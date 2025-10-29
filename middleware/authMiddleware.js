import { supabase } from "../config/supabaseClient.js";

// ✅ Basic authentication (already good)
export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return res.status(401).json({ error: "Invalid token" });

  req.user = data.user;
  next();
};

// ✅ Role-based authorization
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.user_metadata?.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied: requires ${allowedRoles.join(" or ")} role`,
      });
    }
    next();
  };
};
