import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Unauthorized from "./pages/Unauthorized";
import Profile from "./pages/Profile";

// Admin
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Owner
import OwnerDashboard from "./pages/OwnerDashboard";

// Customer
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerBookings from "./pages/CustomerBookings";
import PlaceDetails from "./pages/PlaceDetails";
import MyFavorites from "./pages/MyFavorites";
import CategoryPage from "./pages/CategoryPage";
import DiningPage from "./pages/DiningPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import SmartPlanner from "./pages/SmartPlanner/SmartPlanner"; // ⭐ AI Smart Itinerary Planner

function App() {
  return (
    <GoogleOAuthProvider clientId="593149822202-o648jt4p23lcistoh3q9n0ishss7kthj.apps.googleusercontent.com">
      <BrowserRouter>

        {/* Global Navigation */}
        <Navbar />

        <Routes>

          {/* ================= PUBLIC ROUTES ================= */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ================= ADMIN ================= */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= CUSTOMER / GUEST EXPLORER ================= */}
          <Route path="/customer" element={<CustomerDashboard />} />
          <Route path="/dine" element={<DiningPage />} />
          {/* Landing pages bypassed per user request to streamline search journey */}
          {/* <Route path="/category/:type" element={<CategoryPage />} /> */}
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/smart-planner" element={<SmartPlanner />} />
          <Route path="/places/:id" element={<PlaceDetails />} />

          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute allowedRoles={["customer", "admin"]}>
                <CustomerBookings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/favorites"
            element={
              <ProtectedRoute allowedRoles={["customer", "admin"]}>
                <MyFavorites />
              </ProtectedRoute>
            }
          />

          {/* ================= OWNER ================= */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={["owner", "admin"]}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= SHARED ROUTES (ALL AUTH USERS) ================= */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["customer", "owner", "admin"]}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* ================= DEFAULT REDIRECT ================= */}
          <Route path="/" element={<Navigate to="/customer" replace />} />

          {/* ================= UNKNOWN ROUTES ================= */}
          <Route path="*" element={<Navigate to="/customer" replace />} />

        </Routes>

      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;