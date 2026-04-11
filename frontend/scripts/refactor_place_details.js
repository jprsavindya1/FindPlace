const fs = require('fs');

const path = 'c:/Users/prage/Desktop/Find Place/frontend/src/pages/PlaceDetails.jsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add new state variables
const newStates = `
  const [resDate, setResDate] = useState(null);
  const [resTime, setResTime] = useState("");
  const [resGuests, setResGuests] = useState(2);
  const [resTable, setResTable] = useState("");
  const [tables, setTables] = useState([]);
`;
code = code.replace('const [rooms, setRooms] = useState([]);', 'const [rooms, setRooms] = useState([]);' + newStates);

// 2. Fetch tables along with rooms
const tableFetch = `\n    axios.get(\`\${API_BASE_URL}/api/tables/place/\${id}\`).then(res => setTables(res.data)).catch(console.error);`;
code = code.replace('axios.get(`${API_BASE_URL}/api/rooms/place/${id}`).then(res => setRooms(res.data)).catch(console.error);', 
  'axios.get(`${API_BASE_URL}/api/rooms/place/${id}`).then(res => setRooms(res.data)).catch(console.error);' + tableFetch);

// 3. Add handleDinnerBookingSubmit function
const dinnerSubmitFn = `
  const handleDinnerBookingSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setBookingStatus("error"); setBookingMsg("Please login to reserve a table."); return;
    }
    if (!resDate || !resTime) {
      setBookingStatus("error"); setBookingMsg("Please select reservation date and time."); return;
    }

    setIsBooking(true);
    setBookingStatus(null);
    setBookingMsg("Confirming your reservation...");

    const formattedDate = \`\${resDate.getFullYear()}-\${String(resDate.getMonth() + 1).padStart(2, '0')}-\${String(resDate.getDate()).padStart(2, '0')}\`;

    try {
      const res = await axios.post(\`\${API_BASE_URL}/api/reservations\`, {
        place_id: place.id,
        customer_name: fullName,
        customer_email: email,
        res_date: formattedDate,
        res_time: resTime,
        people_count: resGuests,
        table_id: resTable
      }, { headers: { Authorization: \`Bearer \${token}\` } });

      setBookingStatus("success"); 
      setBookingMsg(\`✅ \${res.data.message}\`);
      
      // Reset form
      setResDate(null); setResTime(""); setResGuests(2);
      setResTable(""); setFullName(""); setEmail("");
    } catch (err) {
      setBookingStatus("error"); 
      setBookingMsg("Reservation failed. Please try again.");
    } finally { 
      setIsBooking(false); 
    }
  };
`;
code = code.replace('const handleBookingSubmit = (e, type = \'ONLINE\') => {', dinnerSubmitFn + '\n  const handleBookingSubmit = (e, type = \'ONLINE\') => {');

// 4. Inject Restaurant Component Layout
const restaurantLayout = `
  if (place.type === 'dine') {
    return (
      <div className="place-details-wrapper dining-wrapper">
        <motion.div className="luna-blob blob-1" animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.2, 0.15] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="luna-blob blob-2" animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }} />

        <div className="pd-container">
          {/* HERO */}
          <motion.section className="pd-hero-section" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="pd-hero-img-container">
              <img src={place.image ? \`\${API_BASE_URL}/uploads/places/\${place.image}\` : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"} alt={place.name} className="pd-hero-img" />
            </div>
            <div className="pd-hero-info">
              <div className="pd-header-lite">
                <h1 className="pd-title-refined">{place.name}</h1>
                <div className="pd-meta-stack">
                  <div className="pd-meta-item pd-rating-refined">
                    <Star size={18} fill="#ffffff" color="#ffffff" />
                    <span className="pd-rating-val">{avgRating ? avgRating.toFixed(1) : "New"}</span>
                    <span className="pd-rating-count">({totalReviews || 0} reviews)</span>
                  </div>
                  <div className="pd-meta-item">
                    <MapPin size={18} className="pd-location-icon" />
                    {place.location}
                  </div>
                  <div className="pd-meta-item">
                    <FileText size={18} />
                    {place.cuisine_type || "Restaurant"}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '24px' }}>
                  {place.whatsapp && (
                    <motion.a href={\`https://wa.me/\${place.whatsapp.replace(/\\D/g, '')}?text=Hello\`} className="pd-hero-whatsapp" target="_blank" rel="noopener noreferrer">
                      <FaWhatsapp size={20} /><span>Chat with Restaurant</span>
                    </motion.a>
                  )}
                  {role !== "admin" && role !== "owner" && (
                    <motion.button onClick={toggleFavorite} className={\`btn-save-favorite \${isFavorite ? "active" : ""}\`}>
                      <Heart size={20} fill={isFavorite ? "#ef4444" : "none"} color={isFavorite ? "#ef4444" : "#262626"} />
                      {isFavorite ? "Saved" : "Save"}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.section>

          {/* MAIN LAYOUT */}
          <div className="pd-main-layout">
            <motion.div className="pd-content-col" initial="hidden" animate="show" variants={staggerContainer}>
              
              {/* About */}
              <motion.div className="pd-section" variants={fadeUp}>
                <h2 className="pd-section-title">About this Restaurant</h2>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '20px' }}>
                   <div style={{ background: '#f8fafc', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Clock size={20} color="#003580" />
                     <span style={{ fontWeight: 600 }}>{place.opening_hours || "10:00"} - {place.closing_hours || "22:00"}</span>
                   </div>
                   <div style={{ background: '#f8fafc', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <FileText size={20} color="#003580" />
                     <span style={{ fontWeight: 600 }}>{place.cuisine_type || "International"}</span>
                   </div>
                   <div style={{ background: '#f8fafc', padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <Users size={20} color="#003580" />
                     <span style={{ fontWeight: 600 }}>Max Capacity: {place.table_capacity || "N/A"}</span>
                   </div>
                </div>
                <p className="pd-description">{place.description}</p>
              </motion.div>

              {/* Menu Section */}
              <motion.div className="pd-section" variants={fadeUp}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                  <h2 className="pd-section-title" style={{ marginBottom: 0 }}>Restaurant Menu</h2>
                  <div className="pd-menu-tabs" style={{ marginBottom: 0, overflowX: 'auto', display: 'flex' }}>
                    {["Breakfast", "Lunch", "Dinner", "Drinks", "Desserts", "Appetizers", "Main Course", "Beverages", "Snacks"].filter(cat => menuItems.some(i => i.category === cat)).map((cat) => (
                      <div key={cat} className={\`pd-menu-tab \${activeCategory === cat ? 'active' : ''}\`} onClick={() => setActiveCategory(cat)}>
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>

                {filteredMenu.length === 0 ? <p>Select a category to view menu items.</p> : (showAllMenu ? filteredMenu : filteredMenu.slice(0, 4)).map((item, index) => (
                  <div key={index} className="pd-horizontal-card">
                    <img src={item.image ? \`\${API_BASE_URL}/uploads/menu/\${item.image}\` : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"} alt={item.name} className="pd-card-img" />
                    <div className="pd-card-body" style={{ flex: 1 }}>
                      <div className="pd-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <h4 className="pd-card-name" style={{ color: '#262626' }}>{item.name}</h4>
                        <span className="pd-card-price">LKR {Number(item.price).toLocaleString()}</span>
                      </div>
                      <p className="pd-card-desc" style={{ marginBottom: '8px' }}>{item.description}</p>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                         {!!item.is_veg && <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Vegetarian</span>}
                         {!!item.chefs_recommendation && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Chef's Pick</span>}
                         {!!item.is_special && <span style={{ background: '#ffe4e6', color: '#be123c', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Special</span>}
                         {item.spicy_level && item.spicy_level !== 'None' && <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>Spicy: {item.spicy_level}</span>}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredMenu.length > 4 && (
                  <button className="btn-show-more" onClick={() => setShowAllMenu(!showAllMenu)} style={{ background: 'none', border: 'none', color: '#003580', fontWeight: '900', cursor: 'pointer', padding: '10px 0', fontSize: '1rem' }}>
                    {showAllMenu ? "Show Less" : \`See all \${filteredMenu.length} items in \${activeCategory}\`}
                  </button>
                )}
              </motion.div>

              {/* Reviews */}
              <motion.div className="pd-section" variants={fadeUp}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                   <h2 className="pd-section-title" style={{ margin: 0 }}>Diner Reviews</h2>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Star fill="#FFD700" color="#FFD700" size={24} />
                      <span style={{ fontSize: '1.5rem', fontWeight: 900 }}>{avgRating > 0 ? avgRating.toFixed(1) : "N/A"}</span>
                   </div>
                </div>
                {/* REVIEWS LIST */}
                <div className="pd-reviews-list" style={{ marginBottom: '40px' }}>
                  {reviews.length > 0 ? reviews.map(r => (
                    <div key={r.id} className="pd-review-card">
                      <div className="review-header">
                        <div className="reviewer-avatar">{r.customer_name ? r.customer_name.charAt(0).toUpperCase() : 'A'}</div>
                        <div className="reviewer-info">
                          <h4>{r.customer_name}</h4>
                          <span className="review-date">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="review-stars">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} fill={i < r.rating ? "#FFD700" : "#e5e7eb"} color={i < r.rating ? "#FFD700" : "#e5e7eb"} />
                          ))}
                        </div>
                      </div>
                      <p className="review-text">{r.comment}</p>
                    </div>
                  )) : <p>No reviews yet. Be the first to review this place!</p>}
                </div>
              </motion.div>

            </motion.div>

            {/* RESERVATION SIDEBAR */}
            <aside className="pd-sidebar">
              <motion.div className="pd-booking-widget" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                <div className="pd-widget-header">
                  <h2 className="pd-widget-title" style={{ fontSize: '1.8rem', fontWeight: '900', color: '#262626' }}>Reserve a Table</h2>
                  <p style={{ color: '#666', fontSize: '0.9rem', marginTop: '8px' }}>Free cancellation up to 24h before</p>
                </div>

                <form className="pd-form" onSubmit={handleDinnerBookingSubmit}>
                  
                  <div className="pd-input-group">
                    <label className="pd-label">Date</label>
                    <div className="pd-input-wrapper" style={{ zIndex: 10 }}>
                      <Calendar size={18} className="pd-icon" />
                      <DatePicker
                        selected={resDate}
                        onChange={setResDate}
                        minDate={new Date()}
                        placeholderText="Select Date"
                        className="pd-input"
                        required
                        dateFormat="MMM dd, yyyy"
                        wrapperClassName="date-picker-wrapper"
                      />
                    </div>
                  </div>

                  <div className="pd-input-group">
                    <label className="pd-label">Time</label>
                    <div className="pd-input-wrapper">
                      <Clock size={18} className="pd-icon" />
                      <input type="time" className="pd-input" value={resTime} onChange={(e) => setResTime(e.target.value)} required />
                    </div>
                  </div>

                  <div className="pd-input-group">
                    <label className="pd-label">Guests</label>
                    <div className="pd-input-wrapper">
                      <Users size={18} className="pd-icon" />
                      <input type="number" min="1" max="20" className="pd-input" value={resGuests} onChange={(e) => setResGuests(e.target.value)} required />
                    </div>
                  </div>

                  <div className="pd-input-group">
                    <label className="pd-label">Table Preference (Optional)</label>
                    <div className="pd-input-wrapper">
                      <FileText size={18} className="pd-icon" />
                      <select className="pd-input" value={resTable} onChange={(e) => setResTable(e.target.value)} style={{ appearance: 'none' }}>
                        <option value="">Any Available Table</option>
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>Table {t.table_no} ({t.table_type || 'Standard'} / {t.location_area || 'Main'} - Max {t.capacity})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pd-input-group">
                     <label className="pd-label">Full Name</label>
                     <div className="pd-input-wrapper">
                        <User size={18} className="pd-icon" />
                        <input type="text" className="pd-input" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Jane Doe" />
                     </div>
                  </div>
                  
                  <div className="pd-input-group">
                     <label className="pd-label">Email</label>
                     <div className="pd-input-wrapper">
                        <Mail size={18} className="pd-icon" />
                        <input type="email" className="pd-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" />
                     </div>
                  </div>

                  {bookingMsg && (
                    <div className={\`pd-booking-alert \${bookingStatus}\`} style={{ marginTop: '16px' }}>
                      {bookingStatus === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
                      {bookingMsg}
                    </div>
                  )}

                  <button type="submit" className="pd-book-btn" style={{ marginTop: '24px' }} disabled={isBooking}>
                    {isBooking ? <div className="spinner-mini"></div> : "Request Reservation"}
                  </button>
                </form>

              </motion.div>
            </aside>
          </div>
        </div>
      </div>
    );
  }
`;

code = code.replace('return (\n    <>\n    <div className="place-details-wrapper">', restaurantLayout + '\n  return (\n    <>\n    <div className="place-details-wrapper">');

fs.writeFileSync(path, code);
console.log("Refactored PlaceDetails.jsx successfully!");
