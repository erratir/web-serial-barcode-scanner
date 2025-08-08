import { defineStore } from 'pinia';

export const useBarcodeScannerStore = defineStore('barcodeScanner', {
    state: () => ({
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
        userDevices: {} // пользовательские устройства
    }),
    actions: {
        updateStatus(status, message) {
            this.status = status;
            this.statusMessage = message;
            this.isConnected = status === 'connected';
        },
        addRawData(data) {
            this.rawData.push({
                timestamp: new Date().toISOString(),
                data
            });
            // Ограничиваем историю до 100 записей
            if (this.rawData.length > 100) {
                this.rawData.shift();
            }
        },
        addParsedData(data) {
            this.parsedData.push({
                timestamp: new Date().toISOString(),
                ...data
            });
            // Ограничиваем историю до 100 записей
            if (this.parsedData.length > 100) {
                this.parsedData.shift();
            }
        },
        setAutoConnect(enabled) {
            this.autoConnectEnabled = enabled;
        },
        setInterByteTimeout(value) {
            this.interByteTimeout = value;
        },
        setBaudRate(value) {
            this.baudRate = value;
        },
        setReconnectDelay(value) {
            this.reconnectDelay = value;
        },
        addCustomDevice(vid, pid) {
            const vendorId = vid.toUpperCase();
            const productId = pid.toUpperCase();

            // Проверяем, не является ли это стандартным устройством
            if (DEVICES[vendorId] && DEVICES[vendorId].devices[productId]) {
                return false;
            }

            // Если производитель не существует, создаем его
            if (!this.userDevices[vendorId]) {
                this.userDevices[vendorId] = {
                    vendorName: `Vendor ${vendorId}`,
                    devices: {}
                };
            }

            // Добавляем устройство
            this.userDevices[vendorId].devices[productId] = {
                name: `Пользовательское устройство (VID:0x${vendorId}, PID:0x${productId})`
            };

            return {
                vendor: vendorId,
                productid: [productId],
                name: this.userDevices[vendorId].devices[productId].name
            };
        },
        removeCustomDevice(vid, pid) {
            const vendorId = vid.toUpperCase();
            const productId = pid.toUpperCase();

            // Проверяем, существует ли это пользовательское устройство
            if (!this.userDevices[vendorId] || !this.userDevices[vendorId].devices[productId]) {
                return false;
            }

            // Удаляем устройство
            delete this.userDevices[vendorId].devices[productId];

            // Если у производителя не осталось устройств, удаляем и самого производителя
            if (Object.keys(this.userDevices[vendorId].devices).length === 0) {
                delete this.userDevices[vendorId];
            }

            return true;
        }
    },
    getters: {}
});