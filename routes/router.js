var express = require('express');
var router = express.Router();
var User = require('../models/user');
var path = require('path');
var utils = require('./utils.js');
var mid = require('./mid.js');
var bcrypt = require('bcrypt');
var sgMail = require('@sendgrid/mail');

require('dotenv').load();

sgMail.setApiKey(process.env.SEND_MAIL_KEY);

router.get('/', function (req, res, next) {
    // send user to profile if already logged in
    if (req.session && req.session.userId) {
        res.redirect('/profile');
    }
    else {
        res.render('index', {});
    }
});

router.get('/settings', mid.requiresLogin, function (req, res, next) {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    res.render('settings', {});
});

//POST route for creating user/login
router.post('/', function (req, res, next) {
    // confirm that user typed same password twice
    if (req.body.password !== req.body.passwordConf) {
        let err = utils.createError('Passwords do not match');
        return next(err);
    }

    // Creating new user
    if (req.body.email && req.body.username && req.body.password && req.body.passwordConf) {
        // testing of inputs
        if (utils.validateEmail(req.body.email) == false) {
            let err = utils.createError('Email is invalid');
            return next(err);
        }

        if (utils.validatePassword(req.body.password) == false) {
            let err = utils.createError('Password needs at least one digit, one special character e.g. !@#$%^&* and a minimum length of 8');
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
                const msg = {
                    to: user.email,
                    from: 'no-reply@loginsimulator.com',
                    subject: 'Confirm your Login Simulator account',
                    html: '<div><h1>Login Simulator</h1><h2>Welcome, ' + user.username + '!</h2><p>Please click the link below to visit your profile</p><a href=\'http://' + req.headers.host + '/profile\'>View Profile</a></div>',
                };
                sgMail.send(msg);

                req.session.userId = user._id;
                return res.redirect('/profile');
            }
        });

    }
    else if (req.body.logemail && req.body.logpassword) { // User log in
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
    }
    else {
        var err = new Error('All fields required.');
        err.status = 400;
        return next(err);
    }
})

//POST route for updating password
router.post('/update', mid.requiresLogin, function (req, res, next) {
    if (!req.body.curPassword) {
        let err = utils.createError('Current password required');
        return next(err);
    }
    if (req.body.password !== req.body.passwordConf) {
        let err = utils.createError('Passwords do not match');
        return next(err);
    }
    if (utils.validatePassword(req.body.password) == false) {
        let err = utils.createError('Password needs at least one digit, one special character e.g. !@#$%^&* and a minimum length of 8');
        return next(err);
    }

    User.findById(req.session.userId).exec(function (error, user) {
        if (error) {
            return next(error);
        }
        else {
            User.authenticate(user.email, req.body.curPassword, function (error, user) {
                if (error || !user) {
                    var err = new Error('Wrong current password.');
                    err.status = 401;
                    return next(err);
                }
                else {
                    bcrypt.hash(req.body.password, 10, function (error, hash) {
                        if (error) {
                            return next(err);
                        }
                        // update user's password here
                        const doc = { password: hash }
                        User.update({ _id: user.id }, doc, function (error, raw) {
                            if (error) {
                                return next(error);
                            }
                            else {
                                const msg = {
                                    to: user.email,
                                    from: 'no-reply@loginsimulator.com',
                                    subject: 'Your Login Simulator password has changed',
                                    html: '<div><h1>Login Simulator</h1><h2>Hi ' + user.username + ',</h2><p>Your password has been changed. If this was not done by you, contact us at help@loginsimlator.com</p></div>',
                                };
                                sgMail.send(msg);

                                return res.redirect('/profile');
                            }
                        })
                    })
                }
            });
        }
    });
})

router.get('/profile', mid.requiresLogin, function (req, res, next) {
    res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');

    User.findById(req.session.userId)
        .exec(function (error, user) {
            if (error) {
                return next(error);
            }
            else {
                if (user === null) {
                    var err = new Error('Not authorized! Go back!');
                    err.status = 400;
                    return next(err);
                }
                else {
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
            }
            else {
                return res.redirect('/');
            }
        });
    }
});

module.exports = router