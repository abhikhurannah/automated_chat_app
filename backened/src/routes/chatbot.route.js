import express from "express";
import { protectRoute } from "../middlewares/auth.middleware.js";
import {
  getReplySuggestions,
  getTypingSuggestions,
  chatWithBot,
  analyzeConversation
} from "../controllers/chatbot.controller.js";

const router = express.Router();

// Get AI-powered reply suggestions for a specific message
router.post("/suggestions/reply", protectRoute, getReplySuggestions);

// Get suggestions while user is typing
router.post("/suggestions/typing", protectRoute, getTypingSuggestions);

// Direct chatbot conversation
router.post("/chat", protectRoute, chatWithBot);

// Analyze conversation sentiment and topics
router.get("/analyze/:receiverId", protectRoute, analyzeConversation);

export default router;