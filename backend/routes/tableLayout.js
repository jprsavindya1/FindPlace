const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/tables/layout/:placeId?date=YYYY-MM-DD&time=HH:mm
router.get("/:placeId", (req, res) => {
    const { placeId } = req.params;
    const { date, time } = req.query;

    if (!date || !time) {
        return res.status(400).json({ message: "Date and time are required" });
    }

    const requestedDuration = Number(req.query.duration) || 120;
    const BUFFER = 15;

    // 1. Fetch all tables
    const tablesQuery = `SELECT * FROM restaurant_tables WHERE place_id = ?`;
    
    // 2. Fetch overlapping reservations using the new join table logic
    // We factor in each reservation's specific duration and buffer
    const overlapQuery = `
        SELECT rt.table_id 
        FROM reservation_tables rt
        JOIN reservations r ON rt.reservation_id = r.id
        WHERE r.place_id = ? AND r.res_date = ? AND r.status = 'confirmed'
        AND r.res_time < ADDTIME(?, SEC_TO_TIME((? + ?) * 60))
        AND ADDTIME(r.res_time, SEC_TO_TIME((r.duration_minutes + r.buffer_minutes) * 60)) > ?
    `;

    db.query(tablesQuery, [placeId], (err, tables) => {
        if (err) return res.status(500).json({ message: "Error fetching tables" });

        db.query(overlapQuery, [placeId, date, time, requestedDuration, BUFFER, time], (err, occupiedRows) => {
            if (err) return res.status(500).json({ message: "Error checking availability" });

            const occupiedTableIds = occupiedRows.map(row => row.table_id);

            const layout = tables.map(table => ({
                ...table,
                status: occupiedTableIds.includes(table.id) ? 'occupied' : 'available'
            }));

            res.json(layout);
        });
    });
});

module.exports = router;
