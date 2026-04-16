const jwt = require("jsonwebtoken");

/* ================= VERIFY TOKEN ================= */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "findplace_secret"
    );

    // decoded = { id, role, iat, exp }
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

/* ================= ADMIN ONLY ================= */
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    console.warn(`Unauthorized Admin Access Attempt by: ${req.user?.id || 'Unknown'}, Role: ${req.user?.role || 'None'}`);
    return res.status(403).json({ message: "Access Denied: Admin privileges required." });
  }
  next();
};

/* ================= OWNER OR ADMIN ================= */
const verifyOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: No user found" });
  }

  const role = req.user.role;
  if (role === "owner" || role === "admin") {
    return next();
  }

  console.warn(`Unauthorized Resource Access Attempt by: ${req.user.id}, Role: ${role}`);
  return res.status(403).json({ message: "Access Denied: Owner or Admin privileges required." });
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyOwnerOrAdmin,
};
