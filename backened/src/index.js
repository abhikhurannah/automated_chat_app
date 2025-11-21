import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js" 
import chatbotRoutes from "./routes/chatbot.route.js"  // NEW
import { connectDB } from './lib/db.js';
import cors from "cors"
import {app,server} from "./lib/socket.js"

dotenv.config();
const PORT= process.env.PORT || 3000;

// increase body size limits to allow base64 image uploads from frontend
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
    origin: [
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175",
        "https://chatty-ai.vercel.app",  // Add your Vercel URL here
        // Add your actual Vercel URL after deployment
    ],
    credentials: true
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/chatbot", chatbotRoutes);  // NEW: AI chatbot routes

app.get('/',(req,res)=>{
    res.send('Hello! Chat API with AI Assistant is running 🤖');
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

server.listen(PORT,()=>{
    console.log(`Server is running on port: ${PORT}`);
    console.log(`AI Chatbot features enabled`);
    connectDB();
})