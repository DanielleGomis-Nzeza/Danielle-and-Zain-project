require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const passport = require('passport');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');
const { registerUser, checkAuthenticated, checkNotAuthenticated } = require('./auth');
const surveyRoutes = require('./routes/surveys');
const Survey = require('./models/Survey');

const app = express();
const PORT = process.env.PORT || 5000;

// Debug environment variables
console.log('MONGO_URI:', process.env.MONGO_URI);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET);

// **MongoDB Connection**
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // Wait 5 seconds for MongoDB server response
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit if DB connection fails
    });

// **Session Configuration**
app.use(session({
    secret: process.env.SESSION_SECRET || 'yourSecretKeyHere',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions',
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
}));

// **Middleware**
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public')); // Serve static files
app.set('view engine', 'ejs'); // Use EJS for views
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// **Global Variables**
app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    res.locals.user = req.user || null;
    res.locals.message = req.flash('error');
    next();
});

// **Debugging Middleware**
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// **Routes**
// Index route (homepage)
app.get('/', async (req, res) => {
    try {
        const surveys = req.isAuthenticated() ? await Survey.find({ user: req.user.id }) : [];
        res.render('index', { surveys, user: req.user });
    } catch (err) {
        console.error('Error loading surveys:', err);
        res.status(500).send('Error loading surveys.');
    }
});

// Registration routes
app.get('/register', checkNotAuthenticated, (req, res) => res.render('register'));
app.post('/register', checkNotAuthenticated, registerUser);

// Login routes
app.get('/login', checkNotAuthenticated, (req, res) => res.render('login', { message: req.flash('error') }));
app.post('/login', checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true,
}));

// Logout route
app.post('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.redirect('/login');
    });
});

// Survey routes (protected)
app.use('/surveys', checkAuthenticated, surveyRoutes);

// **Error Handling**
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).send('Internal Server Error');
});

// **Start the Server**
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
