import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CreditCard, Calendar, Lock, CheckCircle, X, MoreHorizontal, ShieldCheck } from 'lucide-react';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, onPaymentSuccess, amount }) => {
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.slice(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || '';
    setCardData({ ...cardData, number: formatted });
  };

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardData({ ...cardData, expiry: val });
  };

  const handlePay = (e) => {
    e.preventDefault();
    setProcessing(true);

    // Simulate delay
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess({
          transaction_id: 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          method: 'CREDIT_CARD'
        });
      }, 1500);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="payment-overlay">
      <motion.div 
        className="payment-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
      >
        <button className="btn-close" onClick={onClose}>
          <X size={18} />
        </button>

        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="payment-header">
                <p>Total amount: <span>Rs. {amount.toLocaleString()}</span></p>
              </div>

              {/* Ultra Premium Card */}
              <div className="card-container">
                <div className="card-visual">
                  <div className="card-chip"></div>
                  <div className="card-number-display">
                    {cardData.number || '4242 1234 5678 9999'}
                  </div>
                  <div className="card-details-row">
                    <div className="card-holder-display">
                      <span className="card-value">{cardData.name || 'JOHN DOE'}</span>
                    </div>
                    <div className="card-expiry-display">
                      <span className="card-label" style={{textAlign: 'right'}}>Expires</span>
                      <span className="card-value">{cardData.expiry || '04/28'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <form className="payment-form" onSubmit={handlePay}>
                <div className="form-group">
                  <div className="form-group-label">Cardholder Name</div>
                  <div className="input-container">
                    <User size={18} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      required 
                      value={cardData.name}
                      onChange={(e) => setCardData({...cardData, name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="form-group-label">Card Number</div>
                  <div className="input-container">
                    <CreditCard size={18} className="input-icon" />
                    <input 
                      type="text" 
                      placeholder="4242 1234 5678 9999" 
                      required 
                      value={cardData.number}
                      onChange={handleCardNumberChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <div className="form-group-label">Expiry Date</div>
                    <div className="input-container">
                      <Calendar size={18} className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="04/28" 
                        required 
                        value={cardData.expiry}
                        onChange={handleExpiryChange}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <div className="form-group-label">CVV</div>
                    <div className="input-container">
                      <MoreHorizontal size={18} className="input-icon" />
                      <input 
                        type="text" 
                        placeholder="..." 
                        maxLength="3"
                        required 
                        value={cardData.cvv}
                        onChange={(e) => setCardData({...cardData, cvv: e.target.value.replace(/\D/g, '')})}
                      />
                    </div>
                  </div>
                </div>

                <button className="pay-btn" type="submit" disabled={processing}>
                  {processing ? (
                    <><span className="loader"></span> Processing...</>
                  ) : (
                    <><Lock size={18} /> Pay Rs. {amount.toLocaleString()}</>
                  )}
                </button>
              </form>

              <div className="payment-footer">
                <div className="secure-tag">
                  <ShieldCheck size={16} /> Secure Payment
                </div>
                <div className="encryption-tag">
                  256-bit SSL encryption
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="success"
              className="success-checkmark"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <CheckCircle size={70} color="#10b981" />
              <h3>Payment Successful!</h3>
              <p>Finalizing your booking details...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PaymentModal;
