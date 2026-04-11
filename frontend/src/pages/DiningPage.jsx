import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { API_BASE_URL } from "../apiConfig";
import "./DiningPage.css";
import DiningSearchForm from "../components/DiningSearchForm";
import RestaurantCard from "../components/RestaurantCard";
import DiningSidebar from "../components/DiningSidebar";
import RestaurantResultCard from "../components/RestaurantResultCard";
import SkeletonCard from "../components/SkeletonCard";
import Footer from "../components/Footer";
import { 
  Utensils, 
  Award, 
  Clock, 
  Map as MapIcon, 
  ChevronRight, 
  SortAsc, 
  ChevronDown, 
  List, 
  LayoutGrid, 
  AlertCircle 
} from "lucide-react";

const cuisines = [
  { name: "Seafood", icon: "🦀", image: "/explore/beach_bar.png", count: "12+ Places" },
  { name: "Sri Lankan", icon: "🍛", image: "/explore/buffet.png", count: "45+ Places" },
  { name: "Fast Food", icon: "🍔", image: "/explore/cafe.png", count: "28+ Places" },
  { name: "Fine Dining", icon: "🥂", image: "/explore/fine_dining.png", count: "8+ Places" }
];

const ambienceOptions = [
  "All", "Rooftop Dining", "Beachfront", "Garden View", "Family Friendly", "Romantic", "Live Music"
];

function DiningPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  const [isSearching, setIsSearching] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeAmbience, setActiveAmbience] = useState("All");
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('our-picks');

  // Filters State (Synced with URL)
  const [filters, setFilters] = useState({
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || '',
    cuisine: queryParams.get('cuisine') || '',
    stars: queryParams.get('stars') ? parseInt(queryParams.get('stars')) : null,
    wifi: queryParams.get('wifi') === 'true',
    parking: queryParams.get('parking') === 'true',
    district: queryParams.get('district') || '',
    area: queryParams.get('area') || '',
    keywords: queryParams.get('keywords') || '',
    diningOption: queryParams.get('diningOption') || '',
    dietary: queryParams.get('dietary') || ''
  });

  const lastSearchRef = useRef("");

  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    const hasSearchParams = qp.has('keywords') || qp.has('district') || qp.has('area') || qp.has('cuisine') || qp.has('province') || qp.has('isNearby');
    setIsSearching(hasSearchParams);
    
    setFilters({
      minPrice: qp.get('minPrice') || '',
      maxPrice: qp.get('maxPrice') || '',
      cuisine: qp.get('cuisine') || '',
      stars: qp.get('stars') ? parseInt(qp.get('stars')) : null,
      wifi: qp.get('wifi') === 'true',
      parking: qp.get('parking') === 'true',
      district: qp.get('district') || '',
      area: qp.get('area') || '',
      keywords: qp.get('keywords') || '',
      diningOption: qp.get('diningOption') || '',
      dietary: qp.get('dietary') || ''
    });

    const currentSearch = location.search + activeAmbience;
    if (lastSearchRef.current !== currentSearch) {
      lastSearchRef.current = currentSearch;
      fetchRestaurants(hasSearchParams);
    }
  }, [location.search, activeAmbience]);

  const fetchRestaurants = async (isSearch = isSearching) => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams = new URLSearchParams(location.search);
      searchParams.set('type', 'dine'); // ⭐ Force Dine Only
      
      if (activeAmbience !== "All" && !isSearch) {
        searchParams.set('ambience', activeAmbience);
      }
      
      const res = await fetch(`${API_BASE_URL}/api/places/find-places?${searchParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch restaurants error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = useMemo(() => {
    let sorted = [...restaurants];
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => (a.price || 2500) - (b.price || 2500));
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => b.avg_rating - a.avg_rating);
    }
    return sorted;
  }, [restaurants, sortBy]);

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(location.search);
    if (!newParams.has('type')) newParams.set('type', 'dine');
    
    if (value === null || value === '' || value === false) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    navigate(`/dine?${newParams.toString()}`, { replace: true });
  };

  const handleClearFilters = () => {
    const newParams = new URLSearchParams();
    newParams.set('type', 'dine');
    if (queryParams.get('district')) newParams.set('district', queryParams.get('district'));
    navigate(`/dine?${newParams.toString()}`, { replace: true });
  };

  const getSearchSummary = () => {
    const district = queryParams.get('district');
    const area = queryParams.get('area');
    const cuisine = queryParams.get('cuisine');
    const locationName = area || district || "Sri Lanka";
    const cuisineText = cuisine ? `${cuisine} ` : "";
    return `${locationName}: ${restaurants.length} ${cuisineText}restaurants found`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="dining-page-wrapper">
      {/* ================= HERO SECTION ================= */}
      <section className="dining-hero" style={{ backgroundImage: "url('/explore/dining_hero.png')" }}>
        <div className="dining-hero-overlay"></div>
        <motion.div 
          className="dining-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="dining-badge">Premium Table Reservations</span>
          <h1>Find the Best Taste in Town</h1>
          <p>Book a table at top-rated restaurants, beachfront bars, and cozy cafes.</p>
        </motion.div>
      </section>

      {/* ================= SEARCH FORM ================= */}
      <div className="dining-search-form-wrapper">
        <DiningSearchForm onSearch={(query) => navigate(`/dine${query}`)} />
      </div>

      {/* ================= RESULTS VIEW (DEFAULT) ================= */}
      <div className="dining-container results-layout">
        <div className="breadcrumb-nav">
          Home > Sri Lanka > {queryParams.get('district') || 'Dining'}
        </div>

        <div className="search-layout">
          <DiningSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onClearFilters={handleClearFilters}
          />

          <main className="results-main">
            <header className="results-header">
              <div className="results-title-group">
                <h1 className="results-title">{getSearchSummary()}</h1>
                <div className="results-actions">
                  <div className="view-toggle">
                    <button className={viewMode === 'list' ? 'active' : ''} onClick={() => setViewMode('list')}><List size={20} /></button>
                    <button className={viewMode === 'grid' ? 'active' : ''} onClick={() => setViewMode('grid')}><LayoutGrid size={20} /></button>
                  </div>
                </div>
              </div>

              <div className="results-tabs">
                <button className={`tab-btn ${sortBy === 'our-picks' ? 'active' : ''}`} onClick={() => setSortBy('our-picks')}>Our top picks</button>
                <button className={`tab-btn ${sortBy === 'price-low' ? 'active' : ''}`} onClick={() => setSortBy('price-low')}>Price (lowest first)</button>
                <button className={`tab-btn ${sortBy === 'rating' ? 'active' : ''}`} onClick={() => setSortBy('rating')}>Best reviewed</button>
              </div>
            </header>

            <div className={`results-list ${viewMode}-view`}>
              {loading ? (
                <div className="restaurant-grid">
                  {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : error ? (
                <div className="error-state">
                  <AlertCircle size={48} />
                  <h3>{error}</h3>
                  <button className="retry-btn" onClick={() => fetchRestaurants()}>Try Again</button>
                </div>
              ) : restaurants.length === 0 ? (
                <div className="no-results-state">
                  <div className="no-results-icon">🍽️</div>
                  <h2>No restaurants found</h2>
                  <p>Try adjusting your filters or area.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {sortedResults.map((res) => (
                    <RestaurantResultCard key={res.id} restaurant={res} viewMode={viewMode} />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default DiningPage;
