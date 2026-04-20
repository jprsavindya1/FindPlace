import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Save, Trash2, Undo2, RotateCcw, 
  Maximize, Minus, Search, Info, MousePointer2, 
  LayoutDashboard, Star, CheckCircle2, X, Settings, Layers,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Move, Upload, Image as ImageIcon, Sparkles
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../../apiConfig';
import './FloorPlanDesigner.css';

// --- CUSTOM SVG ICONS FOR ASSETS (BALANCED SCALE) ---
const IconSmall = ({ color }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="9" width="12" height="6" rx="1.5" fill={color} />
    <rect x="3" y="10" width="2" height="4" rx="1" fill={color} opacity="0.5" />
    <rect x="19" y="10" width="2" height="4" rx="1" fill={color} opacity="0.5" />
  </svg>
);

const IconMedium = ({ color }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="6" width="6" height="12" rx="1.5" fill={color} />
    <rect x="11" y="3" width="2" height="2" rx="0.5" fill={color} opacity="0.5" />
    <rect x="11" y="19" width="2" height="2" rx="0.5" fill={color} opacity="0.5" />
    <rect x="6" y="9" width="2" height="6" rx="0.5" fill={color} opacity="0.5" />
    <rect x="16" y="9" width="2" height="6" rx="0.5" fill={color} opacity="0.5" />
  </svg>
);

const IconLarge = ({ color }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="4" width="8" height="16" rx="2" fill={color} />
    <rect x="5" y="5" width="2.5" height="2.5" rx="0.5" fill={color} opacity="0.4" />
    <rect x="5" y="8.5" width="2.5" height="2.5" rx="0.5" fill={color} opacity="0.4" />
    <rect x="5" y="12" width="2.5" height="2.5" rx="0.5" fill={color} opacity="0.4" />
    <rect x="5" y="15.5" width="2.5" height="2.5" rx="0.5" fill={color} opacity="0.4" />
    <rect x="16.5" y="5" width="2.5" height="2.5" rx="0.5" fill={color} opacity="0.4" />
    <rect x="16.5" y="8.5" width="2.5" height="2.5" rx="0.5" fill={color} opacity="0.4" />
    <rect x="16.5" y="12" width="2.5" height="2.5" rx="0.5" fill={color} opacity="0.4" />
    <rect x="16.5" y="15.5" width="2.5" height="2.5" rx="0.5" fill={color} opacity="0.4" />
  </svg>
);

const IconVIP = ({ color }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H20V20H16V8H8V20H4V4Z" fill={color} opacity="0.8" />
    <rect x="10" y="11" width="4" height="6" rx="1.5" fill={color} />
  </svg>
);

const PRESETS = [
  { id: 'small', label: 'Small', chairs: 2, capacity: 2, width: 6, height: 6, color: '#3b82f6', icon: <IconSmall color="#3b82f6" /> },
  { id: 'medium', label: 'Medium', chairs: 4, capacity: 4, width: 8, height: 6, color: '#10b981', icon: <IconMedium color="#10b981" /> },
  { id: 'large', label: 'Large', chairs: 10, capacity: 10, width: 12, height: 8, color: '#ff6b00', icon: <IconLarge color="#ff6b00" /> },
  { id: 'vip', label: 'VIP Booth', chairs: 8, capacity: 8, width: 10, height: 10, color: '#fbbf24', icon: <IconVIP color="#fbbf24" />, isVip: true },
];

const SNAP_VALUE = 2; // 2% Snap for precise alignment

const FloorPlanDesigner = ({ placeId, onSaveSuccess, setIsDesignerMode }) => {
  const [tables, setTables] = useState([]);
  const [placeData, setPlaceData] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [activePreset, setActivePreset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  
  // Panning State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  // Image Upload State
  const [isUploading, setIsUploading] = useState(false);
  
  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const fileInputRef = useRef(null);

  const fetchTables = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/tables/place/${placeId}`);
      setTables(res.data.map(t => ({
        ...t,
        pos_x: parseFloat(t.pos_x) || 0,
        pos_y: parseFloat(t.pos_y) || 0,
        width: parseFloat(t.width) || 8,
        height: parseFloat(t.height) || 8
      })));
    } catch (err) {
      console.error('Fetch tables failed', err);
    }
  }, [placeId]);

  const fetchPlace = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/places/${placeId}`);
      setPlaceData(res.data);
    } catch (err) {
      console.error('Fetch place failed', err);
    }
  }, [placeId]);

  useEffect(() => {
    setLoading(true);
    const init = async () => {
      await Promise.all([fetchTables(), fetchPlace()]);
      setLoading(false);
    };
    init();
  }, [fetchTables, fetchPlace]);

  const saveHistory = useCallback((currentTables) => {
    const stateToSave = currentTables || tables;
    setHistory(prev => [...prev.slice(-19), JSON.stringify(stateToSave)]);
    setHasUnsavedChanges(true);
  }, [tables]);

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setTables(JSON.parse(last));
    setHistory(prev => prev.slice(0, -1));
    if (history.length === 1) setHasUnsavedChanges(false);
  };

  const updateTable = (id, updates) => {
    setTables(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleCanvasClick = (e) => {
    if (isPanning) return;
    
    if (e.target === canvasRef.current && activePreset) {
      const parent = canvasRef.current.getBoundingClientRect();
      const rawX = ((e.clientX - parent.left) / parent.width) * 100;
      const rawY = ((e.clientY - parent.top) / parent.height) * 100;
      
      const snappedX = Math.round(rawX / SNAP_VALUE) * SNAP_VALUE;
      const snappedY = Math.round(rawY / SNAP_VALUE) * SNAP_VALUE;

      const newTable = {
        id: `new-${Date.now()}`,
        table_no: `T-${tables.length + 1}`,
        capacity: activePreset.capacity,
        pos_x: Math.max(0, Math.min(100 - activePreset.width, snappedX - activePreset.width / 2)),
        pos_y: Math.max(0, Math.min(100 - activePreset.height, snappedY - activePreset.height / 2)),
        width: activePreset.width,
        height: activePreset.height,
        table_type: activePreset.isVip ? 'VIP' : 'Standard',
        min_spend: 0,
        status: 'available',
        shape: activePreset.isVip ? 'circle' : 'rect'
      };
      
      saveHistory(); 
      setTables(prev => [...prev, newTable]);
      setActivePreset(null);
      setSelectedTableId(newTable.id);
    } else if (e.target === canvasRef.current) {
      setSelectedTableId(null);
    }
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || (e.button === 0 && !selectedTableId && !activePreset)) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      
      await axios.put(`${API_BASE_URL}/api/tables/bulk/layout`, { 
        place_id: placeId,
        tables 
      }, {
        headers: { Authorization: "Bearer " + token }
      });
      
      setHasUnsavedChanges(false);
      alert('Floor plan saved successfully! ✨');
      await fetchTables();
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      console.error('Save failed', err);
      const serverError = err.response?.data?.error || err.response?.data?.message || "Unknown server error";
      alert(`Failed to save floor plan: ${serverError} ❌`);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('floor_plan', file);

    setIsUploading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API_BASE_URL}/api/places/owner/places/${placeId}/floor-plan`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Floor plan image uploaded successfully! 🎇');
      fetchPlace(); 
    } catch (err) {
      console.error('Upload failed', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id) => {
    saveHistory();
    setTables(prev => prev.filter(t => t.id !== id));
    setSelectedTableId(null);
  };

  const handleNudge = (id, dir) => {
    const table = tables.find(t => t.id === id);
    if (!table) return;
    saveHistory();
    const step = 0.5;
    if (dir === 'up') updateTable(id, { pos_y: Math.max(0, table.pos_y - step) });
    if (dir === 'down') updateTable(id, { pos_y: Math.min(100 - table.height, table.pos_y + step) });
    if (dir === 'left') updateTable(id, { pos_x: Math.max(0, table.pos_x - step) });
    if (dir === 'right') updateTable(id, { pos_x: Math.min(100 - table.width, table.pos_x + step) });
  };

  const placedTables = tables.filter(t => t.pos_x !== 0 || t.pos_y !== 0);
  const unplacedTables = tables.filter(t => t.pos_x === 0 && t.pos_y === 0);
  const selectedTable = tables.find(t => t.id === selectedTableId);

  if (loading) return <div className="designer-loading">Initializing Studio Pro...</div>;

  return (
    <div className="floor-plan-designer-v3">
      {/* Top Header Bar */}
      <header className="designer-header-v3">
        <div className="header-left">
           <div className="breadcrumb">Floor Plan Designer / <span className="active">Studio v4.2</span></div>
        </div>
        <div className="header-center">
           <div className="switcher-pill-v3">
              <button className="active">Studio Mode</button>
              <button onClick={() => setIsDesignerMode(false)}>Standard View</button>
           </div>
        </div>
        <div className="header-right">
           <button className={`btn-save-v3 ${hasUnsavedChanges ? 'unsaved' : ''}`} onClick={handleSave} disabled={saving}>
             <Save size={16} /> {saving ? "Saving..." : "Save Layout"}
           </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="studio-container">
        {/* Left Sidebar: Assets */}
        <aside className="studio-sidebar left">
          <div className="sidebar-header">
            <h3>DESIGN ASSETS</h3>
          </div>
          <div className="sidebar-content">
            <motion.div 
               initial={{ opacity: 0, y: -15 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="upload-section-v4"
               style={{ marginBottom: '20px' }}
            >
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleImageUpload} 
                 style={{ display: 'none' }} 
                 accept="image/*"
               />
               <button 
                 className="btn-upload-v4" 
                 onClick={() => fileInputRef.current.click()}
                 disabled={isUploading}
               >
                 <Upload size={18} />
                 {isUploading ? "Uploading..." : "Upload Layout"}
               </button>
               <p className="upload-hint">Drag or upload your 2D layout.</p>
            </motion.div>

            <div className="sidebar-divider" style={{ margin: '0 0 20px 0' }} />

            <div className="presets-list-v3">
              {PRESETS.map((preset, index) => (
                <motion.button 
                  key={preset.id} 
                  initial={{ opacity: 0, x: -25 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 + 0.3, duration: 0.5, ease: "easeOut" }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`preset-item-v4 ${activePreset?.id === preset.id ? 'active' : ''}`}
                  onClick={() => setActivePreset(preset)}
                  style={{ '--preset-color': preset.color }}
                >
                  <div className="p-icon-v4">
                    {preset.icon}
                  </div>
                  <div className="p-details">
                    <span className="p-title-v4">{preset.label}</span>
                    <span className="p-hint-v4">{preset.chairs} Seater</span>
                  </div>
                  {activePreset?.id === preset.id && (
                    <motion.div layoutId="preset-active" className="active-glow" />
                  )}
                </motion.button>
              ))}
            </div>
            
            <div className="sidebar-tip" style={{ marginTop: 'auto' }}>
              <Sparkles size={14} style={{ color: '#fbbf24' }} />
              <p>Select an asset and click on the canvas to place it.</p>
            </div>
          </div>
        </aside>

        {/* Center Canvas Area */}
        <main 
          className="studio-canvas-area"
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Floating Mid Toolbar */}
          <div className="studio-toolbar">
             <div className="t-group">
                <button onClick={() => setZoom(prev => Math.max(0.4, prev - 0.1))}><Minus size={14}/></button>
                <span className="t-zoom">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(prev => Math.min(2.5, prev + 0.1))}><Plus size={14}/></button>
             </div>
             <div className="t-divider" />
             <div className="t-group">
                <button onClick={handleUndo} title="Undo"><Undo2 size={16}/></button>
                <button title="Redo"><RotateCcw size={16} style={{ transform: 'scaleX(-1)' }} /></button>
                <button onClick={() => { setPan({x:0, y:0}); setZoom(1); }} title="Fit View"><Maximize size={16}/></button>
                <button onClick={() => setSelectedTableId(null)} title="Clear Selection"><X size={16}/></button>
             </div>
          </div>

          <div className="canvas-viewport">
             <div 
               ref={canvasRef}
               className={`canvas-stage-v3 ${isPanning ? 'panning' : ''}`}
               onClick={handleCanvasClick}
               style={{ 
                 transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                 backgroundImage: placeData?.floor_plan_image ? `url(${API_BASE_URL}/uploads/places/${placeData.floor_plan_image})` : 'none',
                 width: '1200px',
                 height: '800px'
               }}
             >
               {!placeData?.floor_plan_image && (
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="canvas-placeholder"
                 >
                    <ImageIcon size={48} />
                    <p>Ready for your layout sitemap.</p>
                    <button onClick={() => fileInputRef.current.click()}>Choose Template</button>
                 </motion.div>
               )}
               <AnimatePresence>
                 {placedTables.map((table) => {
                   const isSelected = selectedTableId === table.id;
                   const isVip = table.table_type === 'VIP';
                   const isOccupied = table.status?.toLowerCase() !== 'available';
                   const preset = PRESETS.find(p => p.capacity === table.capacity) || PRESETS[0];

                   return (
                     <motion.div
                       key={table.id}
                       drag
                       dragMomentum={false}
                       dragElastic={0}
                       onClick={(e) => {
                         e.stopPropagation();
                         setSelectedTableId(table.id);
                       }}
                       onDragStart={(e) => {
                         e.stopPropagation();
                         setSelectedTableId(table.id);
                         saveHistory();
                       }}
                       onDrag={(e, info) => {
                          if (!canvasRef.current) return;
                          const parent = canvasRef.current.getBoundingClientRect();
                          const rawX = (info.point.x - parent.left) / (parent.width) * 100;
                          const rawY = (info.point.y - parent.top) / (parent.height) * 100;
                          const snappedX = Math.round(rawX / SNAP_VALUE) * SNAP_VALUE;
                          const snappedY = Math.round(rawY / SNAP_VALUE) * SNAP_VALUE;
                          updateTable(table.id, { 
                             pos_x: Math.max(0, Math.min(100 - table.width, snappedX - table.width/2)), 
                             pos_y: Math.max(0, Math.min(100 - table.height, snappedY - table.height/2)) 
                          });
                       }}
                       animate={{ 
                         left: `${table.pos_x}%`, 
                         top: `${table.pos_y}%`,
                         scale: isSelected ? 1.05 : 1,
                         zIndex: isSelected ? 100 : 1
                       }}
                       className={`table-sprite-v3 ${table.shape || 'rect'} ${isSelected ? 'selected' : ''} ${isVip ? 'vip' : ''} ${isOccupied ? 'occupied' : ''}`}
                       style={{
                         width: `${table.width}%`,
                         height: `${table.height}%`,
                         '--accent': isOccupied ? '#ef4444' : (isVip ? '#fbbf24' : preset.color)
                       }}
                     >
                       <div className="sprite-core" />
                       {isOccupied && <div className="occupied-effect" />}
                       <div className="label-container">
                         <span className="s-name">{table.table_no}</span>
                         {isSelected && <span className="s-pax">{table.capacity}</span>}
                         {isVip && <div className="vip-effect" />}
                       </div>
                       
                       {isSelected && (
                         <div className="selection-arrows">
                           <div className="arr t" /><div className="arr b" />
                           <div className="arr l" /><div className="arr r" />
                         </div>
                       )}
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
             </div>
          </div>
        </main>

        {/* Right Sidebar: Properties */}
        <aside className="studio-sidebar right">
          <div className="sidebar-header">
            <h3>PROPERTIES</h3>
          </div>
          <div className="sidebar-content">
            {selectedTable ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="inspector-v4"
               >
                <div className="v4-group">
                  <label>Identifier</label>
                  <input 
                    className="v4-input"
                    value={selectedTable.table_no} 
                    onChange={e => { updateTable(selectedTable.id, { table_no: e.target.value }); setHasUnsavedChanges(true); }} 
                  />
                </div>
                <div className="v4-group">
                  <label>Max Seats</label>
                  <div className="v4-counter">
                    <button onClick={() => { updateTable(selectedTable.id, { capacity: Math.max(1, selectedTable.capacity - 1) }); setHasUnsavedChanges(true); }}><Minus size={14}/></button>
                    <span>{selectedTable.capacity}</span>
                    <button onClick={() => { updateTable(selectedTable.id, { capacity: selectedTable.capacity + 1 }); setHasUnsavedChanges(true); }}><Plus size={14}/></button>
                  </div>
                </div>

                <div className="v4-group">
                  <label>Dynamic Resize (%)</label>
                  <div className="v4-dimensions">
                    <div className="v4-dim-box">
                      <span className="dim-label">W</span>
                      <button onClick={() => { updateTable(selectedTable.id, { width: Math.max(2, selectedTable.width - 0.5) }); setHasUnsavedChanges(true); }}><Minus size={12}/></button>
                      <span className="dim-val">{selectedTable.width}</span>
                      <button onClick={() => { updateTable(selectedTable.id, { width: Math.min(30, selectedTable.width + 0.5) }); setHasUnsavedChanges(true); }}><Plus size={12}/></button>
                    </div>
                    <div className="v4-dim-box">
                      <span className="dim-label">H</span>
                      <button onClick={() => { updateTable(selectedTable.id, { height: Math.max(2, selectedTable.height - 0.5) }); setHasUnsavedChanges(true); }}><Minus size={12}/></button>
                      <span className="dim-val">{selectedTable.height}</span>
                      <button onClick={() => { updateTable(selectedTable.id, { height: Math.min(30, selectedTable.height + 0.5) }); setHasUnsavedChanges(true); }}><Plus size={12}/></button>
                    </div>
                  </div>
                </div>

                <div className="v4-group">
                   <label>Micro Position</label>
                   <div className="v4-nudge-grid">
                      <div/>
                      <button className="n-btn" onClick={() => handleNudge(selectedTable.id, 'up')}><ChevronUp size={14}/></button>
                      <div/>
                      <button className="n-btn" onClick={() => handleNudge(selectedTable.id, 'left')}><ChevronLeft size={14}/></button>
                      <div className="n-center"><Move size={12}/></div>
                      <button className="n-btn" onClick={() => handleNudge(selectedTable.id, 'right')}><ChevronRight size={14}/></button>
                      <div/>
                      <button className="n-btn" onClick={() => handleNudge(selectedTable.id, 'down')}><ChevronDown size={14}/></button>
                      <div/>
                   </div>
                </div>
                
                <button className="v4-delete-btn" onClick={() => handleDelete(selectedTable.id)}>
                   <Trash2 size={16}/> Delete Asset
                </button>
              </motion.div>
            ) : (
              <div className="sidebar-empty">
                 <Move size={24} style={{ opacity: 0.3 }} />
                 <p>Select a table or drag the background to pan view.</p>
              </div>
            )}

            <div className="sidebar-header" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <h3>LIBRARY ({unplacedTables.length})</h3>
            </div>
            <div className="unplaced-list-v3">
              {unplacedTables.length > 0 ? (
                unplacedTables.map((t, idx) => (
                  <motion.div 
                    key={t.id} 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="u-item" 
                    onClick={() => {
                      setSelectedTableId(t.id);
                      saveHistory();
                      updateTable(t.id, { pos_x: 45, pos_y: 45 });
                    }}
                  >
                     <span>{t.table_no}</span>
                     <Plus size={14} />
                  </motion.div>
                ))
              ) : (
                <p className="u-empty">All assets located.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default FloorPlanDesigner;
