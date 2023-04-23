const { check } = require('express-validator');

exports.registerValidation = [
    check('name','Please enter the name').not().isEmpty(),
    check('email','Please enter the valid email').isEmail().normalizeEmail({gmail_remove_dots:true}),
    check('password','Please enter the valid password').isLength({min:5}),
]

exports.loginValidation = [
    check('email','Please enter the valid email').isEmail().normalizeEmail({gmail_remove_dots:true}),
    check('password','Please enter  the valid password').isLength({min:5}),
]
exports.forgetpassValidation = [
    check('email','Please enter the valid email').isEmail().normalizeEmail({gmail_remove_dots:true}),
]
exports.updateprofileValidation = [
    check('name','Please enter the name').not().isEmpty(),
    check('email','Please enter the valid email').isEmail().normalizeEmail({gmail_remove_dots:true}),
]

