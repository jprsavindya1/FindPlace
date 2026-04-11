import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../apiConfig";
import AgodaSearchForm from "../components/AgodaSearchForm";
import PlaceCard from "../components/PlaceCard";
import SkeletonCard from "../components/SkeletonCard";
import "./CategoryPage.css";

const CategoryPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);
  
  const scrollRefs = {
    popular: useRef(null),
    featured: useRef(null),
    topRated: useRef(null)
  };

  const categoryMetadata = {
    Hotel: {
      title: "Hotels",
      subtitle: "Find the perfect hotel for your next stay",
      image: "/categories/hotel.png",
      description: "From luxury resorts to boutique stays, explore the best hotels curated just for you."
    },
    Resort: {
      title: "Resorts",
      subtitle: "Discover the finest luxury experiences",
      image: "/categories/resort.png",
      description: "Escape to paradise with our handpicked selection of premium resorts and tropical getaways."
    },
    Villa: {
      title: "Villas",
      subtitle: "Luxury and privacy in every corner",
      image: "/categories/villa.png",
      description: "Spacious, private, and breathtaking. Find your perfect villa getaway."
    },
    Cabana: {
      title: "Cabanas",
      subtitle: "Cozy escapes by the waves",
      image: "/categories/cabana.png",
      description: "Experience the tropical charm of beachfront cabanas and rustic escapes."
    },
    "Boarding House": {
      title: "Boarding Houses",
      subtitle: "Comfortable stays that feel like home",
      image: "/categories/boarding_house.png",
      description: "Affordable, clean, and welcoming boarding houses for your long or short stays."
    }
  };

  const faqData = {
    Hotel: [
      { q: "How do I find cheap hotels on FindPlace?", a: "You can find affordable hotels by using our 'Sort by: Price' filter on the search results page or looking for the 'Budget' tag on listings." },
      { q: "How do I search for a hotel on FindPlace?", a: "Simply use the search bar above, enter your destination and dates, and we'll show you all available hotels in that area." },
      { q: "Where can I find hotel deals on FindPlace?", a: "Deals are highlighted with a special 'Deal' badge. You can also filter by 'Special Offers' in the sidebar." },
      { q: "How do I find cheap last minute hotels on FindPlace?", a: "Last minute deals are usually posted within 48 hours of the stay date. Keep an eye on our 'Today's Top Deals' section." },
      { q: "How many hotels are listed on FindPlace?", a: "We have thousands of hotels listed across Sri Lanka, from luxury resorts to cozy boutique stays." },
      { q: "Why can I trust FindPlace's hotel reviews?", a: "All our reviews come from verified guests who have actually stayed at the property, ensuring authentic feedback." }
    ],
    Resort: [
      { q: "How do I find the best resorts nearby?", a: "Use the location search to find luxury spots in your area and sort by 'Rating' to see the community favorites." },
      { q: "Do resorts include all-inclusive packages?", a: "Many of our partner resorts offer all-inclusive deals including meals and activities. Look for the 'All-Inclusive' tag." },
      { q: "Are there family-friendly resorts available?", a: "Absolutely! You can filter your search by 'Family Friendly' to find resorts with kids' clubs and family suites." },
      { q: "How do reviews work for resorts?", a: "Guests can leave detailed ratings and photos after their stay, helping you choose the perfect escape." }
    ],
    Villa: [
      { q: "Are villas private on FindPlace?", a: "Yes, villas listed as 'Private Villa' offer exclusive access to the entire property for you and your group." },
      { q: "Do villas come with a private pool?", a: "Many of our luxury villas include private pools. Use the 'Amenities' filter to find exactly what you need." },
      { q: "Is there a minimum stay for villas?", a: "Minimum stays vary by owner, typically ranging from 1 to 3 nights. Check the 'House Rules' section of the listing." }
    ],
    Cabana: [
      { q: "Are cabanas usually beachfront?", a: "Most of our cabanas are located right on the beach or within walking distance of the shore." },
      { q: "What amenities are included in a cabana?", a: "While rustic, most include essentials like Wi-Fi, fans/AC, and private bathrooms. Details are on each listing." }
    ],
    "Boarding House": [
      { q: "How long can I stay in a boarding house?", a: "Boarding houses are great for both short-term visits and long-term stays. Monthly rates are often available." },
      { q: "Are utilities included in the price?", a: "Usually, water and electricity are included, but it's best to confirm with the owner via the contact details provided." }
    ]
  };

  const currentFaqs = faqData[type] || faqData["Hotel"];

  const trendingDestinations = [
    { name: "Colombo", image: "/destinations/colombo.png", count: "1,240+ properties" },
    { name: "Kandy", image: "/destinations/kandy.png", count: "850+ properties" },
    { name: "Galle", image: "/destinations/galle.png", count: "620+ properties" },
    { name: "Nuwara Eliya", image: "/destinations/nuwara_eliya.png", count: "410+ properties" },
    { name: "Ella", image: "/destinations/ella.png", count: "320+ properties" },
    { name: "Sigiriya", image: "/destinations/sigiriya.png", count: "210+ properties" },
    { name: "Mirissa", image: "/destinations/mirissa.png", count: "180+ properties" },
    { name: "Bentota", image: "/destinations/bentota.png", count: "150+ properties" }
  ];

  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?q=80&w=1000&auto=format&fit=crop"; // High-quality fallback
    e.target.onerror = null;
  };

  const categoryFeatures = {
    hotel: [
      { name: "Infinity Pool", icon: "fa-water", desc: "Relax in our crystal clear rooftop pools." },
      { name: "Luxury Spa", icon: "fa-spa", desc: "World-class wellness and massage treatments." },
      { name: "Gourmet Buffet", icon: "fa-utensils", desc: "International cuisines prepared by top chefs." },
      { name: "24/7 Concierge", icon: "fa-bell", desc: "Always here to help with your every need." }
    ],
    resort: [
      { name: "Private Beach", icon: "fa-umbrella-beach", desc: "Enjoy exclusive access to pristine sandy shores." },
      { name: "Wellness Center", icon: "fa-spa", desc: "Rejuvenate with world-class spa and yoga sessions." },
      { name: "Luxury Suites", icon: "fa-bed", desc: "Experience comfort in our high-end designer rooms." },
      { name: "Exotic Excursions", icon: "fa-map-marked-alt", desc: "Tailored adventure tours and local exploration." }
    ],
    villa: [
      { name: "Private Pool", icon: "fa-swimming-pool", desc: "Complete privacy for you and your family." },
      { name: "Personal Chef", icon: "fa-user-tie", desc: "Exquisite meals tailored to your taste buds." },
      { name: "Garden BBQ", icon: "fa-fire", desc: "Perfect for evening gatherings and parties." },
      { name: "Ocean View", icon: "fa-mountain", desc: "Breathtaking views right from your balcony." }
    ],
    cabana: [
      { name: "Beach Access", icon: "fa-umbrella-beach", desc: "Step out of your room directly onto the sand." },
      { name: "Surf Lessons", icon: "fa-water", desc: "Learn to ride the waves with pro instructors." },
      { name: "Hammock Zone", icon: "fa-couch", desc: "The ultimate spot for a relaxed afternoon nap." },
      { name: "Evening Bonfire", icon: "fa-fire-alt", desc: "Gather around the fire for a magical night." }
    ],
    boardinghouse: [
      { name: "Affordable", icon: "fa-wallet", desc: "Best value for long-term student stays." },
      { name: "Safe & Secure", icon: "fa-shield-alt", desc: "24/7 security for your peace of mind." },
      { name: "Study Area", icon: "fa-graduation-cap", desc: "Quiet spaces designed for focused learning." },
      { name: "Shared Kitchen", icon: "fa-cookie-bite", desc: "Fully equipped kitchen for your convenience." }
    ]
  };

  const currentFeatures = categoryFeatures[type.toLowerCase()] || categoryFeatures.hotel;


  const handleDestinationClick = (district) => {
    navigate(`/search?category=${type}&district=${district}`);
  };

  const meta = categoryMetadata[type] || {
    title: type + "s",
    subtitle: `Explore best ${type}s`,
    image: "/categories/hotel.png",
    description: "Discover amazing places to stay and visit."
  };

  useEffect(() => {
    const fetchCategoryPlaces = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/places/find-places?category=${type}`);
        // Sort by id desc for "Featured/New"
        setPlaces(response.data);
      } catch (error) {
        console.error("Error fetching category places:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryPlaces();
    window.scrollTo(0, 0);
  }, [type]);

  const scroll = (direction, ref) => {
    if (ref.current) {
      const { scrollLeft, clientWidth } = ref.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      ref.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const handleSearch = (queryParams) => {
    navigate(`/search${queryParams}`);
  };

  // Mock data for specialized sections (in a real app, these would be separate API calls)
  const topRated = [...places].sort((a, b) => b.rating - a.rating).slice(0, 8);
  const featured = [...places].slice(0, 8); // Just the first few

  return (
    <div className="category-page">
      {/* HERO SECTION */}
      <section className="category-hero" style={{ backgroundImage: `url(${meta.image})` }}>
        <div className="category-hero-overlay"></div>
        <div className="category-hero-content">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="category-hero-title">Find the perfect {type} on FindPlace</h1>
            <p className="category-hero-subtitle">{meta.description}</p>
          </motion.div>
          
          <div className="category-search-container">
            <AgodaSearchForm onSearch={handleSearch} initialCategory={type} />
          </div>
        </div>
      </section>

      <div className="category-container">
        {/* TRUST SECTION */}
        <section className="trust-section">
          <div className="trust-item">
            <div className="trust-icon-wrapper">
              <i className="fas fa-tags trust-icon"></i>
            </div>
            <div className="trust-content">
              <h3>Best Price Guarantee</h3>
              <p>Find a lower price? We'll match it and give you more.</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-wrapper">
              <i className="fas fa-shield-alt trust-icon"></i>
            </div>
            <div className="trust-content">
              <h3>100% Secure Payments</h3>
              <p>Your transactions are protected by industry-leading security.</p>
            </div>
          </div>
          <div className="trust-item">
            <div className="trust-icon-wrapper">
              <i className="fas fa-headset trust-icon"></i>
            </div>
            <div className="trust-content">
              <h3>24/7 Customer Support</h3>
              <p>Our dedicated team is ready to assist you anytime, anywhere.</p>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="features-section">
          <div className="section-header">
            <h2 className="section-title">Explore {type} Features</h2>
            <p className="section-subtitle">Specially curated amenities for a perfect {type.toLowerCase()} experience</p>
          </div>
          <div className="features-grid">
            {currentFeatures.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  <i className={`fas ${feature.icon}`}></i>
                </div>
                <h3>{feature.name}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>


        {/* TRENDING DESTINATIONS SECTION */}
        <section className="trending-section">
          <div className="section-header">
            <h2 className="trending-title">Trending destinations for {type.toLowerCase()}s</h2>
            <p className="trending-subtitle">Most popular places to stay in {type.toLowerCase()}s right now</p>
          </div>
          
          <div className="destinations-grid">
            {trendingDestinations.map((dest, index) => (
              <div 
                key={index} 
                className="destination-card"
                onClick={() => handleDestinationClick(dest.name)}
              >
                <div className="destination-image-wrapper">
                  <img 
                    src={dest.image} 
                    alt={dest.name} 
                    className="destination-image" 
                    onError={handleImageError}
                  />
                  <div className="destination-overlay"></div>
                </div>

                <div className="destination-info">
                  <h3>{dest.name}</h3>
                  <p>{dest.count}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="faq-section">
          <h2 className="faq-main-title">FAQs about {type.toLowerCase()}s on FindPlace</h2>
          
          <div className="faq-grid">
            {/* Split FAQs into two columns */}
            <div className="faq-column">
              {currentFaqs.slice(0, Math.ceil(currentFaqs.length / 2)).map((faq, index) => (
                <div 
                  key={index} 
                  className={`faq-item ${openFaq === index ? 'open' : ''}`}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="faq-question">
                    <span>{faq.q}</span>
                    <i className={`fas fa-chevron-down chevron-icon`}></i>
                  </div>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="faq-answer"
                      >
                        <p>{faq.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            
            <div className="faq-column">
              {currentFaqs.slice(Math.ceil(currentFaqs.length / 2)).map((faq, index) => {
                const globalIndex = index + Math.ceil(currentFaqs.length / 2);
                return (
                  <div 
                    key={globalIndex} 
                    className={`faq-item ${openFaq === globalIndex ? 'open' : ''}`}
                    onClick={() => setOpenFaq(openFaq === globalIndex ? null : globalIndex)}
                  >
                    <div className="faq-question">
                      <span>{faq.q}</span>
                      <i className={`fas fa-chevron-down chevron-icon`}></i>
                    </div>
                    <AnimatePresence>
                      {openFaq === globalIndex && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="faq-answer"
                        >
                          <p>{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CategoryPage;
