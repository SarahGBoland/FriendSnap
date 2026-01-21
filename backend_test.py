import requests
import sys
import json
import base64
from datetime import datetime
import time

class FriendSnapAPITester:
    def __init__(self, base_url="https://share-memories-1.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_result(self, test_name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name} - PASSED")
        else:
            print(f"❌ {test_name} - FAILED: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    # Remove Content-Type for file uploads
                    headers.pop('Content-Type', None)
                    response = requests.post(url, headers=headers, files=files)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            
            if success:
                self.log_result(name, True)
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json().get('detail', '')
                    if error_detail:
                        error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:100]}"
                
                self.log_result(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_result(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health endpoints"""
        print("\n=== HEALTH CHECK TESTS ===")
        self.run_test("Root endpoint", "GET", "", 200)
        self.run_test("Health endpoint", "GET", "health", 200)

    def test_avatars(self):
        """Test avatar endpoint"""
        print("\n=== AVATAR TESTS ===")
        success, response = self.run_test("Get avatars", "GET", "avatars", 200)
        if success and isinstance(response, list) and len(response) > 0:
            print(f"   Found {len(response)} avatars")
            return response[0]  # Return first avatar for registration
        return None

    def test_registration(self, avatar_url):
        """Test user registration"""
        print("\n=== REGISTRATION TESTS ===")
        
        # Test registration with valid data
        test_nickname = f"testuser_{int(time.time())}"
        registration_data = {
            "nickname": test_nickname,
            "avatar_url": avatar_url or "https://api.dicebear.com/7.x/bottts/svg?seed=test",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User registration", 
            "POST", 
            "auth/register", 
            200, 
            data=registration_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   Registered user: {test_nickname} (ID: {self.user_id})")
            return True
        
        return False

    def test_login(self):
        """Test user login"""
        print("\n=== LOGIN TESTS ===")
        
        # Test with invalid credentials first
        self.run_test(
            "Login with invalid credentials",
            "POST",
            "auth/login",
            401,
            data={"nickname": "nonexistent", "password": "wrong"}
        )
        
        # Test /auth/me endpoint
        if self.token:
            self.run_test("Get current user", "GET", "auth/me", 200)

    def test_photos(self):
        """Test photo endpoints"""
        print("\n=== PHOTO TESTS ===")
        
        # Create a simple test image (1x1 pixel PNG in base64)
        test_image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
        
        # Test photo upload
        photo_data = {
            "image_base64": test_image_base64,
            "description": "Test photo of a red dot",
            "category": "art"
        }
        
        success, response = self.run_test(
            "Upload photo",
            "POST",
            "photos",
            200,
            data=photo_data
        )
        
        photo_id = None
        if success and 'id' in response:
            photo_id = response['id']
            print(f"   Uploaded photo ID: {photo_id}")
        
        # Test get my photos
        self.run_test("Get my photos", "GET", "photos/mine", 200)
        
        # Test get photo feed
        self.run_test("Get photo feed", "GET", "photos/feed", 200)
        
        # Test delete photo
        if photo_id:
            self.run_test(
                "Delete photo",
                "DELETE",
                f"photos/{photo_id}",
                200
            )

    def test_friends(self):
        """Test friend endpoints"""
        print("\n=== FRIEND TESTS ===")
        
        # Test get friend suggestions
        self.run_test("Get friend suggestions", "GET", "friends/suggestions", 200)
        
        # Test get friend requests
        self.run_test("Get friend requests", "GET", "friends/requests", 200)
        
        # Test get friends list
        self.run_test("Get friends list", "GET", "friends/list", 200)

    def test_chat(self):
        """Test chat endpoints"""
        print("\n=== CHAT TESTS ===")
        
        # Test get conversations
        self.run_test("Get conversations", "GET", "conversations", 200)
        
        # Note: We can't easily test sending messages without another user
        # This would require creating a second user account

    def test_safety(self):
        """Test safety endpoints"""
        print("\n=== SAFETY TESTS ===")
        
        # Test report (should work even with fake user ID)
        report_data = {
            "reported_user_id": "fake-user-id",
            "reason": "Test report"
        }
        self.run_test("Report user", "POST", "report", 200, data=report_data)

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 Starting FriendSnap API Tests...")
        print(f"Testing against: {self.base_url}")
        
        # Health checks
        self.test_health_check()
        
        # Get avatars for registration
        avatar = self.test_avatars()
        avatar_url = avatar['url'] if avatar else None
        
        # Registration (this sets up token for other tests)
        if not self.test_registration(avatar_url):
            print("❌ Registration failed - stopping tests")
            return False
        
        # Login tests
        self.test_login()
        
        # Photo tests
        self.test_photos()
        
        # Friend tests
        self.test_friends()
        
        # Chat tests
        self.test_chat()
        
        # Safety tests
        self.test_safety()
        
        # Print summary
        print(f"\n📊 TEST SUMMARY")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return False

def main():
    tester = FriendSnapAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())