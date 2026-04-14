const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itineraryController');

// Route to generate itinerary
// POST /api/itinerary/generate
router.post('/generate', itineraryController.generateItinerary);

module.exports = router;
