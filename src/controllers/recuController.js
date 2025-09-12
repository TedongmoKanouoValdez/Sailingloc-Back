const { uploadRecuService } = require("../services/recuService");

async function uploadRecuController(req, res) {
  try {
    const { reservationId } = req.body;
    if (!reservationId)
      return res.status(400).json({ error: "Reservation ID manquant" });
    if (!req.file) return res.status(400).json({ error: "Fichier manquant" });

    const data = await uploadRecuService(req.file.path, reservationId);
    res.json({ success: true, ...data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { uploadRecuController };
