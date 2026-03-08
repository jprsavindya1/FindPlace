import { useEffect, useState } from "react";
import axios from "axios";
import "./OwnerDashboard.css";
import OwnerBookings from "./OwnerBookings"; // ✅ IMPORT

function OwnerDashboard() {
  const token = localStorage.getItem("token");

  /* ================= STATES ================= */
  const [places, setPlaces] = useState([]);
  const [editingPlace, setEditingPlace] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    price: "",
    category: "",
    province: "",
    district: "",
    area: "",
    keywords: "",
  });

  /* ================= FETCH OWNER PLACES ================= */
  useEffect(() => {
    const fetchOwnerPlaces = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/places/my",
          {
            headers: { Authorization: "Bearer " + token },
          }
        );
        setPlaces(res.data);
      } catch (err) {
        console.error("Fetch owner places failed", err);
      }
    };

    if (token) fetchOwnerPlaces();
  }, [token]);

  /* ================= FORM HANDLING ================= */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({
      name: "",
      location: "",
      price: "",
      category: "",
      province: "",
      district: "",
      area: "",
      keywords: "",
    });
  };

  /* ================= ADD PLACE ================= */
  const handleAddPlace = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://localhost:5000/api/owner/places",
        form,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );

      alert("Place added (Pending approval)");
      resetForm();

      const res = await axios.get(
        "http://localhost:5000/api/places/my",
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      setPlaces(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to add place");
    }
  };

  /* ================= EDIT PLACE ================= */
  const startEdit = (place) => {
    setEditingPlace(place.id);
    setForm({
      name: place.name || "",
      location: place.location || "",
      price: place.price || "",
      category: place.category || "",
      province: place.province || "",
      district: place.district || "",
      area: place.area || "",
      keywords: place.keywords || "",
    });
  };

  const handleUpdatePlace = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:5000/api/owner/places/${editingPlace}`,
        form,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );

      alert("Place updated successfully");
      resetForm();
      setEditingPlace(null);

      const res = await axios.get(
        "http://localhost:5000/api/places/my",
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      setPlaces(res.data);
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  /* ================= DELETE PLACE ================= */
  const handleDeletePlace = async (id) => {
    if (!window.confirm("Are you sure you want to delete this place?")) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/owner/places/${id}`,
        {
          headers: { Authorization: "Bearer " + token },
        }
      );

      alert("Place deleted successfully");

      const res = await axios.get(
        "http://localhost:5000/api/places/my",
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      setPlaces(res.data);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  /* ================= IMAGE UPLOAD ================= */
  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleUploadImage = async (placeId) => {
    if (!imageFile) {
      alert("Please select an image");
      return;
    }

    const formData = new FormData();
    formData.append("image", imageFile);

    try {
      await axios.put(
        `http://localhost:5000/api/owner/places/${placeId}/image`,
        formData,
        {
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert("Image uploaded successfully");
      setImageFile(null);

      const res = await axios.get(
        "http://localhost:5000/api/places/my",
        {
          headers: { Authorization: "Bearer " + token },
        }
      );
      setPlaces(res.data);
    } catch (err) {
      console.error(err);
      alert("Image upload failed");
    }
  };

  /* ================= UI ================= */
  return (
    <div className="owner-page">
      <h2>Owner Dashboard</h2>

      {/* ===== PLACE MANAGEMENT ===== */}
      <h3>{editingPlace ? "Edit Place" : "Add New Place"}</h3>

      <form
        className="owner-form"
        onSubmit={editingPlace ? handleUpdatePlace : handleAddPlace}
      >
        <input name="name" placeholder="Place Name" value={form.name} onChange={handleChange} required />
        <input name="location" placeholder="Location" value={form.location} onChange={handleChange} />
        <input name="price" placeholder="Price" value={form.price} onChange={handleChange} />
        <input name="province" placeholder="Province" value={form.province} onChange={handleChange} />
        <input name="district" placeholder="District" value={form.district} onChange={handleChange} />
        <input name="area" placeholder="Area" value={form.area} onChange={handleChange} />

        <select name="category" value={form.category} onChange={handleChange} required>
          <option value="">Select Category</option>
          <option value="Hotel">Hotel</option>
          <option value="Restaurant">Restaurant</option>
          <option value="Villa">Villa</option>
          <option value="Cabana">Cabana</option>
          <option value="Room">Room</option>
        </select>

        <input name="keywords" placeholder="Keywords" value={form.keywords} onChange={handleChange} />

        <button type="submit">{editingPlace ? "Update Place" : "Add Place"}</button>

        {editingPlace && (
          <button type="button" className="cancel-btn" onClick={() => {
            resetForm();
            setEditingPlace(null);
          }}>
            Cancel
          </button>
        )}
      </form>

      <h3>My Places</h3>

      <div className="owner-places-grid">
        {places.map((place) => (
          <div className="owner-place-card" key={place.id}>
            <h4>{place.name}</h4>
            <p>{place.location}</p>
            <p>Rs. {place.price}</p>
            <p>Category: {place.category}</p>
            <p>Status: {place.status}</p>

            {place.image && (
              <img
                src={`http://localhost:5000/uploads/${place.image}`}
                alt={place.name}
                className="place-img"
              />
            )}

            <input type="file" onChange={handleImageChange} />
            <button onClick={() => handleUploadImage(place.id)}>Upload Image</button>

            <button onClick={() => startEdit(place)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDeletePlace(place.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* ===== BOOKINGS SECTION ===== */}
      <hr />
      <OwnerBookings /> {/* ✅ BOOKING REQUESTS */}
    </div>
  );
}

export default OwnerDashboard;
