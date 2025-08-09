require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// ==================== Middleware globaux ====================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Origines autorisées
const allowedOrigins = [
  "http://localhost:3000",
  "https://sailingloc-front.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Routes
const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const bateauRoutes = require("./routes/bateauRoute");
app.use("/api/bateaux", bateauRoutes);

const uploadRoute = require("./routes/uploadRoute");
app.use("/upload-documents", uploadRoute);

const userRoutes = require("./routes/utilisateurRoute");
app.use("/api/utilisateur", userRoutes);

// app.get('/env-test', (req, res) => {
//   res.json({
//     database: process.env.DATABASE_URL,
//     secret: process.env.API_SECRET
//   });
module.exports = app;
