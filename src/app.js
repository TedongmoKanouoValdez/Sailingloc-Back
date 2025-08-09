require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Origines autorisées
const allowedOrigins = [
  "http://localhost:3000", // développement local
  "https://sailingloc-front.vercel.app", // production
];

// CORS dynamique
app.use(
  cors({
    origin: function (origin, callback) {
      // Autoriser les requêtes sans "origin" (Postman, tests internes)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true, // important si tu utilises cookies / sessions
  })
);

// ==================== Forcer headers CORS en global ====================
app.use((req, res, next) => {
  const origin = allowedOrigins.includes(req.headers.origin)
    ? req.headers.origin
    : allowedOrigins[1]; // Par défaut, prend sailingloc-front.vercel

  res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// ==================== Gérer OPTIONS (Preflight) ====================
app.options("*", cors());

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
// });

// Démarrer le serveur une seule fois
const PORT = process.env.PORT || 3001;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app; // Utile pour les tests ou pour un autre usage
