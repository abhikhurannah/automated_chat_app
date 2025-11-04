# 💬 Chatty - Real-time Chat Application

A modern, real-time chat application built with React, Node.js, Socket.io, and MongoDB. Features include instant messaging, image sharing, emoji reactions, online status, and beautiful UI with dark/light themes.

## ✨ Features

- 🔐 **Authentication** - Secure user registration and login
- 💬 **Real-time Messaging** - Instant message delivery using Socket.io
- 📸 **Image Sharing** - Share images with Cloudinary integration
- 😊 **Emoji Support** - Rich emoji picker for expressions
- 👥 **Online Status** - See who's online in real-time
- 🎨 **Theme Support** - Beautiful light/dark mode themes
- 📱 **Responsive Design** - Works on desktop and mobile
- ✅ **Read Receipts** - Know when messages are delivered
- ⚡ **Fast & Smooth** - Optimized performance with animations

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **shadcn/ui** - UI components
- **Zustand** - State management
- **Socket.io Client** - Real-time communication

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Cloudinary** - Image hosting
- **Bcrypt** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### Backend Setup

1. Navigate to backend folder:
```bash
cd backened
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend folder:
```bash
cd frontened2
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```env
VITE_API_URL=http://localhost:5001
```

4. Start the development server:
```bash
npm run dev
```

## 🚀 Usage

1. Register a new account or login
2. Select a contact from the sidebar
3. Start chatting with real-time messaging
4. Upload images, add emojis, and see online status
5. Switch between light/dark themes in settings

## 📁 Project Structure

```
Chatty-main/
├── backened/           # Backend Node.js application
│   ├── src/
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── middlewares/  # Auth middleware
│   │   └── lib/          # Utilities (socket, db, cloudinary)
│   └── package.json
│
└── frontened2/         # Frontend React application
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── stores/       # Zustand stores
    │   ├── lib/          # Utilities
    │   └── hooks/        # Custom hooks
    └── package.json
```

## 🎨 Features Showcase

- **Floating Bubbles Sidebar** - Animated contact list with last message preview
- **Theme Studio** - 8 pre-designed themes to choose from
- **Message Reactions** - React to messages with emojis
- **Typing Indicators** - See when someone is typing
- **Image Preview** - Full-screen image viewer
- **Smooth Animations** - Powered by Framer Motion

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

Built with ❤️ by Abhay Kumar

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Lucide Icons](https://lucide.dev/) - Icon library
- [emoji-picker-react](https://www.npmjs.com/package/emoji-picker-react) - Emoji picker component
