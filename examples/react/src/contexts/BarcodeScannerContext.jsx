import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebSerialBarcodeScanner } from '@web-serial-barcode-scanner/core';

const BarcodeScannerContext = createContext();

export const useBarcodeScanner = () => {
  const context = useContext(BarcodeScannerContext);
  if (!context) {
    throw new Error('useBarcodeScanner must be used within a BarcodeScannerProvider');
  }
  return context;
};

export const BarcodeScannerProvider = ({ children }) => {
  const [scanner, setScanner] = useState(null);

  useEffect(() => {
    const initScanner = async () => {
      try {
        const scannerInstance = new WebSerialBarcodeScanner();
        setScanner(scannerInstance);
      } catch (error) {
        console.error('Ошибка инициализации сканера:', error);
      }
    };

    initScanner();
  }, []);

  const value = {
    scanner
  };

  return (
    <BarcodeScannerContext.Provider value={value}>
      {children}
    </BarcodeScannerContext.Provider>
  );
};
