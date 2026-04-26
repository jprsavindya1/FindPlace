const express = require('express');
const router = express.Router();
const itineraryController = require('../controllers/itineraryController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route to generate itinerary (Auth optional, but persistence only for logged-in users)
// POST /api/itinerary/generate
router.post('/generate', itineraryController.generateItinerary);

// Route to fetch latest itinerary (Protected)
// GET /api/itinerary/latest
router.get('/latest', verifyToken, itineraryController.getLatestItinerary);

// Route to reset/delete itinerary (Protected)
// DELETE /api/itinerary/reset
router.delete('/reset', verifyToken, itineraryController.resetItinerary);

module.exports = router;
