import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../apiConfig";
import "./CustomerDashboard.css";
import PlaceCard from "../components/PlaceCard";
import SkeletonCard from "../components/SkeletonCard";
import Footer from "../components/Footer";


function CustomerDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [personalizedData, setPersonalizedData] = useState({ lastBooking: null, suggestions: [] });
  const [activeTrip, setActiveTrip] = useState(null);
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "Guest");
  const [places, setPlaces] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const scrollRef = useRef(null);
  const trendingScrollRef = useRef(null);
  const stayScrollRef = useRef(null);
  const diningScrollRef = useRef(null);

  const stayCategories = [
    { name: "Hotels", icon: "/categories/hotel.png", filter: "Hotel" },
    { name: "Resorts", icon: "/categories/resort.png", filter: "Resort" },
    { name: "Villas", icon: "/categories/villa.png", filter: "Villa" },
    { name: "Cabanas", icon: "/categories/cabana.png", filter: "Cabana" },
    { name: "Boarding Houses", icon: "/categories/boarding_house.png", filter: "Boarding House" },
  ];

  const diningCategories = [
    { name: "Sri Lankan", icon: "/explore/sri_lankan.png", filter: "Sri Lankan" },
    { name: "Italian", icon: "/explore/italian.png", filter: "Italian" },
    { name: "Chinese", icon: "/explore/chinese.png", filter: "Chinese" },
    { name: "Indian", icon: "/explore/indian.png", filter: "Indian" },
    { name: "Japanese", icon: "/explore/japanese.png", filter: "Japanese" },
    { name: "Fast Food", icon: "/explore/fast_food.png", filter: "Fast Food" },
    { name: "Seafood", icon: "/explore/seafood.png", filter: "Seafood" },
  ];

  const topFeatures = [
    {
      id: "stays",
      title: "STAYS",
      heading: "Find Your Perfect Room",
      btnText: "Book a Stay",
      image: "/explore/stays_hero.png?v=4",
      target: "/search"
    },
    {
      id: "dining",
      title: "DINING",
      heading: "Explore Culinary Wonders",
      btnText: "Book a Table",
      image: "/explore/dining_hero.png?v=4",
      target: "/dine"
    }
  ];

  const trendingDestinations = [
    { name: "Galle", district: "Galle", image: "/destinations/galle.png", size: "large" },
    { name: "Matara", district: "Matara", image: "/destinations/matara.png", size: "large" },
    { name: "Negombo", district: "Gampaha", image: "/destinations/negombo.png", size: "small" },
    { name: "Kandy", district: "Kandy", image: "/destinations/kandy.png", size: "small" },
    { name: "Mirissa", district: "Matara", image: "/destinations/mirissa.png", size: "small" }
  ];



  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const heroItemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  const scroll = (direction, ref = scrollRef) => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      ref.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const fetchPlaces = async (query = "") => {
    try {
      setLoading(true);
      if (query && query !== "?") setHasSearched(true);
      else setHasSearched(false);

      // If query contains lat and lng, use the nearby endpoint
      const isNearby = query.includes("lat=") && query.includes("lng=");
      const endpoint = isNearby ? "nearby" : "find-places";
      
      const res = await fetch(`${API_BASE_URL}/api/places/${endpoint}${query}`);
      const data = await res.json();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching places:", error);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryFilter, type = 'stay') => {
    if (type === 'dine') {
      navigate(`/dine?cuisine=${categoryFilter}`);
    } else {
      navigate(`/search?category=${categoryFilter}`);
    }
  };






  useEffect(() => {
    // Initial fetch from trending endpoint
    const fetchInitialPlaces = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/places/trending`);
        const data = await res.json();
        setPlaces(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error fetching initial places:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialPlaces();

    // Fetch recommendations safely
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${API_BASE_URL}/api/places/recommendations`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => setRecommended(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching recommendations:", err));

    // Fetch profile to ensure name and userId are current
    fetch(`${API_BASE_URL}/api/users/profile`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.name) {
          setUserName(data.name);
          localStorage.setItem("userName", data.name);
        }
        if (data.id) {
          localStorage.setItem("userId", data.id);
        }
      })
      .catch((err) => console.error("Error fetching profile:", err));

    // Fetch personalized dashboard data
    fetch(`${API_BASE_URL}/api/personalized/dashboard`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => setPersonalizedData(data))
      .catch((err) => console.error("Error fetching personalized data:", err));

    // ⭐ FETCH ACTIVE TRIP ITINERARY
    fetch(`${API_BASE_URL}/api/itinerary/latest`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
          if (data.success) {
              const trip = data.data;
              
              // LOGIC: Hide card if currrent date is past the trip's end date
              if (trip.baseDate && trip.dailyPlans) {
                  const baseDate = new Date(trip.baseDate);
                  const duration = trip.dailyPlans.length;
                  const endDate = new Date(baseDate);
                  endDate.setDate(baseDate.getDate() + duration);
                  
                  const today = new Date();
                  today.setHours(0,0,0,0); // compare only dates
                  
                  if (today <= endDate) {
                      setActiveTrip(trip);
                  } else {
                      console.log("Trip expired, hiding from active slot.");
                  }
              } else {
                  setActiveTrip(trip);
              }
          }
      })
      .catch((err) => console.warn("No active trip found."));

    // Add listener for storage changes
    const handleStorageChange = (e) => {
      if (e.key === "userName" && e.newValue) {
        console.log("[Dashboard] Name updated in another tab:", e.newValue);
        setUserName(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <div className="customer-page-wrapper">
      {/* LUNA THEME Animated Background Blobs */}
      <motion.div 
        className="luna-blob blob-1"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.15, 0.25, 0.15],
          x: [0, 50, 0],
          y: [0, 30, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="luna-blob blob-2"
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
          x: [0, -40, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div 
        className="luna-blob blob-3"
        animate={{ 
          scale: [1, 1.3, 1],
          opacity: [0.05, 0.15, 0.05],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      />

      {/* Floating Background Elements */}
      <motion.div 
        className="floating-depth-card fd-1"
        animate={{ y: [0, -20, 0], rotate: [5, 10, 5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="floating-depth-card fd-2"
        animate={{ y: [0, 15, 0], rotate: [-5, -12, -5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* ================= HERO SECTION ================= */}
      <section className="customer-hero" style={{ backgroundImage: "url('/explore/blended_hero.png?v=4')" }}>
        <motion.div 
          className="hero-text-container"
          variants={heroContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.span variants={heroItemVariants} className="hero-badge">
            Curated Stays. Premium Experience.
          </motion.span>
          
          <motion.h1 variants={heroItemVariants} className="modern-hero-heading">
            <span className="light-text">{token ? "Welcome back," : "Welcome to"}</span> <span className="premium-name-gradient">{token ? userName : "FindPlace"}</span>
            {token && (
              <motion.span 
                className="waving-hand"
                animate={{ rotate: [0, 20, 0, 20, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              > 👋</motion.span>
            )}
          </motion.h1>

          <motion.p variants={heroItemVariants} className="modern-hero-subheading">
            {token && (personalizedData.lastBooking || userName !== "Guest")
              ? "Ready for your next incredible adventure?" 
              : "Discover extraordinary places for your next escape."}
          </motion.p>
        </motion.div>
      </section>

      {/* ================= FEATURE CARDS SECTION ================= */}
      <section className="feature-cards-section">
        <div className="customer-container">
          <div className="feature-cards-grid">
            {topFeatures.map((feature) => (
              <motion.div 
                key={feature.id}
                className="feature-hero-card"
                style={{ backgroundImage: `url(${feature.image})` }}
                whileHover={{ y: -10 }}
                transition={{ type: "spring", stiffness: 300 }}
                onClick={() => {
                  navigate(feature.target);
                }}
              >
                <div className="feature-card-overlay"></div>
                <div className="feature-card-content">
                  <span className="feature-tag">{feature.title}</span>
                  <h2 className="feature-heading">{feature.heading}</h2>
                  <button className="feature-cta-btn">
                    {feature.btnText}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ⭐ ACTIVE TRIP SECTION ⭐ */}
          <AnimatePresence>
            {activeTrip && (
              <motion.div 
                className="active-trip-section"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="active-trip-card" onClick={() => navigate('/smart-planner')}>
                   <div className="active-trip-info">
                      <div className="trip-badge">ACTIVE TRIP ✨</div>
                      <h2>{activeTrip.tripTitle}</h2>
                      <p>Your AI-crafted journey is ready. Pick up where you left off!</p>
                      <div className="trip-meta">
                         <span>{activeTrip.dailyPlans.length} Days</span>
                         <span>•</span>
                         <span>{activeTrip.totalDistanceKm} km Total</span>
                      </div>
                   </div>
                   <div className="active-trip-visual">
                      <div className="pulse-icon">📍</div>
                      <button className="resume-btn">Resume Journey</button>
                   </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="need-place-text">Need a place? Check out our <span onClick={() => navigate('/search')}>Stays</span></p>
        </div>
      </section>

      {/* ================= EXPLORE STAYS ================= */}
      <section className="category-section explore-stays">
        <div className="customer-container">
          <div className="section-header modern-section-header">
            <div>
              <h2 className="section-title modern-section-title">Explore Places to Stay</h2>
            </div>
            <div className="scroll-controls">
              <button className="scroll-arrow-btn" onClick={() => scroll("left", stayScrollRef)}>←</button>
              <button className="scroll-arrow-btn" onClick={() => scroll("right", stayScrollRef)}>→</button>
            </div>
          </div>
          
          <div className="horizontal-scroll-container" ref={stayScrollRef}>
            <div className="horizontal-scroll-track">
              {stayCategories.map((cat, idx) => (
                <motion.div 
                  key={idx} 
                  className="category-card compact"
                  whileHover={{ y: -5 }}
                  onClick={() => handleCategoryClick(cat.filter, 'stay')}
                >
                  <div className="category-image">
                    <img src={cat.icon} alt={cat.name} />
                  </div>
                  <div className="category-info">
                    <h3>{cat.name}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= EXPLORE DINING ================= */}
      <section className="category-section explore-dining">
        <div className="customer-container">
          <div className="section-header modern-section-header">
            <div>
              <h2 className="section-title modern-section-title">Explore Dining Experiences</h2>
            </div>
            <div className="scroll-controls">
              <button className="scroll-arrow-btn" onClick={() => scroll("left", diningScrollRef)}>←</button>
              <button className="scroll-arrow-btn" onClick={() => scroll("right", diningScrollRef)}>→</button>
            </div>
          </div>
          
          <div className="horizontal-scroll-container" ref={diningScrollRef}>
            <div className="horizontal-scroll-track">
              {diningCategories.map((cat, idx) => (
                <motion.div 
                  key={idx} 
                  className="category-card compact"
                  whileHover={{ y: -5 }}
                  onClick={() => handleCategoryClick(cat.filter, 'dine')}
                >
                  <div className="category-image">
                    <img src={cat.icon} alt={cat.name} />
                  </div>
                  <div className="category-info">
                    <h3>{cat.name}</h3>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTENT CONTAINER ================= */}
      <div className="customer-container">

        <AnimatePresence mode="wait">
          {/* SEARCH RESULTS VIEW */}
          {hasSearched ? (
             <motion.div
               key="search-results"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
             >
               <div className="section-header modern-section-header">
                 <div>
                   <h2 className="section-title modern-section-title">Search Results</h2>
                   <p className="modern-section-subtitle">Based on your filters</p>
                 </div>
               </div>

               {loading ? (
                 <div className="customer-places-grid">
                   {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
                 </div>
               ) : places.length === 0 ? (
                 <div className="empty-state modern-empty-state">No places match your search criteria.</div>
               ) : (
                 <motion.div 
                   className="customer-places-grid"
                   variants={containerVariants}
                   initial="hidden"
                   animate="visible"
                 >
                   {places.map((place) => (
                     <motion.div key={place._id || place.id} variants={itemVariants}>
                       <PlaceCard place={place} />
                     </motion.div>
                   ))}
                 </motion.div>
               )}
             </motion.div>
          ) : (
            /* DEFAULT/EXPLORE VIEW */
            <motion.div
              key="default-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >

              {/* RECOMMENDED FOR YOU (AUTHENTICATED ONLY) */}
              {token && recommended.length > 0 && (
                <div style={{ position: "relative", zIndex: 10, marginTop: "20px" }}>
                  <div className="section-header modern-section-header">
                    <div>
                      <h2 className="section-title modern-section-title">Hand-picked for you</h2>
                      <p className="modern-section-subtitle">Based on your activity</p>
                    </div>
                  </div>
                  <div className="customer-places-grid">
                    {recommended.map((place) => (
                      <PlaceCard key={place._id || place.id} place={place} />
                    ))}
                  </div>
                </div>
              )}

              {/* ALL PLACES (TRENDING) */}
              <div className="trending-section" style={{ position: "relative", zIndex: 10, marginTop: "20px" }}>
                <div className="section-header modern-section-header">
                  <div>
                    <h2 className="section-title modern-section-title">Trending Destinations</h2>
                    <p className="modern-section-subtitle">Travelers searching for Sri Lanka also booked these</p>
                  </div>
                </div>

                <div className="trending-destinations-grid">
                  {trendingDestinations.map((dest, idx) => (
                    <motion.div 
                      key={idx}
                      className={`dest-card ${dest.size}`}
                      style={{ backgroundImage: `url(${dest.image})` }}
                      whileHover={{ scale: 1.02 }}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => navigate(`/search?district=${dest.district}`)}
                    >
                      <div className="dest-overlay"></div>
                      <div className="dest-info">
                        <span className="dest-name">{dest.name}</span>
                        <img src="https://flagcdn.com/w40/lk.png" alt="Sri Lanka Flag" className="dest-flag" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
        
      </div>
      <Footer />
    </div>

  );
}

export default CustomerDashboard;
