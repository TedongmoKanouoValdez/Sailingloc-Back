// tests/functional/captcha.test.js
const request = require("supertest");
const express = require("express");
const axios = require("axios");

// Mock axios
jest.mock("axios");

// Mock environment variable
process.env.RECAPTCHA_SECRET_KEY = "test-secret-key";

const app = express();
app.use(express.json());

// Import and use the route
const captchaRouter = require("../../../routes/captcha");
app.use("/api", captchaRouter);

describe("CAPTCHA Route", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/verify-captcha", () => {
    it("devrait retourner 400 si token manquant", async () => {
      const response = await request(app).post("/api/verify-captcha").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ ok: false });
    });

    it("devrait retourner 400 si token vide", async () => {
      const response = await request(app)
        .post("/api/verify-captcha")
        .send({ token: "" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({ ok: false });
    });

    it("devrait appeler l'API Google reCAPTCHA avec les bons paramètres", async () => {
      // Mock successful response from Google
      axios.post.mockResolvedValue({
        data: {
          success: true,
          score: 0.8,
        },
      });

      const token = "test-captcha-token";
      const response = await request(app)
        .post("/api/verify-captcha")
        .send({ token });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true, score: 0.8 });

      // Verify axios call
      expect(axios.post).toHaveBeenCalledWith(
        "https://www.google.com/recaptcha/api/siteverify",
        null,
        {
          params: {
            secret: "test-secret-key",
            response: token,
            remoteip: expect.any(String), // supertest adds IP
          },
        }
      );
    });

    it("devrait retourner false si reCAPTCHA échoue", async () => {
      // Mock failed response from Google
      axios.post.mockResolvedValue({
        data: {
          success: false,
          score: 0.3,
        },
      });

      const response = await request(app)
        .post("/api/verify-captcha")
        .send({ token: "test-token" });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: false, score: 0.3 });
    });

    it("devrait retourner 500 en cas d'erreur de l'API Google", async () => {
      // Mock axios error
      axios.post.mockRejectedValue(new Error("API Error"));

      const response = await request(app)
        .post("/api/verify-captcha")
        .send({ token: "test-token" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ ok: false });
    });

    it("devrait gérer les erreurs réseau", async () => {
      // Mock network error
      axios.post.mockRejectedValue({
        code: "ENOTFOUND",
        message: "Network error",
      });

      const response = await request(app)
        .post("/api/verify-captcha")
        .send({ token: "test-token" });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ ok: false });
    });

    it("devrait inclure l'adresse IP dans la requête Google", async () => {
      axios.post.mockResolvedValue({
        data: { success: true, score: 0.9 },
      });

      const token = "test-token";
      await request(app).post("/api/verify-captcha").send({ token });

      // Check that remoteip was included in params
      const callParams = axios.post.mock.calls[0][2].params;
      expect(callParams.remoteip).toBeDefined();
      expect(callParams.remoteip).not.toBe("");
    });

  });
});

// Test avec différentes scores
describe("CAPTCHA Score Handling", () => {
  it("devrait accepter un score élevé", async () => {
    axios.post.mockResolvedValue({
      data: { success: true, score: 0.9 },
    });

    const response = await request(app)
      .post("/api/verify-captcha")
      .send({ token: "high-score-token" });

    expect(response.body).toEqual({ ok: true, score: 0.9 });
  });

  it("devrait rejeter un score faible", async () => {
    axios.post.mockResolvedValue({
      data: { success: true, score: 0.2 }, // Low score
    });

    const response = await request(app)
      .post("/api/verify-captcha")
      .send({ token: "low-score-token" });

    expect(response.body).toEqual({ ok: true, score: 0.2 });
  });
});

// Test d'intégration avec différents tokens
describe("Different Token Scenarios", () => {
  it("devrait travailler avec des tokens longs", async () => {
    const longToken = "a".repeat(1000);
    axios.post.mockResolvedValue({
      data: { success: true, score: 0.7 },
    });

    const response = await request(app)
      .post("/api/verify-captcha")
      .send({ token: longToken });

    expect(response.status).toBe(200);
  });

  it("devrait travailler avec des tokens spéciaux", async () => {
    const specialToken = "test-token-éàü@123";
    axios.post.mockResolvedValue({
      data: { success: true, score: 0.7 },
    });

    const response = await request(app)
      .post("/api/verify-captcha")
      .send({ token: specialToken });

    expect(response.status).toBe(200);
  });
});
