import { create } from 'zustand';

export const useBarcodeScannerStore = create((set, get) => ({
  // State
  status: 'disconnected', // 'connected', 'disconnected', 'connecting', 'error'
  statusMessage: 'Сканер не подключен',
  isConnected: false,
  rawData: [],
  parsedData: [],
  autoConnectEnabled: false,
  interByteTimeout: 300,
  baudRate: 9600,
  reconnectDelay: 3000,
  devices: [],
  userDevices: {}, // пользовательские устройства

  // Actions
  updateStatus: (status, message) => set({
    status,
    statusMessage: message,
    isConnected: status === 'connected'
  }),

  addRawData: (data) => set((state) => {
    const newRawData = [...state.rawData, {
      timestamp: new Date().toISOString(),
      data
    }];
    
    // Ограничиваем историю до 100 записей
    if (newRawData.length > 100) {
      newRawData.shift();
    }
    
    return { rawData: newRawData };
  }),

  addParsedData: (data) => set((state) => {
    const newParsedData = [...state.parsedData, {
      timestamp: new Date().toISOString(),
      ...data
    }];
    
    // Ограничиваем историю до 100 записей
    if (newParsedData.length > 100) {
      newParsedData.shift();
    }
    
    return { parsedData: newParsedData };
  }),

  setAutoConnect: (enabled) => set({ autoConnectEnabled: enabled }),

  setInterByteTimeout: (value) => set({ interByteTimeout: value }),

  setBaudRate: (value) => set({ baudRate: value }),

  setReconnectDelay: (value) => set({ reconnectDelay: value }),

  addCustomDevice: (vid, pid) => {
    const vendorId = vid.toUpperCase();
    const productId = pid.toUpperCase();

    set((state) => {
      const newUserDevices = { ...state.userDevices };

      // Если производитель не существует, создаем его
      if (!newUserDevices[vendorId]) {
        newUserDevices[vendorId] = {
          vendorName: `Vendor ${vendorId}`,
          devices: {}
        };
      }

      // Добавляем устройство
      newUserDevices[vendorId].devices[productId] = {
        name: `Пользовательское устройство (VID:0x${vendorId}, PID:0x${productId})`
      };

      return { userDevices: newUserDevices };
    });

    return {
      vendor: vendorId,
      productid: [productId],
      name: `Пользовательское устройство (VID:0x${vendorId}, PID:0x${productId})`
    };
  },

  removeCustomDevice: (vid, pid) => {
    const vendorId = vid.toUpperCase();
    const productId = pid.toUpperCase();

    set((state) => {
      const newUserDevices = { ...state.userDevices };

      // Проверяем, существует ли это пользовательское устройство
      if (!newUserDevices[vendorId] || !newUserDevices[vendorId].devices[productId]) {
        return state;
      }

      // Удаляем устройство
      delete newUserDevices[vendorId].devices[productId];

      // Если у производителя не осталось устройств, удаляем и самого производителя
      if (Object.keys(newUserDevices[vendorId].devices).length === 0) {
        delete newUserDevices[vendorId];
      }

      return { userDevices: newUserDevices };
    });

    return true;
  }
}));
