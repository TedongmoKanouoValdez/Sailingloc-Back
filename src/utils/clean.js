// utils/clean.js
function cleanString(str) {
  if (typeof str !== "string") return str;
  return str.replace(/\0/g, ""); // supprime null bytes
}
module.exports = { cleanString };
