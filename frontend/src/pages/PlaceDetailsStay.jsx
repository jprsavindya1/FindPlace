import React from 'react';
import { motion } from "framer-motion";
import { 
  MapPin, Star, Check, Users, Bed, Calendar, Phone, FileText, 
  Heart, Clock, PawPrint, Ban, Info, CheckCircle, Eye, User,
  MessageCircle, PlusCircle, Share2, Edit3, ChevronRight
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import DatePicker from "react-datepicker";
import { Link } from "react-router-dom";

const PlaceDetailsStay = ({
  place, id, token, role, navigate, location, API_BASE_URL,
  amenities, rooms, selectedRoom, setSelectedRoom, showAllRooms, setShowAllRooms,
  checkIn, setCheckIn, checkOut, setCheckOut, adults, setAdults, children, setChildren,
  bookedDates, disabledDates, occupancy, fullName, setFullName, email, setEmail, phone, setPhone, identity, setIdentity,
  nights, totalPrice, roomName, pricePerNight, isBooking, setIsBooking,
  bookingStatus, setBookingStatus, bookingMsg, setBookingMsg,
  isPaymentModalOpen, setIsPaymentModalOpen, pendingBookingData, setPendingBookingData,
  confirmPaidBooking, is360ModalOpen, setIs360ModalOpen, selected360Image, setSelected360Image, selectedRoomLabel, setSelectedRoomLabel,
  numRooms, setNumRooms,
  reviews, avgRating, totalReviews, toggleFavorite, isFavorite, isLiking,
  proofModal, setCurrentProof,
  handleAddReview, myRating, setMyRating, myComment, setMyComment, reviewMsg, isPostingReview,
  activeCategory, setActiveCategory, showAllMenu, setShowAllMenu, menuItems, filteredMenu,
  handleBookingSubmit, addDays, gallery
}) => {
  const tabsRef = React.useRef(null);

  const scrollTabs = () => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  const availableCategories = React.useMemo(() => {
    return [...new Set(menuItems.map(item => item.category))].filter(Boolean);
  }, [menuItems]);
  
  const currentTab = activeCategory || availableCategories[0];

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

  const placeholderImg = "https://images.unsplash.com/photo-1582719478250-c89cae4df85b?auto=format&fit=crop&q=80"; // A reliable default
  
  const galleryItems = [
    place.image ? `${API_BASE_URL}/uploads/places/${place.image}` : placeholderImg,
    gallery?.[0] ? `${API_BASE_URL}/uploads/places/${gallery[0].image_path}` : placeholderImg,
    gallery?.[1] ? `${API_BASE_URL}/uploads/places/${gallery[1].image_path}` : placeholderImg,
    gallery?.[2] ? `${API_BASE_URL}/uploads/places/${gallery[2].image_path}` : placeholderImg,
    gallery?.[3] ? `${API_BASE_URL}/uploads/places/${gallery[3].image_path}` : placeholderImg
  ];

  return (
    <div className="pd-page">
        <div className="place-details-wrapper">
          {/* LUNA THEME Animated Background Blobs */}
          <motion.div className="luna-blob blob-1" animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.2, 0.15] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} />
          <motion.div className="luna-blob blob-2" animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
          <motion.div className="luna-blob blob-3" animate={{ scale: [1, 1.3, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 5 }} />

          <div className="pd-container">
            
            {/* GALLERY GRID (RESTORED LUXURY VERSION) */}
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
                        <span className="res-review-count">({totalReviews || 124})</span>
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
                        <Bed size={14} className="pd-meta-icon" />
                        <span className="pd-cuisine-badge">{place.category || "Luxury Stay"}</span>
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

            {/* MAIN LAYOUT: CONTENT + SIDEBAR */}
            <div className="pd-main-layout">
              <div className="pd-content-col">
                {/* Description */}
                <div className="pd-section">
                  <h2 className="pd-section-title">About this {place.category || "Place"}</h2>
                  <p className="pd-description">{place.description || "Experience unparalleled luxury in this stunning location."}</p>
                </div>

                {/* Amenities */}
                {amenities && amenities.length > 0 && (
                  <div className="pd-section">
                    <h2 className="pd-section-title">What this place offers</h2>
                    <div className="pd-amenities-grid">
                      {amenities.map((am, i) => (
                        <div key={i} className="pd-amenity-chip"><Check size={16} /> {am.name}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Room Types */}
                <div className="pd-section">
                  <h2 className="pd-section-title">Available Accommodations</h2>
                  <div className="pd-rooms-list">
                    {(showAllRooms ? rooms : rooms.slice(0, 2)).map((room) => (
                      <div key={room.id} 
                        className={`pd-luxury-room-card ${selectedRoom === String(room.id) ? 'selected' : ''}`}
                        onClick={() => setSelectedRoom(String(room.id))}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Image Side */}
                        <div className="pd-lux-img-wrapper">
                          <img 
                            src={
                              room.image 
                                ? `${API_BASE_URL}/uploads/rooms/${room.image}` 
                                : room.image_360 
                                  ? `${API_BASE_URL}/uploads/rooms/${room.image_360}` 
                                  : "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"
                            } 
                            alt={room.name} 
                          />
                          {room.image_360 && (
                            <div className="pd-lux-360-badge">
                              <MapPin size={10} /> 360° Virtual Tour
                            </div>
                          )}
                          {occupancy[room.id] && (
                            <div className="pd-occupancy-badge" style={{ bottom: '10px', top: 'auto', left: '10px' }}>
                               {occupancy[room.id].is_booked ? "Full" : `${occupancy[room.id].available} left`}
                            </div>
                          )}
                        </div>

                        {/* Content Side */}
                        <div className="pd-lux-content">
                          <div className="pd-lux-header">
                            <h3 className="pd-lux-name">{room.name}</h3>
                            <span className="pd-lux-price">LKR {Number(room.price).toLocaleString()}</span>
                          </div>

                          <p className="pd-lux-desc">{room.description}</p>

                          <div className="pd-lux-footer">
                            <div className="pd-lux-occupancy">
                               <Users size={16} /> 
                               <span>Max occupancy: {room.capacity || 2} persons</span>
                            </div>

                            {room.image_360 && (
                              <button 
                                className="pd-lux-btn-360" 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  setSelected360Image(room.image_360); 
                                  setSelectedRoomLabel(room.name); 
                                  setIs360ModalOpen(true); 
                                }}
                              >
                                <Eye size={16} /> View in 360°
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {rooms.length > 2 && (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                      <button onClick={() => setShowAllRooms(!showAllRooms)} className="pd-lux-btn-360" style={{ margin: '0 auto' }}>
                        {showAllRooms ? "Show Less" : `View all ${rooms.length} room types`}
                      </button>
                    </div>
                  )}
                </div>

                {/* Dining Options Section */}
                {menuItems && menuItems.length > 0 && (
                  <div className="pd-section" style={{ marginTop: '40px' }}>
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

                    <div className="pd-menu-luxury-grid">
                      {menuItems.filter(item => item.category === activeCategory).length > 0 ? (
                        (showAllMenu ? menuItems.filter(item => item.category === activeCategory) : menuItems.filter(item => item.category === activeCategory).slice(0, 2)).map((item, idx) => (
                          <div className="pd-food-luxury-card" key={idx}>
                            <div className="pd-food-lux-img-wrapper">
                              <img src={item.image ? `${API_BASE_URL}/uploads/menu/${item.image}` : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"} alt={item.name} />
                            </div>
                            <div className="pd-food-lux-content">
                              <div className="pd-food-lux-header">
                                <h4 className="pd-food-lux-name">{item.name}</h4>
                                <span className="pd-food-lux-price">LKR {Number(item.price).toLocaleString()}</span>
                              </div>
                              <p className="pd-food-lux-desc">{item.description || "A delicious dish prepared with fresh ingredients."}</p>
                              <div className="pd-menu-pills" style={{ marginTop: '10px' }}>
                                 {item.is_veg && <span className="menu-pill pill-vegan">Vegan</span>}
                                 {item.is_special && <span className="menu-pill pill-special">Special</span>}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.02)', borderRadius: '24px' }}>
                           <p style={{ color: '#64748b' }}>No {activeCategory.toLowerCase()} available at the moment.</p>
                        </div>
                      )}
                    </div>
                    {menuItems.filter(item => item.category === activeCategory).length > 2 && (
                      <div style={{ textAlign: 'center', marginTop: '10px' }}>
                        <button onClick={() => setShowAllMenu(!showAllMenu)} className="res-btn-see-more">
                          {showAllMenu ? "See Less" : `See More ${activeCategory}`}
                        </button>
                      </div>
                    )}

                  </div>
                )}

                {/* House Rules */}
                <div className="pd-section">
                  <h2 className="pd-section-title">House Rules & Info</h2>
                  <div className="pd-rules-grid">
                    <div className="pd-rule-card">
                       <div className="pd-rule-icon"><Clock size={20} /></div>
                       <div className="pd-rule-info">
                          <span className="pd-rule-label">Check-In</span>
                          <span className="pd-rule-value">From 14:00 PM</span>
                       </div>
                    </div>
                    <div className="pd-rule-card">
                       <div className="pd-rule-icon"><Clock size={20} /></div>
                       <div className="pd-rule-info">
                          <span className="pd-rule-label">Check-Out</span>
                          <span className="pd-rule-value">Until 11:00 AM</span>
                       </div>
                    </div>
                    <div className="pd-rule-card">
                       <div className={`pd-rule-icon ${place.pets_allowed ? "allowed" : "not-allowed"}`}><PawPrint size={20} /></div>
                       <div className="pd-rule-info">
                          <span className="pd-rule-label">Pets</span>
                          <span className={`pd-rule-value ${place.pets_allowed ? "status-allowed" : "status-prohibited"}`}>{place.pets_allowed ? "Allowed" : "Not Allowed"}</span>
                       </div>
                    </div>
                    <div className="pd-rule-card">
                       <div className={`pd-rule-icon ${place.smoking_allowed ? "allowed" : "not-allowed"}`}><Ban size={20} /></div>
                       <div className="pd-rule-info">
                          <span className="pd-rule-label">Smoking</span>
                          <span className={`pd-rule-value ${place.smoking_allowed ? "status-allowed" : "status-prohibited"}`}>{place.smoking_allowed ? "Allowed" : "Prohibited"}</span>
                       </div>
                    </div>
                  </div>
                </div>

              </div>

              <aside className="pd-sidebar">
                <div className="res-booking-widget">
                  <div className="pd-widget-header">
                    <h2 className="pd-widget-title" style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: '900', color: '#1a1a1a' }}>Booking Form</h2>
                  </div>
                  {token ? (
                    <div className="pd-form">
                      {/* Room Type */}
                      <div className="pd-input-group">
                        <label className="pd-label">Room Type</label>
                        <div className="pd-input-wrapper">
                          <select className="pd-input" value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} required>
                            <option value="">Select a room...</option>
                            {rooms.map(rt => <option key={rt.id} value={rt.id}>{rt.name} - Rs. {Number(rt.price).toLocaleString()}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Number of Rooms */}
                      <div className="pd-input-group">
                        <label className="pd-label">Number of Rooms</label>
                        <div className="pd-input-wrapper">
                          <PlusCircle size={18} className="pd-icon" />
                          <input 
                            type="number" 
                            className="pd-input" 
                            min="1" 
                            max="10"
                            value={numRooms} 
                            onChange={(e) => setNumRooms(Math.max(1, parseInt(e.target.value) || 1))} 
                            required 
                          />
                        </div>
                      </div>

                      {/* Check-In */}
                      <div className="pd-input-group">
                        <label className="pd-label">Check-In Date</label>
                        <div className="pd-input-wrapper" style={{ zIndex: 10 }}>
                          <Calendar size={18} className="pd-icon" />
                          <DatePicker 
                            selected={checkIn} 
                            onChange={(date) => { setCheckIn(date); if (checkOut && date >= checkOut) setCheckOut(null); }} 
                            minDate={new Date()} 
                            excludeDates={disabledDates} 
                            placeholderText={selectedRoom ? "Select Check-In" : "Select Room First"} 
                            className="pd-input" 
                            disabled={!selectedRoom} 
                            required 
                          />
                        </div>
                      </div>

                      {/* Check-Out */}
                      <div className="pd-input-group">
                        <label className="pd-label">Check-Out Date</label>
                        <div className="pd-input-wrapper" style={{ zIndex: 9 }}>
                          <Calendar size={18} className="pd-icon" />
                          <DatePicker 
                            selected={checkOut} 
                            onChange={(date) => setCheckOut(date)} 
                            minDate={checkIn ? addDays(checkIn, 1) : new Date()} 
                            excludeDates={disabledDates} 
                            placeholderText={checkIn ? "Select Check-Out" : "Select Check-In First"} 
                            className="pd-input" 
                            disabled={!checkIn} 
                            required 
                          />
                        </div>
                      </div>

                      {/* Occupancy: Adults & Children */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="pd-input-group">
                          <label className="pd-label">Adults</label>
                          <div className="pd-input-wrapper">
                            <Users size={18} className="pd-icon" />
                            <input 
                              type="number" 
                              className="pd-input" 
                              min="1" 
                              value={adults} 
                              onChange={(e) => setAdults(Math.max(1, parseInt(e.target.value) || 1))} 
                              required 
                            />
                          </div>
                        </div>
                        <div className="pd-input-group">
                          <label className="pd-label">Children</label>
                          <div className="pd-input-wrapper">
                            <Users size={18} className="pd-icon" />
                            <input 
                              type="number" 
                              className="pd-input" 
                              min="0" 
                              value={children} 
                              onChange={(e) => setChildren(Math.max(0, parseInt(e.target.value) || 0))} 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Full Name */}
                      <div className="pd-input-group">
                        <label className="pd-label">Full Name</label>
                        <div className="pd-input-wrapper">
                          <User size={18} className="pd-icon" />
                          <input 
                            type="text" 
                            className="pd-input" 
                            placeholder="Jane Doe" 
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>

                      {/* Phone Number */}
                      <div className="pd-input-group">
                        <label className="pd-label">Phone Number</label>
                        <div className="pd-input-wrapper">
                          <Phone size={18} className="pd-icon" />
                          <input 
                            type="text" 
                            className="pd-input" 
                            placeholder="+94 77 XXX XXXX" 
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

                      {/* NIC / Passport */}
                      <div className="pd-input-group">
                        <label className="pd-label">NIC / Passport</label>
                        <div className="pd-input-wrapper">
                          <FileText size={18} className="pd-icon" />
                          <input 
                            type="text" 
                            className="pd-input" 
                            placeholder="Enter ID number" 
                            value={identity} 
                            onChange={(e) => setIdentity(e.target.value)} 
                            required 
                          />
                        </div>
                      </div>
                      
                      {nights > 0 && totalPrice > 0 && (
                        <div className="pricing-summary" style={{ background: 'rgba(0, 53, 128, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(0, 53, 128, 0.1)', marginTop: '8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#555555', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{nights} Nights × {numRooms} {numRooms > 1 ? 'Rooms' : 'Room'}</span>
                              <span style={{ fontWeight: 800, color: '#003580' }}>Rs. {totalPrice.toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Guests: {adults} Adults, {children} Children
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="pd-booking-actions" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <motion.button 
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                          className="pd-btn-pay-now" 
                          onClick={(e) => handleBookingSubmit(e, 'ONLINE')}
                          disabled={isBooking || !selectedRoom || !checkIn || !checkOut}
                          style={{ margin: 0 }}
                        >
                          {isBooking ? "Processing..." : "Pay Now (Online)"}
                        </motion.button>
                        
                        <motion.button 
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                          className="pd-btn-pay-later" 
                          onClick={(e) => handleBookingSubmit(e, 'AT_HOTEL')}
                          disabled={isBooking || !selectedRoom || !checkIn || !checkOut}
                          style={{ margin: 0, background: 'white', border: '2px solid #003580', color: '#003580', padding: '16px', borderRadius: '16px', fontWeight: '900', fontSize: '1.1rem' }}
                        >
                          Pay at Hotel
                        </motion.button>

                        {place.whatsapp && (
                          <motion.a 
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} 
                            href={`https://wa.me/${place.whatsapp.replace(/\D/g, '')}`} 
                            target="_blank" rel="noopener noreferrer" 
                            className="pd-btn-whatsapp-form"
                            style={{ margin: 0, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                          >
                            <FaWhatsapp size={20} />
                            Contact Host
                          </motion.a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="guest-booking-prompt" style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ color: '#666', marginBottom: '24px' }}>Join FindPlace to unlock instant bookings.</p>
                      <button className="pd-btn-pay-now" onClick={() => navigate("/login", { state: { from: location.pathname } })} style={{ width: '100%' }}>Login to Book</button>
                    </div>
                  )}
                </div>

                {/* SIDEBAR MAP (STAY) */}
                <div className="pd-sidebar-map" style={{ marginTop: '24px' }}>
                  <div className="res-map-container">
                    <iframe title="stay-map" src={`https://maps.google.com/maps?q=${encodeURIComponent(place.location || "Colombo")}&z=14&output=embed`} width="100%" height="200" frameBorder="0" style={{ border: 0, borderRadius: '16px', display: 'block' }} allowFullScreen="" />
                    <button className="res-btn-directions" onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(place.location)}`, '_blank')}>Get Directions</button>
                  </div>
                </div>

                {/* SIDEBAR REVIEW FORM (STAY) - Moved from main content */}
                <div id="review-form-section" className="res-booking-widget" style={{ marginTop: '24px', padding: '24px' }}>
                  <h2 className="pd-section-title" style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Share Your Experience</h2>
                  {token ? (
                    <form onSubmit={handleAddReview} className="pd-form" style={{ background: 'rgba(0,0,0,0.03)', padding: '20px', borderRadius: '20px', border: '1px solid rgba(0, 53, 128, 0.05)' }}>
                      <div className="pd-input-group">
                        <label className="pd-label">Your Rating</label>
                        <div className="pd-stars-picker" style={{ display: 'flex', gap: '8px', padding: '10px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={18} style={{ cursor: 'pointer', transition: 'all 0.3s' }} className={`pd-star-icon ${star <= myRating ? 'active' : ''}`} fill={star <= myRating ? "#FFD700" : "none"} color={star <= myRating ? "#FFD700" : "#cbd5e1"} onClick={() => setMyRating(star)} />
                          ))}
                        </div>
                      </div>
                      <div className="pd-input-group">
                        <label className="pd-label">Your Feedback</label>
                        <textarea className="pd-input" style={{ minHeight: '100px', padding: '14px', resize: 'none', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', width: '100%', fontSize: '0.9rem' }} placeholder="Tell us what you loved..." value={myComment} onChange={(e) => setMyComment(e.target.value)} required />
                      </div>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="pd-btn-submit" disabled={isPostingReview} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: '#003580', color: 'white', fontWeight: '800', marginTop: '12px', border: 'none', cursor: 'pointer' }}>
                        {isPostingReview ? "Posting..." : "Post Review"}
                      </motion.button>
                    </form>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(0,0,0,0.03)', borderRadius: '20px', border: '1px solid rgba(0, 53, 128, 0.05)' }}>
                      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '16px' }}>Login to share your stay experience.</p>
                      <button className="pd-btn-submit" onClick={() => navigate("/login", { state: { from: location.pathname } })} style={{ background: '#003580', padding: '12px', borderRadius: '12px' }}>Login</button>
                    </div>
                  )}
                </div>

                {/* SIDEBAR FEEDBACK (STAY) */}
                <div className="res-reviews-sidebar" style={{ background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid rgba(0, 53, 128, 0.1)', marginTop: '24px' }}>
                  <h2 className="pd-section-title" style={{ marginBottom: '20px', fontSize: '1.4rem' }}>Guest Feedback</h2>
                  <div className="reviews-list-compact" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }}>
                    {reviews.length > 0 ? reviews.map((r, i) => (
                      <div key={i} style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #f1f5f9', marginBottom: '12px' }}>
                        <div className="review-header" style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                          <div className="review-avatar" style={{ width: 32, height: 32, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={14} color="#003580" /></div>
                          <div className="review-meta"><h4 style={{ margin: 0, color: '#1e293b', fontWeight: 800, fontSize: '0.85rem' }}>{r.user_name || "Guest"}</h4><div style={{ display: 'flex', gap: 1 }}>{[1,2,3,4,5].map(star => <Star key={star} size={8} fill={star <= r.rating ? "#FFD700" : "none"} color="#FFD700" />)}</div></div>
                          <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                        <p style={{ color: '#475569', lineHeight: 1.5, margin: 0, fontSize: '0.85rem' }}>{r.comment}</p>
                      </div>
                    )) : (<div className="res-menu-empty"><p>No reviews yet.</p></div>)}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
    </div>
  );
};

export default PlaceDetailsStay;
