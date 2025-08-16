import { sendEmail } from "../services/contactService.js";

export async function handleSendEmail(req, res) {
  try {
    const { email, link, message } = req.body;

    if (!email) {
      return res.status(400).json({ error: "L'e-mail est requis." });
    }
    

    await sendEmail(email, link, message); // délégué au service
    res.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'e-mail :", error);
    res.status(500).json({ error: "Échec de l'envoi de l'e-mail." });
  }
}
