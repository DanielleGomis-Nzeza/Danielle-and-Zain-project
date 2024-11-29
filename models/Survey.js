// models/Survey.js
const mongoose = require('mongoose');

// Define the Survey schema
const surveySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ['Active', 'Draft', 'Published', 'Closed'], default: 'Active' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Link to the user who created the survey
}, { timestamps: true });

// Create the Survey model
const Survey = mongoose.model('Survey', surveySchema);

module.exports = Survey;
