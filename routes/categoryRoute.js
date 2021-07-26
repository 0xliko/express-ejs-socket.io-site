const express = require('express');
const isAuth = require('../middleware/is-auth');
const categoryController = require('../controllers/categoryController');
const router = express.Router();

router.get('/categories',isAuth, categoryController.categories);
router.post('/categories',isAuth, categoryController.categoryAjax);
//router.get('/adding_users',isAuth, categoryController.adding_users);
//router.post('/adding_users',isAuth, categoryController.addingUserAjax);
//router.post('/userCategoryTable',isAuth, categoryController.userCategoryTable);

module.exports = router;