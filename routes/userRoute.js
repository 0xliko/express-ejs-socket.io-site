const express = require('express');
const isAuth = require('../middleware/is-auth');
const userRoute = require('../controllers/userController');
const router = express.Router();

router.get('/admins',isAuth, userRoute.admins);
router.post('/admins',isAuth, userRoute.adminsAjax);
router.get('/attendants',isAuth, userRoute.attendants);
router.post('/attendants',isAuth, userRoute.attendantAjax);
router.post('/attendantTable',isAuth, userRoute.attendantTable);

module.exports = router;