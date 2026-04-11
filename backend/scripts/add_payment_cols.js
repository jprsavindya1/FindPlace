const db = require('./db');

const addPaymentColumns = async () => {
    try {
        console.log("Checking for payment columns...");
        
        // 1. Add payment_status
        const addStatusQuery = `
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS payment_status ENUM('UNPAID', 'PAID') DEFAULT 'UNPAID' AFTER status
        `;
        
        // 2. Add payment_method
        const addMethodQuery = `
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT NULL AFTER payment_status
        `;

        // Note: IF NOT EXISTS in ALTER TABLE works in MariaDB and newer MySQL, 
        // but for safety in all MySQL versions, we might need to check column existence first.
        // Let's try the direct approach first as we did with previous scripts.

        db.query("ALTER TABLE bookings ADD COLUMN payment_status ENUM('UNPAID', 'PAID') DEFAULT 'UNPAID' AFTER status", (err) => {
            if (err && !err.message.includes('Duplicate column')) {
                console.error("Error adding payment_status:", err.message);
            } else {
                console.log("payment_status column ensured.");
            }

            db.query("ALTER TABLE bookings ADD COLUMN payment_method VARCHAR(50) DEFAULT NULL AFTER payment_status", (err2) => {
                if (err2 && !err2.message.includes('Duplicate column')) {
                    console.error("Error adding payment_method:", err2.message);
                } else {
                    console.log("payment_method column ensured.");
                }

                db.query("ALTER TABLE bookings ADD COLUMN transaction_id VARCHAR(255) DEFAULT NULL AFTER payment_method", (err3) => {
                    if (err3 && !err3.message.includes('Duplicate column')) {
                        console.error("Error adding transaction_id:", err3.message);
                    } else {
                        console.log("transaction_id column ensured.");
                    }
                    console.log("Migration finished.");
                    process.exit(0);
                });
            });
        });

    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

addPaymentColumns();
