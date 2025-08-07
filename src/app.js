require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// Activer CORS
app.use(cors());

// Middleware pour parser le JSON
app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true, // si tu utilises des cookies ou headers d'authentification
  })
);

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
