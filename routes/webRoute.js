const express = require('express');
const routerr = express();

routerr.set('view engine','ejs');
routerr.set('views','./views');
routerr.use(express.static('public'));

const userControllers = require('../controllers/usercontroller');

routerr.get('/mail-verification', userControllers.verifyMail);
routerr.get('/reset-password', userControllers.resetpassword);
routerr.post('/reset-password', userControllers.resetPassword);


module.exports = routerr;