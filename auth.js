// auth.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./models/User');  // Import the User model (make sure the path is correct)

// Configure the local strategy for Passport
passport.use(
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        // Find user by email in the MongoDB database
        User.findOne({ email: email.toLowerCase() })  // Use lowercase to make email case-insensitive
            .then(user => {
                if (!user) {
                    return done(null, false, { message: 'User not found' });
                }

                // Compare the password with the stored hash in MongoDB
                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) return done(err);
                    if (isMatch) {
                        return done(null, user);  // Authentication successful
                    } else {
                        return done(null, false, { message: 'Incorrect password' });
                    }
                });
            })
            .catch(err => done(err));
    })
);

// Serialize and deserialize user (store user ID in session)
passport.serializeUser((user, done) => {
    done(null, user.id);  // Store the user ID in the session (not email)
});

passport.deserializeUser((id, done) => {
    User.findById(id)  // Use user ID to find user from the database
        .then(user => {
            done(null, user);
        })
        .catch(err => done(err));
});

// Register a new user
function registerUser(req, res) {
    const { email, password } = req.body;
    // Check if user already exists in MongoDB
    User.findOne({ email: email.toLowerCase() })
        .then(user => {
            if (user) {
                return res.send('User already exists');
            }

            // Hash the password and save the new user
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) throw err;

                const newUser = new User({
                    email: email.toLowerCase(),
                    password: hashedPassword,
                });

                // Save the new user to MongoDB
                newUser.save()
                    .then(() => {
                        res.redirect('/login');
                    })
                    .catch(err => {
                        console.error('Error saving user:', err);
                        res.send('Error saving user');
                    });
            });
        })
        .catch(err => {
            console.error('Error checking user:', err);
            res.send('Error checking user');
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
