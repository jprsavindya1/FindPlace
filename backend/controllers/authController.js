const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const db = require("../db");
const axios = require("axios");

const client = new OAuth2Client(
  "593149822202-o648jt4p23lcistoh3q9n0ishss7kthj.apps.googleusercontent.com"
);

exports.googleAuth = async (req, res) => {
  try {

    const { token } = req.body;
    let email, name;

    try {
      // First try to verify as an ID Token (Standard GoogleLogin)
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: "593149822202-o648jt4p23lcistoh3q9n0ishss7kthj.apps.googleusercontent.com",
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
    } catch (idTokenErr) {
      // If it fails, assume it's an Access Token from useGoogleLogin
      try {
        const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${token}` }
        });
        email = response.data.email;
        name = response.data.name;
      } catch (accessTokenErr) {
        console.error("Access Token Verification Failed:", accessTokenErr.message);
        return res.status(401).json({ message: "Invalid Google token" });
      }
    }

    // check user already exists
    const sql = "SELECT * FROM users WHERE email = ? LIMIT 1";

    db.query(sql, [email], (err, results) => {

      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      // user already exists → login
      if (results.length > 0) {

        const user = results[0];

        const jwtToken = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET || "findplace_secret",
          { expiresIn: "1d" }
        );

        return res.json({
          token: jwtToken,
          role: user.role,
          userId: user.id,
          name: user.name
        });

      }

      // user not exists → register
      const insertSQL =
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

      db.query(insertSQL, [name, email, "google_auth", "customer"], (err, result) => {

        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Registration failed" });
        }

        const jwtToken = jwt.sign(
          { id: result.insertId, role: "customer" },
          process.env.JWT_SECRET || "findplace_secret",
          { expiresIn: "1d" }
        );

        return res.json({
          token: jwtToken,
          role: "customer",
          userId: result.insertId,
          name: name
        });

      });

    });

  } catch (err) {

    console.error(err);

    res.status(401).json({
      message: "Google authentication failed"
    });

  }
};