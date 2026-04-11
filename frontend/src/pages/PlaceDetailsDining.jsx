import React from 'react';
import { motion } from "framer-motion";
import { 
  MapPin, Star, Check, FileText, Users, Heart, Clock, User, 
  MessageCircle 
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import DatePicker from "react-datepicker";

const PlaceDetailsDining = ({
  place, id, token, role, navigate, location, API_BASE_URL,
  menuItems, filteredMenu, activeCategory, setActiveCategory, showAllMenu, setShowAllMenu,
  resDate, setResDate, resTime, setResTime, resGuests, setResGuests, resTable, setResTable, tables,
  wantsPreOrder, setWantsPreOrder, preOrderQuantities, updatePreOrderQty,
  handleDinnerBookingSubmit, isBooking, reviews, toggleFavorite, isFavorite, isLiking,
  proofModal, setCurrentProof,
  handleAddReview, myRating, setMyRating, myComment, setMyComment, reviewMsg, isPostingReview, gallery,
  fullName, setFullName, email, setEmail, phone, setPhone
}) => {

  const placeholderImg = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"; // Reliable restaurant placeholder
  
  const galleryItems = [
    place.image ? `${API_BASE_URL}/uploads/places/${place.image}` : placeholderImg,
    gallery?.[0] ? `${API_BASE_URL}/uploads/places/${gallery[0].image_path}` : placeholderImg,
    gallery?.[1] ? `${API_BASE_URL}/uploads/places/${gallery[1].image_path}` : placeholderImg,
    gallery?.[2] ? `${API_BASE_URL}/uploads/places/${gallery[2].image_path}` : placeholderImg,
    gallery?.[3] ? `${API_BASE_URL}/uploads/places/${gallery[3].image_path}` : placeholderImg
  ];

  return (
    <div className="place-details-wrapper dining-wrapper">
        <div className="pd-container" style={{paddingTop: '20px'}}>
          
          {/* GALLERY GRID */}
          <div className="res-gallery-grid">
            <img src={galleryItems[0]} alt="Gallery 1" className="gallery-main" />
            
            <div className="gallery-sub top-mid">
               <img src={galleryItems[1]} alt="Gallery 2" />
            </div>
            
            <div className="res-info-card-cell">
              <div className="res-title-info">
                <h1>{place.name}</h1>
                <div className="res-title-ratings">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                  <span>4.8</span>
                  <span style={{ color: '#9ca3af', fontWeight: 'normal' }}>(212)</span>
                </div>
                <div className="res-location-row">
                   <MapPin size={12} color="#6b7280" />
                   <span>{place.location || "Sri Lanka"}</span>
                </div>
                <div className="res-cuisine-row">
                   <FileText size={12} color="#6b7280" />
                   <span>{place.cuisine_type || "Modern Sri Lankan Fusion"}</span>
                </div>
              </div>
              <button onClick={toggleFavorite} className="btn-save-minimal">
                <Heart size={14} fill={isFavorite ? "#ef4444" : "none"} color={isFavorite ? "#ef4444" : "#111827"} />
                <span>Save</span>
              </button>
            </div>

            <div className="gallery-sub bot-mid">
               <img src={galleryItems[2]} alt="Gallery 3" />
            </div>
            
            <div className="bot-right-group">
               <img src={galleryItems[3]} alt="Gallery 4" />
               <img src={galleryItems[4]} alt="Gallery 5" />
            </div>
          </div>

          <div className="pd-main-layout">
            <div className="pd-content-col">
              
              {/* ABOUT SECTION */}
              <div className="pd-section res-about-section">
                <h2 className="pd-section-title">About this Restaurant</h2>
                <div className="res-about-container">
                  <div className="res-about-card-lite">
                    <p>{place.description || "Experience unparalleled dining in this stunning location."}</p>
                    <div className="res-about-tags">
                      <span className="res-about-tag-lite"><Clock size={16} /> {place.opening_hours || "09:00"} - {place.closing_hours || "23:00"}</span>
                      <span className="res-about-tag-lite"><FileText size={16} /> {place.cuisine_type || "Modern Sri Lankan Fusion"}</span>
                      <span className="res-about-tag-lite"><Users size={16} /> Max Capacity: {place.table_capacity || "74"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MENU HIGHLIGHTS */}
              <div className="pd-section">
                <div className="res-menu-heading-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 className="pd-section-title" style={{ margin: 0 }}>Restaurant Menu</h2>
                    {place.menu_pdf && (
                      <a href={`${API_BASE_URL}/uploads/pdfs/${place.menu_pdf}`} target="_blank" rel="noopener noreferrer" className="btn-pdf-menu">
                        <FileText size={14} /> View Full PDF Menu
                      </a>
                    )}
                  </div>
                  <div className="pd-menu-tabs">
                    {["Main Course", "Desserts"].map((cat) => (
                      <div key={cat} className={`pd-menu-tab ${activeCategory === cat || (cat === 'Main Course' && !activeCategory) ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="res-menu-grid">
                  {filteredMenu.length > 0 ? (
                    (showAllMenu ? filteredMenu : filteredMenu.slice(0, 3)).map((item, idx) => (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="res-menu-card" key={idx}>
                        <img src={item.image ? `${API_BASE_URL}/uploads/menu/${item.image}` : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"} alt={item.name} className="res-menu-img" />
                        <div className="res-menu-info-row">
                          <h4>{item.name}</h4>
                          <span className="res-menu-price">LKR {Number(item.price).toLocaleString()}</span>
                        </div>
                        <div className="res-menu-pills">
                          {item.is_veg && <span className="menu-pill pill-vegan">Vegan Option</span>}
                          {item.is_special && <span className="menu-pill pill-special">Special</span>}
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="res-menu-empty">
                       <p>We haven't added any {activeCategory.toLowerCase()} yet.</p>
                    </div>
                  )}
                </div>

                {filteredMenu.length > 3 && (
                  <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button onClick={() => setShowAllMenu(!showAllMenu)} className="res-btn-see-more">
                      {showAllMenu ? "Show Less" : "See More"}
                    </button>
                  </div>
                )}
              </div>

              {/* SHARE EXPERIENCE FORM */}
              <div className="pd-section" style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
                <h2 className="pd-section-title" style={{ marginBottom: '24px', fontSize: '1.6rem' }}>Share Your Experience</h2>
                {token ? (
                  <form onSubmit={handleAddReview} className="pd-form" style={{ background: 'rgba(255,255,255,0.4)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(0, 53, 128, 0.1)', backdropFilter: 'blur(10px)', maxWidth: '100%' }}>
                    <div className="pd-input-group">
                      <label className="pd-label">Your Rating</label>
                      <div className="pd-stars-picker" style={{ display: 'flex', gap: '8px', padding: '12px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} size={20} style={{ cursor: 'pointer', transition: 'all 0.3s' }}
                            className={`pd-star-icon ${star <= myRating ? 'active' : ''}`}
                            fill={star <= myRating ? "#FFD700" : "none"}
                            color={star <= myRating ? "#FFD700" : "#555555"}
                            onClick={() => setMyRating(star)}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <div className="pd-input-group">
                      <label className="pd-label">Your Feedback</label>
                      <textarea 
                        className="pd-input" 
                        style={{ minHeight: '120px', padding: '16px', resize: 'none', background: 'white' }}
                        placeholder="Tell us what you loved..." 
                        value={myComment}
                        onChange={(e) => setMyComment(e.target.value)}
                        required
                      ></textarea>
                    </div>

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="pd-btn-submit" disabled={isPostingReview} style={{ width: '100%', background: '#003580' }}>
                      {isPostingReview ? "Posting..." : "Post Review"}
                    </motion.button>
                  </form>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(255,255,255,0.4)', borderRadius: '24px', border: '1px solid rgba(0, 53, 128, 0.1)', backdropFilter: 'blur(10px)' }}>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '20px' }}>Been here before? Login to share your host experience.</p>
                    <button className="pd-btn-submit" onClick={() => navigate("/login", { state: { from: location.pathname } })} style={{ background: '#003580' }}>
                      Login to Review
                    </button>
                  </div>
                )}
              </div>
            </div>

            <aside className="pd-sidebar">
              {/* BOOKING WIDGET */}
              <div className="res-booking-widget-lite">
                <div className="pd-widget-header">
                  <h2 className="pd-widget-title" style={{ fontSize: '1.6rem', color: '#1a1a1a' }}>Book a Table</h2>
                  <p className="res-widget-subtitle">Join us for an unforgettable meal</p>
                </div>

                <form className="pd-form" onSubmit={handleDinnerBookingSubmit}>
                  {/* Guest Info */}
                  <div className="pd-input-group">
                    <label className="pd-label">Full Name</label>
                    <div className="pd-input-wrapper">
                      <User size={16} className="pd-icon" />
                      <input className="pd-input" type="text" placeholder="Your Name" value={fullName} onChange={e => setFullName(e.target.value)} required />
                    </div>
                  </div>

                  <div className="res-form-grid-lite">
                    <div className="pd-input-group">
                      <label className="pd-label">Email</label>
                      <div className="pd-input-wrapper">
                        <FileText size={16} className="pd-icon" />
                        <input className="pd-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                    </div>
                    <div className="pd-input-group">
                      <label className="pd-label">Phone</label>
                      <div className="pd-input-wrapper">
                        <User size={16} className="pd-icon" />
                        <input 
                          className="pd-input" 
                          type="text" 
                          placeholder="+94 77 123 4567" 
                          value={phone} 
                          onChange={(e) => {
                            let val = e.target.value;
                            if (!val.startsWith("+94 ")) {
                              val = "+94 " + val.replace(/^\+94\s*/, "");
                            }
                            const prefix = "+94 ";
                            let digits = val.substring(prefix.length).replace(/\D/g, "");
                            if (digits.length > 9) digits = digits.slice(0, 9);
                            let formattedDigits = "";
                            for (let i = 0; i < digits.length; i++) {
                              if (i === 2 || i === 5) formattedDigits += " ";
                              formattedDigits += digits[i];
                            }
                            setPhone(prefix + formattedDigits);
                          }} 
                          onFocus={() => { if (!phone) setPhone("+94 "); }}
                          required 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pd-input-group">
                    <label className="pd-label">Date</label>
                    <div className="pd-input-wrapper">
                      <Clock size={16} className="pd-icon" />
                      <DatePicker selected={resDate} onChange={date => setResDate(date)} minDate={new Date()} placeholderText="Select Date" className="pd-input" required />
                    </div>
                  </div>

                  <div className="res-form-grid-lite">
                    <div className="pd-input-group">
                      <label className="pd-label">Time</label>
                      <div className="pd-input-wrapper">
                        <Clock size={16} className="pd-icon" />
                        <select className="pd-input" value={resTime} onChange={e => setResTime(e.target.value)} required>
                          <option value="">Time</option>
                          {["11:00", "12:00", "13:00", "14:00", "15:00", "18:00", "19:00", "20:00", "21:00", "22:00"].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="pd-input-group">
                      <label className="pd-label">Guests</label>
                      <div className="pd-input-wrapper">
                        <Users size={16} className="pd-icon" />
                        <input className="pd-input" type="number" min="1" max="20" value={resGuests} onChange={e => setResGuests(e.target.value)} required />
                      </div>
                    </div>
                  </div>

                  <div className="pd-input-group">
                    <label className="pd-label">Select Table (Optional)</label>
                    <div className="pd-input-wrapper">
                      <Users size={16} className="pd-icon" />
                      <select className="pd-input" value={resTable} onChange={e => setResTable(e.target.value)}>
                        <option value="">System will auto-allocate</option>
                        {tables.map(t => <option key={t.id} value={t.id}>{t.table_number ? `Table ${t.table_number}` : t.name} ({t.capacity} seats)</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="res-preorder-section">
                    <div className="preorder-header" onClick={() => setWantsPreOrder(!wantsPreOrder)}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <Check size={16} color={wantsPreOrder ? "#003580" : "#cbd5e1"} />
                         <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#262626' }}>Pre-order Food?</span>
                       </div>
                    </div>
                    {wantsPreOrder && (
                      <div className="preorder-list">
                         {menuItems.slice(0, 3).map(item => (
                           <div key={item.id} className="preorder-item-lite">
                             <span>{item.name}</span>
                             <div className="qty-controls">
                               <button type="button" onClick={() => updatePreOrderQty(item.id, -1)}>-</button>
                               <span>{preOrderQuantities[item.id] || 0}</span>
                               <button type="button" onClick={() => updatePreOrderQty(item.id, 1)}>+</button>
                             </div>
                           </div>
                         ))}
                      </div>
                    )}
                  </div>

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="pd-btn-submit" disabled={isBooking} style={{ width: '100%', marginTop: '16px' }}>
                    {isBooking ? "Confirming..." : "Reserve Now"}
                  </motion.button>
                </form>
              </div>

              {/* SIDEBAR MAP */}
              <div className="pd-sidebar-map" style={{ marginTop: '24px' }}>
                <div className="res-map-container">
                  <iframe 
                    title="restaurant-map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(place.location || "Colombo")}&z=14&output=embed`}
                    width="100%" height="200" frameBorder="0" style={{ border: 0, borderRadius: '16px', display: 'block' }} allowFullScreen=""
                  />
                  <button className="res-btn-directions" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(place.location)}`, '_blank')}>
                    Get Directions
                  </button>
                </div>
              </div>

              {/* SIDEBAR FEEDBACK */}
              <div className="res-reviews-sidebar" style={{ background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', marginTop: '24px' }}>
                <h2 className="pd-section-title" style={{ marginBottom: '24px', fontSize: '1.4rem' }}>Guest Feedback</h2>
                <div className="reviews-list-compact" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                  {reviews.length > 0 ? reviews.map((r, i) => (
                    <div key={i} style={{ background: 'white', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '12px' }}>
                      <div className="review-header" style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                        <div className="review-avatar" style={{ width: 32, height: 32, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <User size={14} color="#003580" />
                        </div>
                        <div className="review-meta">
                          <h4 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: '0.85rem' }}>{r.user_name || "Guest"}</h4>
                          <div style={{ display: 'flex', gap: 1 }}>
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} size={8} fill={star <= r.rating ? "#FFD700" : "none"} color="#FFD700" />
                            ))}
                          </div>
                        </div>
                        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ color: '#475569', lineHeight: 1.5, margin: 0, fontSize: '0.85rem' }}>{r.comment}</p>
                    </div>
                  )) : (
                    <div className="res-menu-empty">
                       <p>No reviews yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
    </div>
  );
};

export default PlaceDetailsDining;
