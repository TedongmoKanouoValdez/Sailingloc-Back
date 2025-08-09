const app = require("./src/app");

// // Démarrer le serveur
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   // console.log(`Serveur démarré sur http://localhost:${PORT}`);
// });

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}
