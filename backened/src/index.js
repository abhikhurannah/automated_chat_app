import express from 'express';
import dotenv from "dotenv";
import cookieParser from 'cookie-parser';
import authRoutes from "./routes/auth.route.js"
import messageRoutes from "./routes/message.route.js" 
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
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
    credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get('/',(req,res)=>{
    res.send('Hello abhai g');
})

server.listen(PORT,()=>{
    console.log(`Server is running on port: ${PORT}`);
    connectDB();
})
