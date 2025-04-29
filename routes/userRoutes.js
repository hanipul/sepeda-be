const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.createUser);
router.get('/:cardId', userController.getUserByCardId);

module.exports = router;
