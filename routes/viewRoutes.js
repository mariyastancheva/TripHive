const express = require('express');
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');
const router = express.Router();

router.get('/me', authController.protect, viewController.getAccount);
router.post('/submit-user-data', authController.protect, viewController.updateUserData);

router.use(authController.isLoggedIn);
router.get('/aboutUs', viewController.getAboutus);
router.get('/becomeGuide', viewController.getBecomeGuide);
router.get('/contact', viewController.getContact);
router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewController.getOverview);
router.get('/tour/:slug', viewController.getTour);
router.get('/login', viewController.getLogin);
router.get('/signup', viewController.getSignup);
router.get('/my-tours', authController.protect, viewController.getMyTours);


module.exports = router;