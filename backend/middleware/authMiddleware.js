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
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
};

/* ================= OWNER ONLY ================= */
const verifyOwner = (req, res, next) => {
  if (!req.user || req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner access only" });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyOwner,
};
