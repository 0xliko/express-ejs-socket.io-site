const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const {validationResult} = require('express-validator/check');
const menuCreator = require("../helper/menuCreator");

const User = require('../models/user');

const SENDGRID_API_KEY = process.env.sendgridApiKey;
const APP_SERVER_URL = process.env.appServerUrl;

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: SENDGRID_API_KEY
    }
}));

const handleError = (err) => {
    const error = new Error(err);
    error.httpStatusCode = 500;
    return next(error);
};

exports.testpost = (req, res, next) => {
    console.log('testing');
}

exports.getLogIn = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/login', {
        pageTitle: 'Election Day | Log In',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    });
};

exports.postLogIn = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('auth/login', {
            pageTitle: 'Log In',
            errorMessage: errors.array()[0].msg,
            oldInput: {email, password},
            validationErrors: errors.array()
        });
    }
    User.findOne({email: email})
        .then(user => {
            if (!user) {

                return res.status(422).render('auth/login', {
                    pageTitle: 'Election Day | Log In',
                    errorMessage: 'User Not Found.',
                    oldInput: {email, password},
                    validationErrors: [{param: "email"}]
                });
            }
            bcrypt
                .compare(password, user.password)
                .then(passwordsMatch => {
                    if (passwordsMatch) {
                        req.session.isLoggedIn = true;
                        req.session.user = user;
                        req.session.menus = menuCreator(user.level);

                        return req.session.save(err => {
                            res.redirect('/dashboard');
                        });
                    }
                    // req.flash('error', 'Enter a valid email and password.');
                    // res.redirect('log-in');
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Election Day | Login',
                        errorMessage: 'Incorrect password.',
                        oldInput: {email, password},
                        validationErrors: [{param: "password"}]
                    });
                })
                .catch(err => {
                    console.log(err);
                    res.redirect('login');
                });
        })
        .catch(err => console.log(err));
};

exports.postLogOut = (req, res, next) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
};

exports.getSignUp = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/signup', {
        pageTitle: 'Election Day | Sign Up',
        errorMessage: message,
        oldInput: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationErrors: []
    });
};

exports.postSignUp = (req, res, next) => {
    // console.log(req.body);
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log(errors.array());
        return res.status(422).render('auth/signup', {
            pageTitle: 'Election Day | Sign Up',
            errorMessage: errors.array()[0].msg,
            oldInput: {email, password, confirmPassword},
            validationErrors: errors.array()
        });
    }
    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword
            });
            return user.save();
        })
        .then(result => {
            res.redirect('/');
            return transporter.sendMail({
                to: email,
                from: 'mee-mvc@web.app',
                subject: 'Successful Signup',
                html: '<h3>You successfully signed up for the MEE-MVC demo app!</h3>'
            }).catch(err => handleError(err));
        });

};


exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    res.render('auth/reset', {
        pageTitle: 'Reset Password',
        errorMessage: message
    });
};

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
            .then(user => {
                if (!user) {
                    req.flash('error', 'Email account not found.');
                    return res.redirect('/reset');
                }
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000; // 1h in ms
                return user.save();
            })
            .then(result => {
                res.redirect('/');
                transporter.sendMail({
                    to: req.body.email,
                    from: 'mee-mvc@web.app',
                    subject: 'Password reset',
                    html: `
            <p>You have requested a password reset.</p>
            <p>Click this <a href="${APP_SERVER_URL}/reset/${token}">link</a> to set a new password.</p>
          `
                });
            }).catch(err => handleError(err));
    });
};


exports.getNewPassword = (req, res, next) => {
    res.render('auth/new-password', {
        pageTitle: 'Election Day | Reset-Password',
        errorMessage: ""
    });
};


exports.postNewPassword = (req, res, next) => {
    const email = req.body.email;
    const newPassword = req.body.new_password;
    const oldPassword = req.body.password;
    const errors = validationResult(req);
    console.log(newPassword, oldPassword, email);
    if (!errors.isEmpty()) {
        return res.status(422).render('auth/new-password', {
            pageTitle: 'Election Day | Reset-Password',
            errorMessage: errors.array()[0].msg,
            oldInput: {email, password},
            validationErrors: errors.array()
        });
    }
    User.findOne({email: email})
        .then(user => {
            if (!user) {
                // req.flash('error', 'Enter a valid email and password.');
                // return res.redirect('/log-in');
                return res.status(422).render('auth/new-password', {
                    pageTitle: 'Election Day | Reset-Password',
                    errorMessage: 'Invalid email or password.',
                    oldInput: {email, oldPassword},
                    validationErrors: []
                });
            }
            bcrypt
                .compare(oldPassword, user.password)
                .then(passwordsMatch => {
                    console.log(passwordsMatch);
                    if (passwordsMatch) {
                        bcrypt
                            .hash(newPassword, 12)
                            .then(hashedPassword => {
                                user.password = hashedPassword;
                                user.resetToken = undefined;
                                user.resetTokenExpiration = undefined;
                                user.save()
                                    .then(result => {
                                        console.log(result);
                                        res.render('dashboard/index', {
                                            pageTitle: 'Election Day | Dashboard'
                                        });
                                    })
                                    .catch(err => handleError(err));
                            })
                            .catch(err => handleError(err));
                    } else {
                        // req.flash('error', 'Enter a valid email and password.');
                        // res.redirect('log-in');
                        return res.status(422).render('auth/new-password', {
                            pageTitle: 'Election Day | Reset-Password',
                            errorMessage: 'Invalid Email or Old-password.'
                        });
                    }

                })
                .catch(err => {
                    console.log(err);
                    res.redirect('/');
                });
        })
        .catch(err => console.log(err));
};


// postNewPassword ALTERNATIVE SYNTAX

// IN ORDER TO CHAIN THE PROMISES, resetUser HAS
// TO BE DECLARED IN THE EXTERNAL SCOPE, BECAUSE
// OTHERWISE user IS NOT AVAILABLE IN THE SECOND then 

// exports.postNewPassword = (req, res, next) => {
//   const newPassword = req.body.password;
//   const userId = req.body.userId;
//   const passwordToken = req.body.passwordToken;
//   let resetUser;
//   User.findOne({
//     resetToken: passwordToken,
//     resetTokenExpiration: { $gt: Date.now() },
//     _id: userId
//   })
//     .then(user => {
//       resetUser = user;
//       return bcrypt.hash(newPassword, 12);
//     })
//     .then(hashedPassword => {
//       resetUser.password = hashedPassword;
//       resetUser.resetToken = undefined;
//       resetUser.resetTokenExpiration = undefined;
//       return resetUser.save();
//     })
//     .then(result => {
//       res.redirect('/log-in');
//     })
//     .catch(err => {
//       console.log(err);
//     });
// };
