const express = require('express');
const router = express.Router();
const {registerValidation, loginValidation, forgetpassValidation, updateprofileValidation} = require('../validations/validation');
const userControllers = require('../controllers/usercontroller');
const {isAuthorize} = require('../middleware/auth');

router.post('/register', registerValidation, userControllers.register);
router.post('/login',loginValidation, userControllers.login);

router.get('/get-user', isAuthorize,userControllers.getUser);

router.post('/forget-password', forgetpassValidation, userControllers.forgetpassword);
router.post('/updateprofile', updateprofileValidation, isAuthorize, userControllers.updateprofile);

module.exports = router;