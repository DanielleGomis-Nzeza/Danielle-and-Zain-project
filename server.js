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
const surveyRoutes = require('./routes/surveys');

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

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.use(session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
}));
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

// Survey routes
app.use('/surveys', checkAuthenticated, surveyRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
