# FriendSnap - Product Requirements Document

## Original Problem Statement
Build a friendship app for adults with intellectual disabilities. Core features include sharing photos of things (NOT people), nickname + avatar signup, AI-powered photo moderation using OpenAI GPT-4o to detect people in photos, interest-based friend matching, simple chat with emojis and sentence starters, and block/report functionality.

**Key Rules:**
- No photos of people (except famous)
- Use nickname, not real name  
- Be kind to everyone

**Accessibility is paramount:** Large buttons, text-to-speech, help button on every screen, simple language.

## User Personas
1. **Primary Users:** Adults with intellectual disabilities who prefer visual communication over text
2. **Support Persons:** Caregivers/support workers who may help users (optional access with permission)

## Core Requirements (Static)
- Image-based friendship matching (not profile-based)
- No photos of people allowed (AI moderation)
- Nickname + avatar identity system
- Simple, accessible interface
- Safe communication features
- Block/report functionality

## What's Been Implemented (January 2026)

### Phase 1 - MVP Complete ✅
- **Backend (FastAPI + MongoDB)**
  - User authentication (register/login with JWT)
  - Photo upload with AI moderation (OpenAI GPT-4o)
  - Interest-based friend matching using photo tags
  - Real-time chat messaging
  - Block/Report functionality
  - Avatar selection API

- **Frontend (React + Tailwind)**
  - Landing page with logo, features, rules
  - 2-step signup wizard (nickname → avatar)
  - Login page
  - Home page with photo feed and friend suggestions
  - Add Photo page with upload zone
  - My Photos gallery with delete option
  - Friends page (Suggestions + My Friends tabs)
  - Chat/Messages page
  - Conversation page with sentence starters & emojis
  - Profile page with logout
  - Help modal (accessible on all pages)
  - Bottom navigation
  - Text-to-speech buttons throughout

### Accessibility Features Implemented
- Large touch targets (60x60px minimum)
- High contrast colors (orange/blue palette)
- Nunito + Mulish fonts for readability
- Text-to-speech on all major screens
- Help button visible everywhere
- Simple, clear language
- Step-by-step wizards

## Prioritized Backlog

### P0 (Critical) - All Complete ✅
- [x] User registration/login
- [x] Photo upload with AI moderation
- [x] Friend matching
- [x] Basic chat

### P1 (High Priority) - Remaining
- [ ] Voice message support in chat
- [ ] Push notifications for new messages
- [ ] Admin moderation panel UI
- [ ] Support person access (with permission)

### P2 (Medium Priority)
- [ ] Photo categories/filters
- [ ] Audio reading of full pages
- [ ] Onboarding tutorial
- [ ] Dark mode option

### P3 (Nice to Have)
- [ ] Video messages
- [ ] Group chats
- [ ] Interest badges/achievements
- [ ] Language localization

## Technical Architecture

```
Frontend: React 19 + Tailwind CSS + Shadcn/UI
Backend: FastAPI (Python)
Database: MongoDB
AI: OpenAI GPT-4o via Emergent LLM Key
Auth: JWT tokens
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| /api/auth/register | POST | Register new user |
| /api/auth/login | POST | Login user |
| /api/auth/me | GET | Get current user |
| /api/photos | POST | Upload photo |
| /api/photos/mine | GET | Get user's photos |
| /api/photos/feed | GET | Get photo feed |
| /api/friends/suggestions | GET | Get friend suggestions |
| /api/friends/list | GET | Get friends list |
| /api/messages | POST | Send message |
| /api/messages/{userId} | GET | Get conversation |
| /api/conversations | GET | Get all conversations |
| /api/block | POST | Block user |
| /api/report | POST | Report user/photo |
| /api/avatars | GET | Get available avatars |

## Next Tasks
1. Add voice message recording in chat
2. Build admin moderation panel
3. Add push notification support
4. Create onboarding tutorial for new users
