import React, { useState, useEffect } from 'react';
import { useBarcodeScanner } from '../contexts/BarcodeScannerContext';
import { useBarcodeScannerStore } from '../stores/barcodeScannerStore';
import DeviceLists from './DeviceLists';
import CustomDeviceModal from './CustomDeviceModal';
import SettingsModal from './SettingsModal';

const WebSerialBarcodeScannerControl = () => {
  const { scanner } = useBarcodeScanner();
  const { 
    status, 
    statusMessage, 
    isConnected, 
    autoConnectEnabled,
    setAutoConnect,
    addRawData,
    addParsedData,
    updateStatus
  } = useBarcodeScannerStore();

  const [showCustomDeviceForm, setShowCustomDeviceForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Инициализация и подписка на события сканера
  useEffect(() => {
    if (!scanner) return;

    // Подписываемся на события сканера
    const handleData = (event) => {
      if (event.detail.data) {
        addRawData(event.detail.data);
      }

      if (event.detail.parsed || event.detail.error) {
        addParsedData({
          type: event.detail.type,
          data: event.detail.parsed,
          error: event.detail.error,
          raw: event.detail.raw
        });
      }
    };

    const handleStatus = (event) => {
      updateStatus(event.detail.status, event.detail.message);
    };

    scanner.addEventListener('data', handleData);
    scanner.addEventListener('status', handleStatus);

    // Инициализируем состояние автоподключения
    setAutoConnect(scanner.autoConnectEnabled);

    // Если автоподключение включено, запускаем его
    if (scanner.autoConnectEnabled) {
      scanner.enableAutoConnect();
    }

    // Очистка при размонтировании
    return () => {
      scanner.removeEventListener('data', handleData);
      scanner.removeEventListener('status', handleStatus);
    };
  }, [scanner, addRawData, addParsedData, updateStatus, setAutoConnect]);

  if (!scanner) return null;

  const toggleConnection = async () => {
    try {
      if (isConnected) {
        await scanner.disconnect();
      } else {
        await scanner.connect();
      }
    } catch (error) {
      console.error('Ошибка управления подключением:', error);
    }
  };

  const handleToggleAutoConnect = (checked) => {
    if (checked) {
      scanner.enableAutoConnect();
    } else {
      scanner.disableAutoConnect();
    }
    setAutoConnect(checked);
  };

  const handleAddUserDevice = () => {
    setShowCustomDeviceForm(true);
  };

  const statusClass = isConnected ? 'status-connected' : 'status-disconnected';

  return (
    <div className="barcode-scanner-control">
      <div className="title-row">
        <h2>Управление сканером штрихкодов</h2>
        <div className="title-actions">
          <button onClick={toggleConnection} className="main-control-btn">
            {isConnected ? 'Отключить сканер' : 'Подключить сканер'}
          </button>
          <button 
            className="settings-btn" 
            onClick={() => setShowSettingsModal(true)} 
            title="Настройки сканера" 
            aria-label="Настройки"
          >
            ⚙️
          </button>
        </div>
      </div>

      <DeviceLists
        autoConnectEnabled={autoConnectEnabled}
        onToggleAutoConnect={handleToggleAutoConnect}
        onAddUserDevice={handleAddUserDevice}
      />

      <CustomDeviceModal
        isOpen={showCustomDeviceForm}
        onClose={() => setShowCustomDeviceForm(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <div className={`status-section ${statusClass}`}>
        {statusMessage}
      </div>
    </div>
  );
};

export default WebSerialBarcodeScannerControl;
