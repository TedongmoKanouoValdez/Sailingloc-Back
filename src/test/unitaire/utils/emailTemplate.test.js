// src/test/unitaire/utils/emailTemplate.test.js
const { resetPasswordTemplate } = require("../../../utils/emailTemplate");

describe("Email Template Utils", () => {
  describe("resetPasswordTemplate", () => {
    it("devrait retourner un template HTML avec l'URL de réinitialisation", () => {
      // Arrange
      const resetUrl = "https://example.com/reset-password?token=abc123";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert
      expect(result).toContain(resetUrl);
      expect(result).toContain("Réinitialisation de votre mot de passe");
      expect(result).toContain("Réinitialiser mon mot de passe");
      expect(result).toContain("SAILINGLOC");
    });

    it("devrait contenir la structure HTML de base", () => {
      // Arrange
      const resetUrl = "https://example.com/reset";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert
      // Vérifier la structure div plutôt que html/body/doctype
      expect(result).toContain('<div style="');
      expect(result).toContain("</div>");
      expect(result).toContain("background:#f7f9fc");
      expect(result).toContain("font-family");
    });

    it("devrait inclure le copyright et le nom de l'entreprise", () => {
      // Arrange
      const resetUrl = "https://example.com/reset";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert
      expect(result).toContain("SailInLoc");
      expect(result).toContain("&copy;"); // Utilise &copy; au lieu de ©
      expect(result).toContain("2025");
      expect(result).toContain("Tous droits réservés");
    });

    it("devrait échapper correctement les caractères spéciaux dans l'URL", () => {
      // Arrange
      const resetUrl =
        "https://example.com/reset?token=abc&email=test@example.com";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert
      expect(result).toContain(resetUrl);
      expect(result).toContain(`href="${resetUrl}"`);
    });

    it("devrait contenir le message de sécurité", () => {
      // Arrange
      const resetUrl = "https://example.com/reset";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert - Vérifier la présence du message sans dépendre du type de guillemet
      expect(result).toMatch(/Si vous n[’']avez pas demandé cette action/);
      expect(result).toContain("ignorez simplement cet e-mail");
    });

    it("devrait avoir le bon style et les bonnes couleurs", () => {
      // Arrange
      const resetUrl = "https://example.com/reset";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert
      expect(result).toContain("#3682AE"); // Couleur principale
      expect(result).toContain("background:#f7f9fc");
      expect(result).toContain("border-radius:8px");
    });

    it("devrait être une chaîne de caractères non vide", () => {
      // Arrange
      const resetUrl = "https://example.com/reset";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
      expect(result.trim()).not.toBe("");
    });

    it("devrait fonctionner avec une URL vide", () => {
      // Arrange
      const resetUrl = "";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert
      expect(result).toContain('href=""');
      expect(typeof result).toBe("string");
    });

    it("devrait fonctionner avec une URL complexe", () => {
      // Arrange
      const resetUrl =
        "https://sailinloc.com/reset-password?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9&expires=1234567890";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert
      expect(result).toContain(resetUrl);
      expect(result).toContain(`href="${resetUrl}"`);
    });

    it("devrait contenir les sections header, body et footer", () => {
      // Arrange
      const resetUrl = "https://example.com/reset";

      // Act
      const result = resetPasswordTemplate(resetUrl);

      // Assert
      expect(result).toContain("<!-- HEADER -->");
      expect(result).toContain("<!-- BODY -->");
      expect(result).toContain("<!-- FOOTER -->");
    });
  });
});
