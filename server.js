import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./config/supabaseClient.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// ✅ Health check route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "✅ Backend is running successfully!",
  });
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 EduVerse Backend Server is Live on Port 5000!");
});

// ✅ Supabase connection test route
app.get("/api/test-supabase", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: "✅ Supabase connection successful!",
      sampleData: data,
    });
  } catch (err) {
    console.error("❌ Supabase connection failed:", err.message);
    res.status(500).json({
      success: false,
      message: "❌ Supabase connection failed",
      error: err.message,
    });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server started successfully on http://localhost:${PORT}`);
});
