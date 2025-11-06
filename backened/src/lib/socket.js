import { Server } from "socket.io";
import http from "http";
import express from "express";
import aiService from "./ai.js";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // NEW: Request AI reply suggestions
  socket.on("requestReplySuggestions", async (data) => {
    try {
      const { messageId, receiverId, conversationHistory } = data;
      
      if (!aiService.isAvailable()) {
        socket.emit("replySuggestions", {
          suggestions: aiService.getFallbackSuggestions(),
          messageId
        });
        return;
      }

      // Get the target message
      const targetMessage = await Message.findById(messageId);
      if (!targetMessage) {
        socket.emit("replySuggestionsError", { 
          error: "Message not found" 
        });
        return;
      }

      // Generate suggestions
      const suggestions = await aiService.generateReplySuggestions(
        conversationHistory || [],
        targetMessage.text || '[Image]',
        { userId }
      );

      // Send suggestions back to the requesting client
      socket.emit("replySuggestions", {
        suggestions,
        messageId,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error generating reply suggestions:", error);
      socket.emit("replySuggestionsError", { 
        error: "Failed to generate suggestions" 
      });
    }
  });

  // NEW: Real-time typing suggestions
  socket.on("requestTypingSuggestions", async (data) => {
    try {
      const { partialText, receiverId, conversationHistory } = data;

      if (!aiService.isAvailable() || !partialText || partialText.length < 3) {
        socket.emit("typingSuggestions", {
          suggestions: [
            "Sure, sounds good!",
            "Let me think about it",
            "Thanks!"
          ]
        });
        return;
      }

      const suggestions = await aiService.generateReplySuggestions(
        conversationHistory || [],
        partialText,
        { userId, isPartial: true }
      );

      socket.emit("typingSuggestions", {
        suggestions,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error generating typing suggestions:", error);
      socket.emit("typingSuggestions", { suggestions: [] });
    }
  });

  // NEW: Smart compose - Get AI help with message composition
  socket.on("requestSmartCompose", async (data) => {
    try {
      const { intent, context, receiverId } = data;
      
      if (!aiService.isAvailable()) {
        socket.emit("smartCompose", {
          composition: "Thanks for your message!"
        });
        return;
      }

      // Get recent conversation for context
      const recentMessages = await Message.find({
        $or: [
          { senderId: userId, receiverId: receiverId },
          { senderId: receiverId, receiverId: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

      recentMessages.reverse();

      const prompt = `Based on this conversation and intent "${intent}", compose an appropriate message:\n${context}`;
      
      const suggestions = await aiService.generateReplySuggestions(
        recentMessages,
        prompt,
        { userId }
      );

      socket.emit("smartCompose", {
        compositions: suggestions,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("Error in smart compose:", error);
      socket.emit("smartComposeError", { 
        error: "Failed to generate composition" 
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };