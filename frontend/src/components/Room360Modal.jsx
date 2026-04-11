import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RotateCcw, MousePointer2, ExternalLink, Plus, Minus, Maximize, Minimize } from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';

const Room360Modal = ({ isOpen, onClose, roomLabel, image360 }) => {
  const viewerRef = useRef(null);
  const pannellumInstance = useRef(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen && image360 && window.pannellum) {
      // Small delay to ensure the container is rendered
      const timer = setTimeout(() => {
        const imageUrl = image360.startsWith('http') 
          ? image360 
          : `${API_BASE_URL}/uploads/rooms/${image360}`;

        pannellumInstance.current = window.pannellum.viewer('panorama-container', {
          type: 'equirectangular',
          panorama: imageUrl,
          autoLoad: true,
          autoRotate: -2,
          compass: false,
          showFullscreenCtrl: false, // We use custom controls
          showZoomCtrl: false,       // We use custom controls
          hfov: 110,
          vaov: 180,
          haov: 360
        });
      }, 100);

      // Auto-hide instructions after 5 seconds
      const instructionTimer = setTimeout(() => {
        setShowInstructions(false);
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(instructionTimer);
        if (pannellumInstance.current) {
          pannellumInstance.current.destroy();
        }
      };
    }
    
    if (isOpen) {
      setShowInstructions(true);
      setIsFullscreen(false);
    }
  }, [isOpen, image360]);

  const handleReset = () => {
    if (pannellumInstance.current) {
      pannellumInstance.current.setYaw(0);
      pannellumInstance.current.setPitch(0);
      pannellumInstance.current.setHfov(110);
    }
  };

  const handleZoom = (delta) => {
    if (pannellumInstance.current) {
      const currentHfov = pannellumInstance.current.getHfov();
      pannellumInstance.current.setHfov(currentHfov + (delta * -10));
    }
  };

  const toggleFullscreen = () => {
    const element = document.getElementById('panorama-modal-root');
    if (!isFullscreen) {
      if (element.requestFullscreen) element.requestFullscreen();
      else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
      else if (element.msRequestFullscreen) element.msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (document.msExitFullscreen) document.msExitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const glassStyle = {
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          id="panorama-modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#000',
            zIndex: 999999,
          }}
        >
          {/* Fullscreen Panorama Container */}
          <div 
            id="panorama-container" 
            style={{ width: '100%', height: '100%' }}
          />

          {/* Top-Left Navigation & Title */}
          <div style={{
            position: 'absolute',
            top: '30px',
            left: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            zIndex: 10,
            pointerEvents: 'none'
          }}>
            <motion.button
              whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.25)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              style={{
                ...glassStyle,
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '1rem',
                fontWeight: '700',
                pointerEvents: 'auto'
              }}
            >
              <ArrowLeft size={20} /> Back
            </motion.button>

            <div style={{
              ...glassStyle,
              padding: '12px 24px',
              borderRadius: '16px',
              color: '#fff'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
                {roomLabel || "Room View"}
              </h3>
            </div>
          </div>

          {/* Custom Navigation Controls (Bottom-Left) */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            left: '40px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 10
          }}>
            <motion.button
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.25)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleZoom(1)}
              style={{ ...glassStyle, width: '48px', height: '48px', borderRadius: '14px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Plus size={22} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.25)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleZoom(-1)}
              style={{ ...glassStyle, width: '48px', height: '48px', borderRadius: '14px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Minus size={22} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.25)' }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleFullscreen}
              style={{ ...glassStyle, width: '48px', height: '48px', borderRadius: '14px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
            </motion.button>
          </div>

          {/* Bottom-Center Instructions */}
          <AnimatePresence>
            {showInstructions && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                style={{
                  position: 'absolute',
                  bottom: '40px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                  ...glassStyle,
                  padding: '10px 20px',
                  borderRadius: '30px',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}
              >
                <MousePointer2 size={16} /> Drag to explore | Scroll to zoom
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom-Right View from Window Button */}
          <div style={{
            position: 'absolute',
            bottom: '40px',
            right: '40px',
            zIndex: 10
          }}>
            <motion.button
              whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.25)' }}
              whileTap={{ scale: 0.95 }}
              style={{
                ...glassStyle,
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '1rem',
                fontWeight: '700'
              }}
            >
              <ExternalLink size={20} /> View from Window
            </motion.button>
          </div>

          {/* Subtle Reset Icon (Kept small/discreet) */}
          <div style={{ position: 'absolute', top: '30px', right: '30px', zIndex: 10 }}>
             <motion.button
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.25)' }}
              whileTap={{ scale: 0.9 }}
              onClick={handleReset}
              style={{
                ...glassStyle,
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Reset View"
            >
              <RotateCcw size={18} />
            </motion.button>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Room360Modal;
