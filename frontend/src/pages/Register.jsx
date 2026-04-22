import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Search, ArrowRightLeft, CalendarCheck, Home, Star, ShieldCheck, Utensils, User, Mail, Phone, Lock } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { API_BASE_URL } from "../apiConfig";
import { motion } from "framer-motion";
import InteractiveNetwork from "../components/InteractiveNetwork";
import "./Login.css";

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

function Register() {
  const navigate = useNavigate();

  const [role, setRole] = useState("customer");
  const [businessType, setBusinessType] = useState("accommodation");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Phone Formatter: +94 XX XXX XXXX
  const handlePhoneChange = (e) => {
    let val = e.target.value;
    
    // Ensure it starts with +94
    if (!val.startsWith("+94 ")) {
      val = "+94 " + val.replace(/^\+94\s*/, "");
    }

    // Keep only digits after +94
    const prefix = "+94 ";
    let digits = val.substring(prefix.length).replace(/\D/g, "");
    
    // Limit to 9 digits (7X XXX XXXX)
    if (digits.length > 9) digits = digits.slice(0, 9);

    // Format digits: XX XXX XXXX
    let formattedDigits = "";
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 5) formattedDigits += " ";
      formattedDigits += digits[i];
    }

    setPhone(prefix + formattedDigits);
  };

  const handleGoogleRegister = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setError("");
      setIsLoading(true);
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/google`,
          { token: credentialResponse.access_token }
        );

        const { token, role: gRole } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", gRole);

        if (gRole === "customer") navigate("/customer");
        else if (gRole === "owner") navigate("/owner");
      } catch (err) {
        console.error("Google Register Error:", err);
        setError("Google Registration Failed.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Google Registration Failed.");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select a role to continue.");
      return;
    }

    // Basic phone validation
    if (phone.length < 15) {
      setError("Please enter a valid phone number (+94 XX XXX XXXX).");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/auth/register`,
        { name, email, password, role, business_type: role === 'owner' ? businessType : null, phone },
        { headers: { "Content-Type": "application/json" } }
      );

      navigate("/login", { state: { message: "Registration successful! Please login." } });

    } catch (err) {
      console.error("REGISTER ERROR:", err);
      setError(
        err.response?.data?.message ||
        "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <InteractiveNetwork />
      {/* GLOBAL Animated Background Elements */}
      <div className="login-bg-shape login-bg-shape-1"></div>
      <div className="login-bg-shape login-bg-shape-2"></div>
      <div className="login-bg-shape login-bg-shape-3"></div>

      <section className="login-hero-section">
        <div className="login-hero-container">
          {/* LEFT CONTENT */}
          <motion.div 
            className="login-hero-text"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="badge-pill">
              <Star size={14} fill="currentColor" /> Welcome to FindPlace
            </motion.div>
            <motion.h1 variants={fadeUp}>
              Create Your <span className="text-gradient">Premium Account</span>
            </motion.h1>
            <motion.p variants={fadeUp}>
              Join FindPlace today and discover the best places to stay
              across Sri Lanka quickly and easily. Experience the future of bookings.
            </motion.p>
            
            <motion.div variants={fadeUp} className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">Free</div>
                <div className="stat-label">To Register</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">1 Min</div>
                <div className="stat-label">Setup Time</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">100%</div>
                <div className="stat-label">Secure</div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT HERO / AUTH CARD */}
          <motion.div 
            className="login-auth-wrapper"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >

            <div className="modern-auth-card">
              <div className="card-header">
                <h2>Register</h2>
                <p className="subtitle">Join our community today</p>
              </div>

              <div className="modern-role-select">
                <button
                  type="button"
                  className={role === "customer" ? "active" : ""}
                  onClick={() => { setError(""); setRole("customer"); }}
                >
                   <Search size={18} />
                   <div className="role-btn-text">
                     <span className="role-name">Customer</span>
                     <span className="role-desc">Looking for a stay</span>
                   </div>
                </button>
                <button
                  type="button"
                  className={role === "owner" ? "active" : ""}
                  onClick={() => { setError(""); setRole("owner"); }}
                >
                   <Home size={18} />
                   <div className="role-btn-text">
                     <span className="role-name">Owner</span>
                     <span className="role-desc">Hosting a place</span>
                   </div>
                </button>
              </div>

              {role === "owner" && (
                <div className="business-type-select-container">
                   <p className="select-label">WHAT TYPE OF BUSINESS DO YOU RUN?</p>
                   <div className="business-type-grid">
                      <div 
                        className={`biz-type-card ${businessType === 'accommodation' ? 'selected' : ''}`}
                        onClick={() => setBusinessType('accommodation')}
                      >
                         <Home size={20} />
                         <span>Accommodations</span>
                         <small>Hotels, Villas, Resorts</small>
                      </div>
                      <div 
                        className={`biz-type-card ${businessType === 'dining' ? 'selected' : ''}`}
                        onClick={() => setBusinessType('dining')}
                      >
                         <Utensils size={20} />
                         <span>Dining</span>
                         <small>Restaurants, Cafes</small>
                      </div>
                   </div>
                </div>
              )}

              {role && (
                <motion.form 
                  className="modern-auth-form" 
                  onSubmit={handleSubmit}
                  variants={staggerContainer}
                  initial="hidden"
                  animate="show"
                >
                  <motion.div variants={fadeUp} className="input-group">
                    <User className="input-icon" size={18} />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </motion.div>


                  <motion.div variants={fadeUp} className="input-group">
                    <Mail className="input-icon" size={18} />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </motion.div>


                  <motion.div variants={fadeUp} className="input-group">
                    <Phone className="input-icon" size={18} />
                    <div className="phone-input-wrapper">
                      <input
                        type="text"
                        placeholder="+94 77 123 4567"
                        value={phone}
                        onChange={handlePhoneChange}
                        onFocus={() => { if (!phone) setPhone("+94 "); }}
                        required
                      />
                    </div>
                  </motion.div>


                  <motion.div variants={fadeUp} className="input-group password-field">
                    <Lock className="input-icon" size={18} />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </motion.div>


                  {error && (
                    <motion.div 
                      variants={fadeUp}
                      className="error-message"
                    >
                      {error}
                    </motion.div>
                  )}

                  <motion.button variants={fadeUp} type="submit" className="primary-login-btn" disabled={isLoading}>
                    {isLoading ? "Registering..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                  </motion.button>

                  <motion.div variants={fadeUp} className="modern-divider">
                    <span>Or register with</span>
                  </motion.div>

                  <motion.div variants={fadeUp} className="modern-google-login">
                    <button type="button" className="custom-google-btn" onClick={() => handleGoogleRegister()}>
                      <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      Sign in with Google
                    </button>
                  </motion.div>
                </motion.form>

              )}

              <div className="modern-auth-footer">
                <p>Already have an account? <Link to="/login">Login</Link></p>
                <div className="trust-indicators">
                  <div className="trust-item">
                    <ShieldCheck size={14} /> <span>Secure Registration</span>
                  </div>
                  <div className="trust-item">
                     <span>Join 10k+ users</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* POPULAR PLACES */}
      <section className="popular-section">
        <motion.div
           initial="hidden"
           whileInView="show"
           viewport={{ once: true, margin: "-100px" }}
           variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp}>Popular Places</motion.h2>
          <motion.p variants={fadeUp} className="section-subtitle">
            Top rated boarding places chosen by users
          </motion.p>

          <div className="popular-grid">
            <motion.div variants={fadeUp} className="hotel-card">
              <img src="/sample1.jpg" alt="Ocean View"/>
              <div className="hotel-overlay">
                <h3>Ocean View Boarding</h3>
                <p className="hotel-desc">
                  Beautiful seaside rooms with amazing ocean views.
                </p>
                <div className="hotel-meta">
                  <Star size={14} style={{display: 'inline', marginTop:-2}} fill="#FFD700" color="#FFD700" /> 4.7 <span> • 1 Night Stay</span>
                </div>
                <button className="reserve-btn">Reserve Now</button>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="hotel-card">
              <img src="/sample2.jpg" alt="City Comfort"/>
              <div className="hotel-overlay">
                <h3>City Comfort Rooms</h3>
                <p className="hotel-desc">
                  Comfortable rooms located in the heart of Colombo.
                </p>
                <div className="hotel-meta">
                  <Star size={14} style={{display: 'inline', marginTop:-2}} fill="#FFD700" color="#FFD700" /> 4.5 <span> • 1 Night Stay</span>
                </div>
                <button className="reserve-btn">Reserve Now</button>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="hotel-card">
              <img src="/sample3.jpg" alt="Hill Stay"/>
              <div className="hotel-overlay">
                <h3>Hill Stay Villa</h3>
                <p className="hotel-desc">
                  Peaceful villa in the hills of Kandy.
                </p>
                <div className="hotel-meta">
                  <Star size={14} fill="#FFD700" color="#FFD700" /> 4.8 <span> • 1 Night Stay</span>
                </div>
                <button className="reserve-btn">Reserve Now</button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

       {/* HOW FINDPLACE WORKS */}
       <section className="how-section">
        <motion.div
           initial="hidden"
           whileInView="show"
           viewport={{ once: true, margin: "-100px" }}
           variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp}>How FindPlace Works</motion.h2>
          
          <div className="process-line">
            <motion.div variants={fadeUp} className="process-step">
              <div className="step-icon"><Search size={32} /></div>
              <h4>Search</h4>
              <p>Find places by location and price</p>
            </motion.div>

            <motion.div variants={fadeUp} className="process-step">
              <div className="step-icon"><ArrowRightLeft size={32} /></div>
              <h4>Compare</h4>
              <p>View details and compare options</p>
            </motion.div>

            <motion.div variants={fadeUp} className="process-step">
              <div className="step-icon"><CalendarCheck size={32} /></div>
              <h4>Book</h4>
              <p>Send booking request easily</p>
            </motion.div>

            <motion.div variants={fadeUp} className="process-step">
              <div className="step-icon"><Home size={32} /></div>
              <h4>Stay</h4>
              <p>Owner approves and enjoy your stay</p>
            </motion.div>

            <motion.div variants={fadeUp} className="process-step">
              <div className="step-icon"><Star size={32} /></div>
              <h4>Review</h4>
              <p>Leave feedback about the place</p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonial-section">
        <motion.div
           initial="hidden"
           whileInView="show"
           viewport={{ once: true, margin: "-100px" }}
           variants={staggerContainer}
        >
          <motion.h2 variants={fadeUp}>What Our Users Say</motion.h2>
          <motion.p variants={fadeUp} className="section-subtitle">
            Trusted by students and travelers across Sri Lanka
          </motion.p>

          <div className="testimonial-grid">
            <motion.div variants={fadeUp} className="testimonial-card">
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
              <div className="testimonial-rating">
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="testimonial-card">
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
              <div className="testimonial-rating">
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="testimonial-card">
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
              <div className="testimonial-rating">
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <Star size={16} color="#d1d5db" />
              </div>
            </motion.div>
          </div>
        </motion.div>
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
    </div>
  );
}

export default Register;
