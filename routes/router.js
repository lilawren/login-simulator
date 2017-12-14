var express = require('express');
var router = express.Router();
var User = require('../models/user');
var path = require('path');
var utils = require('./utils.js');
var mid = require('./mid.js')

router.get('/', function (req, res, next) {
    // send user to profile if already logged in
    if (req.session && req.session.userId) {
        res.redirect('/profile');
    }
    else {
        res.render('index', {});
    }
});

router.get('/password', mid.requiresLogin, function (req, res, next) {
    res.render('password', {});
});

//POST route for updating data
router.post('/', function (req, res, next) {
    // confirm that user typed same password twice
    if (req.body.password !== req.body.passwordConf) {
        let err = new Error('Passwords do not match.');
        err.status = 400;
        res.send("Passwords dont match");
        return next(err);
    }

    // Creating new user
    if (req.body.email && req.body.username && req.body.password && req.body.passwordConf) {
        // testing of inputs
        if (utils.validateEmail(req.body.email) == false) {
            let err = utils.sendError(res, 'Email is invalid');
            return next(err);
        }

        if (utils.validatePassword(req.body.password) == false) {
            let err = utils.sendError(res, 'Password needs at least one digit, one special character e.g. !@#$%^&* and a minimum length of 8');
            return next(err);
        }

        let userData = {
            email: req.body.email,
            username: req.body.username,
            password: req.body.password,
        }

        User.create(userData, function (error, user) {
            if (error) {
                return next(error);
            } else {
                req.session.userId = user._id;
                return res.redirect('/profile');
            }
        });

    }
    else if (req.body.logemail && req.body.logpassword) {
        User.authenticate(req.body.logemail, req.body.logpassword, function (error, user) {
            if (error || !user) {
                var err = new Error('Wrong email or password.');
                err.status = 401;
                return next(err);
            } else {
                req.session.userId = user._id;
                return res.redirect('/profile');
            }
        });
    } else {
        var err = new Error('All fields required.');
        err.status = 400;
        return next(err);
    }
})

// GET route after registering
router.get('/profile', mid.requiresLogin, function (req, res, next) {
    User.findById(req.session.userId)
        .exec(function (error, user) {
            if (error) {
                return next(error);
            } else {
                if (user === null) {
                    var err = new Error('Not authorized! Go back!');
                    err.status = 400;
                    return next(err);
                } else {
                    res.render('profile', {
                        username: user.username,
                        email: user.email
                    });
                }
            }
        });
});

router.get('/logout', function (req, res, next) {
    if (req.session) {
        // delete session object
        req.session.destroy(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.redirect('/');
            }
        });
    }
});

module.exports = router