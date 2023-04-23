const { validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

const db = require('../config/dbConnection');


const randomstring = require('randomstring');
const sendMail = require('../mailsender/sendMail');

const jwt = require('jsonwebtoken');
const {JWT_SECRET} = process.env;

const register = (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    db.query(
        `SELECT * FROM users WHERE LOWER(email) = LOWER(${db.escape(
            req.body.email
        )}); `,
        (err, result) => {
            if (result && result.length) {
                return res.status(409).send({
                    msg: 'Email is already in use'
                });
            }
            else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {

                    if (err) {
                        return res.status(400).send({
                            msg: err,
                        });
                    }
                    else {
                        db.query(
                            `INSERT INTO users (name,email,password) VALUES ('${req.body.name}',${db.escape(
                                req.body.email
                            )},${db.escape(hash)});`,
                            (err, result) => {
                                if (err) {
                                    return res.status(400).send({
                                        msg: err
                                    });
                                }
                                
                                let mailSubject = 'Mail Verification';
                                const randomString = randomstring.generate();
                                let content = '<p>Hii '+req.body.name+',\
                                Please <a href="http://127.0.0.1:3000/mail-verification?token='+randomString+'" verify</a> your mail>';
                                sendMail(req.body.email, mailSubject, content);

                                db.query('UPDATE users set token=? where email=?', [randomString, req.body.email], function(error,result){
                                    if(error){
                                        return res.send(400).send({
                                            msg:error,
                                        });
                                    }
                                });
                                return res.status(200).send({
                                    msg: 'The user registered successfully!',
                                });


                            }
                        );
                    }
                })
            }
        }
    )
}

const verifyMail = (req,res)=>{

    var token = req.body.token;

    db.query('SELECT * FROM users where token=? limit 1', token, function(error, result){

        if(error){
            console.log(error.message)
        }

        if(result.length > 0){

            db.query(`
            UPDATE users SET  token = null, is_verified = 1 where id = '${result[0].id}'
            `);

        }
        else{
            return res.render('404');
        }
    })
}

const login = (req, res)=>{

    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).send({errors:errors.array()});
    }

    db.query(
        `SELECT * FROM users WHERE email = ${db.escape(req.body.email)};`,
        (error, result)=>{
            if(error){
                return res.status(400).send({
                    message:error
                });
            }
            if(!result.length){
                return res.status(401).send({
                    message:'Email or Password is incorrect!'
                });
            }
            bcrypt.compare(
                req.body.password,
                result[0]['password'],
                (bErr, bResult)=>{
                    if(bErr){
                        return res.status(400).send({
                            msg:bErr,
                        });
                    }
                    if(bResult){
                        const token = jwt.sign({ id: result[0]['id'], is_admin: result[0]['is_admin']}, JWT_SECRET, {expiresIn:'1h'});
                        db.query(
                            `UPDATE users SET lastlogin = now() WHERE id = '${result[0]['id']}'`
                        );
                         return res.status(200).send({
                            msg:'Logged In',
                            token,
                            user:result[0]
                        });
                    }
                    return res.status(401).send({
                        message:'Email or Password is incorrect!'
                    });
                }
            )
        }
    )
}

const getUser = (req, res)=>{
    
    const authToken = req.headers.authorization.split(' ')[1];
    const decode = jwt.verify(authToken, JWT_SECRET);

    db.query('SELECT * FROM users where id=?', decode.id, function(error, result){
        if(error) throw error;

        return res.status(200).send({ success:true, data:result[0], message:'Fetch Successfully'});
    });
}

const forgetpassword = (req, res)=>{
    const errors = validationResult(req);

    if(!errors.isEmpty()){
        return res.status(400).send({errors:errors.array()});
    }

    var email = req.body.email;
    db.query('SELECT * FROM users WHERE email=? limit 1', email, function(error, result){
        if(error){
            res.status(400).json({message:error});
        }
        if(result.length > 0){
            let mailSubject = 'Forget password';
            const randomString = randomstring.generate();
            let content = '<p>Hii, '+result[0].name+'\
            Please <a href="http://127.0.0.1:3000/reset-password?token='+randomString+'"> Click here</a> tp reset your password</p>';
            sendMail(email, mailSubject, content);

            db.query(
                `DELETE FROM password_resets WHERE email=${db.escape(result[0].email)}
                `);

            db.query(
                `INSERT INTO password_resets (email, token) VALUES(${db.escape(result[0].email)}, '${randomString}')
                `);
                return res.status(201).send({
                    message:'Mail sent Successfully'
                });
        }
        return res.status(401).send({
            message:"Email doesn't exists"
        })
    })
}

const resetpassword = (req, res)=>{
    try {
        
        var token = req.query.token;
        if(token == undefined){
            return res.render('404');
        }

        db.query(`SELECT * FROM password_resets WHERE token=? limit 1`, token, function(error, result){
            if(error){
                console.log(error);
            }

            if(result !== undefined && result.length > 0){

                db.query(`SELECT * FROM users WHERE email=? limit 1`, result[0].email, function(error, result){
                    if(error){
                        console.log(error);
                    }

                    return res.render('reset-password', { user: result[0] });
                })
            }
            else{
                return res.render('404');
            }
        })
    } catch (error) {
       console.log(error.message); 
    }
}


const resetPassword = (req, res)=>{
    if(req.body.password != req.body.confirm_password){
        res.render('reset-password', {error_message:'Password not Matching', user:{id:req.body.user_id, email:req.body.email}})
    }

    bcrypt.hash(req.body.confirm_password, 10, (err, hash)=>{

        if(err){
            console.log(err);
        }

        db.query(`DELETE FROM password_resets WHERE email = '${req.body.email}'`);

        db.query(`UPDATE users SET password = '${hash}' WHERE id = '${req.body.user_id}'`);

        return res.render('message', { message: 'Password reset Successfully!'});
    })
}

const updateprofile = (req, res)=>{
    try {
        const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const token = req.headers.authorization.split(' ')[1];
    const decode = jwt.verify(token, JWT_SECRET);

    if(req.file !== undefined){
        sql = `UPDATE users SET name = ?, email = ?, image = ? WHERE id = ?`;
        data = [req.body.name, req.body.email, 'images/'+req.file.filename, decode.id];
    }
    else{
        sql = `UPDATE users SET name = ?, email = ? WHERE id = ?`;
        data = [req.body.name, req.body.email, decode.id];
    }

    db.query( sql, data, function(error,result){

        if(error){
            return res.status(400).send({
                msg:error
            });
        }
        
        return res.status(201).send({
            msg:'Profile Updated Successfully!'
        })
    })




} 
catch (error) {
        return res.status(400).json({msg:error.message});
    }
}


module.exports = {
    register,
    verifyMail,
    login,
    getUser,
    forgetpassword,
    resetpassword,
    resetPassword,
    updateprofile
    
};