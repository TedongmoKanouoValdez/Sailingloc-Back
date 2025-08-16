const Stripe = require('stripe');
const express = require('express');
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Montant invalide ou manquant." });
    }
    

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // en centimes
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Erreur create-payment-intent:", error.message);
    res.status(500).json({ error: "Une erreur est survenue lors de la création du paiement." });
  }
});

module.exports = router;
