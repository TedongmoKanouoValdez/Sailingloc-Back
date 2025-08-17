// src/lib/prisma.js
const { PrismaClient } = require("@prisma/client");

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  // Pour le développement : éviter de recréer plusieurs clients
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

module.exports = prisma;
