const serverless = require("serverless-http");
const app = require("../src/app");

module.exports = (req, res) => {
  app(req, res);
};

// const PORT = process.env.PORT || 3001;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
