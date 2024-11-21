
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const { registerUser, checkAuthenticated, checkNotAuthenticated } = require('./auth');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');  // Add mongoose for DB connection
const User = require('./models/User');  // Adjust the path according to your project structure

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB (add this line to connect to the database)
mongoose.connect('mongodb://localhost:27017/project_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Increase timeout to 30 seconds
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.log('MongoDB connection error:', err));

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable method override for PUT and DELETE in forms
app.use(methodOverride('_method'));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// Session and flash middleware
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: false,
    })
);
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Global variable for authentication state
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

// In-memory data store for surveys (consider using MongoDB in the future)
let surveys = [];

// Passport Local Strategy for user authentication
passport.use(new LocalStrategy(
    { usernameField: 'email' }, // Assuming login is with email
    async (email, password, done) => {
        try {
            // Find the user by email
            const user = await User.findOne({ email: email });
            if (!user) {
                return done(null, false, { message: 'No user found' });
            }

            // Compare the entered password with the stored hash
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password' });
            }
        } catch (err) {
            return done(err);
        }
    }
));

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// Home route
app.get('/', (req, res) => {
    console.log('Home route accessed');
    res.render('index', { surveys, user: req.user });
});

// Register routes
app.get('/register', checkNotAuthenticated, (req, res) => res.render('register'));
app.post('/register', checkNotAuthenticated, registerUser);

// Login routes
app.get('/login', checkNotAuthenticated, (req, res) => res.render('login', { message: req.flash('error') }));
app.post(
    '/login',
    checkNotAuthenticated,
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
    })
);

// Logout route
app.post('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// CRUD routes for surveys (protected)
app.post('/surveys', checkAuthenticated, (req, res) => {
    const newSurvey = { id: Date.now(), title: req.body.title, status: 'Active' };
    surveys.push(newSurvey);
    res.redirect('/');
});

app.get('/surveys/:id', checkAuthenticated, (req, res) => {
    const survey = surveys.find(s => s.id === parseInt(req.params.id));
    if (survey) {
        res.render('survey-details', { survey });
    } else {
        res.status(404).send('Survey not found');
    }
});

app.put('/surveys/:id', checkAuthenticated, (req, res) => {
    const survey = surveys.find(s => s.id === parseInt(req.params.id));
    if (survey) {
        survey.title = req.body.title;
        res.redirect('/');
    } else {
        res.status(404).send('Survey not found');
    }
});

app.delete('/surveys/:id', checkAuthenticated, (req, res) => {
    surveys = surveys.filter(s => s.id !== parseInt(req.params.id));
    res.redirect('/');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
