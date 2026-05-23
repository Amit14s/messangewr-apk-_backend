# messangewr-apk-_backend
started on date:25 Feb 2026

# 💬 Messangewr — Backend

> A production-grade, real-time chat application backend built with **Node.js**, **Express**, **MongoDB**, and **Socket.IO**.  
> Inspired by WhatsApp / Instagram DMs — featuring live messaging, OTP auth, read receipts, typing indicators, emoji reactions, and 24-hour disappearing statuses.

**🚧 Status:** Backend — Complete | Frontend (React) — In Development

---

## 📌 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Database Models](#database-models)
  - [User Model](#user-model)
  - [Message Model](#message-model)
  - [Conversation Model](#conversation-model)
  - [Status Model](#status-model)
- [REST API — Auth](#rest-api--auth)
- [REST API — Messages](#rest-api--messages)
- [REST API — Status](#rest-api--status)
- [Socket.IO — Real-Time Events](#socketio--real-time-events)
  - [Connection & Presence](#1-connection--presence)
  - [Messaging](#2-messaging)
  - [Read Receipts](#3-read-receipts)
  - [Typing Indicators](#4-typing-indicators)
  - [Emoji Reactions](#5-emoji-reactions)
  - [Disconnect Handling](#6-disconnect-handling)
- [Middleware](#middleware)
- [Services & Utilities](#services--utilities)
- [Known Issues & TODOs](#known-issues--todos)
- [Author](#author)

---

## Overview

Messangewr is a full-stack real-time messaging app built from scratch. The backend handles everything: user authentication with OTP verification, persistent messaging via MongoDB, real-time communication via Socket.IO, and ephemeral 24-hour statuses similar to WhatsApp/Instagram Stories.

The architecture is intentionally modular — controllers, models, routes, services, middleware, and socket logic are all separated — making it easy to extend, test, and discuss in technical interviews.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose |
| Real-Time | Socket.IO v4 |
| Authentication | JWT + OTP |
| Email (OTP) | Nodemailer |
| SMS (OTP) | Twilio |
| Cookie Handling | cookie-parser |
| Cross-Origin | cors |
| Dev Server | nodemon |

---

## Project Structure

```
messangewr-apk-_backend/
│
├── index.js                  # Entry point — creates HTTP server, connects DB, mounts routes
│
├── config/
│   └── db.js                 # MongoDB connection logic using Mongoose
│
├── models/
│   ├── user.model.js         # User schema (auth, profile, online status)
│   ├── messages.js           # Message schema (content, status, reactions)
│   ├── communication.js      # Conversation schema (participants, last message)
│   └── status.js             # 24-hour status/story schema
│
├── controller/
│   ├── auth.controller.js    # signup, login, OTP send/verify, logout
│   ├── message.controller.js # send message, fetch messages, mark as read
│   └── status.controller.js  # create status, view status, get viewers, delete
│
├── middleware/
│   └── auth.middleware.js    # JWT verification, protects private routes
│
├── routes/
│   ├── auth.routes.js        # /api/auth/* endpoints
│   ├── message.routes.js     # /api/message/* endpoints
│   └── status.routes.js      # /api/status/* endpoints
│
├── services/
│   ├── email.service.js      # Nodemailer — OTP email dispatch
│   └── sms.service.js        # Twilio — OTP SMS dispatch
│
├── utils/
│   └── socket.js             # initializeSocket() — all Socket.IO event handlers
│
├── .gitignore
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file in the root directory with the following:

```env
# Server
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/messangewr

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Nodemailer (Email OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Twilio (SMS OTP)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

>  Never commit `.env` to version control. It is already in `.gitignore`.

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- A Gmail account with App Password enabled (for OTP emails)
- Twilio account (for SMS OTP — optional for dev)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Amit14s/messangewr-apk-_backend.git
cd messangewr-apk-_backend

# 2. Install dependencies
npm install

# 3. Create your .env file (see above)
cp .env.example .env

# 4. Start the development server
npm run dev

# For production
npm start
```

The server starts on `http://localhost:5000` by default.

---

## Database Models

### User Model

**File:** `models/user.model.js`

Stores all user profile and authentication data.

| Field | Type | Description |
|---|---|---|
| `username` | String | Unique display name |
| `email` | String | Unique email address |
| `phone` | String | Phone number (used for SMS OTP) |
| `password` | String | Bcrypt-hashed password |
| `profilePicture` | String | URL to profile image |
| `isOnline` | Boolean | Real-time online status flag |
| `lastSeen` | Date | Timestamp of last activity |
| `isVerified` | Boolean | Whether OTP was verified |
| `otp` | String | Temporary OTP value |
| `otpExpiry` | Date | OTP expiration timestamp |

The `isOnline` and `lastSeen` fields are updated in real-time by Socket.IO events, not just on login/logout.

---

### Message Model

**File:** `models/messages.js`

Stores every individual message exchanged between users.

| Field | Type | Description |
|---|---|---|
| `sender` | ObjectId (ref: User) | Who sent the message |
| `receiver` | ObjectId (ref: User) | Who receives the message |
| `conversation` | ObjectId (ref: Conversation) | Parent conversation |
| `content` | String | Message text |
| `messageType` | String | `text`, `image`, `file` |
| `messageStatus` | String | `sent`, `delivered`, `read` |
| `reactions` | Array | `[{ user: ObjectId, emoji: String }]` |
| `createdAt` | Date | Auto-managed by Mongoose timestamps |

The `reactions` sub-array supports multiple users reacting to the same message with different emojis.

---

### Conversation Model

**File:** `models/communication.js`

Groups messages between two users into a conversation thread.

| Field | Type | Description |
|---|---|---|
| `participants` | [ObjectId] | Array of two user references |
| `lastMessage` | ObjectId (ref: Message) | Most recent message (for preview) |
| `unreadCount` | Map | Per-user unread message counts |
| `createdAt` | Date | Timestamps |

Using `participants` as an array allows efficient querying: to find a conversation between users A and B, query `{ participants: { $all: [A, B] } }`.

---

### Status Model

**File:** `models/status.js`

Manages 24-hour ephemeral statuses (like WhatsApp/Instagram Stories).

| Field | Type | Description |
|---|---|---|
| `user` | ObjectId (ref: User) | Status creator |
| `content` | String | Text or media URL |
| `mediaType` | String | `text`, `image`, `video` |
| `viewers` | [ObjectId] | Users who viewed this status |
| `viewCount` | Number | Total view count |
| `expiresAt` | Date | Auto-set to 24 hours after creation |
| `isActive` | Boolean | Derived from `expiresAt` comparison |
| `createdAt` | Date | Timestamps |

Statuses auto-expire after 24 hours. The `expiresAt` field is used in queries with `{ expiresAt: { $gt: new Date() } }` to only return active statuses.

---

## REST API — Auth

**Base URL:** `/api/auth`  
All auth routes are public (no JWT required) unless noted.

---

### `POST /api/auth/register`

Registers a new user and triggers OTP dispatch.

**Request Body:**
```json
{
  "username": "amit",
  "email": "amit@example.com",
  "password": "securepassword",
  "phone": "+919876543210"
}
```

**Response:** `201 Created`
```json
{
  "message": "OTP sent to your email/phone. Please verify to complete registration.",
  "userId": "64abc..."
}
```

**Flow:**
1. Check if email already exists.
2. Hash password with bcrypt.
3. Generate a 6-digit OTP, set expiry (10 minutes).
4. Save user with `isVerified: false`.
5. Dispatch OTP via Nodemailer (email) or Twilio (SMS).

---

### `POST /api/auth/verify-otp`

Verifies the OTP to activate the account.

**Request Body:**
```json
{
  "userId": "64abc...",
  "otp": "483920"
}
```

**Response:** `200 OK`
```json
{
  "message": "Account verified successfully.",
  "token": "eyJhbGci..."
}
```

**Flow:**
1. Find user by ID.
2. Compare OTP and check `otpExpiry > new Date()`.
3. Set `isVerified: true`, clear `otp` and `otpExpiry`.
4. Issue JWT, set in `httpOnly` cookie.

---

### `POST /api/auth/resend-otp`

Resends a fresh OTP to the user.

**Request Body:**
```json
{ "userId": "64abc..." }
```

---

### `POST /api/auth/login`

Authenticates an existing verified user.

**Request Body:**
```json
{
  "email": "amit@example.com",
  "password": "securepassword"
}
```

**Response:** `200 OK` — Sets JWT in `httpOnly` cookie.
```json
{
  "message": "Login successful",
  "user": { "_id": "...", "username": "amit", "profilePicture": "..." }
}
```

**Flow:**
1. Find user by email.
2. Check `isVerified` — reject unverified accounts.
3. Compare password with bcrypt.
4. Sign JWT with `JWT_SECRET`, set cookie.

---

### `POST /api/auth/logout`

**Auth Required: Yes**

Clears the JWT cookie.

**Response:** `200 OK`
```json
{ "message": "Logged out successfully" }
```

---

## REST API — Messages

**Base URL:** `/api/message`  
**Auth Required: Yes** (JWT middleware on all routes)

---

### `POST /api/message/send`

Sends a new message and creates or updates the conversation.

**Request Body:**
```json
{
  "receiverId": "64xyz...",
  "content": "Hey! What's up?",
  "messageType": "text"
}
```

**Response:** `201 Created` — Returns populated message object.

**Flow:**
1. Find or create a `Conversation` between sender and receiver.
2. Create new `Message` document with status `sent`.
3. Update `conversation.lastMessage` and `unreadCount` for receiver.
4. Return the populated message.

> Note: The actual real-time delivery is handled by Socket.IO (`send_message` event). The REST endpoint persists the message to the database.

---

### `GET /api/message/:conversationId`

Fetches all messages in a conversation (paginated).

**Query Params:** `?page=1&limit=30`

**Response:** `200 OK` — Returns messages array, sorted by `createdAt` ascending.

---

### `PATCH /api/message/read`

Marks a batch of messages as read and updates `unreadCount`.

**Request Body:**
```json
{
  "messageIds": ["64aaa...", "64bbb..."],
  "conversationId": "64ccc..."
}
```

---

### `GET /api/message/unread`

Returns the total unread message count across all conversations for the authenticated user.

**Response:**
```json
{ "totalUnread": 7 }
```

---

## REST API — Status

**Base URL:** `/api/status`  
**Auth Required: Yes**

---

### `POST /api/status/create`

Creates a new 24-hour status.

**Request Body:**
```json
{
  "content": "Feeling great today! ",
  "mediaType": "text"
}
```

**Response:** `201 Created` — Returns the created status document.

The `expiresAt` is automatically set to `new Date(Date.now() + 24 * 60 * 60 * 1000)`.

---

### `GET /api/status/feed`

Returns active statuses (not expired) from all users the authenticated user follows/is connected with.

**Response:** `200 OK`
```json
[
  {
    "_id": "...",
    "user": { "username": "rahul", "profilePicture": "..." },
    "content": "...",
    "viewCount": 3,
    "expiresAt": "2026-05-24T10:00:00Z"
  }
]
```

---

### `POST /api/status/view/:statusId`

Records a view on a status. Adds the viewer's ID to `viewers` array and increments `viewCount`.

**Response:** `200 OK`
```json
{ "message": "Status view recorded" }
```

---

### `GET /api/status/viewers/:statusId`

Returns the list of users who viewed a specific status (only accessible by the status owner).

**Response:** `200 OK` — Array of viewer objects with `username` and `profilePicture`.

---

### `DELETE /api/status/:statusId`

Deletes a status. Only the owner can delete their own status.

---

## Socket.IO — Real-Time Events

**File:** `utils/socket.js`

The socket module is initialized with the HTTP server and exports the `io` instance. An in-memory `Map` called `onlineUsers` maps `userId → socketId` for fast socket targeting, and a `typingUser` Map tracks per-user typing state per conversation.

```js
const onlineUsers = new Map();  // { userId: socketId }
const typingUser  = new Map();  // { userId: { conversationId: bool, conversationId_timeout: timeoutRef } }
```

---

### 1. Connection & Presence

#### Client emits: `user_connected`

Fired immediately after the socket connects, with the logged-in user's ID.

```js
socket.emit('user_connected', userId);
```

**Server actions:**
- Stores `userId → socket.id` in `onlineUsers`.
- Makes the socket join a private room named by `userId` (for targeted messages).
- Updates MongoDB: `isOnline: true`, `lastSeen: new Date()`.
- Broadcasts `user_status` to all connected clients.

```js
// Broadcast to everyone
io.emit('user_status', { userId, isOnline: true });
```

---

#### Client emits: `get_user_status`

Query the online status of any user by their ID.

```js
socket.emit('get_user_status', targetUserId, (response) => {
  console.log(response); // { userId, isOnline, lastSeen }
});
```

The server uses an **acknowledgement callback** (Socket.IO's built-in feature) to return the result synchronously without a separate event.

---

### 2. Messaging

#### Client emits: `send_message`

Sends a message object to a specific receiver.

```js
socket.emit('send_message', {
  _id: 'msg123',
  content: 'Hello!',
  sender: { _id: 'senderUserId', username: 'amit' },
  receiver: { _id: 'receiverUserId', username: 'rahul' },
  createdAt: new Date()
});
```

**Server actions:**
- Looks up `receiver._id` in `onlineUsers` Map.
- If receiver is online, emits `receive_message` directly to their socket.
- If receiver is offline, the message is already persisted by the REST API — they'll load it on next login.

#### Server emits: `receive_message`

```js
socket.on('receive_message', (message) => {
  // Display message in chat UI
});
```

---

### 3. Read Receipts

#### Client emits: `message_read`

Fired when the receiver opens a conversation and sees messages.

```js
socket.emit('message_read', {
  messageIds: ['msg1', 'msg2', 'msg3'],
  senderId: 'originalSenderUserId'
});
```

**Server actions:**
1. Batch-updates all messages: `{ messageStatus: "read" }` via `Message.updateMany`.
2. Finds the sender's current socket in `onlineUsers`.
3. Emits `message_status_update` for **each message ID individually** so the sender's UI can update tick icons in real-time.

#### Server emits: `message_status_update`

```js
socket.on('message_status_update', ({ messageid, messageStatus }) => {
  // Change single/double tick to blue tick for messageid
});
```

---

### 4. Typing Indicators

#### Client emits: `typing_start`

Fired when the user starts typing in a conversation.

```js
socket.emit('typing_start', {
  conversationId: 'conv123',
  receiverId: 'receiverUserId'
});
```

**Server actions:**
- Stores typing state in `typingUser` Map.
- Sets a **3-second auto-timeout**: if no further `typing_start` is received within 3 seconds, automatically emits `user_typing` with `isTyping: false` to the receiver. This prevents the "X is typing..." indicator getting stuck if the user closes the app.
- Forwards `user_typing: true` to the receiver via `socket.to(receiverId)`.

#### Client emits: `typing_stop`

Fired when the user stops typing manually (blur, send, or clear).

```js
socket.emit('typing_stop', {
  conversationId: 'conv123',
  receiverId: 'receiverUserId'
});
```

**Server actions:**
- Clears the pending auto-timeout.
- Emits `user_typing: false` to the receiver immediately.

#### Server emits: `user_typing`

```js
socket.on('user_typing', ({ userId, conversationId, isTyping }) => {
  // Show or hide "typing..." indicator
});
```

---

### 5. Emoji Reactions

#### Client emits: `add_reaction`

```js
socket.emit('add_reaction', {
  messageId: 'msg123',
  emoji: '❤️',
  userId: 'currentUserId',
  reactionUserId: 'currentUserId'
});
```

**Server actions (toggle logic):**

| Scenario | Behaviour |
|---|---|
| User hasn't reacted | Adds `{ user: reactionUserId, emoji }` to reactions array |
| User reacted with same emoji | Removes the reaction (toggle off) |
| User reacted with different emoji | Updates existing reaction to new emoji |

After saving:
1. Re-fetches the message with `.populate()` on sender, receiver, and reaction users.
2. Emits `reaction_update` to **both** the sender's and receiver's sockets simultaneously.

#### Server emits: `reaction_update`

```js
socket.on('reaction_update', ({ messageId, reactions }) => {
  // Update reaction display on the message
});
```

---

### 6. Disconnect Handling

Fires automatically when the socket connection drops (tab closed, network loss, app killed).

**Server actions:**
1. Removes `userId` from `onlineUsers` Map.
2. Iterates `typingUser` Map for this user — clears all pending typing timeouts to prevent memory leaks.
3. Removes user from `typingUser` Map.
4. Updates MongoDB: `isOnline: false`, `lastSeen: new Date()`.
5. Broadcasts `user_status: { isOnline: false, lastSeen }` to all connected clients.
6. Makes socket leave its private room.

---

## Middleware

### `middleware/auth.middleware.js`

Protects all private routes. Applied at the router level.

**How it works:**
1. Reads the JWT from the `httpOnly` cookie (`req.cookies.token`).
2. Verifies it with `jwt.verify(token, process.env.JWT_SECRET)`.
3. Attaches the decoded payload as `req.user` for downstream controllers.
4. Returns `401 Unauthorized` if token is missing, expired, or tampered.

```js
// Usage in routes
router.get('/profile', authMiddleware, getUserProfile);
```

---

## Services & Utilities

### `services/email.service.js`

Uses **Nodemailer** to send OTP emails via SMTP (Gmail).

```
Recipient ← SMTP (Gmail) ← Nodemailer ← OTP Generator ← Auth Controller
```

The email template includes the 6-digit OTP with a 10-minute expiry notice.

---

### `services/sms.service.js`

Uses **Twilio** to send OTP via SMS to phone numbers. Falls back gracefully if `TWILIO_ACCOUNT_SID` is not configured (useful during local development).

---

### `config/db.js`

Establishes the Mongoose connection using `MONGODB_URI`. Logs success or fatal connection errors. Called once at server startup from `index.js`.

---

## Known Issues & TODOs

These are known bugs identified in `utils/socket.js` — fixes planned:

- [ ] **`userId` scoping bug** — `const userId = null` inside the connection handler prevents `userId` from being reassigned. Should be `let userId = null`.
- [ ] **`message.reactions(exitingIndex)`** — incorrectly calls `reactions` as a function. Should be `message.reactions[exitingIndex]` (array indexing).
- [ ] **`calback` typo** — in `get_user_status`, `calback(...)` should be `callback(...)`.
- [ ] Add Redis adapter for `onlineUsers` to support horizontal scaling across multiple server instances.
- [ ] Add rate limiting on auth routes (`/login`, `/register`, `/resend-otp`) to prevent OTP brute-force.
- [ ] Add input validation middleware (e.g., `express-validator`) on all REST routes.
- [ ] Write unit tests for controllers using Jest + Supertest.

---

## Author

**Amit** — [@Amit14s](https://github.com/Amit14s)

> 📌 *Frontend (React) is actively in development. Backend is production-ready.*  
> ⭐ Star the repo if you found it useful!
