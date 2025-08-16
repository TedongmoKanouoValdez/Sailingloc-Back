// paymentService.js
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createPaymentIntent(amount) {
  if (!amount || isNaN(amount)) {
    throw new Error("Montant invalide ou manquant.");
  }
  

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
  });

  return paymentIntent.client_secret;
}

module.exports = { createPaymentIntent };
