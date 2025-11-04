# Chatty Backend

A real-time chat application backend built with Node.js, Express, MongoDB, and Socket.IO.

## 🚀 Features

- **User Authentication**: Secure signup, login, and logout with JWT tokens
- **Real-time Messaging**: Instant messaging using Socket.IO
- **File Upload**: Profile picture and image message support via Cloudinary
- **Online Status**: Real-time user online/offline status tracking
- **RESTful API**: Well-structured REST endpoints
- **Security**: Password hashing, JWT authentication, and CORS protection

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.IO
- **File Storage**: Cloudinary
- **Password Hashing**: bcryptjs
- **Environment Variables**: dotenv

## 📁 Project Structure

```
backened/
├── src/
│   ├── controllers/           # Route handlers
│   │   ├── auth.controller.js     # Authentication logic
│   │   └── message.controller.js  # Message handling logic
│   ├── lib/                   # Utility libraries
│   │   ├── cloudinary.js          # Cloudinary configuration
│   │   ├── db.js                  # Database connection
│   │   ├── socket.js              # Socket.IO setup
│   │   └── utils.js               # JWT token utilities
│   ├── middlewares/           # Custom middleware
│   │   └── auth.middleware.js     # Authentication middleware
│   ├── models/                # Database schemas
│   │   ├── message.model.js       # Message schema
│   │   └── user.model.js          # User schema
│   ├── routes/                # API routes
│   │   ├── auth.route.js          # Authentication routes
│   │   └── message.route.js       # Message routes
│   ├── seeds/                 # Database seeding
│   │   └── user.seed.js           # Sample user data
│   └── index.js               # Application entry point
├── package.json
└── .env                       # Environment variables
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Cloudinary account

### 1. Clone the repository
```bash
git clone <repository-url>
cd chatty/backened
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the backend root directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatty

# Server
PORT=5001
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Start the server
```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication Endpoints

#### POST `/auth/signup`
Register a new user.

**Request Body:**
```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "_id": "user_id",
  "fullname": "John Doe",
  "email": "john@example.com",
  "profilePic": ""
}
```

#### POST `/auth/login`
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "123456"
}
```

#### POST `/auth/logout`
Logout user and clear JWT cookie.

#### PUT `/auth/update-profile` (Protected)
Update user profile picture.

**Request Body:**
```json
{
  "profilePic": "base64_image_data"
}
```

#### GET `/auth/check` (Protected)
Check if user is authenticated.

### Message Endpoints

#### GET `/messages/users` (Protected)
Get all users except the current user for sidebar.

#### GET `/messages/:id` (Protected)
Get chat history between current user and specified user.

#### POST `/messages/send/:id` (Protected)
Send a message to a specific user.

**Request Body:**
```json
{
  "text": "Hello there!",
  "image": "base64_image_data" // optional
}
```

## 🔌 Socket.IO Events

### Client to Server Events

#### `connection`
Triggered when a user connects to the socket.

**Query Parameters:**
- `userId`: The ID of the connecting user

### Server to Client Events

#### `getOnlineUsers`
Broadcasted to all clients with the list of online user IDs.

#### `newMessage`
Sent to specific user when they receive a new message.

**Payload:**
```json
{
  "_id": "message_id",
  "senderId": "sender_id",
  "receiverId": "receiver_id",
  "text": "message text",
  "image": "image_url",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 🗃️ Database Schema

### User Model
```javascript
{
  email: {
    type: String,
    required: true,
    unique: true
  },
  fullname: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePic: {
    type: String,
    default: ''
  }
}
```

### Message Model
```javascript
{
  senderId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String
  },
  image: {
    type: String
  }
}
```

## 🔐 Security Features

### JWT Authentication
- Secure HTTP-only cookies
- 7-day token expiration
- Automatic token refresh

### Password Security
- bcryptjs hashing with salt
- Minimum 6-character requirement

### CORS Protection
- Configured for frontend origin
- Credentials support enabled

### Input Validation
- Required field validation
- Email format validation
- Password strength requirements

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use secure JWT secret
3. Configure MongoDB Atlas
4. Set up Cloudinary account

### Platform Deployment
The application can be deployed on:
- **Heroku**: Easy deployment with buildpacks
- **Railway**: Simple deployment with automatic SSL
- **DigitalOcean**: App Platform deployment
- **AWS**: EC2 or Elastic Beanstalk

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5001
CMD ["npm", "start"]
```

## 🧪 Testing

### Database Seeding
Run the seed script to populate the database with sample users:

```bash
node src/seeds/user.seed.js
```

This creates sample users for testing the chat functionality.

## 🐛 Common Issues & Solutions

### MongoDB Connection Issues
- Verify MongoDB URI format
- Check network access in MongoDB Atlas
- Ensure correct username/password

### Socket.IO Connection Problems
- Check CORS configuration
- Verify frontend origin URLs
- Test with Socket.IO client tools

### Cloudinary Upload Failures
- Validate API credentials
- Check image format and size
- Monitor Cloudinary dashboard

## 📝 Development Workflow

### Code Structure
1. **Models**: Define data schemas
2. **Controllers**: Handle business logic
3. **Routes**: Define API endpoints
4. **Middleware**: Add authentication and validation
5. **Utils**: Shared utilities and helpers

### Best Practices
- Use async/await for database operations
- Implement proper error handling
- Validate input data
- Use environment variables for configuration
- Follow RESTful API conventions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🔗 Related Links

- [Frontend Repository](../frontened)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)