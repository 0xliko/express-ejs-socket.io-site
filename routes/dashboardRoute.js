const express = require('express');
const isAuth = require('../middleware/is-auth');
const dashboardController = require('../controllers/dashboardController');
const router = express.Router();

router.get('/',isAuth, dashboardController.getDashboard);
router.get('/dashboard',isAuth, dashboardController.getDashboard);
router.post('/dashboard',isAuth, dashboardController.postDashboard);
router.post('/',isAuth, dashboardController.postDashboard);

module.exports = router;