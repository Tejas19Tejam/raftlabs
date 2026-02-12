# Backend API

A RESTful API built with Node.js, Express, and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Replace `your_password_here` with your actual MongoDB password

```env
PORT=5000
MONGODB_URI=mongodb+srv://tejas19tejam:<db_password>@cluster0.4xbpbga.mongodb.net/?appName=Cluster0
DB_PASSWORD=your_actual_password
NODE_ENV=development
```

## Running the Application

Development mode (with auto-reload):

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## API Endpoints

### Users

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Example Request

Create a new user:

```bash
POST /api/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 30,
  "status": "active"
}
```

## Project Structure

```
backend/
├── config/
│   └── database.js      # MongoDB connection
├── controllers/
│   └── userController.js # User controller logic
├── models/
│   └── User.js          # User model schema
├── routes/
│   └── userRoutes.js    # User routes
├── .env                 # Environment variables
├── .gitignore
├── package.json
└── server.js            # Main application file
```

## Technologies Used

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **dotenv** - Environment variable management
- **cors** - Cross-origin resource sharing
- **body-parser** - Request body parsing
