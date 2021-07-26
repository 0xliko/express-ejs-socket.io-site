const express = require('express');
const isAuth = require('../middleware/is-auth');
const checkController = require('../controllers/checkController');
const router = express.Router();

router.get('/attend_check',isAuth, checkController.attend_check);
router.post('/attend_check',isAuth, checkController.attendAjax);
router.post('/attendTable',isAuth, checkController.attendTable);

module.exports = router;