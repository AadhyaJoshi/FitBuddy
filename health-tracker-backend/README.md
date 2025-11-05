# Health Tracker API Backend

Backend API for Health Tracker mobile application built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Screen time tracking
- Health reminders management
- AI-powered health chatbot
- RESTful API design

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd health-tracker-backend
```

2. Install dependencies
```bash
npm install
```

3. Create `.env` file
```bash
cp .env.example .env
```

4. Update environment variables in `.env`

5. Start MongoDB (if running locally)
```bash
mongod
```

6. Run the application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/updatedetails` - Update user details (protected)
- `PUT /api/auth/updatepassword` - Update password (protected)

### Screen Time
- `GET /api/screentime` - Get all screen time entries (protected)
- `GET /api/screentime/today` - Get today's screen time (protected)
- `GET /api/screentime/stats` - Get statistics (protected)
- `POST /api/screentime` - Create screen time entry (protected)
- `PUT /api/screentime/:id` - Update entry (protected)
- `DELETE /api/screentime/:id` - Delete entry (protected)

### Reminders
- `GET /api/reminders` - Get all reminders (protected)
- `GET /api/reminders/active` - Get active reminders (protected)
- `GET /api/reminders/today` - Get today's reminders (protected)
- `POST /api/reminders` - Create reminder (protected)
- `PUT /api/reminders/:id` - Update reminder (protected)
- `PATCH /api/reminders/:id` - Toggle completion (protected)
- `DELETE /api/reminders/:id` - Delete reminder (protected)

### Chat
- `POST /api/chat` - Send message to chatbot (protected)
- `GET /api/chat/history` - Get chat history (protected)
- `GET /api/chat/conversations` - Get all conversations (protected)
- `DELETE /api/chat/history/:conversationId` - Delete chat history (protected)

## Environment Variables
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
OPENAI_API_KEY=your_openai_api_key (optional)
```

## Project Structure
```
health-tracker-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── constants.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── screenTimeController.js
│   │   ├── reminderController.js
│   │   └── chatController.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── validation.middleware.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── ScreenTime.js
│   │   ├── Reminder.js
│   │   └── ChatMessage.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── screentime.routes.js
│   │   ├── reminder.routes.js
│   │   └── chat.routes.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Testing API with Postman/Thunder Client

### 1. Register User
```json
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

### 2. Login
```json
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Copy the `token` from response and use it in Authorization header for protected routes:
```
Authorization: Bearer <your_token_here>
```

### 3. Create Screen Time Entry
```json
POST http://localhost:5000/api/screentime
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "totalMinutes": 120,
  "category": "social"
}
```

### 4. Create Reminder
```json
POST http://localhost:5000/api/reminders
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Take Vitamin D",
  "description": "Take with breakfast",
  "category": "medication",
  "time": "2024-01-15T09:00:00Z"
}
```

### 5. Send Chat Message
```json
POST http://localhost:5000/api/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "How can I improve my sleep?"
}
```

## Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

Error response format:
```json
{
  "success": false,
  "message": "Error message here",
  "errors": []
}
```

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Input validation with express-validator
- MongoDB injection prevention
- CORS enabled