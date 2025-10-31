import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from "./config/supabaseClient.js";
import authRoutes from "./routes/auth.js";
import { protect, requireRole } from "./middleware/authMiddleware.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

/* ------------------------------- ALL ROUTES ------------------------------- */

// api Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is running successfully!",
  });
});

// Root api check
app.get("/", (req, res) => {
  res.send(`EduVerse Backend Server is Live on Port ${PORT}`);
});

// Supabase connection test
app.get("/api/test-supabase", async (req, res) => {
  try {
    const { data, error } = await supabase.from("users").select("*").limit(1);
    if (error) throw error;
    res.status(200).json({
      success: true,
      message: "Supabase connection successful!",
      sampleData: data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Supabase connection failed",
      error: err.message,
    });
  }
});

/* ------------------------------- AUTH ROUTES ------------------------------- */
app.use("/api/auth", authRoutes);

/* ------------------------------- PROTECTED ROUTES ------------------------------- */

// Any logged-in user
app.get("/api/protected", protect, (req, res) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    message: `Welcome ${user.user_metadata.name}! You are logged in as a ${user.user_metadata.role}.`,
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata.name,
      role: user.user_metadata.role,
    },
  });
});

// Only accessible by educators
app.get("/api/educator/dashboard", protect, requireRole("educator"), (req, res) => {
  res.json({
    success: true,
    message: `Welcome educator ${req.user.user_metadata.name}!`,
  });
});


// Only accessible by admins
app.get("/api/admin/panel", protect, requireRole("admin"), (req, res) => {
  res.json({
    success: true,
    message: `Welcome admin ${req.user.user_metadata.name}!`,
  });
});

app.listen(PORT, () => {
  console.log(`Server started successfully on http://localhost:${PORT}`);
});
