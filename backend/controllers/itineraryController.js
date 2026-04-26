const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');

exports.generateItinerary = async (req, res) => {
    try {
    const { baseLocation, endLocation, durationDays, departureDate, departureTime, companions, vibe, transport, diet, wheelchair, budget, mustVisitPlaces, partySize } = req.body;
    
    // ⭐ EXTRACT TOKEN IF PRESENT (OPTIONAL)
    const jwt = require("jsonwebtoken");
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "findplace_secret");
            userId = decoded.id;
            console.log("✅ USER IDENTIFIED FOR PERSISTENCE:", userId);
        } catch (e) {
            console.warn("❌ Invalid token provided in optional-auth route:", e.message);
        }
    } else {
        console.warn("⚠️ No Auth header found for itinerary generation");
    }

        console.log("--- AI ITINERARY GENERATOR (MULTI-DAY) ---");
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: "GEMINI_API_KEY missing." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const budgetContext = {
            "budget": "Rs. 5,000 - 10,000 per person/day. Focus on Guest Houses, Home-stays, and Public Transport.",
            "standard": "Rs. 10,000 - 25,000 per person/day. Focus on 3-Star Hotels, Boutique Villas, and AC Vehicles.",
            "luxury": "Rs. 25,000+ per person/day. Focus on 5-Star Resorts, Private Luxury Tours, and Luxury Vehicles."
        };

        const prompt = `
        You are an expert Sri Lankan travel guide. Plan a ${durationDays}-day trip from ${baseLocation} to ${endLocation}.
        
        TRAVEL PARTY:
        - Companions: ${companions}
        - Party Size: ${partySize || 1} people (Crucial: Suggest places that can accommodate this group size).
        
        GEOGRAPHY:
        - Route must be logically consistent with Sri Lankan roads.
        - Points must follow a linear path from start to finish.
        - Use REAL GPS coordinates (Latitude/Longitude).

        DETAILS:
        - Start: ${baseLocation}, End: ${endLocation}
        - Departure: ${departureTime} on Day 1
        - Vibes: ${vibe}, Diet: ${diet}
        - Budget Tier: ${budget} (${budgetContext[budget] || 'Moderate spending'})
        - Wheelchair: ${wheelchair ? 'Required' : 'Not needed'}
        - Must Visit: ${mustVisitPlaces || 'None'}

        STRUCTURE:
        Generate exactly ${durationDays} days. Each day should have 3-5 events.
        For each event, specify a "category": "beach", "temple", "food", "nature", "city", "hotel", "landmark".
        Also, provide a "totalDistanceKm" integer at the root representing the total estimated road distance for the entire trip.
        
        RETURN RAW JSON ONLY:
        {
          "tripTitle": "${baseLocation} to ${endLocation} Escape",
          "baseDate": "${departureDate}",
          "totalDistanceKm": 250,
          "dailyPlans": [
            {
              "dayNumber": 1,
              "timeline": [
                {
                  "id": 1,
                  "time": "09:00 AM",
                  "title": "Real Place Name",
                  "description": "Engaging description",
                  "category": "food", 
                  "lat": 6.0,
                  "lng": 80.0,
                  "price": "Rs. 2000",
                  "rating": 4.5
                }
              ]
            }
          ]
        }
        `;

        console.log("Requesting Gemini...");
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        console.log("--- AI RAW RESPONSE ---");
        console.log(text);

        // Robust cleaning
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        if (text.includes("{") && text.includes("}")) {
            text = text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1);
        }

        const generatedPlan = JSON.parse(text);
        
        // Robust Category Based Image Mapping
        const imageMap = {
            "beach": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop",
            "temple": "https://images.unsplash.com/photo-1544473244-11883c5a61d1?q=80&w=600&auto=format&fit=crop",
            "food": "https://images.unsplash.com/photo-1583083527882-4bee9aba2eea?q=80&w=600&auto=format&fit=crop",
            "nature": "https://images.unsplash.com/photo-1588533508433-2a956515ad79?q=80&w=600&auto=format&fit=crop",
            "city": "https://images.unsplash.com/photo-1592631553018-052d9200aafe?q=80&w=600&auto=format&fit=crop",
            "hotel": "https://images.unsplash.com/photo-1517248135467-4c7ed9d42c77?q=80&w=600&auto=format&fit=crop",
            "landmark": "https://images.unsplash.com/photo-1469440832326-191163562a3d?q=80&w=600&auto=format&fit=crop"
        };

        generatedPlan.dailyPlans.forEach(day => {
            day.timeline.forEach(event => {
                const cat = event.category || "landmark";
                event.imageUrl = imageMap[cat.toLowerCase()] || imageMap["landmark"];
            });
        });

        // ⭐ PERSIST TO DATABASE (ONLY IF LOGGED IN)
        if (userId) {
            console.log("💾 ATTEMPTING TO PERSIST ITINERARY FOR USER:", userId);
            const tripTitle = generatedPlan.tripTitle || `${baseLocation} to ${endLocation} Trip`;
            const jsonData = JSON.stringify(generatedPlan);

            const deleteOld = "DELETE FROM itineraries WHERE user_id = ?";
            const insertNew = "INSERT INTO itineraries (user_id, title, data) VALUES (?, ?, ?)";

            db.query(deleteOld, [userId], (err) => {
                if (err) console.error("❌ Error deleting old itinerary:", err);
                else console.log("🗑️ Old itinerary deleted for user:", userId);

                db.query(insertNew, [userId, tripTitle, jsonData], (insErr) => {
                    if (insErr) console.error("❌ Error saving itinerary:", insErr);
                    else console.log("✅ ITINERARY SAVED SUCCESSFULLY TO DB");
                });
            });
        }
        
        res.status(200).json({
            success: true,
            data: generatedPlan
        });

    } catch (err) {
        console.error("AI Gen Error:", err);
        res.status(500).json({ success: false, message: "AI generation failed." });
    }
};

exports.getLatestItinerary = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = "SELECT * FROM itineraries WHERE user_id = ? ORDER BY created_at DESC LIMIT 1";

        db.query(query, [userId], (err, results) => {
            if (err) {
                console.error("Error fetching itinerary:", err);
                return res.status(500).json({ success: false, message: "Database error." });
            }

            if (results.length === 0) {
                return res.status(404).json({ success: false, message: "No active itinerary found." });
            }

            const itinerary = results[0];
            const planData = JSON.parse(itinerary.data);

            // 🕒 EXPIRATION LOGIC: Check if the trip has already ended
            if (planData.baseDate && planData.dailyPlans) {
                const departure = new Date(planData.baseDate);
                const duration = planData.dailyPlans.length;
                const expiryDate = new Date(departure);
                expiryDate.setDate(expiryDate.getDate() + duration); // Expire the day AFTER the trip ends

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (today >= expiryDate) {
                    console.log("🕒 ITINERARY EXPIRED for user:", userId);
                    return res.status(404).json({ success: false, message: "Previous plan has expired." });
                }
            }

            res.status(200).json({
                success: true,
                data: planData
            });
        });
    } catch (err) {
        console.error("Fetch Itinerary Error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

exports.resetItinerary = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = "DELETE FROM itineraries WHERE user_id = ?";

        db.query(query, [userId], (err) => {
            if (err) {
                console.error("Error resetting itinerary:", err);
                return res.status(500).json({ success: false, message: "Database error during reset." });
            }
            res.status(200).json({ success: true, message: "Itinerary reset successfully." });
        });
    } catch (err) {
        console.error("Reset Itinerary Error:", err);
        res.status(500).json({ success: false, message: "Server error." });
    }
};
