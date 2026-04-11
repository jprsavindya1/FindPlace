import React, { useState } from "react";
import "./Footer.css";

const Footer = () => {
  const [activeTab, setActiveTab] = useState("Domestic cities");

  const destinationData = {
    "Domestic cities": [
      "Ella hotels", "Kandy hotels", "Nuwara Eliya hotels", "Bentota hotels", "Weligama hotels",
      "Mirissa hotels", "Hatton hotels", "Galle hotels", "Anuradhapura hotels", "Negombo hotels",
      "Haputale hotels", "Ahangama hotels", "Polonnaruwa hotels", "Boralesgamuwa hotels", "Jaffna hotels",
      "Dehiwala hotels", "Colombo hotels", "Pasikuda hotels", "Hikkaduwa hotels", "Seruwawila hotels",
      "Bambalapitiya hotels", "Imaduwa hotels", "Habarana hotels", "Trincomalee hotels", "Tangalle hotels"
    ],
    "Coastal Gems": [
      "Bentota resorts", "Mirissa villas", "Hikkaduwa cabanas", "Trincomalee hotels", "Tangalle resorts",
      "Arugam Bay surf stays", "Weligama villas", "Matara hotels", "Pasikuda resorts", "Kalpitiya camps",
      "Dickwella villas", "Nilaveli hotels", "Induruwa resorts", "Balapitya villas", "Ahungalla hotels"
    ],
    "Nature & Culture": [
      "Sigiriya lodges", "Dambulla hotels", "Yala safari camps", "Wilpattu lodges", "Udawalawa stays",
      "Belihuloya eco resorts", "Knuckles forest lodges", "Kitulgala adventure camps", "Sinharaja eco lodges"
    ]
  };

  const footerLinks = {
    Support: ["Manage your trips", "Contact Customer Service", "Safety Resource Center", "Help Center"],
    Discover: ["Genius loyalty program", "Seasonal and holiday deals", "Travel articles", "FindPlace for Business", "Traveller Review Awards", "Car rental", "Flight finder", "Restaurant reservations"],
    "Terms and settings": ["Privacy Notice", "Terms of Service", "Accessibility Statement", "Partner dispute", "Modern Slavery Statement", "Human Rights Statement"],
    Partners: ["Extranet login", "Partner help", "List your property", "Become an affiliate"],
    About: ["About FindPlace.com", "How We Work", "Sustainability", "Press center", "Careers", "Investor relations", "Corporate contact"]
  };

  return (
    <footer className="main-footer">
      <div className="footer-top-section">
        <div className="footer-container">
          <h2 className="popular-title">Popular with travelers from Sri Lanka</h2>
          <div className="footer-tabs">
            {Object.keys(destinationData).map((tab) => (
              <button
                key={tab}
                className={`footer-tab-btn ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="destination-links-grid">
            {destinationData[activeTab].map((item, idx) => (
              <a key={idx} href="#" className="dest-link">{item}</a>
            ))}
          </div>
        </div>
      </div>


    </footer>
  );
};

export default Footer;
