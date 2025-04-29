// controllers/scanController.js
let latestScannedCard = null;

const saveScannedCard = (req, res) => {
  const { cardId } = req.body;
  if (!cardId) return res.status(400).json({ message: "cardId is required" });

  latestScannedCard = cardId;
  res.json({ message: "Card ID received", cardId });
};

const getLatestScannedCard = (req, res) => {
  if (!latestScannedCard) {
    return res.status(404).json({ message: "No card scanned yet" });
  }

  res.json({ cardId: latestScannedCard });
  latestScannedCard = null; 
};

module.exports ={
  saveScannedCard,
  getLatestScannedCard
}