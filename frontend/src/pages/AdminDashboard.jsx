import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(true);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  /* ================= ADMIN GUARD ================= */
  useEffect(() => {
    if (!token || role !== "admin") {
      navigate("/login");
    }
  }, [token, role, navigate]);

  /* ================= FETCH USERS ================= */
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);

  /* ================= FETCH PLACES (PENDING FIRST) ================= */
  const fetchPlaces = async () => {
    setLoadingPlaces(true);
    try {
      const res = await axios.get("http://localhost:5000/api/admin/places", {
        headers: { Authorization: "Bearer " + token },
      });

      // Pending places first
      const sortedPlaces = res.data.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return 0;
      });

      setPlaces(sortedPlaces);
    } catch (err) {
      console.error(err);
      alert("Failed to load places");
    } finally {
      setLoadingPlaces(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
    // eslint-disable-next-line
  }, []);

  /* ================= USER ACTIONS ================= */
  const changeUserRole = async (id, newRole) => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/users/${id}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.filter((u) => u.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= PLACE ACTIONS ================= */
  const approvePlace = async (id) => {
    if (!window.confirm("Approve this place?")) return;

    try {
      await axios.put(
        `http://localhost:5000/api/admin/places/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchPlaces();
    } catch (err) {
      console.error(err);
      alert("Failed to approve place");
    }
  };

  const rejectPlace = async (id) => {
    if (!window.confirm("Reject/Delete this place?")) return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/places/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPlaces();
    } catch (err) {
      console.error(err);
      alert("Failed to reject/delete place");
    }
  };

  return (
    <div className="admin-page">
      <h2>👑 Admin Dashboard</h2>
      <p className="subtitle">System control panel</p>

      {/* ================= USER MANAGEMENT ================= */}
      <h3>User Management</h3>

      {loadingUsers ? (
        <p>Loading users...</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  {user.role === "admin" ? (
                    <strong>Admin</strong>
                  ) : (
                    <>
                      {user.role === "owner" ? (
                        <button
                          className="btn customer"
                          onClick={() => changeUserRole(user.id, "customer")}
                        >
                          Make Customer
                        </button>
                      ) : (
                        <button
                          className="btn owner"
                          onClick={() => changeUserRole(user.id, "owner")}
                        >
                          Make Owner
                        </button>
                      )}

                      <button
                        className="btn danger"
                        style={{ marginLeft: "8px" }}
                        onClick={() => deleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= PLACE MANAGEMENT ================= */}
      <h3>Place Management</h3>

      {loadingPlaces ? (
        <p>Loading places...</p>
      ) : (
        <table className="place-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Place</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {places.map((place) => (
              <tr key={place.id}>
                <td>{place.id}</td>
                <td>{place.name}</td>
                <td>{place.owner_name}</td>
                <td>
                  <span className={`status ${place.status}`}>{place.status}</span>
                </td>
                <td>
                  {place.status === "pending" ? (
                    <>
                      <button
                        className="btn approve"
                        onClick={() => approvePlace(place.id)}
                      >
                        Approve
                      </button>

                      <button
                        className="btn danger"
                        style={{ marginLeft: "8px" }}
                        onClick={() => rejectPlace(place.id)}
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <button
                      className="btn danger"
                      onClick={() => rejectPlace(place.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminDashboard;