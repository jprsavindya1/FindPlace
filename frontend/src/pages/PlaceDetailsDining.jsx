import React from 'react';
import { motion } from "framer-motion";
import { 
  MapPin, Star, Check, FileText, Users, Heart, Clock, User, 
  MessageCircle, Plus, Minus, ChevronRight, Share2, Edit3
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
  fullName, setFullName, email, setEmail, phone, setPhone, avgRating, totalReviews
}) => {
  const tabsRef = React.useRef(null);
  const [showAllReviews, setShowAllReviews] = React.useState(false);

  const handleShare = async () => {
    const shareData = {
      title: place.name,
      text: `Check out ${place.name} on Find Place!`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard! 📋");
      }
    } catch (err) { console.log(err); }
  };
  
  // EAT APP INSPIRED TIME SLOT GENERATION
  const timeSlots = React.useMemo(() => {
    const slots = [];
    const now = new Date();
    const isToday = resDate && (
      resDate.getDate() === now.getDate() &&
      resDate.getMonth() === now.getMonth() &&
      resDate.getFullYear() === now.getFullYear()
    );

    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Parse business hours (format: "HH:mm")
    const startH = parseInt((place.opening_hours || "09:00").split(':')[0]);
    const endH = parseInt((place.closing_hours || "22:00").split(':')[0]);
    const endM = parseInt((place.closing_hours || "22:00").split(':')[1] || "0");

    // From opening hour to closing hour
    for (let h = startH; h <= endH; h++) {
      for (let m = 0; m < 60; m += 30) {
        // Break if we hit or exceed the closing time
        if (h === endH && m >= endM) break;
        
        // Final sanity check for late night closing (e.g. 11 PM or 11:30 PM)
        if (h === 23 && m > 30) break;

        // Filter out past slots if today
        if (isToday) {
          if (h < currentHour) continue;
          if (h === currentHour && m <= currentMinute) continue;
        }

        const hour12 = h % 12 || 12;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const label = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
        const value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        
        let category = "Dinner";
        if (h < 11) category = "Breakfast";
        else if (h < 16) category = "Lunch";
        
        slots.push({ label, value, category });
      }
    }
    return slots;
  }, [resDate, place.opening_hours, place.closing_hours]);

  const groupedSlots = React.useMemo(() => {
    const breakfast = timeSlots.filter(s => s.category === "Breakfast");
    const lunch = timeSlots.filter(s => s.category === "Lunch");
    const dinner = timeSlots.filter(s => s.category === "Dinner");
    
    const result = {};
    if (breakfast.length > 0) result["Breakfast"] = breakfast;
    if (lunch.length > 0) result["Lunch"] = lunch;
    if (dinner.length > 0) result["Dinner"] = dinner;
    
    return result;
  }, [timeSlots]);

  const placeholderImg = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"; // Reliable restaurant placeholder
  
  const totalPreOrderPrice = Object.entries(preOrderQuantities).reduce((sum, [itemId, qty]) => {
    const item = menuItems.find(i => String(i.id) === String(itemId));
    return sum + (item ? item.price * qty : 0);
  }, 0);

  const availableCategories = [...new Set(menuItems.map(item => item.category))].filter(Boolean);
  // Ensure the current activeCategory is valid or default to first one if possible
  const currentTab = activeCategory || (availableCategories.includes("Main Course") ? "Main Course" : availableCategories[0]);
  
  const galleryItems = [
    place.image ? `${API_BASE_URL}/uploads/places/${place.image}` : placeholderImg,
    gallery?.[0] ? `${API_BASE_URL}/uploads/places/${gallery[0].image_path}` : placeholderImg,
    gallery?.[1] ? `${API_BASE_URL}/uploads/places/${gallery[1].image_path}` : placeholderImg,
    gallery?.[2] ? `${API_BASE_URL}/uploads/places/${gallery[2].image_path}` : placeholderImg,
    gallery?.[3] ? `${API_BASE_URL}/uploads/places/${gallery[3].image_path}` : placeholderImg
  ];

  const scrollTabs = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

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
              <div className="res-info-top-group">
                <h1 className="pd-main-title">{place.name}</h1>
                
                <div className="pd-meta-row">
                  <div className="pd-meta-item">
                    <div className="res-rating-pill">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{avgRating ? avgRating.toFixed(1) : "4.8"}</span>
                      <span className="res-review-count">({totalReviews || 212})</span>
                    </div>
                  </div>
                  
                  <div className="pd-meta-divider"></div>
                  
                  <div className="pd-meta-item">
                     <MapPin size={14} className="pd-meta-icon" />
                     <span>{place.location || "Sri Lanka"}</span>
                  </div>
                </div>

                <div className="pd-cuisine-review-row">
                   <div className="pd-meta-item">
                      <FileText size={14} className="pd-meta-icon" />
                      <span className="pd-cuisine-badge">{place.cuisine_type || "Modern Fusion"}</span>
                   </div>
                   <button className="btn-write-review-minimal" onClick={() => document.getElementById('review-form-section')?.scrollIntoView({ behavior: 'smooth' })}>
                      <Edit3 size={14} />
                      <span>Write Review</span>
                   </button>
                </div>
              </div>

              <div className="res-action-group">
                <button onClick={toggleFavorite} className="btn-save-premium">
                  <Heart size={18} fill={isFavorite ? "#ef4444" : "none"} color={isFavorite ? "#ef4444" : "#1e293b"} />
                  <span>{isFavorite ? "Saved" : "Save"}</span>
                </button>

                {place.whatsapp && (
                  <a 
                    href={`https://wa.me/${place.whatsapp.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-whatsapp-premium"
                  >
                    <FaWhatsapp size={18} />
                    <span>WhatsApp</span>
                  </a>
                )}

                <button className="btn-share-premium" title="Share Place" onClick={handleShare}>
                  <Share2 size={18} />
                  <span>Share</span>
                </button>
              </div>
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
                  <div className="pd-menu-tabs-container">
                    <div className="pd-menu-tabs-scroll-wrapper" ref={tabsRef}>
                      <div className="pd-menu-tabs">
                        {availableCategories.map((cat) => (
                          <div key={cat} className={`pd-menu-tab ${currentTab === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                            {cat}
                          </div>
                        ))}
                      </div>
                    </div>
                    {availableCategories.length > 2 && (
                      <div className="pd-menu-scroll-indicator" onClick={scrollTabs}>
                         <ChevronRight size={16} />
                      </div>
                    )}
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
              <div id="review-form-section" className="pd-section" style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '40px' }}>
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

                {/* RELOCATED & REDESIGNED GUEST FEEDBACK */}
                <div className="pd-section" style={{ marginTop: '48px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 className="pd-section-title" style={{ margin: 0, fontSize: '1.6rem' }}>Guest Feedback</h2>
                    {reviews.length > 1 && (
                      <button 
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        style={{ background: 'none', border: 'none', color: '#003580', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {showAllReviews ? "Show Less" : `See More (${reviews.length - 1} more)`}
                        <ChevronRight size={16} style={{ transform: showAllReviews ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform 0.3s' }} />
                      </button>
                    )}
                  </div>

                  <div className="reviews-horizontal-container">
                    {reviews.length > 0 ? (
                      (showAllReviews ? reviews : reviews.slice(0, 1)).map((r, i) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          key={i} 
                          style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #e2e8f0', marginBottom: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                        >
                          <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <User size={20} color="#003580" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <h4 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: '1rem' }}>{r.user_name || "Guest"}</h4>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 2, marginBottom: '12px' }}>
                                {[1, 2, 3, 4, 5].map(star => (
                                  <Star key={star} size={14} fill={star <= r.rating ? "#FFD700" : "none"} color="#FFD700" />
                                ))}
                              </div>
                              <p style={{ color: '#475569', lineHeight: 1.6, margin: 0, fontSize: '0.95rem' }}>{r.comment}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '24px', border: '1px dashed #e2e8f0' }}>
                         <p style={{ color: '#94a3b8', margin: 0 }}>No reviews yet. Be the first to share your thoughts!</p>
                      </div>
                    )}
                  </div>
                </div>
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
                   <div className="pd-input-group" style={{ marginBottom: '24px' }}>
                    <label className="pd-label" style={{ marginBottom: '12px' }}>Select a time</label>
                    
                    <div className="res-time-slots-wrapper" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                      {Object.entries(groupedSlots).map(([cat, slots]) => (
                        <div key={cat} style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#64748b', marginBottom: '12px', paddingLeft: '4px' }}>{cat}</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: '8px' }}>
                            {slots.map(slot => {
                              const isActive = resTime === slot.value;
                              return (
                                <button
                                  key={slot.value}
                                  type="button"
                                  onClick={() => setResTime(slot.value)}
                                  style={{
                                    padding: '10px 4px',
                                    borderRadius: '12px',
                                    border: isActive ? '2px solid #003580' : '1px solid #e2e8f0',
                                    background: isActive ? '#00358010' : 'white',
                                    color: isActive ? '#003580' : '#1e293b',
                                    fontSize: '0.85rem',
                                    fontWeight: isActive ? '800' : '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    textAlign: 'center'
                                  }}
                                >
                                  {slot.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
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
                         {availableCategories.map(cat => {
                           const itemsInCat = menuItems.filter(item => item.category === cat);
                           if (itemsInCat.length === 0) return null;
                           return (
                             <div key={cat} className="preorder-cat-group" style={{ marginBottom: '16px' }}>
                               <h5 style={{ fontSize: '0.75rem', fontWeight: '800', color: '#003580', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', paddingLeft: '4px', borderLeft: '3px solid #003580' }}>
                                 {cat}
                               </h5>
                               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                 {itemsInCat.map(item => (
                                   <div key={item.id} className="preorder-item-lite">
                                     <div style={{ display: 'flex', flexDirection: 'column' }}>
                                       <span>{item.name}</span>
                                       <span style={{ fontSize: '0.75rem', color: '#64748b' }}>LKR {item.price.toLocaleString()}</span>
                                     </div>
                                     <div className="qty-controls">
                                        <button type="button" className="qty-btn" onClick={() => updatePreOrderQty(item.id, -1)}>
                                          <Minus size={14} />
                                        </button>
                                        <span className="qty-val">{preOrderQuantities[item.id] || 0}</span>
                                        <button type="button" className="qty-btn" onClick={() => updatePreOrderQty(item.id, 1)}>
                                          <Plus size={14} />
                                        </button>
                                      </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           );
                         })}
                      </div>
                    )}
                    {wantsPreOrder && totalPreOrderPrice > 0 && (
                      <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#64748b' }}>Pre-order Total:</span>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#003580' }}>LKR {totalPreOrderPrice.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="pd-btn-submit" disabled={isBooking} style={{ width: '100%', marginTop: '16px' }}>
                    {isBooking ? "Confirming..." : "Reserve Now"}
                  </motion.button>
                </form>
              </div>

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
            </aside>
          </div>
        </div>
    </div>
  );
};

export default PlaceDetailsDining;
