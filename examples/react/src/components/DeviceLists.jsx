import React, { useState, useEffect } from 'react';
import { useBarcodeScanner } from '../contexts/BarcodeScannerContext';

const DeviceLists = ({ autoConnectEnabled, onToggleAutoConnect, onAddUserDevice }) => {
  const { scanner } = useBarcodeScanner();
  const [showSupportedDevices, setShowSupportedDevices] = useState(false);
  const [showUserDevices, setShowUserDevices] = useState(false);
  const [userDevices, setUserDevices] = useState({});

  if (!scanner) return null;

  const supportedDevices = scanner.supportedDevices || {};

  // Подсчитываем количество поддерживаемых устройств
  const supportedDevicesCount = Object.values(supportedDevices).reduce((count, vendor) =>
    count + Object.keys(vendor.devices || {}).length, 0);

  // Подсчитываем количество пользовательских устройств
  const userDevicesCount = Object.values(userDevices).reduce((count, vendor) =>
    count + Object.keys(vendor.devices || {}).length, 0);

  const handleToggleAutoConnect = (e) => {
    const checked = e.target.checked;
    if (checked) {
      scanner.enableAutoConnect();
    } else {
      scanner.disableAutoConnect();
    }
    onToggleAutoConnect(checked);
  };

  const toggleSupportedDevices = () => {
    setShowSupportedDevices(!showSupportedDevices);
    if (!showSupportedDevices) {
      setShowUserDevices(false);
    }
  };

  const toggleUserDevices = () => {
    setShowUserDevices(!showUserDevices);
    if (!showUserDevices) {
      setShowSupportedDevices(false);
    }
  };

  const removeUserDevice = (vendorId, productId) => {
    if (confirm(`Удалить устройство (VID:0x${vendorId}, PID:0x${productId})?`)) {
      scanner.removeDevice(vendorId, productId);
    }
  };

  const handleAddUserDevice = (e) => {
    e.stopPropagation();
    onAddUserDevice();
  };

  // Обработчик клика вне области для скрытия списков
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.devices-count-container') && !e.target.closest('.devices-list')) {
        setShowSupportedDevices(false);
        setShowUserDevices(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Обновляем пользовательские устройства при изменении
  useEffect(() => {
    const handleUserDevicesChange = () => {
      setUserDevices({ ...scanner.userDevices });
    };

    // Инициализируем
    setUserDevices({ ...scanner.userDevices });

    // Подписываемся на события
    scanner.addEventListener('status', (e) => {
      if (e.detail.message && (e.detail.message.includes('добавлено') ||
          e.detail.message.includes('удалено'))) {
        handleUserDevicesChange();
      }
    });

    scanner.addEventListener('user-devices-updated', handleUserDevicesChange);

    return () => {
      scanner.removeEventListener('user-devices-updated', handleUserDevicesChange);
    };
  }, [scanner]);

  return (
    <div className="devices-summary">
      <div className="counts-left">
        <div className="devices-count-container">
          <span>Поддерживаемые устройства: </span>
          <span
            className="devices-count"
            onClick={toggleSupportedDevices}
          >
            {supportedDevicesCount}
          </span>
          <div
            className={`devices-list ${showSupportedDevices ? 'show' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.keys(supportedDevices).length === 0 ? (
              <div className="empty-message">
                Нет поддерживаемых устройств
              </div>
            ) : (
              <div>
                {Object.entries(supportedDevices).map(([vendorId, vendor]) => (
                  <div key={vendorId} className="vendor-section">
                    <div className="vendor-name">{vendor.vendorName} (VID: {vendorId})</div>
                    <div className="devices">
                      {Object.entries(vendor.devices || {}).map(([productId, device]) => (
                        <div key={productId} className="device-item">
                          {device.name} (PID: {productId})
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="devices-count-container">
          <span>Пользовательские устройства: </span>
          <span
            className="devices-count"
            onClick={toggleUserDevices}
          >
            {userDevicesCount}
          </span>
          <button
            className="add-user-device-btn"
            title="Добавить пользовательское устройство"
            onClick={handleAddUserDevice}
          >
            +
          </button>
          <div
            className={`devices-list ${showUserDevices ? 'show' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.keys(userDevices).length === 0 ? (
              <div className="empty-message">
                Нет добавленных пользовательских устройств
              </div>
            ) : (
              <div>
                {Object.entries(userDevices).map(([vendorId, vendor]) => (
                  <div key={vendorId} className="vendor-section">
                    <div className="vendor-name">{vendor.vendorName} (VID: {vendorId})</div>
                    <div className="devices">
                      {Object.entries(vendor.devices || {}).map(([productId, device]) => (
                        <div key={productId} className="device-item">
                          {device.name} (PID: {productId})
                          <button
                            className="remove-device"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeUserDevice(vendorId, productId);
                            }}
                            title="Удалить устройство"
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <label className="auto-connect-inline">
        <input
          type="checkbox"
          checked={autoConnectEnabled}
          onChange={handleToggleAutoConnect}
        />
        <span>Автоподключение</span>
        <span className={`status-badge ${autoConnectEnabled ? 'status-active' : 'status-inactive'}`}>
          {autoConnectEnabled ? 'Включено' : 'Выключено'}
        </span>
      </label>
    </div>
  );
};

export default DeviceLists;
