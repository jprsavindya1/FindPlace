import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, CalendarCheck, MapPin, Clock, Utensils } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';
import './OwnerRevenue.css';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const OwnerRevenue = ({ filterPlaceId = "ALL", places = [] }) => {
  const [bookings, setBookings] = useState([]);
  const [peakHours, setPeakHours] = useState([]);
  const [topDishes, setTopDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const businessType = localStorage.getItem("businessType") || "accommodation";

  useEffect(() => {
    fetchMainData();
  }, [filterPlaceId]);

  const fetchMainData = async () => {
    setLoading(true);
    await fetchBookings();
    if (businessType === 'dining') {
      await fetchDiningAnalytics();
    }
    setLoading(false);
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/bookings/owner`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data || []);
    } catch (err) {
      console.error("Failed to fetch bookings for revenue dashboard", err);
    }
  };

  const fetchDiningAnalytics = async () => {
    try {
      const phRes = await axios.get(`${API_BASE_URL}/api/owner/dining/analytics/peak-hours`, {
        params: { placeId: filterPlaceId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setPeakHours(phRes.data);

      const tdRes = await axios.get(`${API_BASE_URL}/api/owner/dining/analytics/top-dishes`, {
        params: { placeId: filterPlaceId },
        headers: { Authorization: `Bearer ${token}` }
      });
      setTopDishes(tdRes.data);
    } catch (err) {
      console.error("Failed to fetch dining analytics", err);
    }
  };

  /* ================= METRICS CALCULATION ================= */
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let successfulBookingsCount = 0;
    const placeRevenueMap = {};
    const monthlyRevenueMap = {};
    
    // Time Status variables
    let upcomingCount = 0;
    let ongoingCount = 0;
    let completedCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter bookings based on selected place before processing metrics
    let filteredList = [...bookings];
    if (filterPlaceId !== "ALL") {
      filteredList = filteredList.filter(b => String(b.place_id) === String(filterPlaceId));
    }

    filteredList.forEach(b => {
      const price = Number(b.total_price) || 0;
      const status = (b.status || "").toUpperCase();

      // Only process valid revenue-generating bookings for the dashboard
      if (status === 'CONFIRMED' || status === 'COMPLETED') {
        totalRevenue += price;
        successfulBookingsCount++;

        // Place Revenue Grouping
        const placeName = b.place_name || "Unknown Place";
        placeRevenueMap[placeName] = (placeRevenueMap[placeName] || 0) + price;

        // Monthly Revenue Grouping
        const date = new Date(b.created_at);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyRevenueMap[monthYear] = (monthlyRevenueMap[monthYear] || 0) + price;
        
        // Time Status Calculation
        const checkInDate = new Date(b.check_in);
        checkInDate.setHours(0, 0, 0, 0);
        
        const checkOutDate = new Date(b.check_out);
        checkOutDate.setHours(0, 0, 0, 0);

        if (checkOutDate < today) {
          completedCount++; // Past bookings
        } else if (checkInDate <= today && checkOutDate >= today) {
          ongoingCount++; // Current stay
        } else if (checkInDate > today) {
          upcomingCount++; // Future bookings
        }
      }
    });

    // Formatting Monthly Data for Recharts
    const monthlyData = Object.keys(monthlyRevenueMap).map(key => ({
      name: key,
      Revenue: monthlyRevenueMap[key],
    })).sort((a, b) => new Date(a.name) - new Date(b.name));

    // Time Based Pie Chart Data
    const timeStatusData = [
      { name: 'Upcoming', value: upcomingCount, color: '#10b981' }, // emerald
      { name: 'Ongoing', value: ongoingCount, color: '#3b82f6' }, // blue
      { name: 'Completed', value: completedCount, color: '#ef4444' } // red
    ].filter(s => s.value > 0);

    // Finding Top Place
    let topPlaceName = "N/A";
    let topPlaceRevenue = 0;
    Object.keys(placeRevenueMap).forEach(key => {
      if (placeRevenueMap[key] > topPlaceRevenue) {
        topPlaceRevenue = placeRevenueMap[key];
        topPlaceName = key;
      }
    });

    return { totalRevenue, successfulBookingsCount, monthlyData, upcomingCount, ongoingCount, completedCount, timeStatusData, topPlaceName, topPlaceRevenue };
  }, [bookings, filterPlaceId]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Revenue Data...</div>;
  }

  return (
    <motion.div className="revenue-dashboard" variants={fadeUp} initial="hidden" animate="show">
      <div className="content-header" style={{ marginBottom: '32px' }}>
        <h2>Revenue & Analytics</h2>
        <p>Track your monthly earnings and analyze business performance.</p>
      </div>

      {/* KPI CARDS */}
      <div className="revenue-kpi-grid">
        <motion.div variants={fadeUp} className="kpi-card">
          <div className="kpi-icon"><DollarSign size={28} /></div>
          <div className="kpi-info">
            <h4>{businessType === 'dining' ? "Total Dining Sales" : "Total Revenue"}</h4>
            <p>Rs. {metrics.totalRevenue.toLocaleString()}</p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="kpi-card">
          <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><TrendingUp size={28} /></div>
          <div className="kpi-info">
            <h4>{businessType === 'dining' ? "Successful Reservations" : "Successful Bookings"}</h4>
            <p>{metrics.successfulBookingsCount}</p>
            <div className="subtitle">{businessType === 'dining' ? "Seated & Completed" : "Confirmed & Completed"}</div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="kpi-card">
          <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}><MapPin size={28} /></div>
          <div className="kpi-info">
            <h4>{filterPlaceId === "ALL" ? (businessType === 'dining' ? "Top Restaurant" : "Top Earning Place") : (businessType === 'dining' ? "This Restaurant" : "Selected Property")}</h4>
            <p style={{ fontSize: '1.2rem', margin: '4px 0' }}>{filterPlaceId === "ALL" ? metrics.topPlaceName : (places.find(p => String(p.id) === String(filterPlaceId))?.name || "This Business")}</p>
            <div className="subtitle">{filterPlaceId === "ALL" ? `Rs. ${metrics.topPlaceRevenue.toLocaleString()} Generated` : "Performance Overview"}</div>
          </div>
        </motion.div>
      </div>

      {/* CHARTS GRID */}
      <div className="charts-grid">
        <motion.div variants={fadeUp} className="chart-card">
          <h3><TrendingUp size={20} color="var(--primary-color)" /> {businessType === 'dining' ? "Restaurant Sales Trend" : "Monthly Revenue Trend"}</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={metrics.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `Rs.${value/1000}k`} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="Revenue" fill="var(--primary-color)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {businessType === 'dining' ? (
          <motion.div variants={fadeUp} className="chart-card">
            <h3><Clock size={20} color="var(--primary-color)" /> Peak Dining Hours</h3>
            <div style={{ width: '100%', height: 300 }}>
               {peakHours.length > 0 ? (
                 <ResponsiveContainer>
                    <BarChart data={peakHours.map(p => ({ hour: `${p.hour}:00`, count: p.count }))}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                       <XAxis dataKey="hour" axisLine={false} tickLine={false} />
                       <YAxis axisLine={false} tickLine={false} />
                       <Tooltip />
                       <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No Reservations Data</div>
               )}
            </div>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="chart-card">
            <h3><CalendarCheck size={20} color="var(--primary-color)" /> Booking Time Status</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
              
              <div style={{ width: '100%', height: 220 }}>
                {metrics.timeStatusData.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={metrics.timeStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                        {metrics.timeStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>No Bookings Yet</div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1rem' }}>Upcoming</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Future Bookings</p>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{metrics.upcomingCount}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#1e3a8a', fontSize: '1rem' }}>Ongoing</h4>
                    <p style={{ margin: 0, color: '#3b82f6', fontSize: '0.8rem' }}>Current Stays</p>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#2563eb' }}>{metrics.ongoingCount}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '1rem' }}>Completed</h4>
                    <p style={{ margin: 0, color: '#ef4444', fontSize: '0.8rem' }}>Past Bookings</p>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>{metrics.completedCount}</div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </div>

      {businessType === 'dining' && (
        <motion.div variants={fadeUp} className="chart-card" style={{marginTop:'25px', padding:'24px'}}>
          <h3><Utensils size={20} color="var(--primary-color)" /> Popular Dining Offerings</h3>
          <div className="dishes-grid" style={{
            display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', 
            gap:'20px', marginTop:'25px'
          }}>
             {topDishes.length > 0 ? topDishes.map((dish, i) => (
               <div key={i} style={{
                 background:'#f8fafc', padding:'20px', borderRadius:'15px', 
                 border:'1px solid #e2e8f0', transition:'all 0.3s ease'
               }} className="popular-dish-card">
                  <div style={{fontWeight:'800', color:'#1e293b', fontSize:'16px'}}>{dish.name}</div>
                  <div style={{fontSize:'12px', color:'#64748b', marginTop:'4px', fontWeight:'600'}}>{dish.category}</div>
                  <div style={{
                    fontSize:'16px', fontWeight:'800', color:'#b7791f', 
                    marginTop:'12px', display:'flex', justifyContent:'space-between'
                  }}>
                    <span>Rs. {Number(dish.price).toLocaleString()}</span>
                  </div>
               </div>
             )) : (
               <div style={{gridColumn:'1/-1', textAlign:'center', color:'#64748b', padding:'40px', background:'#f8fafc', borderRadius:'15px'}}>
                 <Utensils size={32} style={{opacity:0.2, marginBottom:'10px'}}/>
                 <p>No special dishes highlighted yet.</p>
               </div>
             )}
          </div>
        </motion.div>
      )}

      {/* RECENT BOOKINGS TABLE */}
      <motion.div variants={fadeUp} className="chart-card" style={{ padding: '0', overflow: 'hidden' }}>
        <h3 style={{ padding: '24px 24px 16px', margin: 0, borderBottom: '1px solid #e2e8f0' }}>Recent Transactions</h3>
        <div className="revenue-table-container">
          <table className="revenue-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Purchaser</th>
                <th>Place & Room</th>
                <th>Date Logged</th>
                <th>Revenue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>#BK-{b.id}</td>
                  <td>{b.customer_name || b.full_name || '-'}</td>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{b.place_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.room_name || 'N/A'}</div>
                  </td>
                  <td>{new Date(b.created_at).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 'bold' }}>Rs. {Number(b.total_price || 0).toLocaleString()}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold',
                      background: b.status === 'CONFIRMED' ? '#d1fae5' : b.status === 'REJECTED' || b.status === 'CANCELLED' ? '#fee2e2' : '#e0f2fe',
                      color: b.status === 'CONFIRMED' ? '#065f46' : b.status === 'REJECTED' || b.status === 'CANCELLED' ? '#991b1b' : '#075985'
                    }}>
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>No transactions recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  );
};

export default OwnerRevenue;
