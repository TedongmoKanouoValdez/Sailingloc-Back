const serverless = require("serverless-http");
const app = require("../src/app");

module.exports = (req, res) => {
  app(req, res);
};
