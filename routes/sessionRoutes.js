const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Endpoint untuk mengambil sesi aktif terbaru
router.get('/active-latest', sessionController.getLatestActiveSession); // Endpoint yang benar
router.get('/latest/:cardId', sessionController.getLatestSession);  // Perbaiki nama fungsi
router.post('/start', sessionController.startSession);
router.post('/end', sessionController.endSession);
router.post('/check-user', sessionController.checkUserExistence);
router.get('/:cardId', sessionController.getSessionHistory);

module.exports = router;
