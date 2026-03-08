import { useNavigate } from "react-router-dom";
import "./PlaceCard.css";

function PlaceCard({ place }) {
  const navigate = useNavigate();

  // Image handling (DB image OR fallback)
  const imageUrl = place.image
    ? `http://localhost:5000/uploads/${place.image}`
    : "https://source.unsplash.com/400x300/?house,home";

  return (
    <div
      className="place-card"
      onClick={() => navigate(`/places/${place.id}`)}
      style={{ cursor: "pointer" }}
    >
      {/* IMAGE */}
      <div className="place-image">
        <img src={imageUrl} alt={place.name} />
      </div>

      {/* CONTENT */}
      <div className="place-content">
        <h3 className="place-name">{place.name}</h3>
        <p className="place-location">📍 {place.location}</p>
        <p className="place-price">💰 Rs. {place.price} / month</p>

        <button
          className="place-btn"
          onClick={(e) => {
            e.stopPropagation(); // prevent card click navigation twice
            navigate(`/places/${place.id}`);
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

export default PlaceCard;
