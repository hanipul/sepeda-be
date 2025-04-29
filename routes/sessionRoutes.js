const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController'); // Import full controller

router.post('/start', sessionController.startSession);


router.post('/end', sessionController.endSession);
router.get('/active-latest', sessionController.getLatestActiveSession);
router.get('/:cardId', sessionController.getSessionHistory);
router.post('/check-user', sessionController.checkUserExistence); // ✅ Fix here
  
module.exports = router;
