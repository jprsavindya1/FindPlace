const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../db');

exports.generateItinerary = async (req, res) => {
    try {
        const { baseLocation, endLocation, durationDays, departureDate, departureTime, companions, vibe, transport, diet, wheelchair, budget, mustVisitPlaces } = req.body;

        console.log("--- AI ITINERARY GENERATOR (MULTI-DAY) ---");
        
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ success: false, message: "GEMINI_API_KEY missing." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        You are an expert Sri Lankan travel guide. Plan a ${durationDays}-day trip from ${baseLocation} to ${endLocation}.
        
        GEOGRAPHY:
        - Route must be logically consistent with Sri Lankan roads.
        - Points must follow a linear path from start to finish.
        - Use REAL GPS coordinates (Latitude/Longitude).

        DETAILS:
        - Start: ${baseLocation}, End: ${endLocation}
        - Departure: ${departureTime} on Day 1
        - Vibes: ${vibe}, Budget: ${budget}, Diet: ${diet}
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
        
        res.status(200).json({
            success: true,
            data: generatedPlan
        });

    } catch (err) {
        console.error("AI Gen Error:", err);
        res.status(500).json({ success: false, message: "AI generation failed." });
    }
};
