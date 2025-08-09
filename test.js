// const serverless = require("serverless-http");
// const app = require("./src/app");

// // // Démarrer le serveur
// // const PORT = process.env.PORT || 3001;
// // app.listen(PORT, () => {
// //   // console.log(`Serveur démarré sur http://localhost:${PORT}`);
// // });

// // if (require.main === module) {
// //   const PORT = process.env.PORT || 3001;
// //   app.listen(PORT, () => {
// //     console.log(`Serveur démarré sur http://localhost:${PORT}`);
// //   });
// // }

// // module.exports = app;

// // module.exports = serverless(app);

// const handler = serverless(app);

// handler(
//   { httpMethod: "GET", path: "/" },
//   {
//     statusCode: 0,
//     headers: {},
//     body: "",
//     setHeader() {},
//     end() {},
//   }
// )
//   .then((res) => {
//     console.log("Response:", res);
//   })
//   .catch(console.error);

const serverless = require("serverless-http");
const app = require("./src/app");

const handler = serverless(app);

handler(
  { httpMethod: "GET", path: "/" },
  {
    statusCode: 0,
    headers: {},
    body: "",
    setHeader() {},
    end() {},
  }
)
  .then((res) => console.log("Réponse :", res))
  .catch(console.error);
