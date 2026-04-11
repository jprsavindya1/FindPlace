import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, Phone, Info, Camera, Lock, CheckCircle, 
  AlertCircle, ShieldCheck, Edit2, Save, X 
} from "lucide-react";
import { API_BASE_URL } from "../apiConfig";
import "./Profile.css";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", about: "" });
  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setFormData({
        name: res.data.name || "",
        phone: res.data.phone || "",
        about: res.data.about || "",
      });
    } catch (err) {
      console.error(err);
      showToast("Failed to load profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API_BASE_URL}/api/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Profile updated successfully!", "success");
      setEditMode(false);
      fetchProfile();
    } catch (err) {
      showToast("Update failed", "error");
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    try {
      await axios.put(`${API_BASE_URL}/api/users/profile/pic`, data, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
      });
      showToast("Profile picture updated", "success");
      fetchProfile();
    } catch (err) {
      showToast("Upload failed", "error");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showToast("Passwords do not match", "error");
    }

    try {
      await axios.put(`${API_BASE_URL}/api/users/profile/password`, {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Password changed successfully", "success");
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(err.response?.data?.message || "Password change failed", "error");
    }
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const calculateCompleteness = () => {
    if (!user) return 0;
    const fields = ["name", "email", "phone", "profile_pic", "about"];
    const filledCount = fields.filter(f => user[f] && user[f] !== "").length;
    return Math.round((filledCount / fields.length) * 100);
  };

  if (loading) return <div className="profile-loading">Preparing your boutique profile...</div>;

  if (!user) return (
    <div className="profile-loading">
      <div className="error-message">
        <AlertCircle size={40} color="#ef4444" />
        <p>Failed to load profile details. Please try again later.</p>
        <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="profile-page">
      {/* Decorative Blobs */}
      <div className="profile-blob blob-1"></div>
      <div className="profile-blob blob-2"></div>

      <div className="profile-container">
        
        {/* Profile Card */}
        <motion.div 
          className="profile-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="profile-header">
            <div className="avatar-wrapper">
              <div className="avatar-circle">
                {user.profile_pic ? (
                  <img src={`${API_BASE_URL}/uploads/profiles/${user.profile_pic}`} alt="Profile" />
                ) : (
                  <User size={60} color="#003580" />
                )}
              </div>
              <label className="upload-btn">
                <Camera size={20} />
                <input type="file" hidden onChange={handleImageUpload} />
              </label>
            </div>
            
            <div className="profile-identity">
              <h2>{user.name}</h2>
              <span className="role-badge">{user.role}</span>
            </div>

            <div className="completeness-wrapper">
              <div className="completeness-info">
                <span>Profile Completeness</span>
                <span>{calculateCompleteness()}%</span>
              </div>
              <div className="progress-bar">
                <motion.div 
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${calculateCompleteness()}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                ></motion.div>
              </div>
            </div>
          </div>

          <div className="profile-content">
            <div className="content-nav">
              <h3>Account Settings</h3>
              <button className="edit-toggle" onClick={() => setEditMode(!editMode)}>
                {editMode ? <X size={18} /> : <Edit2 size={18} />}
                {editMode ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            <form className="profile-form" onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label><User size={16} /> Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    disabled={!editMode}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label><Mail size={16} /> Email Address</label>
                  <input type="email" value={user.email} disabled />
                </div>
                <div className="form-group">
                  <label><Phone size={16} /> Phone Number</label>
                  <input 
                    type="text" 
                    placeholder="+94 77 123 4567"
                    value={formData.phone} 
                    disabled={!editMode}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith("+94 ")) {
                        val = "+94 " + val.replace(/^\+94\s*/, "");
                      }
                      const prefix = "+94 ";
                      let digits = val.substring(prefix.length).replace(/\D/g, "");
                      if (digits.length > 9) digits = digits.slice(0, 9);
                      let formattedDigits = "";
                      for (let i = 0; i < digits.length; i++) {
                        if (i === 2 || i === 5) formattedDigits += " ";
                        formattedDigits += digits[i];
                      }
                      setFormData({...formData, phone: prefix + formattedDigits});
                    }}
                    onFocus={(e) => { if (!formData.phone) setFormData({...formData, phone: "+94 "}); }}
                  />
                </div>
                <div className="form-group full-width">
                  <label><Info size={16} /> About / Bio</label>
                  <textarea 
                    placeholder="Tell us a little bit about yourself..."
                    value={formData.about} 
                    disabled={!editMode}
                    onChange={(e) => setFormData({...formData, about: e.target.value})}
                  />
                </div>
              </div>

              {editMode && (
                <motion.button 
                  type="submit" 
                  className="save-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Save size={18} /> Save Changes
                </motion.button>
              )}
            </form>

            <div className="security-section">
              <button className="password-btn" onClick={() => setShowPasswordModal(true)}>
                <Lock size={18} /> Update Password
              </button>
              <div className="security-info">
                <ShieldCheck size={18} />
                <span>Your account is secured with end-to-end encryption.</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-card"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>Change Password</h3>
                <button onClick={() => setShowPasswordModal(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    required 
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    required 
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    required 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
                <button type="submit" className="confirm-btn">Update Password</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            className={`toast ${toast.type}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {toast.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
