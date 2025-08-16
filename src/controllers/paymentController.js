const { createPaymentIntent } = require("../services/paymentService");

async function handleCreatePaymentIntent(req, res) {
  try {
    const { amount } = req.body;
    const clientSecret = await createPaymentIntent(amount);
    res.json({ clientSecret });
  } catch (error) {
    console.error("Erreur create-payment-intent:", error.message);
    res.status(500).json({ error: "Erreur lors de la création du paiement." });
  }

  
}

module.exports = { handleCreatePaymentIntent };
