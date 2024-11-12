const express = require('express');
const methodOverride = require('method-override');  // Import method-override
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable method override for supporting PUT and DELETE in forms
app.use(methodOverride('_method'));  // Add this line

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set EJS as the templating engine
app.set('view engine', 'ejs');

// In-memory data store for surveys
let surveys = [];

// CREATE Survey
app.post('/surveys', (req, res) => {
    const newSurvey = { id: Date.now(), title: req.body.title, status: 'Active' };
    surveys.push(newSurvey);
    res.redirect('/');
});

// READ Survey
app.get('/surveys/:id', (req, res) => {
    const survey = surveys.find(s => s.id === parseInt(req.params.id));
    if (survey) {
        res.render('survey-details', { survey });
    } else {
        res.status(404).send('Survey not found');
    }
});

// UPDATE Survey
app.put('/surveys/:id', (req, res) => {
    const survey = surveys.find(s => s.id === parseInt(req.params.id));
    if (survey) {
        survey.title = req.body.title;
        res.redirect('/');
    } else {
        res.status(404).send('Survey not found');
    }
});

// DELETE Survey
app.delete('/surveys/:id', (req, res) => {
    surveys = surveys.filter(s => s.id !== parseInt(req.params.id));
    res.redirect('/');
});

// Basic route to render list of surveys
app.get('/', (req, res) => {
    res.render('index', { surveys });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});