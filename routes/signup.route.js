const express = require('express');
const router = express.Router();
// Import user
const User = require('../models/User.model');
// Import mongoose
const mongoose = require('mongoose');
// require bcryptJS
const bcryptjs = require('bcryptjs');
// 10 saltrounds
const saltRounds = 10;
 // Import for middleware
 const { isLoggedIn, isLoggedOut } = require('../middleware/route-guard.js');

 
 // ---------------------------------------------------------------------------------
 // INDEX GET
 // ---------------------------------------------------------------------------------
 router.get('/', (req, res) => res.render('index', { title: 'App created with Ironhack generator 🚀' }));

 
 // ---------------------------------------------------------------------------------
 // SIGNUP GET
 // ---------------------------------------------------------------------------------
 router.get('/signup', isLoggedOut, (req, res) => res.render('auth/signup'));

 // ---------------------------------------------------------------------------------
 // SIGNUP POST
 // ---------------------------------------------------------------------------------
 router.post('/signup', (req, res, next) => {
 	const { username, email, password } = req.body;

	// show error if no email or no pass or no name
	if (!username || !email || !password) {
		res.render('auth/signup', {
			errorMessage: 'All fields are mandatory. Please provide your username, email and password.'
		});
		return;
	}
	// make sure passwords are strong:
	const regex = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,}/;
	if (!regex.test(password)) {
		res.status(500).render('auth/signup', {
			errorMessage:
				'Password needs to have at least 6 chars and must contain at least one number, one lowercase and one uppercase letter.'
		});
		return;
	}
	bcryptjs
		.genSalt(saltRounds)
 		.then((salt) => bcryptjs.hash(password, salt))
 		.then((hashedPassword) => {
 			return User.create({
 		
 				username,
 				email,
 				passwordHash: hashedPassword
 			});
 		})
		.then((userFromDB) => {
			console.log('Newly created user is: ', userFromDB);
			res.redirect('/userProfile');
		})
		.catch((error) => {
			if (error instanceof mongoose.Error.ValidationError) {
				res.status(500).render('auth/signup', { errorMessage: error.message });
			} else if (error.code === 11000) {
				res.status(500).render('auth/signup', {
					errorMessage: 'Username and email need to be unique. Either username or email is already used.'
				});
 			} else {
 				next(error);
 			}
 		});
 });

 // ---------------------------------------------------------------------------------
 // LOGIN GET
 // ---------------------------------------------------------------------------------
 router.get('/login', (req, res) => res.render('auth/login'));

 // ---------------------------------------------------------------------------------
 // LOGIN POST
 // ---------------------------------------------------------------------------------
 router.post('/login', (req, res, next) => {
 	console.log('SESSION =====> ', req.session);
 	const { email, password } = req.body;
	if (email === '' || password === '') {
		res.render('auth/login', {
			errorMessage: 'Please enter both, email and password to login.'
		});
		return;
	}
	User.findOne({ email })
		.then((user) => {
			if (!user) {
 				res.render('auth/login', { errorMessage: 'Email is not registered. Try with other email.' });
 				return;
 			} else if (bcryptjs.compareSync(password, user.passwordHash)) {

 				//******* SAVE THE USER IN THE SESSION ********//
 				req.session.currentUser = user;
 				res.redirect('/userProfile');
			} else {
				res.render('auth/login', { errorMessage: 'Incorrect password.' });
			}
		})
		.catch((error) => next(error));
});
// ---------------------------------------------------------------------------------
// USER PROFILE - GET
// ---------------------------------------------------------------------------------
router.get('/userProfile', isLoggedIn, (req, res) => {
	res.render('users/user-profile', { userInSession: req.session.currentUser });
});
// ---------------------------------------------------------------------------------
// LOGOUT - POST
// ---------------------------------------------------------------------------------
router.post('/logout', (req, res, next) => {
	req.session.destroy((err) => {
		if (err) next(err);
		res.redirect('/');
	});
});
// ---------------------------------------------------------------------------------
module.exports = router;