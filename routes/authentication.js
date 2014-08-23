var express = require('express');
var router = express.Router();
var passport = require('passport');
var models = require('../models/');
var nodemailer = require("nodemailer");

router.get('/', function(req, res) {
    res.render('index', {
        title: 'Log in'
    });
});

router.post('/signup', passport.authenticate('local-signup', {}), function(req, res) {
    //res.json(req.user);
    //send a confirmation email with objectId and authentication key
    var smtpTransport = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "yardsalecu@gmail.com",
            // pass: process.env.EMAIL_PASSWORD
            // pass: process.env.EMAIL_PASSWORD
            pass: process.env.EMAIL_PASSWORD
        }

    });
    
    smtpTransport.sendMail({
        from: "Yard Sale Auto", // sender address
        to: req.user.local.email, // comma separated list of receivers
        subject: "Yardsale email authentication", // Subject line
        text: "This is a confirmation email from yard sale. Click to confirm your account \n" + "http://192.168.1.166:3000/authentication/id/" + req.user._id + "/authentication_key/" + req.user.authenticationKey // plaintext body
    }, function(error, response) {
        if (error) {
            console.log(error);
        } else {
            res.send(200);
            console.log("Message sent: " + response.message);
        }
    });
});

router.post('/login', passport.authenticate('local-login', {}), function(req, res) {
    if(req.user.isAuthenticated) {
      res.json(req.user);
    } else {
      res.send("noAutha");
    }
});

router.get('/logout', function(req, res) {
    res.render('index', {
        title: 'Log out'
    });
});

router.get('/id/:id/authentication_key/:key', function(req, res) {
    var id = req.params.id;
    var key = req.params.key;

    models.User.find({
        _id: id
    }).exec(function(err, user) {
        if (user[0].authenticationKey == key) {
            user[0].isAuthenticated = true;
            user[0].save();
            res.send("The user is now authenticated");
        } else {
            res.send(404);
        }
    });
});


module.exports = router;