const express = require('express');
const router = express.Router();
const Survey = require('../models/Survey');

// Route: Home (List all surveys)
router.get('/', async (req, res) => {
    try {
        const surveys = await Survey.find().sort({ createdAt: -1 });
        const isAuthenticated = false;
        res.render('index', { surveys, isAuthenticated }); // Render index view with surveys
    } catch (err) {
        console.error('Error loading surveys:', err);
        res.status(500).send('Error loading surveys');
    }
});

// Route: Create Survey Form
router.get('/create-survey', (req, res) => {
    console.log('Accessed Create Survey page');
    res.render('createSurvey'); // Render createSurvey.ejs
});

// Route: Handle Survey Creation
router.post('/create-survey', async (req, res) => {
    const { title, questions } = req.body;
    try {
        const newSurvey = new Survey({ title, questions });
        await newSurvey.save(); // Save survey to the database
        res.redirect('/'); // Redirect to the home page
    } catch (err) {
        console.error('Error creating survey:', err);
        res.status(500).send('Error creating survey');
    }
});

router.get('/surveys/:id/edit', async (req, res) => {
    const surveyId = req.params.id;

    // Validate the ID format
    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
        console.error(`Invalid survey ID format: ${surveyId}`);
        return res.status(400).send('Invalid survey ID');
    }

    try {
        const survey = await Survey.findById(surveyId);
        if (!survey) {
            console.error(`Survey not found for ID: ${surveyId}`);
            return res.status(404).send('Survey not found');
        }

        res.render('editSurvey', { survey }); // Pass survey data to the EJS template
    } catch (err) {
        console.error(`Error fetching survey with ID ${surveyId}:`, err);
        res.status(500).send('Error fetching survey');
    }
});

// Route: Handle Survey Update
router.post('/surveys/:id/edit', async (req, res) => {
    const surveyId = req.params.id;
    const { title, questions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(surveyId)) {
        console.error(`Invalid survey ID: ${surveyId}`);
        return res.status(400).send('Invalid survey ID');
    }

    try {
        const updatedSurvey = await Survey.findByIdAndUpdate(
            surveyId,
            { 
                title, 
                questions: questions.split(',').map((q) => q.trim()) 
            },
            { new: true } // Return the updated document
        );

        if (!updatedSurvey) {
            console.error(`Survey not found for update: ${surveyId}`);
            return res.status(404).send('Survey not found for update');
        }

        console.log(`Updated survey with ID: ${surveyId}`);
        res.redirect('/'); // Redirect to home after successful update
    } catch (err) {
        console.error(`Error updating survey with ID ${surveyId}:`, err);
        res.status(500).send('Error updating survey');
    }
});

module.exports = router;
