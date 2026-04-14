require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());

// --- SECRET KEY ---
const SECRET = process.env.JWT_SECRET;

// --- DATABASE CONNECTION ---
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('CRITICAL: Could not connect to PostgreSQL!', err.stack);
  }
  console.log('SUCCESS: Connected to PostgreSQL database (ecotracker)');
  release();
});

// --- AUTH MIDDLEWARE ---
const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).send("No token provided");

    try {
      const decoded = jwt.verify(token, SECRET);

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).send("Access denied");
      }

      req.user = decoded;
      next();
    } catch {
      res.status(401).send("Invalid token");
    }
  };
};

// --- ROUTES ---

// ✅ REGISTER
app.post("/api/register", async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (email, password, role) VALUES ($1,$2,$3)",
      [email, hashed, role || "viewer"]
    );

    res.json({ message: "User created successfully" });
  } catch (err) {
    res.status(400).json({ error: "User already exists" });
  }
});

// ✅ LOGIN
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: "User not found" });
  }

  const user = result.rows[0];

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: "Invalid password" });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    SECRET,
    { expiresIn: "1h" }
  );

  res.json({ token, role: user.role });
});

// ✅ Get Emissions Data (Protected)
app.get('/api/emissions', auth(), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT month, value FROM emissions ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching emissions:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get KPI Data (Protected)
app.get('/api/live-kpis', auth(), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM live_metrics ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching KPIs:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update KPI (ADMIN ONLY)
app.post('/api/update-kpi', auth(["admin"]), async (req, res) => {
  const { id, newValue } = req.body;

  console.log(`Update Request - ID: ${id}, Value: ${newValue}`);

  if (!id || newValue === undefined) {
    return res.status(400).json({ error: "Missing ID or value" });
  }

  try {
    const result = await pool.query(
      'UPDATE live_metrics SET metric_value = $1 WHERE id = $2',
      [String(newValue), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Metric not found" });
    }

    res.json({ message: "Update successful" });
  } catch (err) {
    console.error("Database error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- SERVER START ---
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`-----------------------------------------`);
  console.log(`EcoTrack Backend running on Port ${PORT}`);
  console.log(`Auth + RBAC ENABLED`);
  console.log(`-----------------------------------------`);
});