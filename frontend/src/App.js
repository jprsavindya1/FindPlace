import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./pages/Unauthorized";

// Admin
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

// Owner
import OwnerDashboard from "./pages/OwnerDashboard";

// Customer
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerBookings from "./pages/CustomerBookings";
import PlaceDetails from "./pages/PlaceDetails";

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

          {/* ================= CUSTOMER ================= */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer/bookings"
            element={
              <ProtectedRoute allowedRole="customer">
                <CustomerBookings />
              </ProtectedRoute>
            }
          />

          {/* Customer can view place details */}
          <Route
            path="/places/:id"
            element={
              <ProtectedRoute allowedRole="customer">
                <PlaceDetails />
              </ProtectedRoute>
            }
          />

          {/* ================= OWNER ================= */}
          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRole="owner">
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* ================= DEFAULT REDIRECT ================= */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ================= UNKNOWN ROUTES ================= */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>

      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;