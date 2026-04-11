import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../apiConfig';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  ChevronDown, 
  SortAsc,
  LayoutGrid,
  List,
  AlertCircle,
  Loader2
} from 'lucide-react';
import AgodaSearchForm from '../components/AgodaSearchForm';
import StaySearchForm from '../components/StaySearchForm';
import SearchSidebar from '../components/SearchSidebar';
import PlaceSearchResult from '../components/PlaceSearchResult';
import SkeletonCard from '../components/SkeletonCard';
import './SearchResultsPage.css';

const SearchResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // State
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [sortBy, setSortBy] = useState('our-picks');
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(parseInt(queryParams.get('page')) || 1);

  // Filters State
  const [filters, setFilters] = useState({
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || '',
    category: queryParams.get('category') || '',
    stars: queryParams.get('stars') ? parseInt(queryParams.get('stars')) : null,
    wifi: queryParams.get('wifi') === 'true',
    ac: queryParams.get('ac') === 'true',
    pool: queryParams.get('pool') === 'true',
    parking: queryParams.get('parking') === 'true',
    breakfast: queryParams.get('breakfast') === 'true',
    district: queryParams.get('district') || '',
    province: queryParams.get('province') || '',
    area: queryParams.get('area') || '',
    keywords: queryParams.get('keywords') || ''
  });

  // Sync filters state with URL params
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    setFilters({
      minPrice: qp.get('minPrice') || '',
      maxPrice: qp.get('maxPrice') || '',
      category: qp.get('category') || '',
      stars: qp.get('stars') ? parseInt(qp.get('stars')) : null,
      wifi: qp.get('wifi') === 'true',
      ac: qp.get('ac') === 'true',
      pool: qp.get('pool') === 'true',
      parking: qp.get('parking') === 'true',
      breakfast: qp.get('breakfast') === 'true',
      district: qp.get('district') || '',
      province: qp.get('province') || '',
      area: qp.get('area') || '',
      keywords: qp.get('keywords') || ''
    });
    setCurrentPage(parseInt(qp.get('page')) || 1);
  }, [location.search]);

  // Fetch Results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query string from current filters and existing params
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('type', 'stay'); // ⭐ Force Stay Only
        searchParams.set('page', currentPage);
        searchParams.set('limit', '4');
        
        const finalUrl = `${API_BASE_URL}/api/places/find-places?${searchParams.toString()}`;
        console.log("[Search Debug] Fetching URL:", finalUrl);
        
        const response = await fetch(finalUrl);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || 'Failed to fetch search results');
        }
        
        const data = await response.json();
        console.log("[Search Debug] Received Data:", data);
        setResults(data.results || []);
        setTotalRecords(data.totalRecords || 0);
      } catch (err) {
        console.error("Search fetch error:", err);
        setError(err.message || "Something went wrong while searching. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [location.search]);

  // Derived sorted results
  const sortedResults = React.useMemo(() => {
    let sorted = [...results];
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => b.avg_rating - a.avg_rating);
    }
    return sorted;
  }, [results, sortBy]);

  // Handlers
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL query params
    const newParams = new URLSearchParams(location.search);
    if (value === null || value === '' || value === false) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    
    navigate(`/search?${newParams.toString()}`, { replace: true });
  };

  const handleClearFilters = () => {
    const resetFilters = {
      minPrice: '', maxPrice: '', category: '', stars: null,
      wifi: false, ac: false, pool: false, parking: false, breakfast: false
    };
    setFilters(prev => ({ ...prev, ...resetFilters }));
    
    // Clear relevant params from URL but keep location/keywords
    const newParams = new URLSearchParams(location.search);
    Object.keys(resetFilters).forEach(key => newParams.delete(key));
    navigate(`/search?${newParams.toString()}`, { replace: true });
  };

  const getSearchSummary = () => {
    const district = queryParams.get('district');
    const area = queryParams.get('area');
    const locationName = area || district || "Sri Lanka";
    return `${locationName}: ${totalRecords} properties found`;
  };

  const handlePageChange = (newPage) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('page', newPage);
    navigate(`/search?${newParams.toString()}`);
  };

  const totalPages = Math.ceil(totalRecords / 4);

  return (
    <div className="search-results-page">
      {/* Premium Hero Section */}
      <section className="results-hero-section">
        <div className="hero-overlay"></div>
        <div className="results-container hero-inner">
          <motion.div 
            className="hero-text-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="hero-badge-container">
               <span className="hero-category-badge">PREMIUM ACCOMMODATIONS</span>
            </div>
            <h1 className="hero-main-title">
              Find Your Perfect Stay {queryParams.get('area') ? `in ${queryParams.get('area')}` : 'in Sri Lanka'}
            </h1>
            <p className="hero-subtext">Discover extraordinary places for your next escape.</p>
          </motion.div>
        </div>

        {/* Floating search form moved outside hero-inner for perfect straddling */}
        <div className="hero-search-wrapper">
          <StaySearchForm 
            onSearch={(query) => navigate(`/search${query}`)} 
            initialCategory={filters.category}
          />
        </div>
      </section>

      <div className="results-container main-layout">
        <div className="breadcrumb-nav">
          Home &gt; Sri Lanka &gt; {queryParams.get('district') || 'Search results'}
        </div>

        <div className="search-layout">
          {/* Sidebar */}
          <SearchSidebar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onClearFilters={handleClearFilters}
          />

          {/* Main Content */}
          <main className="results-main">
            <header className="results-header">
              <div className="results-title-group">
                <h1 className="results-title">{getSearchSummary()}</h1>
                <div className="results-actions">
                  <div className="sort-dropdown" onClick={() => setSortBy(sortBy === 'price-low' ? 'our-picks' : 'price-low')}>
                    <SortAsc size={16} />
                    <span>Sort by: {sortBy === 'price-low' ? 'Lowest price first' : sortBy === 'rating' ? 'Best reviewed' : 'Our top picks'}</span>
                    <ChevronDown size={16} />
                  </div>
                  <div className="view-toggle">
                    <button 
                      className={viewMode === 'list' ? 'active' : ''} 
                      onClick={() => setViewMode('list')}
                    >
                      <List size={20} />
                    </button>
                    <button 
                      className={viewMode === 'grid' ? 'active' : ''} 
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs like Booking.com */}
              <div className="results-tabs">
                <button 
                  className={`tab-btn ${sortBy === 'our-picks' ? 'active' : ''}`}
                  onClick={() => setSortBy('our-picks')}
                >
                  Our top picks
                </button>
                <button 
                  className={`tab-btn ${sortBy === 'price-low' ? 'active' : ''}`}
                  onClick={() => setSortBy('price-low')}
                >
                  Price (lowest first)
                </button>
                <button 
                  className={`tab-btn ${sortBy === 'rating' ? 'active' : ''}`}
                  onClick={() => setSortBy('rating')}
                >
                  Best reviewed
                </button>
              </div>
            </header>

            <div className={`results-list ${viewMode}-view`}>
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : error ? (
                <div className="error-state">
                  <AlertCircle size={48} />
                  <h3>{error}</h3>
                  <button className="retry-btn" onClick={() => window.location.reload()}>Try Again</button>
                </div>
              ) : results.length === 0 ? (
                <div className="no-results-state">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="no-results-inner"
                  >
                    <div className="no-results-icon">🕵️</div>
                    <h2>No properties found</h2>
                    <p>Try adjusting your filters or searching in a different area.</p>
                    <button className="clear-filters-btn" onClick={handleClearFilters}>
                      Clear all filters
                    </button>
                  </motion.div>
                </div>
              ) : (
                <AnimatePresence>
                  {sortedResults.map((place) => (
                    <PlaceSearchResult 
                      key={place.id} 
                      place={place} 
                      viewMode={viewMode}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Pagination Implementation */}
            {!loading && totalPages > 1 && (
              <div className="pagination-container modern-pagination">
                <button 
                  className="page-nav-btn" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  &lt; Prev
                </button>
                
                <div className="page-numbers">
                  {[...Array(totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show current page, first, last, and one around current
                    if (
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          className={`page-number-btn ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 || 
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} className="page-dots">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button 
                  className="next-page-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next page &gt;
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
