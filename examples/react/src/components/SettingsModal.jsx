import React, { useState, useEffect } from 'react';
import { useBarcodeScanner } from '../contexts/BarcodeScannerContext';
import { useBarcodeScannerStore } from '../stores/barcodeScannerStore';

const SettingsModal = ({ isOpen, onClose }) => {
  const { scanner } = useBarcodeScanner();
  const { 
    autoConnectEnabled,
    interByteTimeout, 
    baudRate, 
    reconnectDelay,
    setInterByteTimeout,
    setBaudRate,
    setReconnectDelay
  } = useBarcodeScannerStore();

  const [localInterByteTimeout, setLocalInterByteTimeout] = useState(interByteTimeout);
  const [localBaudRate, setLocalBaudRate] = useState(baudRate);
  const [localReconnectDelay, setLocalReconnectDelay] = useState(reconnectDelay);

  // Опции для выпадающих списков
  const timeoutOptions = [10, 30, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
  const baudRateOptions = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
  const reconnectDelayOptions = [500, 1000, 2000, 3000, 5000, 10000, 50000, 100000];

  // Обновляем локальные значения при изменении store
  useEffect(() => {
    setLocalInterByteTimeout(interByteTimeout);
    setLocalBaudRate(baudRate);
    setLocalReconnectDelay(reconnectDelay);
  }, [interByteTimeout, baudRate, reconnectDelay]);

  if (!isOpen) return null;

  const applySettings = () => {
    scanner.interByteTimeout = parseInt(localInterByteTimeout);
    setInterByteTimeout(localInterByteTimeout);

    scanner.baudRate = parseInt(localBaudRate);
    setBaudRate(localBaudRate);

    scanner.reconnectDelay = parseInt(localReconnectDelay);
    setReconnectDelay(localReconnectDelay);

    // Если автоподключение включено, перезапускаем его
    if (autoConnectEnabled) {
      scanner.disableAutoConnect();
      scanner.enableAutoConnect();
    }

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Настройки сканера</h3>

        <div className="grid">
          <label className="row">
            <span>Интервал опроса COM порта:</span>
            <select 
              value={localInterByteTimeout}
              onChange={(e) => setLocalInterByteTimeout(parseInt(e.target.value))}
            >
              {timeoutOptions.map(interval => (
                <option key={interval} value={interval}>{interval} мс</option>
              ))}
            </select>
          </label>

          <label className="row">
            <span>Скорость передачи COM-порта:</span>
            <select 
              value={localBaudRate}
              onChange={(e) => setLocalBaudRate(parseInt(e.target.value))}
            >
              {baudRateOptions.map(rate => (
                <option key={rate} value={rate}>{rate}</option>
              ))}
            </select>
          </label>

          <label className="row">
            <span>Интервал проверки подключенных устройств:</span>
            <select 
              value={localReconnectDelay}
              onChange={(e) => setLocalReconnectDelay(parseInt(e.target.value))}
            >
              {reconnectDelayOptions.map(delay => (
                <option key={delay} value={delay}>{delay} мс</option>
              ))}
            </select>
          </label>
        </div>

        <div className="actions">
          <button className="btn primary" onClick={applySettings}>
            Сохранить
          </button>
          <button className="btn" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
