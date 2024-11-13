// auth.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

// In-memory user store for demonstration purposes
const users = [];

// Configure the local strategy for Passport
passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        const user = users.find(user => user.email === email);
        if (!user) return done(null, false, { message: 'User not found' });
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) return done(err);
            if (isMatch) return done(null, user);
            return done(null, false, { message: 'Incorrect password' });
        });
    })
);

// Serialize and deserialize user
passport.serializeUser((user, done) => done(null, user.email));
passport.deserializeUser((email, done) => {
    const user = users.find(user => user.email === email);
    done(null, user);
});

// Register a new user
function registerUser(req, res) {
    const { email, password } = req.body;
    if (users.find(user => user.email === email)) {
        return res.send('User already exists');
    }
    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;
        users.push({ email, password: hashedPassword });
        res.redirect('/login');
    });
}

// Check if user is authenticated
function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// Check if user is not authenticated
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return res.redirect('/');
    next();
}

module.exports = { passport, registerUser, checkAuthenticated, checkNotAuthenticated };