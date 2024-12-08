require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const { registerUser, checkAuthenticated, checkNotAuthenticated } = require('./auth');
const User = require('./models/User');
const Survey = require('./models/Survey');

const app = express();
const PORT = process.env.PORT || 5000;

// Debug environment variables
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if DB connection fails
    });

// Configure session storage
app.use(session({
    secret: process.env.SESSION_SECRET || 'yourSecretKeyHere',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    }
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Global variables
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user;
    next();
});

// Debugging middleware
app.use((req, res, next) => {
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    next();
});

// Routes
app.get('/', async (req, res) => {
    try {
        const surveys = req.isAuthenticated() ? await Survey.find({ user: req.user.id }) : [];
        res.render('index', { surveys, user: req.user });
    } catch (err) {
        console.error('Error loading surveys:', err);
        res.status(500).send('Error loading surveys.');
    }
});

app.get('/register', checkNotAuthenticated, (req, res) => res.render('register'));
app.post('/register', checkNotAuthenticated, registerUser);

app.get('/login', checkNotAuthenticated, (req, res) => res.render('login', { message: req.flash('error') }));
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
}));

app.post('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// Create Survey Route
app.get('/create-survey', checkAuthenticated, (req, res) => {
    try {
        res.render('create-survey', {
            user: req.user // Optional: Pass user data for dynamic content
        });
    } catch (err) {
        console.error('Error rendering Create Survey page:', err);
        res.status(500).send('An error occurred while loading the Create Survey page.');
    }
});

// Handle Survey Creation
app.post('/surveys', checkAuthenticated, async (req, res) => {
    try {
        const newSurvey = new Survey({
            title: req.body.title,
            description: req.body.description,
            status: req.body.status || 'Active',
            user: req.user.id,
        });
        await newSurvey.save();
        res.redirect('/');
    } catch (err) {
        console.error('Error creating survey:', err);
        res.status(500).send('Error creating survey.');
    }
});

// View Survey Details
app.get('/surveys/:id', checkAuthenticated, async (req, res) => {
    try {
        const survey = await Survey.findOne({ _id: req.params.id, user: req.user.id });
        if (!survey) {
            return res.status(404).send('Survey not found.');
        }
        res.render('survey-details', { survey });
    } catch (err) {
        res.status(500).send('Error loading survey.');
    }
});

// Edit Survey Route
app.get('/surveys/:id/edit', checkAuthenticated, async (req, res) => {
    try {
        const survey = await Survey.findOne({ _id: req.params.id, user: req.user.id });
        if (!survey) {
            return res.status(404).send('Survey not found.');
        }
        res.render('edit-survey', { survey });
    } catch (err) {
        res.status(500).send('Error loading survey for editing.');
    }
});

// Update Survey
app.put('/surveys/:id', checkAuthenticated, async (req, res) => {
    try {
        const survey = await Survey.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { title: req.body.title, description: req.body.description, status: req.body.status },
            { new: true },
        );
        if (!survey) {
            return res.status(404).send('Survey not found.');
        }
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error updating survey.');
    }
});

// Delete Survey
app.delete('/surveys/:id', checkAuthenticated, async (req, res) => {
    try {
        const survey = await Survey.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!survey) {
            return res.status(404).send('Survey not found.');
        }
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Error deleting survey.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
