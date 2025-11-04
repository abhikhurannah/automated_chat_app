# Quick Start Guide

## 🚀 Getting Started with Chatty Backend

Follow these steps to get your Chatty backend server up and running:

### 1. Prerequisites Check
- ✅ Node.js (v16+)
- ✅ MongoDB (local or cloud)
- ✅ Cloudinary account

### 2. Installation
```bash
# Navigate to backend directory
cd backened

# Install dependencies
npm install
```

### 3. Environment Setup
Create a `.env` file with your configuration:
```env
MONGODB_URI=your_mongodb_connection_string
PORT=5001
JWT_SECRET=your_secure_jwt_secret
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Database Setup (Optional)
Seed the database with sample users:
```bash
npm run seed
```

### 5. Start the Server
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

### 6. Verify Installation
- Server should start on http://localhost:5001
- Check console for "Server is running on port: 5001"
- MongoDB connection should show "mongodb connect: [your-host]"

### 🎉 You're Ready!
Your backend is now running and ready to handle requests from the frontend.

## 🔍 Testing Endpoints

### Health Check
```bash
curl http://localhost:5001/
# Should return: "Hello abhai g"
```

### Test Signup
```bash
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullname": "Test User",
    "email": "test@example.com",
    "password": "123456"
  }'
```

## 🛠️ Development Tips

1. **Auto-restart**: Use `npm run dev` for development
2. **Database**: Use MongoDB Compass for GUI management
3. **Logs**: Check terminal for error messages
4. **Testing**: Use Postman or Thunder Client for API testing

## 🚨 Common Issues

### Port Already in Use
```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9
```

### MongoDB Connection Error
- Check if MongoDB is running
- Verify connection string format
- Check network access (for cloud databases)

### Environment Variables Not Loading
- Ensure `.env` file is in the backend root
- Check for typos in variable names
- Restart the server after changes