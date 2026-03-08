import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import "./Login.css";

function Register() {

  const navigate = useNavigate();

  const [role,setRole] = useState("");
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSubmit = async (e) => {

    e.preventDefault();

    if(!role){
      alert("Please select a role");
      return;
    }

    try{

      await axios.post(
        "http://localhost:5000/api/auth/register",
        {name,email,password,role},
        {headers:{ "Content-Type":"application/json"}}
      );

      alert("Registration successful! Please login.");
      navigate("/login");

    }
    catch(err){

      console.error("REGISTER ERROR:",err);

      alert(
        err.response?.data?.message ||
        "Registration failed. Please check details."
      );

    }

  };

  return(

  <>

  {/* HERO SECTION */}

  <section className="hero-section">

    <div className="hero-container">

      {/* LEFT CONTENT */}

      <div className="hero-left">

        <h1>Create Your Account</h1>

        <p>
        Join FindPlace today and discover the best places to stay
        across Sri Lanka quickly and easily.
        </p>

      </div>


      {/* RIGHT REGISTER CARD */}

      <div className="hero-auth">

        <div className="auth-card">

          <h2>Create Account</h2>

          <p className="subtitle">
            Register to start exploring amazing places
          </p>

          <div className="role-select">

            <button
            type="button"
            className={role==="customer"?"active":""}
            onClick={()=>setRole("customer")}
            >
              Customer
            </button>

            <button
            type="button"
            className={role==="owner"?"active":""}
            onClick={()=>setRole("owner")}
            >
              Owner
            </button>

          </div>

          {!role && <p className="hint">Select your role to continue</p>}

          {role && (

          <form className="auth-form" onSubmit={handleSubmit}>

            <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e)=>setName(e.target.value)}
            required
            />

            <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            required
            />

            <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
            />

            <button type="submit">
              Register as {role.toUpperCase()}
            </button>

            {/* Divider */}

            <div className="divider">
              <span>OR</span>
            </div>

            {/* Google Register */}

            <div className="google-login">

              <GoogleLogin
                onSuccess={async (credentialResponse) => {

                  try{

                    const res = await axios.post(
                      "http://localhost:5000/api/auth/google",
                      { token: credentialResponse.credential }
                    );

                    const { token, role } = res.data;

                    localStorage.setItem("token",token);
                    localStorage.setItem("role",role);

                    if(role==="customer") navigate("/customer");
                    else if(role==="owner") navigate("/owner");

                  }
                  catch(err){

                    console.error("Google Register Error:",err);

                  }

                }}
                onError={() => {

                  console.log("Google Register Failed");

                }}
              />

            </div>

          </form>

          )}

        </div>

      </div>

    </div>

  </section>



  {/* POPULAR PLACES */}

  <section className="popular-section">

    <h2>Popular Places</h2>

    <p className="section-subtitle">
    Top rated boarding places chosen by users
    </p>

    <div className="popular-grid">

      <div className="hotel-card">
        <img src="/sample1.jpg" alt="Ocean View"/>
        <div className="hotel-overlay">
          <h3>Ocean View Boarding</h3>
          <p className="hotel-desc">
          Beautiful seaside rooms with amazing ocean views.
          </p>
          <div className="hotel-meta">
            ⭐ 4.7 <span> • 1 Night Stay</span>
          </div>
          <button className="reserve-btn">
            Reserve Now
          </button>
        </div>
      </div>

      <div className="hotel-card">
        <img src="/sample2.jpg" alt="City Comfort"/>
        <div className="hotel-overlay">
          <h3>City Comfort Rooms</h3>
          <p className="hotel-desc">
          Comfortable rooms located in the heart of Colombo.
          </p>
          <div className="hotel-meta">
            ⭐ 4.5 <span> • 1 Night Stay</span>
          </div>
          <button className="reserve-btn">
            Reserve Now
          </button>
        </div>
      </div>

      <div className="hotel-card">
        <img src="/sample3.jpg" alt="Hill Stay"/>
        <div className="hotel-overlay">
          <h3>Hill Stay Villa</h3>
          <p className="hotel-desc">
          Peaceful villa in the hills of Kandy.
          </p>
          <div className="hotel-meta">
            ⭐ 4.8 <span> • 1 Night Stay</span>
          </div>
          <button className="reserve-btn">
            Reserve Now
          </button>
        </div>
      </div>

    </div>

  </section>



  {/* HOW FINDPLACE WORKS */}

  <section className="how-section">

    <h2>How FindPlace Works</h2>

    <div className="process-line">

      <div className="process-step">
        <div className="step-icon">🔍</div>
        <h4>Search</h4>
        <p>Find places by location and price</p>
      </div>

      <div className="process-step">
        <div className="step-icon">📋</div>
        <h4>Compare</h4>
        <p>View details and compare options</p>
      </div>

      <div className="process-step">
        <div className="step-icon">📅</div>
        <h4>Book</h4>
        <p>Send booking request easily</p>
      </div>

      <div className="process-step">
        <div className="step-icon">🏡</div>
        <h4>Stay</h4>
        <p>Owner approves and enjoy your stay</p>
      </div>

      <div className="process-step">
        <div className="step-icon">⭐</div>
        <h4>Review</h4>
        <p>Leave feedback about the place</p>
      </div>

    </div>

  </section>



  {/* TESTIMONIALS */}

  <section className="testimonial-section">

    <h2>What Our Users Say</h2>

    <p className="section-subtitle">
      Trusted by students and travelers across Sri Lanka
    </p>

    <div className="testimonial-grid">

      <div className="testimonial-card">
        <div className="testimonial-top">
          <img src="/user1.jpg" alt="User"/>
          <div>
            <h4>Nimal Perera</h4>
            <span>University Student</span>
          </div>
        </div>

        <p>
        “FindPlace helped me quickly find a comfortable boarding place near my university.
        The booking process was simple and smooth.”
        </p>

        <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
      </div>

      <div className="testimonial-card">
        <div className="testimonial-top">
          <img src="/user2.jpg" alt="User"/>
          <div>
            <h4>Saman Kumara</h4>
            <span>Traveler</span>
          </div>
        </div>

        <p>
        “Very easy to compare places and send booking requests.
        I found a great place in Kandy within minutes.”
        </p>

        <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
      </div>

      <div className="testimonial-card">
        <div className="testimonial-top">
          <img src="/user3.jpg" alt="User"/>
          <div>
            <h4>Dinithi Fernando</h4>
            <span>Customer</span>
          </div>
        </div>

        <p>
        “The platform is clean and easy to use.
        I really like how you can see ratings and details before booking.”
        </p>

        <div className="testimonial-rating">⭐⭐⭐⭐☆</div>
      </div>

    </div>

  </section>



  {/* FOOTER */}

  <footer className="footer">

    <div className="footer-container">

      <div className="footer-col">
        <h3>FindPlace</h3>
        <p>
        Discover verified boarding places across Sri Lanka.
        Find the perfect stay quickly and easily.
        </p>
      </div>

      <div className="footer-col">
        <h4>Quick Links</h4>
        <ul>
          <li>Home</li>
          <li>Login</li>
          <li>Register</li>
          <li>Search Places</li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Popular Locations</h4>
        <ul>
          <li>Colombo</li>
          <li>Kandy</li>
          <li>Galle</li>
          <li>Jaffna</li>
        </ul>
      </div>

      <div className="footer-col">
        <h4>Contact</h4>
        <p>Email: support@findplace.lk</p>
        <p>Phone: +94 71 123 4567</p>
      </div>

    </div>

    <div className="footer-bottom">
      <p>© 2026 FindPlace. All rights reserved.</p>
    </div>

  </footer>

  </>

  );

}

export default Register;