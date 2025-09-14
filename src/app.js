require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// ==================== Middleware globaux ====================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const allowedOrigins = [
  "http://localhost:3000",
  "https://sailingloc-front.vercel.app",
  "https://dsp-dev-o23-g1.vercel.app",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Autorise uniquement les origines dans la liste
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Gère la préflight request OPTIONS
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

const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payment", paymentRoutes);

const commentaireRoutes = require("./routes/commentaireRoutes");
app.use("/api/commentaires", commentaireRoutes);

const reservationRoutes = require("./routes/reservation.routes");
app.use("/api/reservations", reservationRoutes);

const messageRoutes = require("./routes/message.routes");
app.use("/messages", messageRoutes);

const paiementRoutes = require("./routes/paiement.routes");
app.use("/api/paiements", paiementRoutes);

const contratRoutes = require("./routes/contrat");
app.use("/api/upload-contrat", contratRoutes);

const recuRoutes = require("./routes/recuRoutes");
app.use("/api", recuRoutes);

const demandeRoutes = require('./routes/demandeProprietaireRoutes');
app.use('/api', demandeRoutes);

// app.get('/env-test', (req, res) => {
//   res.json({
//     database: process.env.DATABASE_URL,
//     secret: process.env.API_SECRET
//   });

module.exports = app;
