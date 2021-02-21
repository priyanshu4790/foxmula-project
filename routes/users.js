const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')





//user model


const User = require('../models/User');

const JWT_SECRET = 'some super secret...'




// Login Page
router.get('/login', (req, res) => res.render('login'))

// Register Page
router.get('/register', (req, res) => res.render('register'))



// Register Handle
router.post('/register', (req, res)=> {
    const {name, email, phone , password, password2} = req.body;

    let errors = [];

//    check required fields
    if(!name || !email || !phone || !password || !password2){
        errors.push({msg: 'Please fill in all fields'})
    }
//   phone number length
     if(phone.length != 10){
         errors.push({msg: 'Enter 10 digit phone number'})
     }

//    check passwords match
    if(password !== password2){
        errors.push({msg: "passwords do not match"})
    }

//    password length
    if(password.length < 6) {
        errors.push({msg: 'password must be at least 6 characters'})
    }

    if(errors.length > 0){
        res.render('register', {
            errors,
            name,
            email,
            phone,
            password,
            password2
        });
    }else{
    //    validation passed
        User.findOne({ email: email })
            .then(user => {
                if (user) {
                    // User Exists
                    errors.push({ msg: 'email is already registered'})
                    res.render('register', {
                        errors,
                        name,
                        email,
                        phone,
                        password,

                    });
                } else {
                    const newUser = new User({
                        name,
                        email,
                        phone,
                        password
                    });
                    

                //    hash password
                    bcrypt.genSalt(10, (err, salt) =>
                        bcrypt.hash(newUser.password, salt, (err, hash) =>{
                            if(err) throw err;
                            // set password to hashed
                            newUser.password = hash;
                        //    Save User
                            newUser.save()
                                .then(user => {
                                    var transporter = nodemailer.createTransport({
                                        service: 'gmail',
                                        auth: {
                                          user: 'userautht69@gmail.com',
                                          pass: 'user@123456789'
                                        }
                                      });
                                      
                                      var mailOptions = {
                                        from: 'no-reply@userauth.com',
                                        to: newUser.email,
                                        subject: 'Signup sucess',
                                        text: `welcome User`
                                      };
                                      
                                      transporter.sendMail(mailOptions, function(error, info){
                                        if (error) {
                                          console.log(error);
                                        } else {
                                          console.log('Email sent: ' + info.response);
                                        }
                                      });
                                    
                                    req.flash('success_msg', 'You are now registered and can now log in');
                                    res.redirect('/users/login')
                                })
                                .catch(err => console.log(err));

                        }))
                }
            });
    }
});

// Login Handle
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);

});

//logout handle
router.get('/logout',(req, res)=>{
    req.logout();
    req.flash('success_msg','You are logged out');
    res.redirect('/users/login');
});

//forgot password

router.get('/forgot-password', (req, res) => res.render('forgot-password'))
router.post('/forgot-password',(req,res,) => {
  const{ email } = req.body;
  
  User.findOne({email: email})
  .then(user =>{
      if(!user){
        errors.push({ msg: 'email is not registered'});

      }
  })

 const secret = JWT_SECRET + User.password
 const payload = {
     email: user.email,
     id: user.id
 }
  const token = jwt.sign(payload,secret,{expiration: '15m'})
  const link = `http://localhost:5000/users/reset-password/${user.id}/${token}`;
  console.log(link);
  res.send('Password reset link has been sent to ur email......');


});

//Reset password

router.get('/reset-password/:id/:token',(req,res,next) => {
  const{id,token} = req.params;
  
  if(id !== User.id){
      res.send('Invalid id....')
      return
  }

  const secret = JWT_SECRET + User.password
  try{
    const payload = jwt.verify(token,secret)
    res.render('reset-password',{email: User.email})
  }
  catch(error){
    console.log(error.message);
    res.send(error.message);
  }

})
router.post('/reset-password',(req,res,next) => {
    
})













module.exports = router;
