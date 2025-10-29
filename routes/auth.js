import express from "express";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../config/supabaseClient.js";

const router = express.Router();

/* ---------------------------- 🔹 SIGNUP ---------------------------- */
router.post("/signup", async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    // 1️⃣ Create user in Supabase Auth (no email verification redirect for now)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (error) throw error;
    const user = data.user;
    const session = data.session;

    // 2️⃣ Use a user-authenticated client (with JWT) to insert profile
    if (session) {
      const userClient = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY,
        {
          global: {
            headers: { Authorization: `Bearer ${session.access_token}` },
          },
        }
      );

      const { error: insertError } = await userClient
        .from("profiles")
        .insert([{ id: user.id, name, role }]);

      if (insertError) {
        console.warn("⚠️ Profile insert failed:", insertError.message);
      }
    }

    res.json({
      success: true,
      message: "✅ Signup successful",
      user,
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

/* ----------------------------- 🔹 LOGIN ----------------------------- */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    const { user, session } = data;

    // Ensure profile exists for this user
    const userClient = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY,
      {
        global: {
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      }
    );

    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      await userClient
        .from("profiles")
        .insert([{ id: user.id, name: user.user_metadata.name, role: "student" }]);
    }

    res.json({
      success: true,
      message: "✅ Login successful",
      session,
      user,
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;

/* ------------------------------- 🔹 PROFILE -------------------------------- */
router.get("/profile", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res.status(401).json({ success: false, error: "No token provided" });

  try {
    // 1️⃣ Get authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError) throw authError;

    const user = authData.user;

    // 2️⃣ Fetch or create profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") throw profileError;

    // 3️⃣ If no profile exists yet, create one
    let finalProfile = profile;
    if (!profile) {
      const { data: insertedProfile, error: insertError } = await supabase
        .from("profiles")
        .insert([
          { id: user.id, name: user.user_metadata.name, role: user.user_metadata.role },
        ])
        .select()
        .single();

      if (insertError) throw insertError;
      finalProfile = insertedProfile;
    }

    res.json({
      success: true,
      user,
      profile: finalProfile,
    });
  } catch (err) {
    console.error("Profile fetch error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});
