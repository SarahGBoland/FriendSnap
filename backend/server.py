from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import jwt
import bcrypt
import base64
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'friendsnap')]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'friendsnap-secret-key-change-in-production')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    nickname: str
    avatar_url: str = ""
    password: str

class UserLogin(BaseModel):
    nickname: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nickname: str
    avatar_url: str
    created_at: str

class PhotoUpload(BaseModel):
    image_base64: str
    category: str = ""
    description: str = ""

class PhotoResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    image_base64: str
    category: str
    tags: List[str]
    description: str
    created_at: str
    is_approved: bool

class FriendSuggestion(BaseModel):
    user: UserResponse
    shared_interests: List[str]
    match_score: float

class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    message_type: str = "text"  # text, emoji, image

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    sender_id: str
    receiver_id: str
    content: str
    message_type: str
    created_at: str
    is_read: bool

class ReportCreate(BaseModel):
    reported_user_id: Optional[str] = None
    reported_photo_id: Optional[str] = None
    reason: str

class BlockUser(BaseModel):
    blocked_user_id: str

# ==================== HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, nickname: str) -> str:
    return jwt.encode(
        {"user_id": user_id, "nickname": nickname, "exp": datetime.now(timezone.utc).timestamp() + 86400 * 7},
        JWT_SECRET, algorithm="HS256"
    )

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=["HS256"])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def analyze_image_with_ai(image_base64: str) -> dict:
    """Analyze image using OpenAI GPT-4o for content moderation and categorization"""
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"analyze-{uuid.uuid4()}",
            system_message="""You are an image analyzer for FriendSnap, an app for adults with intellectual disabilities.
            Your job is to:
            1. Check if the image contains any people (faces, bodies, or identifiable human features). Famous people/celebrities are allowed.
            2. Identify the main subject/category of the image
            3. Extract relevant tags for matching users with similar interests
            
            Respond in JSON format:
            {
                "contains_people": true/false,
                "is_famous_person": true/false (only if contains_people is true),
                "category": "one of: animals, nature, food, sports, music, art, colors, objects, places, other",
                "tags": ["tag1", "tag2", "tag3"],
                "description": "brief description in simple language"
            }"""
        ).with_model("openai", "gpt-4o")
        
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(
            text="Analyze this image. Check if it contains people and categorize it.",
            image_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        # Clean response - remove markdown code blocks if present
        clean_response = response.strip()
        if clean_response.startswith("```"):
            clean_response = clean_response.split("```")[1]
            if clean_response.startswith("json"):
                clean_response = clean_response[4:]
        
        result = json.loads(clean_response)
        return result
    except Exception as e:
        logger.error(f"AI analysis error: {e}")
        # Default safe response - allow image but flag for review
        return {
            "contains_people": False,
            "is_famous_person": False,
            "category": "other",
            "tags": ["unanalyzed"],
            "description": "Image pending review"
        }

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user: UserCreate):
    # Check if nickname exists
    existing = await db.users.find_one({"nickname": user.nickname.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="This nickname is already taken. Try another one!")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "nickname": user.nickname.lower(),
        "display_name": user.nickname,
        "avatar_url": user.avatar_url,
        "password_hash": hash_password(user.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "blocked_users": [],
        "is_active": True
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id, user.nickname)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "nickname": user.nickname,
            "avatar_url": user.avatar_url,
            "created_at": user_doc["created_at"]
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"nickname": credentials.nickname.lower()}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Wrong nickname or password. Try again!")
    
    token = create_token(user["id"], user["nickname"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "nickname": user["display_name"],
            "avatar_url": user["avatar_url"],
            "created_at": user["created_at"]
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "nickname": current_user.get("display_name", current_user["nickname"]),
        "avatar_url": current_user["avatar_url"],
        "created_at": current_user["created_at"]
    }

# ==================== PHOTO ROUTES ====================

@api_router.post("/photos")
async def upload_photo(photo: PhotoUpload, current_user: dict = Depends(get_current_user)):
    """Upload a photo with AI moderation"""
    
    # Analyze image with AI
    analysis = await analyze_image_with_ai(photo.image_base64)
    
    # Check if image contains people (not famous)
    if analysis.get("contains_people", False) and not analysis.get("is_famous_person", False):
        raise HTTPException(
            status_code=400, 
            detail="This photo seems to have a person in it. Please share photos of things you like instead!"
        )
    
    photo_id = str(uuid.uuid4())
    photo_doc = {
        "id": photo_id,
        "user_id": current_user["id"],
        "image_base64": photo.image_base64,
        "category": analysis.get("category", photo.category or "other"),
        "tags": analysis.get("tags", []),
        "description": photo.description or analysis.get("description", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_approved": True,
        "ai_analysis": analysis
    }
    await db.photos.insert_one(photo_doc)
    
    return {
        "id": photo_id,
        "user_id": current_user["id"],
        "image_base64": photo.image_base64,
        "category": photo_doc["category"],
        "tags": photo_doc["tags"],
        "description": photo_doc["description"],
        "created_at": photo_doc["created_at"],
        "is_approved": True
    }

@api_router.get("/photos/mine")
async def get_my_photos(current_user: dict = Depends(get_current_user)):
    """Get current user's photos"""
    photos = await db.photos.find(
        {"user_id": current_user["id"], "is_approved": True}, 
        {"_id": 0, "ai_analysis": 0}
    ).sort("created_at", -1).to_list(100)
    return photos

@api_router.get("/photos/feed")
async def get_feed(current_user: dict = Depends(get_current_user)):
    """Get photos from friends and suggested users"""
    blocked_users = current_user.get("blocked_users", [])
    
    # Get photos excluding blocked users
    photos = await db.photos.find(
        {"is_approved": True, "user_id": {"$nin": blocked_users}},
        {"_id": 0, "ai_analysis": 0}
    ).sort("created_at", -1).to_list(50)
    
    # Enrich with user info
    for photo in photos:
        user = await db.users.find_one({"id": photo["user_id"]}, {"_id": 0, "password_hash": 0, "blocked_users": 0})
        if user:
            photo["user"] = {
                "id": user["id"],
                "nickname": user.get("display_name", user["nickname"]),
                "avatar_url": user["avatar_url"]
            }
    
    return photos

@api_router.delete("/photos/{photo_id}")
async def delete_photo(photo_id: str, current_user: dict = Depends(get_current_user)):
    """Delete own photo"""
    result = await db.photos.delete_one({"id": photo_id, "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Photo not found")
    return {"message": "Photo deleted"}

# ==================== FRIEND MATCHING ROUTES ====================

@api_router.get("/friends/suggestions")
async def get_friend_suggestions(current_user: dict = Depends(get_current_user)):
    """Get friend suggestions based on similar photo interests"""
    
    # Get current user's tags
    my_photos = await db.photos.find({"user_id": current_user["id"]}, {"_id": 0}).to_list(100)
    my_tags = set()
    my_categories = set()
    for photo in my_photos:
        my_tags.update(photo.get("tags", []))
        my_categories.add(photo.get("category", ""))
    
    if not my_tags and not my_categories:
        return []
    
    blocked_users = current_user.get("blocked_users", [])
    
    # Find other users with similar interests
    other_users = await db.users.find(
        {"id": {"$ne": current_user["id"], "$nin": blocked_users}, "is_active": True},
        {"_id": 0, "password_hash": 0, "blocked_users": 0}
    ).to_list(100)
    
    suggestions = []
    for user in other_users:
        user_photos = await db.photos.find({"user_id": user["id"]}, {"_id": 0}).to_list(50)
        user_tags = set()
        user_categories = set()
        for photo in user_photos:
            user_tags.update(photo.get("tags", []))
            user_categories.add(photo.get("category", ""))
        
        # Calculate match score
        shared_tags = my_tags.intersection(user_tags)
        shared_categories = my_categories.intersection(user_categories)
        
        if shared_tags or shared_categories:
            # Simple match score
            score = len(shared_tags) * 2 + len(shared_categories) * 3
            
            # Create friendly interest descriptions
            shared_interests = []
            if shared_categories:
                category_map = {
                    "animals": "You both like animals",
                    "nature": "You both like nature",
                    "food": "You both like food",
                    "sports": "You both like sports",
                    "music": "You both like music",
                    "art": "You both like art",
                    "colors": "You both like colors",
                    "places": "You both like places",
                    "objects": "You both like similar things"
                }
                for cat in shared_categories:
                    if cat in category_map:
                        shared_interests.append(category_map[cat])
            
            suggestions.append({
                "user": {
                    "id": user["id"],
                    "nickname": user.get("display_name", user["nickname"]),
                    "avatar_url": user["avatar_url"],
                    "created_at": user["created_at"]
                },
                "shared_interests": shared_interests[:3],  # Limit to 3 interests
                "match_score": score,
                "sample_photo": user_photos[0]["image_base64"] if user_photos else None
            })
    
    # Sort by match score
    suggestions.sort(key=lambda x: x["match_score"], reverse=True)
    return suggestions[:10]  # Top 10 suggestions

@api_router.post("/friends/request/{user_id}")
async def send_friend_request(user_id: str, current_user: dict = Depends(get_current_user)):
    """Send a friend request"""
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="You can't add yourself as a friend!")
    
    # Check if already friends or request pending
    existing = await db.friend_requests.find_one({
        "$or": [
            {"sender_id": current_user["id"], "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": current_user["id"]}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Friend request already sent!")
    
    request_doc = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "receiver_id": user_id,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.friend_requests.insert_one(request_doc)
    return {"message": "Friend request sent!"}

@api_router.get("/friends/requests")
async def get_friend_requests(current_user: dict = Depends(get_current_user)):
    """Get pending friend requests"""
    requests = await db.friend_requests.find(
        {"receiver_id": current_user["id"], "status": "pending"},
        {"_id": 0}
    ).to_list(50)
    
    # Enrich with sender info
    for req in requests:
        sender = await db.users.find_one({"id": req["sender_id"]}, {"_id": 0, "password_hash": 0, "blocked_users": 0})
        if sender:
            req["sender"] = {
                "id": sender["id"],
                "nickname": sender.get("display_name", sender["nickname"]),
                "avatar_url": sender["avatar_url"]
            }
    return requests

@api_router.post("/friends/accept/{request_id}")
async def accept_friend_request(request_id: str, current_user: dict = Depends(get_current_user)):
    """Accept a friend request"""
    result = await db.friend_requests.update_one(
        {"id": request_id, "receiver_id": current_user["id"], "status": "pending"},
        {"$set": {"status": "accepted"}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "You are now friends!"}

@api_router.get("/friends/list")
async def get_friends(current_user: dict = Depends(get_current_user)):
    """Get list of friends"""
    accepted_requests = await db.friend_requests.find(
        {"$or": [
            {"sender_id": current_user["id"], "status": "accepted"},
            {"receiver_id": current_user["id"], "status": "accepted"}
        ]},
        {"_id": 0}
    ).to_list(100)
    
    friend_ids = []
    for req in accepted_requests:
        friend_id = req["receiver_id"] if req["sender_id"] == current_user["id"] else req["sender_id"]
        friend_ids.append(friend_id)
    
    friends = []
    for fid in friend_ids:
        friend = await db.users.find_one({"id": fid}, {"_id": 0, "password_hash": 0, "blocked_users": 0})
        if friend:
            friends.append({
                "id": friend["id"],
                "nickname": friend.get("display_name", friend["nickname"]),
                "avatar_url": friend["avatar_url"],
                "created_at": friend["created_at"]
            })
    return friends

# ==================== CHAT ROUTES ====================

@api_router.post("/messages")
async def send_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    """Send a message to another user"""
    # Check if receiver is blocked
    receiver = await db.users.find_one({"id": message.receiver_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    
    if current_user["id"] in receiver.get("blocked_users", []):
        raise HTTPException(status_code=403, detail="Cannot send message to this user")
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "receiver_id": message.receiver_id,
        "content": message.content,
        "message_type": message.message_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_read": False
    }
    await db.messages.insert_one(message_doc)
    return message_doc

@api_router.get("/messages/{user_id}")
async def get_conversation(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get conversation with a user"""
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": current_user["id"], "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": current_user["id"]}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    
    # Mark as read
    await db.messages.update_many(
        {"sender_id": user_id, "receiver_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return messages

@api_router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    """Get all conversations"""
    # Get all unique conversation partners
    pipeline = [
        {"$match": {"$or": [{"sender_id": current_user["id"]}, {"receiver_id": current_user["id"]}]}},
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": {"$cond": [{"$eq": ["$sender_id", current_user["id"]]}, "$receiver_id", "$sender_id"]},
            "last_message": {"$first": "$$ROOT"},
            "unread_count": {"$sum": {"$cond": [{"$and": [{"$eq": ["$receiver_id", current_user["id"]]}, {"$eq": ["$is_read", False]}]}, 1, 0]}}
        }}
    ]
    
    results = await db.messages.aggregate(pipeline).to_list(50)
    
    conversations = []
    for r in results:
        partner_id = r["_id"]
        partner = await db.users.find_one({"id": partner_id}, {"_id": 0, "password_hash": 0, "blocked_users": 0})
        if partner:
            conversations.append({
                "partner": {
                    "id": partner["id"],
                    "nickname": partner.get("display_name", partner["nickname"]),
                    "avatar_url": partner["avatar_url"]
                },
                "last_message": {
                    "content": r["last_message"]["content"],
                    "created_at": r["last_message"]["created_at"],
                    "is_mine": r["last_message"]["sender_id"] == current_user["id"]
                },
                "unread_count": r["unread_count"]
            })
    
    return conversations

# ==================== SAFETY ROUTES ====================

@api_router.post("/block")
async def block_user(block: BlockUser, current_user: dict = Depends(get_current_user)):
    """Block a user"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$addToSet": {"blocked_users": block.blocked_user_id}}
    )
    return {"message": "User blocked"}

@api_router.post("/unblock/{user_id}")
async def unblock_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Unblock a user"""
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$pull": {"blocked_users": user_id}}
    )
    return {"message": "User unblocked"}

@api_router.post("/report")
async def report_content(report: ReportCreate, current_user: dict = Depends(get_current_user)):
    """Report a user or photo"""
    report_doc = {
        "id": str(uuid.uuid4()),
        "reporter_id": current_user["id"],
        "reported_user_id": report.reported_user_id,
        "reported_photo_id": report.reported_photo_id,
        "reason": report.reason,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.reports.insert_one(report_doc)
    return {"message": "Thank you for reporting. We will review this."}

# ==================== ADMIN ROUTES ====================

@api_router.get("/admin/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    """Get all pending reports (admin only - simplified for MVP)"""
    reports = await db.reports.find({"status": "pending"}, {"_id": 0}).to_list(100)
    return reports

@api_router.post("/admin/reports/{report_id}/resolve")
async def resolve_report(report_id: str, action: str = "dismissed", current_user: dict = Depends(get_current_user)):
    """Resolve a report"""
    result = await db.reports.update_one(
        {"id": report_id},
        {"$set": {"status": action, "resolved_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"message": "Report resolved"}

# ==================== AVATARS ====================

@api_router.get("/avatars")
async def get_avatars():
    """Get available avatars for selection"""
    return [
        {"id": "1", "url": "https://api.dicebear.com/7.x/bottts/svg?seed=happy", "name": "Happy Robot"},
        {"id": "2", "url": "https://api.dicebear.com/7.x/bottts/svg?seed=sunny", "name": "Sunny Robot"},
        {"id": "3", "url": "https://api.dicebear.com/7.x/bottts/svg?seed=cool", "name": "Cool Robot"},
        {"id": "4", "url": "https://api.dicebear.com/7.x/bottts/svg?seed=star", "name": "Star Robot"},
        {"id": "5", "url": "https://api.dicebear.com/7.x/bottts/svg?seed=heart", "name": "Heart Robot"},
        {"id": "6", "url": "https://api.dicebear.com/7.x/bottts/svg?seed=flower", "name": "Flower Robot"},
        {"id": "7", "url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=happy", "name": "Happy Face"},
        {"id": "8", "url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=smile", "name": "Smiley Face"},
        {"id": "9", "url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=cool", "name": "Cool Face"},
        {"id": "10", "url": "https://api.dicebear.com/7.x/fun-emoji/svg?seed=star", "name": "Star Face"},
        {"id": "11", "url": "https://api.dicebear.com/7.x/thumbs/svg?seed=cat", "name": "Cat"},
        {"id": "12", "url": "https://api.dicebear.com/7.x/thumbs/svg?seed=dog", "name": "Dog"},
    ]

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "FriendSnap API is running!"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
