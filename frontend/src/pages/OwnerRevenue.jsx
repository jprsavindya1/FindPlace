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
  const [stayAnalytics, setStayAnalytics] = useState([]); // ⭐ NEW
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
      const endpoint = businessType === 'dining' 
        ? `${API_BASE_URL}/api/reservations/owner/all` 
        : `${API_BASE_URL}/api/bookings/owner`;
      
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Normalize Dining Data to fit the "bookings" structure used in metrics
      const rawData = res.data || [];
      const normalizedData = businessType === 'dining' ? rawData.map(r => ({
        ...r,
        total_price: Number(r.total_price) || 0,
        check_in: r.res_date,
        check_out: r.res_date, // Dining is same day
        status: (r.status || "").toUpperCase()
      })) : rawData;

      setBookings(normalizedData);

      // If stay mode, also fetch the pre-aggregated analytics
      if (businessType === 'accommodation') {
        const analyticsRes = await axios.get(`${API_BASE_URL}/api/owner/stay/analytics/revenue`, {
          params: { placeId: filterPlaceId },
          headers: { Authorization: `Bearer ${token}` }
        });
        setStayAnalytics(analyticsRes.data);
      }
    } catch (err) {
      console.error("Failed to fetch data for revenue dashboard", err);
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
        const date = new Date(b.created_at || b.res_date);
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyRevenueMap[monthYear] = (monthlyRevenueMap[monthYear] || 0) + price;
        
        // Time Status Calculation
        if (businessType === 'dining') {
          // DINING LOGIC: Use res_date and res_time
          const resDateStr = b.res_date ? b.res_date.split('T')[0] : '';
          const resTimeStr = b.res_time || '00:00:00';
          const resFullDate = new Date(`${resDateStr}T${resTimeStr}`);
          
          const now = new Date();
          const twoHoursLater = new Date(resFullDate.getTime() + (2 * 60 * 60 * 1000));

          if (status === 'COMPLETED' || twoHoursLater < now) {
            completedCount++;
          } else if (resFullDate <= now && twoHoursLater >= now) {
            ongoingCount++;
          } else {
            upcomingCount++;
          }
        } else {
          // STAY LOGIC: Use check_in and check_out
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
      }
    });

    // Formatting Monthly Data for Recharts
    const monthlyData = businessType === 'accommodation' && stayAnalytics.length > 0 
      ? stayAnalytics.map(a => ({
          name: new Date(2026, a.month - 1).toLocaleString('default', { month: 'short' }),
          Revenue: Number(a.revenue)
        }))
      : Object.keys(monthlyRevenueMap).map(key => ({
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

      <div className="revenue-kpi-grid">
        <motion.div variants={fadeUp} className="kpi-card">
          <div className="kpi-info" style={{ paddingLeft: '0' }}>
            <h4>{businessType === 'dining' ? "TOTAL DINING SALES" : "TOTAL REVENUE"}</h4>
            <p>Rs. {metrics.totalRevenue.toLocaleString()}</p>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="kpi-card successful">
          <div className="kpi-icon"><TrendingUp size={24} /></div>
          <div className="kpi-info">
            <h4>{businessType === 'dining' ? "SUCCESSFUL RESERVATIONS" : "SUCCESSFUL BOOKINGS"}</h4>
            <p>{metrics.successfulBookingsCount}</p>
            <div className="subtitle">{businessType === 'dining' ? "Confirmed & Completed" : "Confirmed & Completed"}</div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="kpi-card top-place">
          <div className="kpi-icon"><MapPin size={24} /></div>
          <div className="kpi-info">
            <h4>{filterPlaceId === "ALL" ? (businessType === 'dining' ? "TOP RESTAURANT" : "TOP EARNING PLACE") : (businessType === 'dining' ? "THIS RESTAURANT" : "SELECTED PROPERTY")}</h4>
            <p className="place-name">{filterPlaceId === "ALL" ? metrics.topPlaceName : (places.find(p => String(p.id) === String(filterPlaceId))?.name || "This Business")}</p>
            <div className="subtitle">{filterPlaceId === "ALL" ? `Rs. ${metrics.topPlaceRevenue.toLocaleString()} Generated` : "Performance Overview"}</div>
          </div>
        </motion.div>
      </div>

      {/* CHARTS GRID */}
      <div className={businessType === 'dining' ? "charts-grid dining-layout" : "charts-grid"}>
        {/* LEFT COLUMN: TREND CHART (Hidden for Dining) */}
        {businessType !== 'dining' && (
          <motion.div variants={fadeUp} className="chart-card">
            <h3>
              <TrendingUp size={20} color="var(--primary-color)" /> 
              Monthly Revenue Trend
            </h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={metrics.monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(value) => `Rs.${value/1000}k`} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="Revenue" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* RIGHT COLUMN: DONUT STATUS */}
        <motion.div variants={fadeUp} className="chart-card">
          <h3>
             {businessType === 'dining' ? <Clock size={20} color="var(--primary-color)" /> : <CalendarCheck size={20} color="var(--primary-color)" />}
             {businessType === 'dining' ? " Reservation Status" : " Booking Time Status"}
          </h3>
          
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
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                  {businessType === 'dining' ? "No Reservations Yet" : "No Bookings Yet"}
                </div>
              )}
            </div>

            <div className="status-grid">
              <div className="status-item upcoming">
                <div className="status-text">
                  <h4>Upcoming</h4>
                  <p>{businessType === 'dining' ? "Future Tables" : "Future Bookings"}</p>
                </div>
                <div className="status-value">{metrics.upcomingCount}</div>
              </div>

              <div className="status-item ongoing">
                <div className="status-text">
                  <h4>Ongoing</h4>
                  <p>{businessType === 'dining' ? "Currently Seated" : "Current Stays"}</p>
                </div>
                <div className="status-value">{metrics.ongoingCount}</div>
              </div>

              <div className="status-item completed">
                <div className="status-text">
                  <h4>Completed</h4>
                  <p>{businessType === 'dining' ? "Past Visits" : "Past Bookings"}</p>
                </div>
                <div className="status-value">{metrics.completedCount}</div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>

      {/* ADDITIONAL DINING CHARTS (MOVED BELOW) */}
      {businessType === 'dining' && (
        <div className="charts-grid" style={{ marginTop: '25px', gridTemplateColumns: '1fr' }}>
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
        </div>
      )}

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
                  <th>BOOKING ID</th>
                  <th>PURCHASER</th>
                  <th>PLACE & ROOM</th>
                  <th>DATE LOGGED</th>
                  <th>REVENUE</th>
                  <th>STATUS</th>
                </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map(b => (
                <tr key={b.id}>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {businessType === 'dining' ? `#DINE-${b.id}` : `#BK-${b.id}`}
                  </td>
                  <td>{b.customer_name || b.full_name || '-'}</td>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{b.place_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                       {businessType === 'dining' ? (b.table_no ? `Table ${b.table_no}` : 'Table TBD') : (b.room_name || 'N/A')}
                    </div>
                  </td>
                  <td>{new Date(b.created_at || b.res_date).toLocaleDateString()}</td>
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
