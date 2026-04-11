import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE_URL } from "../apiConfig";
import {
  LayoutDashboard,
  Hotel,
  BedDouble,
  Utensils,
  CalendarCheck,
  TrendingUp,
  PlusCircle,
  Edit3,
  Trash2,
  Image as ImageIcon,
  MapPin,
  Upload,
  CheckCircle,
  Users,
  Plus,
  Minus,
  Maximize,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Coffee,
  FileText
} from "lucide-react";
import "./OwnerDashboard.css";
import OwnerBookings from "./OwnerBookings";
import OwnerRevenue from "./OwnerRevenue";
import OwnerReservations from "./OwnerReservations"; // ⭐ NEW component

/* ================= ANIMATION VARIANTS ================= */
const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

function OwnerDashboard() {
  const token = localStorage.getItem("token");

  const [activeTab, setActiveTab] = useState("places");
  const [businessType, setBusinessType] = useState(localStorage.getItem("businessType") || "accommodation");

  /* ================= PLACE STATES ================= */
  const [places, setPlaces] = useState([]);
  const [editingPlace, setEditingPlace] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]); // ⭐ NEW
  const [amenities, setAmenities] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [menuPdfFile, setMenuPdfFile] = useState(null);
  const [existingMenuPdf, setExistingMenuPdf] = useState(null);
  const [form, setForm] = useState({
    name: "", location: "", whatsapp: "", price: "",
    category: "", province: "", district: "", area: "",
    keywords: "", description: "", latitude: "", longitude: "",
    pets_allowed: false, smoking_allowed: false, extra_rules: "",
    type: businessType, // Sync with business type
    cuisine_type: "", table_capacity: "", opening_hours: "", closing_hours: ""
  });

  /* ================= MENU STATES ================= */
  const [menuPlaceId, setMenuPlaceId] = useState("");
  const [menus, setMenus] = useState([]);
  const [menuForm, setMenuForm] = useState({
    name: "", description: "", price: "", category: "",
    is_veg: false, is_special: false,
    spicy_level: "None", contains_alcohol: false, chefs_recommendation: false, prep_time: "", is_available: true
  });
  const [menuImage, setMenuImage] = useState(null);
  const [menuImagePreview, setMenuImagePreview] = useState(null);
  const [editingMenu, setEditingMenu] = useState(null);

  /* ================= ROOM STATES ================= */
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [roomPrice, setRoomPrice] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("");
  const [roomTotal, setRoomTotal] = useState("");
  const [selectedPlace, setSelectedPlace] = useState("");
  const [editingRoom, setEditingRoom] = useState(null);
  const [room360File, setRoom360File] = useState(null);
  const [roomImage, setRoomImage] = useState(null);

  /* ================= TABLE STATES ================= */
  const [tables, setTables] = useState([]);
  const [tableForm, setTableForm] = useState({ 
    table_no: "", capacity: "", status: "available",
    location_area: "Indoor", table_type: "Standard", min_capacity: 1, is_smoking: false, is_combineable: false
  });
  const [editingTable, setEditingTable] = useState(null);
  const [tablePlaceId, setTablePlaceId] = useState("");


  /* ================= DASHBOARD FILTER ================= */
  const [dashboardFilterPlaceId, setDashboardFilterPlaceId] = useState("ALL");
  
  const hasStay = places.some(p => p.type === 'stay');
  const hasDine = places.some(p => p.type === 'dine');

  /* ================= FETCH DATA ================= */
  const fetchOwnerPlaces = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/places/my`, {
        headers: { Authorization: "Bearer " + token },
      });
      setPlaces(res.data);
    } catch (err) {
      console.error("Fetch owner places failed", err);
    }
  };

  useEffect(() => {
    if (token) fetchOwnerPlaces();
  }, [token]);

  const handleQuickImageUpdate = async (placeId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);

    try {
      await axios.put(`${API_BASE_URL}/api/owner/places/${placeId}/image`, formData, {
        headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" }
      });
      alert("Cover image updated successfully! 🖼️");
      fetchOwnerPlaces();
    } catch (err) {
      console.error(err);
      alert("Failed to update cover image");
    }
  };

  const fetchPlaceGallery = async (placeId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/owner/places/${placeId}/gallery`);
      setExistingGallery(res.data);
    } catch (err) {
      console.error("Fetch gallery failed", err);
    }
  };

  const handleStartEdit = (place) => {
    setEditingPlace(place.id);
    setExistingMenuPdf(place.menu_pdf);
    setForm({
      name: place.name || "",
      location: place.location || "",
      whatsapp: place.whatsapp || "",
      price: place.price || "",
      category: place.category || "",
      province: place.province || "",
      district: place.district || "",
      area: place.area || "",
      keywords: place.keywords || "",
      description: place.description || "",
      latitude: place.latitude || "",
      longitude: place.longitude || "",
      pets_allowed: !!place.pets_allowed,
      smoking_allowed: !!place.smoking_allowed,
      extra_rules: place.extra_rules || "",
      type: place.type || businessType,
      cuisine_type: place.cuisine_type || "",
      table_capacity: place.table_capacity || "",
      opening_hours: place.opening_hours || "",
      closing_hours: place.closing_hours || ""
    });
    setSelectedAmenities(JSON.parse(place.amenities || "[]"));
    fetchPlaceGallery(place.id); // ⭐ NEW: Fetch existing gallery
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/amenities`)
      .then(res => setAmenities(res.data))
      .catch(err => console.error(err));
  }, []);

  /* ================= AUTO-SYNC SELECTION ================= */
  useEffect(() => {
    // If global filter is simplified to one place, update the sub-tabs automatically
    if (dashboardFilterPlaceId !== "ALL") {
      setSelectedPlace(dashboardFilterPlaceId);
      setMenuPlaceId(dashboardFilterPlaceId);
      setTablePlaceId(dashboardFilterPlaceId);
    } else if (places.length > 0) {
      if (!selectedPlace) setSelectedPlace(places[0].id);
      if (!menuPlaceId) setMenuPlaceId(places[0].id);
      if (!tablePlaceId) setTablePlaceId(places[0].id);
    }
  }, [dashboardFilterPlaceId, places]);

  /* ================= PLACE FUNCTIONS ================= */
  const handlePlaceChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const resetPlaceForm = () => {
    setForm({
      name: "", location: "", whatsapp: "", price: "",
      category: "", province: "", district: "", area: "",
      keywords: "", description: "", latitude: "", longitude: "",
      pets_allowed: false, smoking_allowed: false, extra_rules: "",
      type: businessType,
      cuisine_type: "", table_capacity: "", opening_hours: "", closing_hours: ""
    });
    setEditingPlace(null);
    setImageFile(null);
    setGalleryFiles([]);
    setExistingGallery([]); // ⭐ NEW
    setSelectedAmenities([]);
  };

  const handleAddPlace = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(form).forEach(key => formData.append(key, form[key]));
    formData.append("amenities", JSON.stringify(selectedAmenities));
    if (imageFile) formData.append("image", imageFile);
    Array.from(galleryFiles).forEach(file => formData.append("gallery", file));
    if (menuPdfFile) formData.append("menu_pdf", menuPdfFile);

    try {
      await axios.post(`${API_BASE_URL}/api/places/owner/places`, formData, {
        headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" }
      });
      alert("Property submitted for approval! ✨");
      resetPlaceForm();
      fetchOwnerPlaces();
    } catch (err) {
      console.error(err);
      alert("Failed to add property");
    }
  };

  const handleUpdatePlace = async (e) => {
    e.preventDefault();
    if (!editingPlace) return;

    try {
      // 1. Update text data (JSON)
      await axios.put(`${API_BASE_URL}/api/places/owner/places/${editingPlace}`, {
        ...form,
        amenities: selectedAmenities
      }, {
        headers: { Authorization: "Bearer " + token }
      });

      // 2. Update Image if selected
      if (imageFile) {
        const imgData = new FormData();
        imgData.append("image", imageFile);
        await axios.put(`${API_BASE_URL}/api/owner/places/${editingPlace}/image`, imgData, {
          headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" }
        });
      }

      // 3. Update Gallery if selected
      if (galleryFiles.length > 0) {
        const galData = new FormData();
        Array.from(galleryFiles).forEach(file => galData.append("gallery", file));
        await axios.put(`${API_BASE_URL}/api/owner/places/${editingPlace}/gallery`, galData, {
          headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" }
        });
      }

      // 4. Update Menu PDF if selected
      if (menuPdfFile) {
        const pdfData = new FormData();
        pdfData.append("menu_pdf", menuPdfFile);
        await axios.put(`${API_BASE_URL}/api/owner/places/${editingPlace}/menu-pdf`, pdfData, {
          headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" }
        });
      }

      alert("Property updated successfully! ✨");
      resetPlaceForm();
      fetchOwnerPlaces();
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message || "Unknown error";
      alert(`Failed to update property: ${errorMsg} ❌`);
    }
  };

  const handleDeletePlace = async (id) => {
    if (!window.confirm("Are you sure you want to delete this property?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/places/${id}`, {
        headers: { Authorization: "Bearer " + token }
      });
      fetchOwnerPlaces();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGalleryImage = async (imageId) => {
    if (!window.confirm("Remove this image from gallery?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/owner/gallery/${imageId}`, {
        headers: { Authorization: "Bearer " + token }
      });
      // Refresh existing gallery
      if (editingPlace) fetchPlaceGallery(editingPlace);
    } catch (err) {
      console.error(err);
      alert("Failed to delete gallery image");
    }
  };

  const handleRemoveCoverImage = async (placeId) => {
    if (!window.confirm("Remove cover image?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/owner/places/${placeId}/image`, {
        headers: { Authorization: "Bearer " + token }
      });
      alert("Cover image removed! 🖼️");
      fetchOwnerPlaces();
    } catch (err) {
      console.error(err);
      alert("Failed to remove cover image");
    }
  };

  /* ================= ROOM FUNCTIONS ================= */
  const fetchRooms = async () => {
    if (!selectedPlace) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/rooms/place/${selectedPlace}`);
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedPlace]);

  const handleRoom360FileChange = (e) => setRoom360File(e.target.files[0]);
  const handleRoomImageChange = (e) => setRoomImage(e.target.files[0]);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!selectedPlace) return alert("Please select a property first");

    const formData = new FormData();
    formData.append("place_id", selectedPlace);
    formData.append("name", roomName);
    formData.append("price", roomPrice);
    formData.append("total_rooms", roomTotal);
    formData.append("capacity", roomCapacity);
    formData.append("description", roomDescription);
    if (roomImage) formData.append("image", roomImage);
    if (room360File) formData.append("image_360", room360File);

    try {
      await axios.post(`${API_BASE_URL}/api/rooms`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Room added successfully ✨");
      setRoomName(""); setRoomPrice(""); setRoomDescription(""); setRoomCapacity(""); setRoomTotal("");
      setRoomImage(null); setRoom360File(null);
      fetchRooms();
    } catch (err) {
      console.error(err);
      alert("Failed to add room");
    }
  };

  const startEditRoom = (room) => {
    setEditingRoom(room.id);
    setRoomName(room.name);
    setRoomPrice(room.price);
    setRoomTotal(room.total_rooms || "");
    setRoomCapacity(room.capacity || "");
    setRoomDescription(room.description);
  };

  const handleUpdateRoom = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", roomName);
    formData.append("price", roomPrice);
    formData.append("total_rooms", roomTotal);
    formData.append("capacity", roomCapacity);
    formData.append("description", roomDescription);
    if (roomImage) formData.append("image", roomImage);
    if (room360File) formData.append("image_360", room360File);

    try {
      await axios.put(`${API_BASE_URL}/api/rooms/${editingRoom}`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Room updated successfully ✨");
      setEditingRoom(null); setRoomName(""); setRoomPrice(""); setRoomDescription(""); setRoomCapacity(""); setRoomTotal("");
      setRoomImage(null); setRoom360File(null);
      fetchRooms();
    } catch (err) {
      console.error(err);
      alert("Failed to update room");
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Delete this room type?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/rooms/${id}`);
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= DINING FUNCTIONS ================= */
  const fetchMenus = async (placeId) => {
    if (!placeId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/menu/place/${placeId}`);
      setMenus(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMenus(menuPlaceId);
  }, [menuPlaceId]);

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("place_id", menuPlaceId);
    formData.append("name", menuForm.name);
    formData.append("price", menuForm.price);
    formData.append("description", menuForm.description);
    formData.append("category", menuForm.category);
    formData.append("is_veg", menuForm.is_veg);
    formData.append("is_special", menuForm.is_special);
    formData.append("spicy_level", menuForm.spicy_level);
    formData.append("contains_alcohol", menuForm.contains_alcohol);
    formData.append("chefs_recommendation", menuForm.chefs_recommendation);
    formData.append("prep_time", menuForm.prep_time);
    formData.append("is_available", menuForm.is_available);
    if (menuImage) formData.append("image", menuImage);

    try {
      if (editingMenu) {
        await axios.put(`${API_BASE_URL}/api/menu/${editingMenu}`, formData, {
           headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" }
        });
        alert("Menu item updated! 🍲");
      } else {
        await axios.post(`${API_BASE_URL}/api/menu`, formData, {
           headers: { Authorization: "Bearer " + token, "Content-Type": "multipart/form-data" }
        });
        alert("Menu item added! 🥗");
      }
      setMenuForm({ 
        name: "", price: "", description: "", category: "", 
        is_veg: false, is_special: false, spicy_level: "None", 
        contains_alcohol: false, chefs_recommendation: false, prep_time: "", is_available: true 
      });
      setMenuImage(null);
      setMenuImagePreview(null);
      setEditingMenu(null);
      fetchMenus(menuPlaceId);
    } catch (err) {
      console.error(err);
      alert("Failed to save menu item");
    }
  };

  const startEditMenu = (item) => {
    setEditingMenu(item.id);
    setMenuForm({
      name: item.name,
      price: item.price,
      description: item.description || "",
      category: item.category || "",
      is_veg: !!item.is_veg,
      is_special: !!item.is_special,
      spicy_level: item.spicy_level || "None",
      contains_alcohol: !!item.contains_alcohol,
      chefs_recommendation: !!item.chefs_recommendation,
      prep_time: item.prep_time || "",
      is_available: item.is_available !== 0
    });
    setMenuImagePreview(item.image ? `${API_BASE_URL}/uploads/menu/${item.image}` : null);
  };

  /* ================= TABLE FUNCTIONS ================= */
  const fetchTables = async (placeId) => {
    if (!placeId) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tables/place/${placeId}`);
      setTables(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchTables(tablePlaceId); }, [tablePlaceId]);

  const handleTableSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await axios.put(`${API_BASE_URL}/api/tables/${editingTable}`, tableForm, { headers: { Authorization: "Bearer " + token } });
        alert("Table updated! 🪑");
      } else {
        await axios.post(`${API_BASE_URL}/api/tables`, { ...tableForm, place_id: tablePlaceId }, { headers: { Authorization: "Bearer " + token } });
        alert("Table added! 🪑");
      }
      setTableForm({ 
        table_no: "", capacity: "", status: "available",
        location_area: "Indoor", table_type: "Standard", min_capacity: 1, is_smoking: false, is_combineable: false
      });
      setEditingTable(null);
      fetchTables(tablePlaceId);
    } catch (err) { alert("Failed to save table"); }
  };

  const startEditTable = (t) => {
    setEditingTable(t.id);
    setTableForm({ 
      table_no: t.table_no, capacity: t.capacity, status: t.status,
      location_area: t.location_area || "Indoor",
      table_type: t.table_type || "Standard",
      min_capacity: t.min_capacity || 1,
      is_smoking: !!t.is_smoking,
      is_combineable: !!t.is_combineable
    });
  };

  const handleUpdateTableStatus = async (id, newStatus) => {
    try {
       await axios.put(`${API_BASE_URL}/api/tables/${id}`, { status: newStatus }, { headers: { Authorization: "Bearer " + token } });
       fetchTables(tablePlaceId);
    } catch (err) { console.error(err); }
  };
  
  const renderPlacesTab = () => (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" exit="hidden" key="places">
      <motion.div variants={fadeUp} className="content-header">
        <h2>Property Management</h2>
        <p>Add, edit, and manage your luxury properties securely.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="dashboard-card shadow-premium">
        <h3 className="card-title-navy">
          {editingPlace ? `Update ${businessType === 'dining' ? 'Restaurant' : 'Property'}` : `Add New ${businessType === 'dining' ? 'Restaurant' : 'Property'}`}
        </h3>
        <form onSubmit={editingPlace ? handleUpdatePlace : handleAddPlace} className="owner-form">
          <div className="form-group full-width">
            <label>{businessType === 'dining' ? 'RESTAURANT NAME' : 'PROPERTY NAME'}</label>
            <input name="name" type="text" placeholder={businessType === 'dining' ? 'e.g. Blue Lagoon Resto' : 'e.g. Ocean View Boarding'} value={form.name} onChange={handlePlaceChange} required />
          </div>
          
          <div className="form-row-multi">
             <div className="form-group">
                <label>{businessType === 'dining' ? 'RESTAURANT TYPE' : 'CATEGORY'}</label>
                <select className="glass-select" name="category" value={form.category} onChange={handlePlaceChange} required>
                  <option value="">Select Category</option>
                  {businessType === 'dining' ? (
                    <>
                      <option value="Fine Dining">Fine Dining</option>
                      <option value="Cafe">Cafe</option>
                      <option value="Fast Food">Fast Food</option>
                      <option value="Family Restaurant">Family Restaurant</option>
                      <option value="Pub/Bar">Pub/Bar</option>
                    </>
                  ) : (
                    <>
                      <option value="Hotel">Hotel</option>
                      <option value="Villa">Villa</option>
                      <option value="Cabana">Cabana</option>
                      <option value="Resort">Resort</option>
                      <option value="Boarding House">Boarding House</option>
                    </>
                  )}
                </select>
             </div>
             <div className="form-group">
                <label>{businessType === 'dining' ? 'AVG. PRICE / PERSON (RS.)' : 'BASE PRICE / NIGHT (RS.)'}</label>
                <input name="price" type="text" inputMode="decimal" placeholder={businessType === 'dining' ? "1500" : "4500"} value={form.price} onChange={handlePlaceChange} required />
             </div>
          </div>

          {businessType === 'dining' && (
            <div className="form-row-multi">
               <div className="form-group">
                  <label>CUISINE TYPE</label>
                  <select className="glass-select" name="cuisine_type" value={form.cuisine_type} onChange={handlePlaceChange} required>
                    <option value="">Select Cuisine</option>
                    <option value="Sri Lankan">Sri Lankan</option>
                    <option value="Italian">Italian</option>
                    <option value="Chinese">Chinese</option>
                    <option value="Indian">Indian</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Fast Food">Fast Food</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Other">Other / International</option>
                  </select>
               </div>
               <div className="form-group">
                  <label>TOTAL TABLE CAPACITY</label>
                  <input name="table_capacity" type="number" placeholder="50" value={form.table_capacity} onChange={handlePlaceChange} required />
               </div>
            </div>
          )}

          {businessType === 'dining' && (
            <div className="form-row-multi">
               <div className="form-group">
                  <label>OPENING HOURS</label>
                  <input name="opening_hours" type="time" value={form.opening_hours} onChange={handlePlaceChange} required />
               </div>
               <div className="form-group">
                  <label>CLOSING HOURS</label>
                  <input name="closing_hours" type="time" value={form.closing_hours} onChange={handlePlaceChange} required />
               </div>
            </div>
          )}

          <div className="form-row-multi">
            <div className="form-group">
              <label>PROVINCE</label>
              <input name="province" type="text" placeholder="Western" value={form.province} onChange={handlePlaceChange} required />
            </div>
            <div className="form-group">
              <label>DISTRICT</label>
              <input name="district" type="text" placeholder="Colombo" value={form.district} onChange={handlePlaceChange} required />
            </div>
          </div>
          
          <div className="form-group full-width">
            <label>LOCATION ADDRESS</label>
            <input name="location" type="text" placeholder="No. 12, Galle Road, Colombo" value={form.location} onChange={handlePlaceChange} required />
          </div>

          <div className="form-group full-width">
             <label>{businessType === 'dining' ? 'RESTAURANT COVER IMAGE' : 'PROPERTY IMAGE'}</label>
             <div className="upload-wrapper glass-input">
                <input type="file" onChange={(e) => setImageFile(e.target.files[0])} />
                <ImageIcon size={20} color="#003580" />
             </div>
             {editingPlace && places.find(p => p.id === editingPlace)?.image && (
               <div className="existing-image-management" style={{ marginTop: '10px' }}>
                 <p className="helper-text">Current Cover Image:</p>
                 <div style={{ position: 'relative', width: 'fit-content' }}>
                   <img 
                    src={`${API_BASE_URL}/uploads/places/${places.find(p => p.id === editingPlace).image}`} 
                    alt="Current cover" 
                    style={{ width: '120px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} 
                   />
                   <button 
                    type="button" 
                    className="btn-delete-mini" 
                    title="Remove Cover"
                    onClick={() => handleRemoveCoverImage(editingPlace)}
                    style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                   >
                     <Trash2 size={12} />
                   </button>
                 </div>
               </div>
             )}
          </div>

          <div className="form-group full-width">
             <label>GALLERY IMAGES {editingPlace ? '(ADD MORE)' : '(UP TO 10)'}</label>
             <div className="upload-wrapper glass-input">
                <input type="file" multiple onChange={(e) => setGalleryFiles(e.target.files)} />
                <Upload size={20} color="#003580" />
             </div>
             
             {/* ⭐ NEW: Existing Gallery Management */}
             {editingPlace && existingGallery.length > 0 && (
               <div className="existing-gallery-management" style={{ marginTop: '15px' }}>
                 <p className="helper-text" style={{ marginBottom: '8px', fontWeight: 'bold' }}>Current Gallery:</p>
                 <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                   {existingGallery.map(img => (
                     <div key={img.id} style={{ position: 'relative' }}>
                       <img 
                        src={`${API_BASE_URL}/uploads/places/${img.image_path}`} 
                        alt="Gallery item" 
                        style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }} 
                       />
                       <button 
                        type="button" 
                        title="Delete from Gallery"
                        onClick={() => handleDeleteGalleryImage(img.id)}
                        style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,255,255,0.9)', color: '#ef4444', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                       >
                         <Trash2 size={14} />
                       </button>
                     </div>
                   ))}
                 </div>
               </div>
             )}

             {galleryFiles.length > 0 && (
               <div className="new-uploads-list" style={{ display: 'flex', gap: '8px', marginTop: '15px', flexWrap: 'wrap' }}>
                 <p className="helper-text" style={{ flexBasis: '100%', marginBottom: '4px' }}>Queueing to upload:</p>
                 {Array.from(galleryFiles).map((f, i) => (
                   <div key={i} style={{ padding: '4px 10px', background: '#e0e7ff', borderRadius: '8px', fontSize: '11px', color: '#3730a3', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                     <CheckCircle size={10} /> {f.name}
                   </div>
                 ))}
               </div>
             )}
          </div>

          {businessType === 'dining' && (
            <div className="form-group full-width" style={{ marginTop: '20px' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '800' }}>
                 <FileText size={18} /> FULL MENU (PDF)
               </label>
               <div className="pdf-upload-container-premium" style={{ 
                 background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,250,252,0.8))',
                 border: '2px dashed #cbd5e1',
                 borderRadius: '20px',
                 padding: '24px',
                 marginTop: '10px',
                 textAlign: 'center',
                 transition: 'all 0.3s ease'
               }}>
                  <div className="upload-wrapper glass-input" style={{ marginBottom: '12px' }}>
                     <input type="file" accept="application/pdf" onChange={(e) => setMenuPdfFile(e.target.files[0])} />
                     <Upload size={20} color="#003580" />
                  </div>
                  
                  {menuPdfFile ? (
                    <p className="helper-text" style={{color: '#059669', fontWeight: '700', fontSize: '0.9rem'}}>
                      Selected: {menuPdfFile.name} (Ready to upload)
                    </p>
                  ) : existingMenuPdf ? (
                    <div style={{ background: 'white', padding: '8px 16px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid #e2e8f0' }}>
                      <CheckCircle size={14} color="#10b981" />
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Current: {existingMenuPdf}</span>
                    </div>
                  ) : (
                    <p className="helper-text" style={{ color: '#64748b' }}>
                      Drag & drop your full menu PDF here or click to browse.
                    </p>
                  )}
                  
                  <p className="helper-text" style={{ marginTop: '12px', fontSize: '0.75rem', fontStyle: 'italic' }}>
                    Guests will see a "View Full PDF Menu" button on your restaurant page.
                  </p>
               </div>
            </div>
          )}

          <div className="form-group full-width">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary">
              <PlusCircle size={18}/> {editingPlace ? "Update Details" : "Publish Now"}
            </motion.button>
            {editingPlace && (
              <button type="button" className="btn-secondary" style={{marginTop:'12px'}} onClick={resetPlaceForm}>Cancel Editing</button>
            )}
          </div>
        </form>
      </motion.div>

      <motion.div variants={fadeUp} className="places-list-container">
         <h3 className="section-title-navy">Registered Properties</h3>
         <div className="places-grid">
           {places.map(place => (
             <motion.div key={place.id} className="item-card premium-card" whileHover={{ y: -8 }}>
               <div className="card-image-wrapper">
                 {place.image ? (
                   <img src={`${API_BASE_URL}/uploads/places/${place.image}`} alt={place.name} className="item-image" />
                 ) : (
                   <div className="item-image-placeholder">
                      <ImageIcon size={48} color="rgba(0,0,0,0.1)"/>
                   </div>
                 )}
                 <div className={`status-badge-overlay ${place.status?.toLowerCase()}`}>
                    {place.status || 'Pending'}
                 </div>
               </div>
               
               <div className="item-content">
                 <h4 className="item-title-navy">{place.name}</h4>
                 <p className="item-location-muted"><MapPin size={14}/> {place.location}</p>
                 <p className="item-price-premium">Rs. {Number(place.price).toLocaleString()}</p>
               </div>

               <div className="item-card-actions">
                  <button className="btn-edit-premium" onClick={()=>handleStartEdit(place)}>
                    <Edit3 size={16}/> Edit
                  </button>
                  <button className="btn-delete-premium" onClick={()=>handleDeletePlace(place.id)}>
                    <Trash2 size={16}/> Delete
                  </button>
               </div>
             </motion.div>
           ))}
         </div>
      </motion.div>
    </motion.div>
  );

  const renderRoomsTab = () => (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" exit="hidden" key="rooms">
       <motion.div variants={fadeUp} className="content-header">
        <h2>Room Configuration</h2>
        <p>Manage pricing, occupancy, and 360° virtual tours for your rooms.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="dashboard-card shadow-premium">
        <h3>{editingRoom ? "Edit Room Type" : "Add New Room Type"}</h3>
        <form onSubmit={editingRoom ? handleUpdateRoom : handleAddRoom} className="owner-form">
          <div className="form-group full-width">
            <label>ASSOCIATED PROPERTY</label>
            <select className="glass-select" value={selectedPlace} onChange={(e)=>setSelectedPlace(e.target.value)} required>
              <option value="">Select a property</option>
              {places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group"><label>ROOM NAME / TITLE</label><input type="text" placeholder="e.g. Deluxe Double Room" value={roomName} onChange={(e)=>setRoomName(e.target.value)} required /></div>
          <div className="form-group"><label>PRICE / NIGHT (RS.)</label><input type="text" inputMode="decimal" placeholder="2500" value={roomPrice} onChange={(e)=>setRoomPrice(e.target.value)} required /></div>
          <div className="form-group"><label>MAX OCCUPANCY (PERSONS)</label><input type="text" inputMode="numeric" placeholder="2" value={roomCapacity} onChange={(e)=>setRoomCapacity(e.target.value)} required /></div>
          <div className="form-group"><label>TOTAL ROOMS OF THIS TYPE</label><input type="text" inputMode="numeric" placeholder="5" value={roomTotal} onChange={(e)=>setRoomTotal(e.target.value)} required /></div>
          <div className="form-group full-width"><label>DESCRIPTION</label><textarea placeholder="Room specifics, view, bed types..." value={roomDescription} onChange={(e)=>setRoomDescription(e.target.value)} /></div>
          
          <div className="form-group full-width">
            <label>PRIMARY ROOM PHOTO (NORMAL VIEW)</label>
            <div className="upload-wrapper glass-input">
              <input type="file" onChange={handleRoomImageChange} />
              <ImageIcon size={20} color="#003580" />
            </div>
            <p className="helper-text">This photo will be displayed as the main room thumbnail.</p>
          </div>

          <div className="form-group full-width">
            <label>360° VIRTUAL TOUR IMAGE (EQUIRECTANGULAR)</label>
            <div className="upload-wrapper glass-input">
              <input type="file" onChange={handleRoom360FileChange} />
              <Maximize size={20} color="#003580" />
            </div>
            <p className="helper-text">Upload a high-quality panoramic image for an immersive experience.</p>
          </div>
          
          <div className="form-group full-width">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary">
              <CheckCircle size={18}/> {editingRoom ? "Confirm Changes" : "Create Room Type"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {selectedPlace && (
        <motion.div variants={fadeUp} className="rooms-grid">
           {rooms.map(room => (
              <motion.div key={room.id} className="room-card-premium" whileHover={{ y: -8 }}>
                 <div className="room-card-image-top">
                    {room.image ? (
                       <img src={`${API_BASE_URL}/uploads/rooms/${room.image}`} alt="Room View" className="room-preview-large" />
                    ) : room.image_360 ? (
                       <img src={`${API_BASE_URL}/uploads/rooms/${room.image_360}`} alt="Room View" className="room-preview-large" />
                    ) : (
                       <div className="room-image-placeholder-large">
                          <BedDouble size={48} color="rgba(0,0,0,0.1)"/>
                       </div>
                    )}
                    <div className="room-actions-overlay">
                       <button className="room-action-mini edit" title="Edit Room" onClick={()=>startEditRoom(room)}><Edit3 size={14}/></button>
                       <button className="room-action-mini delete" title="Delete Room" onClick={()=>handleDeleteRoom(room.id)}><Trash2 size={14}/></button>
                    </div>
                 </div>
                 <div className="room-card-body-enhanced">
                    <h4 className="room-title-premium">{room.name}</h4>
                    <p className="room-price-premium">Rs. {Number(room.price).toLocaleString()} <span>/night</span></p>
                    <div className="room-tags-wrapper">
                       <span className="room-tag-slate occupancy"><Users size={12}/> {room.capacity} Persons</span>
                       {room.image_360 && <span className="room-tag-slate tour"><Maximize size={12}/> 360° Ready</span>}
                    </div>
                 </div>
              </motion.div>
           ))}
        </motion.div>
      )}
    </motion.div>
  );

  const renderDiningTab = () => (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" exit="hidden" key="dining">
      <motion.div variants={fadeUp} className="content-header">
        <h2>Dining & Menu</h2>
        <p>Showcase your culinary offerings and special menus to your guests.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="dashboard-card shadow-premium">
        <div className="card-header-flex">
          <h3 className="card-title-navy">{editingMenu ? "Edit Dish" : "Add Menu Item"}</h3>
          {editingMenu && <button className="btn-text-only" onClick={() => {
            setEditingMenu(null); 
            setMenuForm({
              name:"", price:"", description:"", category:"", is_veg:false, is_special:false, 
              spicy_level:"None", contains_alcohol:false, chefs_recommendation:false, prep_time:"", is_available:true
            });
            setMenuImage(null); setMenuImagePreview(null);
          }}>Cancel Edit</button>}
        </div>
        <form onSubmit={handleMenuSubmit} className="owner-form">
          <div className="form-group full-width">
            <label>SWITCH PROPERTY</label>
            <select className="glass-select" value={menuPlaceId} onChange={(e)=>setMenuPlaceId(e.target.value)} required>
              <option value="">Select a property</option>
              {places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="form-group full-width">
            <label>DISH NAME <span className="req">*</span></label>
            <input type="text" placeholder="e.g. Seafood Pasta" value={menuForm.name} onChange={(e)=>setMenuForm({...menuForm, name:e.target.value})} required />
          </div>

          <div className="form-group full-width">
             <label>DESCRIPTION</label>
             <textarea placeholder="e.g. Spicy pasta with fresh shrimp, garlic, and herbs." rows="2" value={menuForm.description} onChange={(e)=>setMenuForm({...menuForm, description:e.target.value})}></textarea>
          </div>

          <div className="form-row-multi">
             <div className="form-group">
                <label>PRICE (RS.) <span className="req">*</span></label>
                <input type="text" inputMode="decimal" placeholder="1200" value={menuForm.price} onChange={(e)=>setMenuForm({...menuForm, price:e.target.value})} required />
             </div>
             <div className="form-group">
                <label>CATEGORY <span className="req">*</span></label>
                <select className="glass-select" value={menuForm.category} onChange={(e)=>setMenuForm({...menuForm, category:e.target.value})} required>
                  <option value="">Select Category</option>
                  <option value="Appetizers">Appetizers</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                </select>
             </div>
          </div>

          <div className="form-row-multi">
             <div className="form-group">
                <label>PREPARATION TIME</label>
                <input type="text" placeholder="e.g. 15-20 mins" value={menuForm.prep_time} onChange={(e)=>setMenuForm({...menuForm, prep_time:e.target.value})} />
             </div>
             <div className="form-group">
                <label>SPICY LEVEL</label>
                <select className="glass-select" value={menuForm.spicy_level} onChange={(e)=>setMenuForm({...menuForm, spicy_level:e.target.value})}>
                  <option value="None">None</option>
                  <option value="Mild">Mild 🌶️</option>
                  <option value="Medium">Medium 🌶️🌶️</option>
                  <option value="Extra Hot">Extra Hot 🌶️🌶️🌶️</option>
                </select>
             </div>
          </div>

          <div className="form-group full-width">
             <label style={{marginBottom: "10px", display: "block"}}>FOOD TAGS & STATUS</label>
             <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <label className="checkbox-label" style={{margin: 0, padding: "8px 12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0"}}>
                   <input type="checkbox" checked={menuForm.is_veg} onChange={(e)=>setMenuForm({...menuForm, is_veg: e.target.checked})} />
                   <span style={{fontWeight: 600}}>Vegetarian</span>
                </label>
                <label className="checkbox-label" style={{margin: 0, padding: "8px 12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0"}}>
                   <input type="checkbox" checked={menuForm.is_special} onChange={(e)=>setMenuForm({...menuForm, is_special: e.target.checked})} />
                   <span style={{fontWeight: 600}}>Today's Special ⭐</span>
                </label>
                <label className="checkbox-label" style={{margin: 0, padding: "8px 12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0"}}>
                   <input type="checkbox" checked={menuForm.chefs_recommendation} onChange={(e)=>setMenuForm({...menuForm, chefs_recommendation: e.target.checked})} />
                   <span style={{fontWeight: 600}}>Chef's Pick 👨‍🍳</span>
                </label>
                <label className="checkbox-label" style={{margin: 0, padding: "8px 12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0"}}>
                   <input type="checkbox" checked={menuForm.contains_alcohol} onChange={(e)=>setMenuForm({...menuForm, contains_alcohol: e.target.checked})} />
                   <span style={{fontWeight: 600}}>Contains Alcohol 🍷</span>
                </label>
                
                <div style={{ flexBasis: '100%', height: '1px', background: 'rgba(0,0,0,0.05)', margin: '5px 0' }}></div>
                
                <label className="checkbox-label" style={{margin: 0, padding: "8px 12px", background: menuForm.is_available ? "#dcfce7" : "#fee2e2", borderRadius: "8px", color: menuForm.is_available ? "#166534" : "#991b1b", border: `1px solid ${menuForm.is_available ? "#bbf7d0" : "#fecaca"}`}}>
                   <input type="checkbox" checked={menuForm.is_available} onChange={(e)=>setMenuForm({...menuForm, is_available: e.target.checked})} />
                   <span style={{fontWeight: 700}}>{menuForm.is_available ? "Available Today ✅" : "Out of Stock ❌"}</span>
                </label>
             </div>
          </div>

          <div className="form-group full-width">
             <label>{editingMenu ? "CHANGE IMAGE (OPTIONAL)" : "DISH IMAGE"}</label>
             <div style={{display: 'flex', gap: '20px', alignItems: 'center'}}>
               <div className="upload-wrapper glass-input" style={{flex: 1}}>
                  <input type="file" onChange={(e)=>{
                    const file = e.target.files[0];
                    setMenuImage(file);
                    if(file) setMenuImagePreview(URL.createObjectURL(file));
                  }} />
                  <ImageIcon size={20} color="#003580" />
               </div>
               {menuImagePreview && (
                 <div style={{width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc', flexShrink: 0}}>
                    <img src={menuImagePreview} alt="Preview" style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                 </div>
               )}
             </div>
          </div>
          
          <div className="form-group full-width">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn-primary">
               {editingMenu ? <CheckCircle size={18}/> : <PlusCircle size={18}/>} {editingMenu ? "Update Item" : "Save Item"}
            </motion.button>
          </div>
        </form>
      </motion.div>

      {menuPlaceId && (
        <motion.div variants={fadeUp} className="menu-grid-premium">
           {menus.map(item => (
              <motion.div key={item.id} className="menu-card-premium" whileHover={{ y: -8 }} style={{ opacity: item.is_available === 0 ? 0.65 : 1 }}>
                 <div className="menu-card-image-box" style={{ filter: item.is_available === 0 ? 'grayscale(80%)' : 'none' }}>
                    {item.image ? (
                       <img src={`${API_BASE_URL}/uploads/menu/${item.image}`} alt={item.name} className="menu-preview-img" />
                    ) : (
                       <div className="menu-placeholder-box">
                          <Utensils size={40} color="rgba(0,0,0,0.1)"/>
                       </div>
                    )}
                    <div className="menu-actions-overlay">
                       <button className="menu-action-btn edit" title="Edit Item" onClick={()=>startEditMenu(item)}><Edit3 size={14}/></button>
                       <button className="menu-action-btn delete" title="Delete Item" onClick={async () => {
                          if(window.confirm("Delete this menu item?")) {
                             await axios.delete(`${API_BASE_URL}/api/menu/${item.id}`, { headers: { Authorization: "Bearer " + token } });
                             fetchMenus(menuPlaceId);
                          }
                       }}><Trash2 size={14}/></button>
                    </div>
                 </div>
                 <div className="menu-card-content">
                    <div className="menu-tags" style={{display:'flex', gap:'5px', flexWrap:'wrap', marginBottom:'8px'}}>
                       {item.is_veg ? <span className="tag-veg" style={{fontSize:'10px', background:'#e6fffa', color:'#2c7a7b', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold'}}>VEG</span> : <span className="tag-nonveg" style={{fontSize:'10px', background:'#fff5f5', color:'#c53030', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold'}}>NON-VEG</span>}
                       {item.is_special ? <span className="tag-special" style={{fontSize:'10px', background:'#fffaf0', color:'#b7791f', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold', border:'1px solid #fbd38d'}}>SPECIAL ⭐</span> : null}
                       {item.chefs_recommendation ? <span style={{fontSize:'10px', background:'#f0fdf4', color:'#166534', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold', border:'1px solid #bbf7d0'}}>CHEF'S PICK 👨‍🍳</span> : null}
                       {item.contains_alcohol ? <span style={{fontSize:'10px', background:'#f3e8ff', color:'#6b21a8', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold'}}>ALCOHOL 🍷</span> : null}
                       {item.spicy_level && item.spicy_level !== "None" ? <span style={{fontSize:'10px', background:'#fef2f2', color:'#991b1b', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold'}}>{item.spicy_level.toUpperCase()} 🌶️</span> : null}
                       {item.is_available === 0 ? <span style={{fontSize:'10px', background:'#fee2e2', color:'#991b1b', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold'}}>OUT OF STOCK</span> : null}
                    </div>
                    <h4 className="menu-title-navy">{item.name}</h4>
                    <p className="menu-price-gold">
                       Rs. {Number(item.price).toLocaleString()} 
                       {item.category && <span style={{fontSize:'11px', color:'#64748b', fontWeight:'normal', marginLeft:'6px'}}>{item.category}</span>}
                    </p>
                    {item.prep_time && <p style={{fontSize:'11px', color:'#ef4444', fontWeight:'600', marginBottom:'4px'}}>⏱️ {item.prep_time}</p>}
                    <p className="menu-desc-muted">{item.description}</p>
                 </div>
              </motion.div>
           ))}
        </motion.div>
      )}
    </motion.div>
  );

  const renderTablesTab = () => (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" exit="hidden" key="tables">
      <motion.div variants={fadeUp} className="content-header">
        <h2>Table Management</h2>
        <p>Define your restaurant floor plan and manage table availability in real-time.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="dashboard-card shadow-premium table-form-card">
           <h3 className="card-title-navy" style={{marginBottom:'20px'}}>{editingTable ? "Edit Table" : "Add New Table"}</h3>
           <form onSubmit={handleTableSubmit} className="owner-form">
              <div className="form-group full-width">
                 <label>SELECT RESTAURANT</label>
                 <select className="glass-select" value={tablePlaceId} onChange={(e)=>setTablePlaceId(e.target.value)} required>
                    <option value="">Select Restaurant</option>
                    {places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'15px'}}>
                 <div className="form-group">
                   <label>TABLE NO / NAME</label>
                   <input type="text" placeholder="e.g. T-01" value={tableForm.table_no} onChange={(e)=>setTableForm({...tableForm, table_no:e.target.value})} required/>
                 </div>
                 <div className="form-group">
                   <label>MAX CAPACITY</label>
                   <input type="number" placeholder="4" value={tableForm.capacity} onChange={(e)=>setTableForm({...tableForm, capacity:e.target.value})} required/>
                 </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'15px'}}>
                 <div className="form-group">
                    <label>MIN PEOPLE</label>
                    <input type="number" placeholder="1" value={tableForm.min_capacity} onChange={(e)=>setTableForm({...tableForm, min_capacity:e.target.value})} />
                 </div>
                 <div className="form-group">
                    <label>INITIAL STATUS</label>
                    <select className="glass-select" value={tableForm.status} onChange={(e)=>setTableForm({...tableForm, status:e.target.value})}>
                       <option value="available">Available</option>
                       <option value="occupied">Occupied</option>
                       <option value="maintenance">Maintenance</option>
                    </select>
                 </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'15px', marginTop:'15px'}}>
                 <div className="form-group">
                    <label>LOCATION / AREA</label>
                    <select className="glass-select" value={tableForm.location_area} onChange={(e)=>setTableForm({...tableForm, location_area:e.target.value})}>
                       <option value="Indoor">Indoor</option>
                       <option value="Rooftop">Rooftop</option>
                       <option value="Balcony">Balcony</option>
                       <option value="Poolside">Poolside</option>
                       <option value="Garden">Garden</option>
                    </select>
                 </div>
                 <div className="form-group">
                    <label>TABLE TYPE</label>
                    <select className="glass-select" value={tableForm.table_type} onChange={(e)=>setTableForm({...tableForm, table_type:e.target.value})}>
                       <option value="Standard">Standard</option>
                       <option value="Booth">Booth</option>
                       <option value="Bar Table">Bar Table</option>
                       <option value="Outdoor">Outdoor</option>
                    </select>
                 </div>
              </div>

              <div className="form-group full-width" style={{marginTop:'20px'}}>
                 <label style={{marginBottom: "10px", display: "block"}}>TABLE SETTINGS</label>
                 <div style={{ display: 'flex', gap: '15px', background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <label className="checkbox-label" style={{margin: 0, flex: 1, padding: "8px 12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0"}}>
                       <input type="checkbox" checked={tableForm.is_smoking} onChange={(e)=>setTableForm({...tableForm, is_smoking: e.target.checked})} />
                       <span style={{fontWeight: 600}}>Smoking 🚬</span>
                    </label>
                    <label className="checkbox-label" style={{margin: 0, flex: 1, padding: "8px 12px", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0"}}>
                       <input type="checkbox" checked={tableForm.is_combineable} onChange={(e)=>setTableForm({...tableForm, is_combineable: e.target.checked})} />
                       <span style={{fontWeight: 600}}>Combineable 🔗</span>
                    </label>
                 </div>
              </div>

              <button type="submit" className="btn-primary full-width" style={{marginTop:'25px'}}>{editingTable ? "Update Table" : "Add Table"}</button>
              {editingTable && <button type="button" className="btn-secondary full-width" style={{marginTop:'10px'}} onClick={()=>{
                 setEditingTable(null); 
                 setTableForm({ table_no:"", capacity:"", status:"available", location_area: "Indoor", table_type: "Standard", min_capacity: 1, is_smoking: false, is_combineable: false });
              }}>Cancel Editing</button>}
           </form>
        </motion.div>

        {/* Right Panel: Current Tables Grid */}
        <motion.div variants={fadeUp}>
           <h3 className="section-title-navy" style={{marginBottom:'20px'}}>Current Tables</h3>
           {tables.length === 0 ? (
              <p style={{color:'#718096'}}>No tables added yet. Create your floor plan.</p>
           ) : (
             <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'20px'}}>
                {tables.map(t => (
                   <div key={t.id} style={{
                      background: 'white', borderRadius: '15px', padding: '20px', border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', gap:'15px',
                      position: 'relative'
                   }}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                         <div>
                           <span style={{fontWeight:'900', color:'#1e293b', fontSize:'22px', display:'block'}}>{t.table_no}</span>
                           <span style={{fontSize:'12px', color:'#64748b', fontWeight:'600'}}>{t.table_type} • {t.location_area}</span>
                         </div>
                         <button 
                            onClick={() => handleUpdateTableStatus(t.id, t.status === 'available' ? 'occupied' : 'available')}
                            style={{
                              fontSize:'11px', fontWeight:'800', textTransform:'uppercase', cursor: 'pointer',
                              padding:'6px 10px', borderRadius:'99px', border: 'none',
                              background: t.status === 'available' ? '#dcfce7' : (t.status === 'maintenance' ? '#fef08a' : '#fee2e2'),
                              color: t.status === 'available' ? '#166534' : (t.status === 'maintenance' ? '#854d0e' : '#991b1b'),
                              boxShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'transform 0.1s'
                            }}
                            onMouseDown={(e)=>e.currentTarget.style.transform='scale(0.95)'}
                            onMouseUp={(e)=>e.currentTarget.style.transform='scale(1)'}
                            title="Click to toggle status"
                         >
                            {t.status}
                         </button>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                         <span style={{background:'#f1f5f9', color:'#475569', fontSize:'11px', padding:'3px 8px', borderRadius:'6px', fontWeight:'600'}}>
                            👥 Min {t.min_capacity || 1} - Max {t.capacity}
                         </span>
                         {t.is_smoking ? <span style={{background:'#fef2f2', color:'#991b1b', fontSize:'11px', padding:'3px 8px', borderRadius:'6px', fontWeight:'600'}}>🚬 Smoking</span> : null}
                         {t.is_combineable ? <span style={{background:'#e0e7ff', color:'#3730a3', fontSize:'11px', padding:'3px 8px', borderRadius:'6px', fontWeight:'600'}}>🔗 Combineable</span> : null}
                      </div>

                      <div style={{display:'flex', gap:'10px', borderTop:'1px solid #f1f5f9', paddingTop:'15px'}}>
                         <button onClick={()=>startEditTable(t)} style={{flex: 1, padding:'8px', borderRadius:'8px', background:'#ebf4ff', color:'#3182ce', border:'none', cursor:'pointer'}}><Edit3 size={14} style={{verticalAlign:'middle'}}/> Edit</button>
                         <button onClick={async () => { if(window.confirm("Remove table from floor plan?")) { await axios.delete(`${API_BASE_URL}/api/tables/${t.id}`, { headers:{Authorization:"Bearer "+token} }); fetchTables(tablePlaceId); } }} style={{flex: 1, padding:'8px', borderRadius:'8px', background:'#fff5f5', color:'#e53e3e', border:'none', cursor:'pointer'}}><Trash2 size={14} style={{verticalAlign:'middle'}}/> Delete</button>
                      </div>
                   </div>
                ))}
             </div>
           )}
        </motion.div>
    </motion.div>
  );

  const renderReservationsTab = () => (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" exit="hidden" key="reservations">
       <OwnerReservations filterPlaceId={dashboardFilterPlaceId} places={places}/>
    </motion.div>
  );

  return (
    <div className="owner-dashboard">
      <div className="owner-sidebar">
        <div className="sidebar-section-title">MANAGEMENT</div>
        <nav className="sidebar-nav">
          <button className={`sidebar-btn ${activeTab === "places" ? "active" : ""}`} onClick={() => setActiveTab("places")}>
            <Hotel size={20}/> {businessType === 'dining' ? 'My Restaurant' : 'My Properties'}
          </button>
          
          {/* STAYS / PROPERTIES */}
          {hasStay && (
            <>
              <button className={`sidebar-btn ${activeTab === "rooms" ? "active" : ""}`} onClick={() => setActiveTab("rooms")}><BedDouble size={20}/> Rooms Config</button>
              <button className={`sidebar-btn ${activeTab === "bookings" ? "active" : ""}`} onClick={() => setActiveTab("bookings")}><CalendarCheck size={20}/> Bookings</button>
            </>
          )}

          {/* DINING & MENU - VISIBLE TO ANYONE WHO ADDS FOOD */}
          <button className={`sidebar-btn ${activeTab === "dining" ? "active" : ""}`} onClick={() => setActiveTab("dining")}><Utensils size={20}/> Dining & Menu</button>
          
          {/* DINING SPECIFIC (TABLES/RESERVATIONS) */}
          {hasDine && (
            <>
              <button className={`sidebar-btn ${activeTab === "tables" ? "active" : ""}`} onClick={() => setActiveTab("tables")}><LayoutDashboard size={20}/> Tables</button>
              <button className={`sidebar-btn ${activeTab === "reservations" ? "active" : ""}`} onClick={() => setActiveTab("reservations")}><CalendarCheck size={20}/> Reservations</button>
            </>
          )}

          <button className={`sidebar-btn ${activeTab === "revenue" ? "active" : ""}`} onClick={() => setActiveTab("revenue")}><TrendingUp size={20}/> Revenue</button>
        </nav>
      </div>

      <main className="owner-content">
        {activeTab === 'revenue' && (
          <header className="dashboard-filter-header">
             <div className="filter-group">
                <label className="filter-label">Analytics Context:</label>
                <select className="pd-analytics-select" value={dashboardFilterPlaceId} onChange={(e)=>setDashboardFilterPlaceId(e.target.value)}>
                   <option value="ALL">All Properties Combined</option>
                   {places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
             </div>
          </header>
        )}

        <div className="tab-content-wrapper">
          <AnimatePresence mode="wait">
            {activeTab === "places" && renderPlacesTab()}
            {activeTab === "rooms" && renderRoomsTab()}
            {activeTab === "dining" && renderDiningTab()}
            {activeTab === "tables" && renderTablesTab()}
            {activeTab === "reservations" && renderReservationsTab()}
            {activeTab === "bookings" && <OwnerBookings filterPlaceId={dashboardFilterPlaceId} key="bookings"/>}
            {activeTab === "revenue" && <OwnerRevenue filterPlaceId={dashboardFilterPlaceId} places={places} key="revenue"/>}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default OwnerDashboard;
