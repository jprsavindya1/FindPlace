import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Eye, EyeOff, Search, ArrowRightLeft, CalendarCheck, Home, Star, ShieldCheck } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { motion } from "framer-motion";
import { API_BASE_URL } from "../apiConfig";
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

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [role, setRole] = useState("customer");
  const from = location.state?.from || (role === "customer" ? "/customer" : "/owner");
  const msg = location.state?.msg || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(msg || "");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (msg) setError(msg);
  }, [msg]);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (credentialResponse) => {
      setError("");
      try {
        const res = await axios.post(
          `${API_BASE_URL}/api/auth/google`,
          { token: credentialResponse.access_token }
        );

        const { token, role: gRole, name: gName, businessType: gBiz } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", gRole);
        localStorage.setItem("userName", gName);
        if (gBiz) localStorage.setItem("businessType", gBiz);

        if (gRole === "customer" || gRole === "owner") navigate(from, { replace: true });
        else navigate("/");
      } catch (err) {
        console.error("Google Auth error:", err);
        setError("Google login failed.");
      }
    },
    onError: () => {
      setError("Google Login Failed.");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("Please select a role to continue.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/auth/login`,
        { email, password, role },
        { headers: { "Content-Type": "application/json" } }
      );

      const { token, role: userRole, name: userName, businessType: userBiz } = res.data;

      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
      localStorage.setItem("userName", userName);
      if (userBiz) localStorage.setItem("businessType", userBiz);

      if (userRole === "customer" || userRole === "owner") navigate(from, { replace: true });
      else navigate("/");

    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(
        err.response?.data?.message ||
        "Login failed. Check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* GLOBAL Animated Background Elements */}
      <div className="login-bg-shape login-bg-shape-1"></div>
      <div className="login-bg-shape login-bg-shape-2"></div>
      <div className="login-bg-shape login-bg-shape-3"></div>

      <section className="login-hero-section">
        <div className="login-hero-container">
          {/* LEFT SIDE - Welcome Text */}
          <motion.div 
            className="login-hero-text"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={fadeUp} className="badge-pill">
              <Star size={14} fill="currentColor" /> Welcome to the Future of Bookings
            </motion.div>
            <motion.h1 variants={fadeUp}>
              Discover Your <span className="text-gradient">Perfect Escape</span>
            </motion.h1>
            <motion.p variants={fadeUp}>
              Find comfortable and verified places to stay across Sri Lanka. 
              Compare options, explore details, and choose the perfect accommodation for your needs seamlessly.
            </motion.p>
            
            <motion.div variants={fadeUp} className="hero-stats">
              <div className="stat-item">
                <div className="stat-value">500+</div>
                <div className="stat-label">Verified Places</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">10k+</div>
                <div className="stat-label">Happy Users</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">4.8</div>
                <div className="stat-label">Average Rating</div>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT SIDE - Modern Login Card */}
          <motion.div 
            className="login-auth-wrapper"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 80 }}
          >
            <div className="modern-auth-card">
              <div className="card-header">
                <h2>Welcome Back</h2>
                <p className="subtitle">Login to your account to continue</p>
              </div>

              <div className="modern-role-select">
                <button
                  type="button"
                  className={role === "customer" ? "active" : ""}
                  onClick={() => { setError(""); setRole("customer"); }}
                >
                  <Search size={18} />
                  <span className="role-name">Customer</span>
                </button>
                <button
                  type="button"
                  className={role === "owner" ? "active" : ""}
                  onClick={() => { setError(""); setRole("owner"); }}
                >
                  <Home size={18} />
                  <span className="role-name">Owner</span>
                </button>
              </div>

              {role && (
                <form className="modern-auth-form" onSubmit={handleSubmit}>
                  <div className="input-group">
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="input-group password-field">
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
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      className="error-message"
                    >
                      {error}
                    </motion.div>
                  )}

                  <div className="forgot-link-wrapper">
                    <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                  </div>

                  <button type="submit" className="primary-login-btn" disabled={isLoading}>
                    {isLoading ? "Logging in..." : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                  </button>

                  <div className="modern-divider">
                    <span>Or continue with</span>
                  </div>

                  <div className="modern-google-login">
                    <button type="button" className="custom-google-btn" onClick={() => handleGoogleLogin()}>
                      <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                      Sign in with Google
                    </button>
                  </div>
                </form>
              )}

              <div className="modern-auth-footer">
                <p>Don't have an account? <Link to="/register">Create Account</Link></p>
                <div className="trust-indicators">
                  <div className="trust-item">
                    <ShieldCheck size={14} /> <span>Secure Login</span>
                  </div>
                  <div className="trust-item">
                     <span>Trusted by 10k+ users</span>
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
                  <Star size={14} fill="#FFD700" color="#FFD700" /> 4.7 <span> • 1 Night Stay</span>
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
                  <Star size={14} style={{display: 'inline', marginTop:-2}} fill="#f59e0b" color="#f59e0b" /> 4.5 <span> • 1 Night Stay</span>
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
                  <Star size={14} style={{display: 'inline', marginTop:-2}} fill="#f59e0b" color="#f59e0b" /> 4.8 <span> • 1 Night Stay</span>
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

export default Login;
