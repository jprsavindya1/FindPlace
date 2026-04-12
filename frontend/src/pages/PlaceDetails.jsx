import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import BookingProofCard from "../components/BookingProofCard";
import { API_BASE_URL } from "../apiConfig";
import { differenceInDays, addDays, eachDayOfInterval } from "date-fns";
import PaymentModal from "../components/PaymentModal";
import Room360Modal from "../components/Room360Modal";
import PlaceDetailsDining from "./PlaceDetailsDining";
import PlaceDetailsStay from "./PlaceDetailsStay";
import "./PlaceDetails.css";

function PlaceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [amenities, setAmenities] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [tables, setTables] = useState([]);
  const [gallery, setGallery] = useState([]);

  // Common States (Reviews, Favorites)
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState("");
  const [reviewMsg, setReviewMsg] = useState("");
  const [isPostingReview, setIsPostingReview] = useState(false);

  // Dining States
  const [resDate, setResDate] = useState(null);
  const [resTime, setResTime] = useState("");
  const [resGuests, setResGuests] = useState(2);
  const [resTable, setResTable] = useState("");
  const [wantsPreOrder, setWantsPreOrder] = useState(false);
  const [preOrderQuantities, setPreOrderQuantities] = useState({});

  // Stay States
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [numRooms, setNumRooms] = useState(1);
  const [selectedRoom, setSelectedRoom] = useState("");
  const [bookedDates, setBookedDates] = useState([]);
  const [occupancy, setOccupancy] = useState({});
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [identity, setIdentity] = useState("");
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [selected360Image, setSelected360Image] = useState(null);
  const [selectedRoomLabel, setSelectedRoomLabel] = useState("");

  // Booking & UI States
  const [isBooking, setIsBooking] = useState(false);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [bookingMsg, setBookingMsg] = useState("");
  const [currentProof, setCurrentProof] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState(null);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Breakfast");

  // Helper to format date without timezone shift
  const formatDate = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // Initial Fetching
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/places/${id}`).then(res => res.json()).then(data => {
      setPlace(data); 
      setLoading(false);
      // Set default category based on place type
      if (data.type === 'dine') {
        setActiveCategory("Main Course");
      } else {
        setActiveCategory("Breakfast");
      }
 })
      .catch(() => { setLoading(false); });

    axios.get(`${API_BASE_URL}/api/places/${id}/amenities`).then(res => setAmenities(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/api/menu/place/${id}`).then(res => setMenuItems(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/api/rooms/place/${id}`).then(res => setRooms(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/api/tables/place/${id}`).then(res => setTables(res.data)).catch(console.error);
    axios.get(`${API_BASE_URL}/api/places/${id}/gallery`).then(res => setGallery(res.data)).catch(console.error);
    
    // Summary & Initial Reviews
    Promise.all([
      fetch(`${API_BASE_URL}/api/reviews/place/${id}`),
      fetch(`${API_BASE_URL}/api/reviews/summary/${id}`)
    ]).then(async ([listRes, summaryRes]) => {
      const listData = await listRes.json();
      const summaryData = await summaryRes.json();
      setReviews(Array.isArray(listData) ? listData : []);
      setTotalReviews(Number(summaryData?.totalReviews || 0));
      setAvgRating(Number(summaryData?.avgRating || 4.8));
    }).catch(console.error);

    if (token && role === "customer") {
      axios.get(`${API_BASE_URL}/api/favorites/check/${id}`, { headers: { Authorization: `Bearer ${token}` } })
           .then(res => setIsFavorite(res.data.isFavorite)).catch(console.error);
    }
  }, [id, token, role]);

  // Stay specific: Fetch booked dates
  useEffect(() => {
    if (selectedRoom) {
      axios.get(`${API_BASE_URL}/api/bookings/place/${id}/room/${selectedRoom}/dates`)
           .then(res => setBookedDates(res.data)).catch(console.error);
    }
  }, [selectedRoom, id]);

  const disabledDates = useMemo(() => {
    let dates = [];
    bookedDates.forEach(b => {
      try { dates = [...dates, ...eachDayOfInterval({ start: new Date(b.check_in), end: new Date(b.check_out) })]; } catch {}
    });
    return dates;
  }, [bookedDates]);

  // Pre-fill user info
  useEffect(() => {
    setFullName(localStorage.getItem("userName") || "");
    setEmail(localStorage.getItem("userEmail") || "");
    setPhone(localStorage.getItem("userPhone") || "");
  }, []);

  // Shared Actions
  const toggleFavorite = async () => {
    if (!token || role !== "customer") {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setIsLiking(true);
    try {
      if (isFavorite) {
        await axios.delete(`${API_BASE_URL}/api/favorites/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        setIsFavorite(false);
      } else {
        await axios.post(`${API_BASE_URL}/api/favorites`, { placeId: id }, { headers: { Authorization: `Bearer ${token}` } });
        setIsFavorite(true);
      }
    } catch { console.error("Favorite toggle failed"); } finally { setIsLiking(false); }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    setIsPostingReview(true);
    try {
      await axios.post(`${API_BASE_URL}/api/reviews`, { place_id: Number(id), rating: myRating, comment: myComment }, { headers: { Authorization: `Bearer ${token}` } });
      const listRes = await fetch(`${API_BASE_URL}/api/reviews/place/${id}`);
      setReviews(await listRes.json());
      setMyComment(""); setMyRating(5);
    } catch { setReviewMsg("❌ Failed to add review"); } finally { setIsPostingReview(false); }
  };

  // Dining Logic Wrapper
  const handleDinnerBookingSubmit = async (e) => {
    e.preventDefault();
    if (!token) return navigate("/login", { state: { from: location.pathname } });
    setIsBooking(true);
    try {
      const formattedDate = formatDate(resDate);
      const res = await axios.post(`${API_BASE_URL}/api/reservations`, {
        place_id: place.id, customer_name: fullName, customer_email: email, customer_phone: phone,
        res_date: formattedDate, res_time: resTime, people_count: resGuests,
        table_id: resTable, food_order_items: wantsPreOrder ? JSON.stringify(preOrderQuantities) : null
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCurrentProof({ ...res.data, place_name: place.name, res_date: formattedDate, res_time: resTime, people_count: resGuests, customer_name: fullName, customer_phone: phone });
      setResDate(null); setResTime(""); setResGuests(2);
    } catch (err) { 
      const errMsg = err.response?.data?.message || "Reservation failed. Please try again.";
      alert(errMsg); 
    } finally { setIsBooking(false); }
  };

  // Stay Logic Wrapper
  const handleBookingSubmit = async (e, paymentMethod = 'ONLINE') => {
    if (e) e.preventDefault();
    if (!token) return navigate("/login", { state: { from: location.pathname } });
    const nightsCount = differenceInDays(checkOut, checkIn);
    const room = rooms.find(r => String(r.id) === String(selectedRoom));
    const finalPrice = nightsCount * (room?.price || 0);

    // ✅ Match Backend snake_case expectation
    const bookingData = { 
      place_id: Number(id), 
      room_id: Number(selectedRoom), 
      check_in: formatDate(checkIn), 
      check_out: formatDate(checkOut), 
      full_name: fullName, 
      email, 
      phone, 
      identity, 
      adults: Number(adults),
      children: Number(children),
      num_rooms: Number(numRooms),
      total_price: finalPrice, 
      payment_method: paymentMethod 
    };

    if (paymentMethod === 'ONLINE') { 
      setPendingBookingData(bookingData); 
      setIsPaymentModalOpen(true); 
    } else {
      // Direct booking for Pay at Hotel
      setIsBooking(true);
      try {
        const res = await axios.post(`${API_BASE_URL}/api/bookings`, { 
          ...bookingData, 
          payment_status: 'UNPAID',
          payment_method: 'CASH_AT_HOTEL'
        }, { headers: { Authorization: `Bearer ${token}` } });
        setCurrentProof({ ...res.data, place_name: place.name, check_in: bookingData.check_in, check_out: bookingData.check_out, total_price: bookingData.total_price, customer_name: fullName });
        setCheckIn(null); setCheckOut(null); setSelectedRoom("");
      } catch { alert("Booking failed. Please try again."); } finally { setIsBooking(false); }
    }
  };

  const confirmPaidBooking = async (paymentResult) => {
    setIsBooking(true);
    try {
      const payload = { 
        ...pendingBookingData, 
        payment_status: 'PAID',
        payment_method: paymentResult?.method || 'ONLINE',
        transaction_id: paymentResult?.transaction_id || null
      };
      const res = await axios.post(`${API_BASE_URL}/api/bookings`, payload, { headers: { Authorization: `Bearer ${token}` } });
      setCurrentProof({ 
        ...res.data, 
        place_name: place.name, 
        check_in: pendingBookingData.check_in, 
        check_out: pendingBookingData.check_out, 
        total_price: pendingBookingData.total_price, 
        customer_name: fullName 
      });
      setCheckIn(null); setCheckOut(null); setSelectedRoom("");
    } catch { alert("Booking failed after payment"); } finally { setIsBooking(false); setIsPaymentModalOpen(false); }
  };

  if (loading) return <div className="place-details"><p style={{padding: 100, textAlign: 'center'}}>Loading...</p></div>;
  if (!place) return <div className="place-details"><p style={{padding: 100, textAlign: 'center'}}>Place not found</p></div>;

  const sharedProps = {
    place, id, token, role, navigate, location, API_BASE_URL,
    reviews, avgRating, totalReviews, toggleFavorite, isFavorite, isLiking,
    handleAddReview, myRating, setMyRating, myComment, setMyComment, reviewMsg, isPostingReview,
    activeCategory, setActiveCategory, showAllMenu, setShowAllMenu, menuItems, filteredMenu: menuItems.filter(i => i.category === activeCategory),
    setCurrentProof, gallery
  };

  return (
    <>
      {createPortal(
        <AnimatePresence>
          {currentProof && <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}><BookingProofCard booking={currentProof} onClose={() => setCurrentProof(null)} /></div>}
        </AnimatePresence>,
        document.body
      )}

      {place.type === 'dine' ? (
        <PlaceDetailsDining 
          {...sharedProps} resDate={resDate} setResDate={setResDate} resTime={resTime} setResTime={setResTime}
          resGuests={resGuests} setResGuests={setResGuests} resTable={resTable} setResTable={setResTable} tables={tables}
          wantsPreOrder={wantsPreOrder} setWantsPreOrder={setWantsPreOrder} preOrderQuantities={preOrderQuantities}
          updatePreOrderQty={(itemId, delta) => setPreOrderQuantities(prev => {
            const next = { ...prev, [itemId]: (prev[itemId] || 0) + delta };
            if (next[itemId] <= 0) delete next[itemId];
            return next;
          })}
          handleDinnerBookingSubmit={handleDinnerBookingSubmit} isBooking={isBooking}
          fullName={fullName} setFullName={setFullName} email={email} setEmail={setEmail} phone={phone} setPhone={setPhone}
          avgRating={avgRating} totalReviews={totalReviews}
        />
      ) : (
        <PlaceDetailsStay 
          {...sharedProps} amenities={amenities} rooms={rooms} selectedRoom={selectedRoom} setSelectedRoom={setSelectedRoom}
          showAllRooms={showAllRooms} setShowAllRooms={setShowAllRooms} checkIn={checkIn} setCheckIn={setCheckIn}
          checkOut={checkOut} setCheckOut={setCheckOut} bookedDates={bookedDates} disabledDates={disabledDates}
          occupancy={occupancy} fullName={fullName} setFullName={setFullName} email={email} setEmail={setEmail}
          phone={phone} setPhone={setPhone} identity={identity} setIdentity={setIdentity}
          isBooking={isBooking} handleBookingSubmit={handleBookingSubmit} addDays={addDays}
          setIs360ModalOpen={setIs360ModalOpen} setSelected360Image={setSelected360Image} setSelectedRoomLabel={setSelectedRoomLabel}
          numRooms={numRooms} setNumRooms={setNumRooms} adults={adults} setAdults={setAdults} children={children} setChildren={setChildren}
          nights={differenceInDays(checkOut || new Date(), checkIn || new Date())}
          totalPrice={differenceInDays(checkOut || new Date(), checkIn || new Date()) * (rooms.find(r => String(r.id) === String(selectedRoom))?.price || 0) * numRooms}
        />
      )}

      <Room360Modal isOpen={is360ModalOpen} onClose={() => setIs360ModalOpen(false)} roomLabel={selectedRoomLabel} image360={selected360Image} />
      <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} onPaymentSuccess={confirmPaidBooking} amount={pendingBookingData?.total_price || 0} bookingData={pendingBookingData} />
    </>
  );
}

export default PlaceDetails;
