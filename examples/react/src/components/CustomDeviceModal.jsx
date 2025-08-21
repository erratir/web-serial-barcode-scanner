import React, { useState, useEffect } from 'react';
import { useBarcodeScanner } from '../contexts/BarcodeScannerContext';

const CustomDeviceModal = ({ isOpen, onClose }) => {
  const { scanner } = useBarcodeScanner();
  
  const [vid, setVid] = useState('');
  const [pid, setPid] = useState('');
  const [vidError, setVidError] = useState('');
  const [pidError, setPidError] = useState('');

  // useEffect должен вызываться всегда, независимо от условий
  useEffect(() => {
    const onKeydown = (e) => {
      if (e.key === 'Escape') handleClose();
    };

    if (isOpen) {
      window.addEventListener('keydown', onKeydown);
      return () => window.removeEventListener('keydown', onKeydown);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    setVidError('');
    setPidError('');
    let ok = true;
    
    if (!/^[0-9A-F]{4}$/i.test(vid)) {
      setVidError('VID должен содержать 4 шестнадцатеричных символа');
      ok = false;
    }
    
    if (!/^[0-9A-F]{4}$/i.test(pid)) {
      setPidError('PID должен содержать 4 шестнадцатеричных символа');
      ok = false;
    }
    
    return ok;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    const success = scanner.addDevice(vid.toUpperCase(), pid.toUpperCase());
    if (success) {
      setVid('');
      setPid('');
      setVidError('');
      setPidError('');
      onClose();
    }
  };

  const handleClose = () => {
    setVid('');
    setPid('');
    setVidError('');
    setPidError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Добавить пользовательское устройство</h3>

        <div className="form">
          <div className="field">
            <label htmlFor="vid">VID (4 символа)</label>
            <input 
              id="vid" 
              value={vid} 
              onChange={(e) => setVid(e.target.value)}
              maxLength={4} 
              className={vidError ? 'error' : ''} 
              placeholder="Например, 1A86" 
            />
            {vidError && <div className="error-text">{vidError}</div>}
          </div>

          <div className="field">
            <label htmlFor="pid">PID (4 символа)</label>
            <input 
              id="pid" 
              value={pid} 
              onChange={(e) => setPid(e.target.value)}
              maxLength={4} 
              className={pidError ? 'error' : ''} 
              placeholder="Например, 5723" 
            />
            {pidError && <div className="error-text">{pidError}</div>}
          </div>
        </div>

        <div className="actions">
          <button className="btn primary" onClick={handleSubmit}>
            Добавить
          </button>
          <button className="btn" onClick={handleClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDeviceModal;
