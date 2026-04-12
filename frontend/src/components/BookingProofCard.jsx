import React, { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { 
  Download, 
  Copy, 
  Check, 
  MapPin, 
  Utensils,
  Bed
} from "lucide-react";
import html2pdf from "html2pdf.js";

const BookingProofCard = ({ booking, onClose }) => {
  const cardRef = useRef(null);
  const pdfRef = useRef(null);
  const [copied, setCopied] = React.useState(false);

  const orderId = booking.order_id || `FP-RES-${String(booking.id).padStart(4, '0')}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(orderId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const token = localStorage.getItem("token");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5007";
    const endpoint = isDine ? "reservations" : "bookings";
    
    // Robust ID retrieval: check .id, then ._id, then parse from order_id
    const rawId = booking.id || booking._id;
    let finalId = rawId;

    if (!finalId && orderId) {
      // If orderId is "FP-STAY-0017", split gives ["FP", "STAY", "0017"], pop gives "0017"
      const parts = orderId.split('-');
      const possibleId = parts[parts.length - 1];
      if (!isNaN(possibleId)) {
        finalId = parseInt(possibleId, 10);
      }
    }

    if (!finalId) {
      console.error("❌ PDF Download Error: Could not determine booking ID", booking);
      alert("Error: Could not determine booking ID. Please try again.");
      return;
    }
    
    console.log(`🚀 Downloading PDF for ${endpoint}/${finalId}`);
    const downloadUrl = `${baseUrl}/api/${endpoint}/invoice/${finalId}?token=${token}&cb=${Date.now()}`;
    window.open(downloadUrl, '_blank');
  };

  const isDine = orderId.includes("DINE") || booking.res_date;
  
  const qrPayload = JSON.stringify({
    order_id: orderId,
    type: isDine ? "dining" : "stay",
    customer: booking.customer_name || "Guest User",
    place: booking.place_name || "Property",
    date: new Date(booking.res_date || booking.check_in).toLocaleDateString('en-GB'),
    time: isDine ? (booking.res_time ? booking.res_time.slice(0, 5) : "TBD") : "Check-in after 2PM",
    guests: isDine ? `${booking.people_count || 2} Pax` : `${booking.adults || 2} Adults`,
    status: "Verified ✅"
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}>
      
      {/* LUXURY DARK & GOLD PDF TEMPLATE */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div 
          ref={pdfRef}
          style={{ 
            width: '210mm', 
            background: isDine ? '#121212' : '#040b17',
            color: '#ffffff',
            fontFamily: "'Georgia', serif, Arial",
            padding: '35px',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          {/* Decorative Outer Border */}
          <div style={{ 
            border: isDine ? '4px double #d4af37' : '2px solid #3b82f6', 
            borderRadius: '15px', 
            padding: '30px', 
            minHeight: '260mm', 
            position: 'relative', 
            boxSizing: 'border-box' 
          }}>
            
            {/* Header Decor */}
            <div style={{ textAlign: 'center', marginBottom: '0' }}>
               <div style={{ color: '#d4af37', fontSize: '30px', lineHeight: '1' }}>❦</div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h1 style={{ margin: '0 0 5px 0', fontSize: '42px', fontWeight: 900, color: isDine ? '#d4af37' : '#3b82f6', textTransform: 'uppercase', letterSpacing: '5px' }}>{booking.place_name}</h1>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '3px', borderBottom: `2px solid ${isDine ? '#333' : '#3b82f6'}`, display: 'inline-block', paddingBottom: '8px' }}>Booking Confirmation</h2>
            </div>

            {/* QR Section - Redesigned for Stay as per user request */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
               <div style={{ 
                 background: isDine ? '#ffffff' : 'transparent', 
                 padding: isDine ? '12px' : '0', 
                 borderRadius: '15px', 
                 border: isDine ? '2px solid #d4af37' : '4px solid #3b82f6',
                 overflow: 'hidden',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 width: isDine ? 'auto' : '170px',
                 height: isDine ? 'auto' : '170px'
               }}>
                 <QRCodeSVG 
                    value={qrPayload} 
                    size={isDine ? 150 : 170} 
                    level="H" 
                    includeMargin={isDine ? true : false} 
                    bgColor={isDine ? "#ffffff" : "transparent"}
                    fgColor={isDine ? "#000000" : "#ffffff"}
                 />
               </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
               <div style={{ fontSize: '10px', color: isDine ? '#d4af37' : '#3b82f6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '5px' }}>Order Confirmation ID</div>
               <div style={{ fontSize: '32px', fontWeight: 900, color: isDine ? '#d4af37' : '#3b82f6', fontFamily: "'Inter', sans-serif, Arial", letterSpacing: '1px' }}>{orderId}</div>
            </div>

            {/* Details Grid (2x2) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: `1px solid ${isDine ? '#d4af37' : '#3b82f6'}` }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: isDine ? '#d4af37' : '#3b82f6', marginBottom: '4px', textTransform: 'uppercase' }}>PROPERTY</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>{booking.place_name}</div>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: `1px solid ${isDine ? '#d4af37' : '#3b82f6'}` }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: isDine ? '#d4af37' : '#3b82f6', marginBottom: '4px', textTransform: 'uppercase' }}>BOOKING TYPE</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: isDine ? '#d4af37' : '#ffffff' }}>
                    {isDine ? "Dining Reservation" : (booking.room_name || "Accommodation Stays")}
                  </div>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: `1px solid ${isDine ? '#d4af37' : '#3b82f6'}` }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: isDine ? '#d4af37' : '#3b82f6', marginBottom: '4px', textTransform: 'uppercase' }}>RESERVATION DATE</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', fontFamily: "'Inter', sans-serif, Arial" }}>{new Date(booking.res_date || booking.check_in).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: `1px solid ${isDine ? '#d4af37' : '#3b82f6'}` }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: isDine ? '#d4af37' : '#3b82f6', marginBottom: '4px', textTransform: 'uppercase' }}>ARRIVAL TIME</div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', fontFamily: "'Inter', sans-serif, Arial" }}>{isDine ? (booking.res_time ? booking.res_time.slice(0, 5) : "TBD") : "Check-in after 2PM"}</div>
               </div>
            </div>

            {/* Guest Details Section (NEW) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: `1px solid ${isDine ? '#d4af37' : '#3b82f6'}` }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: isDine ? '#d4af37' : '#3b82f6', marginBottom: '4px', textTransform: 'uppercase' }}>GUEST NAME</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>{booking.full_name || booking.customer_name || 'Guest'}</div>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: `1px solid ${isDine ? '#d4af37' : '#3b82f6'}` }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: isDine ? '#d4af37' : '#3b82f6', marginBottom: '4px', textTransform: 'uppercase' }}>CONTACT DETAIL</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>{booking.phone || 'N/A'}</div>
                  <div style={{ fontSize: '10px', color: '#aaaaaa' }}>{booking.email || ''}</div>
               </div>
            </div>

            {/* Stay/Dining Metrics (NEW) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: `1px solid ${isDine ? '#d4af37' : '#3b82f6'}` }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: isDine ? '#d4af37' : '#3b82f6', marginBottom: '4px', textTransform: 'uppercase' }}>{isDine ? "GUEST COUNT" : "ROOMS / GUESTS"}</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                    {isDine ? `${booking.people_count} People` : `${booking.num_rooms || 1} Room(s) • ${booking.adults} Adults`}
                  </div>
               </div>
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '12px', border: `1px solid ${isDine ? '#d4af37' : '#3b84f6'}`, borderColor: '#10b981' }}>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: '#10b981', marginBottom: '4px', textTransform: 'uppercase' }}>TOTAL PAYMENT</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#10b981', fontFamily: "'Inter', sans-serif" }}>Rs. {Number(booking.total_price || 0).toLocaleString()}</div>
               </div>
            </div>

            {/* Food Order Section (For Dining) */}
            {isDine && booking.food_order_items && (
               <div style={{ background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '15px', border: '1px dashed #d4af37', marginBottom: '25px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#d4af37', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pre-ordered Delicacies</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {JSON.parse(booking.food_order_items).map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                           <span style={{ color: '#ffffff', fontWeight: 600 }}>{item.quantity}x {item.name}</span>
                           <span style={{ color: '#d4af37' }}>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}

            <div style={{ background: isDine ? 'rgba(212, 175, 55, 0.05)' : 'rgba(59, 130, 246, 0.05)', padding: '15px 20px', borderRadius: '10px', marginBottom: '35px', border: `1px solid ${isDine ? '#d4af3766' : '#3b82f666'}` }}>
               <p style={{ margin: 0, fontSize: '12px', color: '#bbbbbb', lineHeight: '1.5', textAlign: 'center' }}>
                  {isDine ? "Present this QR code to the restaurant host." : "Present this QR code at the reception desk upon arrival."} This is a digitally verified reservation.
               </p>
            </div>

            <div style={{ borderTop: '1px solid #333333', paddingTop: '20px', marginBottom: '25px' }}></div>

            {/* Bottom Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
               <div style={{ maxWidth: '60%' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: 900, color: isDine ? '#d4af37' : '#3b82f6', textTransform: 'uppercase' }}>Contact & Policies</h4>
                  <div style={{ fontSize: '12px', color: '#aaaaaa', lineHeight: '1.6' }}>
                     • Contact <strong>{booking.place_name}</strong>: {booking.place_phone}<br/>
                     • Location: {booking.place_location}<br/>
                     • {isDine ? "Please cancel at least 2 hours in advance." : "Please arrive after 2:00 PM for smooth check-in."}
                  </div>
               </div>
               
               <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ background: isDine ? '#d4af37' : '#3b82f6', padding: '10px 20px', borderRadius: '10px', color: isDine ? '#000000' : '#ffffff', textAlign: 'center', marginBottom: '15px' }}>
                     <div style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>{isDine ? "TABLE RESERVED" : "ROOM RESERVED"}</div>
                     <div style={{ fontSize: '9px', fontWeight: 700 }}>{isDine ? "Enjoy your dining experience" : "Enjoy your stay experience"}</div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#666' }}>FindPlace | findplace.com</div>
               </div>
            </div>

            {/* Welcome Badge */}
            <div style={{ position: 'absolute', bottom: '-20px', left: '50%', transform: 'translateX(-50%)' }}>
               <div style={{ background: isDine ? '#d4af37' : '#3b82f6', padding: '6px 35px', borderRadius: '50px', color: isDine ? '#000000' : '#ffffff', fontWeight: 900, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '2px', border: `4px solid ${isDine ? '#121212' : '#040b17'}` }}>WELCOME</div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '25px', color: isDine ? '#d4af37' : '#3b82f6', fontSize: '10px', opacity: 0.5 }}>Thank you for booking with FindPlace.</div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        <div 
          ref={cardRef}
          className="bg-white rounded-[28px] overflow-hidden"
          style={{ 
            background: 'white', 
            borderRadius: '28px', 
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            maxHeight: '85vh',
            overflowY: 'auto'
          }}
        >
          {/* UI Header */}
          <div style={{ background: '#003580', padding: '20px 24px', color: 'white', position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Digital Booking Proof</div>
                <h2 style={{ margin: '4px 0 0 0', fontSize: '1.3rem', fontWeight: 900 }}>FindPlace Confirmation</h2>
             </div>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{ background: '#f0f4f8', padding: '12px', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                <QRCodeSVG value={qrPayload} size={130} level="H" includeMargin={true} />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
               <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Order Confirmation ID</div>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#003580' }}>{orderId}</span>
                  <button onClick={handleCopy} style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: copied ? '#059669' : '#003580', padding: '10px', borderRadius: '10px' }}>
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
               </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 900, marginBottom: '3px' }}>PROPERTY</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{booking.place_name}</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 900, marginBottom: '3px' }}>BOOKING TYPE</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#003580', display: 'flex', alignItems: 'center', gap: '5px' }}>
                   {isDine ? <Utensils size={14} /> : <Bed size={14} />}
                   {isDine ? 'Dining' : (booking.room_name || 'Stay')}
                </div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 900, marginBottom: '3px' }}>RESERVATION DATE</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{new Date(booking.res_date || booking.check_in).toLocaleDateString('en-GB')}</div>
              </div>
              <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', color: '#475569', fontWeight: 900, marginBottom: '3px' }}>ARRIVAL TIME</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{isDine ? (booking.res_time ? booking.res_time.slice(0, 5) : "TBD") : "Check-in after 2PM"}</div>
              </div>
            </div>

            <div style={{ background: '#00358010', padding: '14px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#003580' }}>
               <MapPin size={18} />
               <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Scan QR at reception for instant check-in.</span>
            </div>
          </div>

          <div style={{ padding: '0 24px 24px 24px', display: 'flex', gap: '10px' }}>
             <button onClick={handleDownload} style={{ flex: 1, padding: '14px', borderRadius: '14px', background: '#003580', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Download size={18} /> Download
             </button>
             <button onClick={onClose} style={{ padding: '14px 20px', borderRadius: '14px', background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1', fontWeight: 900, cursor: 'pointer' }}>
                Close
             </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookingProofCard;
