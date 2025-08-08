import { DEVICES } from "./supported-devices.js";
import { InterByteTimeoutStream } from "./inter-byte-timeout-stream.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * WebSerialBarcodeScanner class for interacting with barcode scanners via WebSerial API.
 * Emits events for data and status updates.
 *
 * Events:
 * - 'data': Dispatched when data is received from the scanner. detail: string
 * - 'status': Dispatched when connection status changes. detail: { message: string, status: 'connected' | 'disconnected' }
 */
class WebSerialBarcodeScanner extends EventTarget {
    /**
     * Creates an instance of WebSerialBarcodeScanner.
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.baudRate=9600] - Baud rate for serial communication
     * @param {number} [options.reconnectDelay=3000] - Delay in ms before reconnect scanner attempts, ms
     * @param {number} [options.interByteTimeout=100] - interval of waiting for a portion of data from the scanner (serial port), ms
     * @param {function} [options.onData] - Callback for received data (deprecated, use 'data' event)
     * @param {function} [options.onStatusUpdate] - Callback for status updates (deprecated, use 'status' event)
     */
    constructor(options = {}) {
        super();
        this.port = null;
        this.reader = null;
        this.isConnected = false;
        this.autoConnectEnabled = false;
        this.supportedDevices = DEVICES; // Поддерживаемые устройства (см supported-devices.js)
        this.userDevices = {}; // Пользовательские устройства (храним в localStorage)
        this.barcodeDataParser = options.barcodeDataParser || null;
        this.baudRate = options.baudRate || 9600;
        this.reconnectDelay = options.reconnectDelay || 3000;
        this.interByteTimeout = options.interByteTimeout || 100;
        this.autoConnectIntervalID = null;
        this.decoder = new TextDecoder();
        this.loadSettings();
        this.setupVisibilityListener();
        // Backward compatibility for callback-based options
        if (options.onData) {
            this.addEventListener('data', (event) => options.onData(event.detail));
        }
        if (options.onStatusUpdate) {
            this.addEventListener('status', (event) => options.onStatusUpdate(event.detail.message, event.detail.status));
        }
    }

    _toRadix16(num) {
        if (typeof num === 'string') {
            return parseInt(num, 16);
        } else {
            return num;
        }
    }

    _toRadix16String(num) {
        return num?.toString(16).padStart(4, '0').toUpperCase();
    }

    /** Возвращает объединенный объект всех устройств (стандартные + пользовательские) */
    getAllDevices() {
        return {
            ...this.supportedDevices,
            ...this.userDevices
        };
    }

    /** Загружает настройки из localStorage */
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('WebSerialBarcodeScannerSettings')) || {};
        this.autoConnectEnabled = settings.autoConnectEnabled || false;

        // Загружаем только пользовательские устройства
        this.userDevices = settings.userDevices || {};
    }

    /** Сохраняет настройки в localStorage */
    saveSettings() {
        const settings = {
            autoConnectEnabled: this.autoConnectEnabled,
            userDevices: this.userDevices
        };

        localStorage.setItem('WebSerialBarcodeScannerSettings', JSON.stringify(settings));
    }

    /** Настраивает обработчик изменения видимости вкладки */
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.autoConnectEnabled && !this.autoConnectIntervalID) {
                this.checkForDevices();
            } else if (document.visibilityState === 'hidden' && this.autoConnectIntervalID) {
                clearTimeout(this.autoConnectIntervalID);
            }
        });
    }

    /** Подключает сканер вручную */
    async connect() {
        try {
            console.log('Подключаем сканер..', this.port);
            if (this.port) {
                await this.disconnect()
            }

            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: this.baudRate });
            this.port = port;
            this.isConnected = true;
            const info = port.getInfo();

            // Используем объединенный список устройств
            const allDevices = this.getAllDevices();
            const vendorId = this._toRadix16String(info.usbVendorId);
            const productId = this._toRadix16String(info.usbProductId);
            const vendor = allDevices[vendorId];
            const device = vendor && vendor.devices[productId];

            const vidPidString = `(VID:${vendorId}, PID:${productId})`;
            const deviceName = `${device?.name || vendor?.vendorName || 'устройство'} ${vidPidString}`;

            this.dispatchEvent(new CustomEvent('status', { detail: { message: `Подключено ${deviceName}`, status: 'connected' } }));
            await this.readData(port);
        } catch (error) {
            console.error('Ошибка подключения:', error);
            this.dispatchEvent(new CustomEvent('status', { detail: { message: 'Не удалось подключиться к сканеру', status: 'disconnected' } }));
            if (this.port) {
                await this.port.close().catch(() => {});
                this.port = null;
            }
            this.isConnected = false;
        }
    }

    /** Отключает сканер */
    async disconnect() {

        console.log('Отключаем сканер..', this.port);
        if (this.reader) {
            await this.aborter?.abort('user_disconnect_scanner');
            await this.reader.releaseLock();
            this.reader = null;
            // this.readableStream.cancel('my_error')
            //     .then(r => {
            //         console.log('then', r);
            //         return this.port.close();
            //     }).then( r => {
            //         console.log('then2', r);
            //         this.port = null;
            //     })
            //     .catch(e => console.log(e));

        }

        console.log('wait.. 1s', this.port);
        /** disconnect SerialPort trouble..:
         - https://github.com/WICG/serial/issues/209
         - https://stackoverflow.com/questions/71262432/how-can-i-close-a-web-serial-port-that-ive-piped-through-a-transformstream
         */
        await delay(1000)
        console.log('close port', this.port);

        if (this.port) {
            await this?.port?.close();
            this.port = null;
            // console.log('port closed?', this.port);
        }

        this.isConnected = false;
        this.dispatchEvent(new CustomEvent('status', { detail: { message: 'Сканер отключен', status: 'disconnected' } }));
    }

    /** Проверяет подключенные устройства для автоподключения */
    async checkForDevices() {
        console.log(`🔎 Проверяем подключенные устройства`);
        // console.log(`❗ ⚙️ Текущие настройки: `, this);
        if (this.port?.readable) return;
        try {
            const ports = await navigator.serial.getPorts();
            const allDevices = this.getAllDevices(); // Используем объединенный список

            const matchingPorts = ports.filter(port => {
                const info = port.getInfo();
                const vendorId = this._toRadix16String(info.usbVendorId);
                const productId = this._toRadix16String(info.usbProductId);
                return allDevices[vendorId] && allDevices[vendorId].devices[productId];
            });

            const availablePorts = matchingPorts.filter(port => !port.readable && !port.writable);
            if (availablePorts.length > 0) {
                const port = availablePorts[0];
                try {
                    await port.open({ baudRate: this.baudRate });
                    console.log('Порт открыт: ', port);
                    port.ondisconnect = () => {
                        this.port = null;
                        this.isConnected = false;
                        if (this.autoConnectEnabled) {
                            setTimeout(() => this.checkForDevices(), this.reconnectDelay);
                        }
                    }
                    this.port = port;
                    this.isConnected = true;
                    const info = port.getInfo();

                    // Используем объединенный список устройств
                    const allDevices = this.getAllDevices();
                    const vendorId = this._toRadix16String(info.usbVendorId);
                    const productId = this._toRadix16String(info.usbProductId);
                    const vendor = allDevices[vendorId];
                    const device = vendor && vendor.devices[productId];

                    const vidPidString = `(VID:${vendorId}, PID:${productId})`;
                    const deviceName = `${device?.name || vendor?.vendorName || 'устройство'} ${vidPidString}`;

                    this.dispatchEvent(new CustomEvent('status', { detail: { message: `Автоподключено ${deviceName}`, status: 'connected' } }));
                    await this.readData(port);
                } catch (openError) {
                    console.error('Ошибка открытия порта:', openError);
                    this.dispatchEvent(new CustomEvent('status', { detail: { message: 'Ошибка автоматического подключения', status: 'disconnected' } }));
                    if (this.port) {
                        await this.port.close().catch(() => {});
                        this.port = null;
                    }
                    this.isConnected = false;
                }
            } else {
                this.isConnected = false;
                this.port = null;
                if (this.autoConnectEnabled) {
                    setTimeout(() => this.checkForDevices(), this.reconnectDelay);
                }
            }
        } catch (error) {
            console.error('Ошибка проверки портов:', error);
            this.isConnected = false;
            if (this.autoConnectEnabled) {
                setTimeout(() => this.checkForDevices(), this.reconnectDelay);
            }
        }
    }

    /**
     * Читает данные со сканера с обработкой частичных данных
     * @param {SerialPort} port - Последовательный порт
     */
    async readData(port) {
        try {
            const aborter = new AbortController();
            this.aborter = aborter;

            const timeoutStream = new InterByteTimeoutStream(this.interByteTimeout);
            const readableStream = port.readable.pipeThrough(timeoutStream, {signal: aborter.signal});
            this.readableStream = readableStream


            this.reader = readableStream.getReader();

            while (this.reader && this.port?.connected) {
                const { value, done } = await this.reader.read();
                if (done) {
                    this.reader.releaseLock();
                    break;
                }
                const data = this.decoder.decode(value).trim();

                if (value) {
                    if (this.barcodeDataParser) {
                        const parseResult = this.barcodeDataParser.parse(value, data);
                        if (parseResult.error) {
                            console.error('Ошибка парсинга:', parseResult.error);
                            this.dispatchEvent(new CustomEvent('data', {
                                detail: { raw: value, data, error: parseResult.error }
                            }));
                        } else {
                            this.dispatchEvent(new CustomEvent('data', {
                                detail: { raw: value, data, ...parseResult }
                            }));
                        }
                    } else {
                        if (data) {
                            this.dispatchEvent(new CustomEvent('data', { detail: { raw: value, data } }));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Ошибка чтения данных:', error);
            this.dispatchEvent(new CustomEvent('status', {
                detail: { message: error.message || error || 'Ошибка чтения данных' }
            }));
            if (error === 'user_disconnect_scanner') {
                console.log('Пользователь отменил подключение сканера');
            }
        } finally {
            this.reader = null;
        }
    }

    /**
     * Добавляет пользовательское устройство
     * @param {string} vid - Vendor ID
     * @param {string} pid - Product ID
     */
    addDevice(vid, pid) {
        if (!/^[0-9A-F]{4}$/i.test(vid) || !/^[0-9A-F]{4}$/i.test(pid)) {
            return false;
        }

        const vendorId = vid.toUpperCase();
        const productId = pid.toUpperCase();

        // Проверяем, не является ли это стандартным устройством
        if (this.supportedDevices[vendorId] && this.supportedDevices[vendorId].devices[productId]) {
            this.dispatchEvent(new CustomEvent('status', {
                detail: {
                    message: `Устройство (VID:0x${vendorId}, PID:0x${productId}) уже в списке поддерживаемых`
                }
            }));
            return false;
        }

        // Если производитель не существует в пользовательских устройствах, создаем его
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

        this.saveSettings();
        this.dispatchEvent(new CustomEvent('status', {
            detail: {
                message: `Устройство (VID:0x${vendorId}, PID:0x${productId}) добавлено для авто-подключения`
            }
        }));

        // Дополнительное событие для обновления UI
        this.dispatchEvent(new CustomEvent('user-devices-updated', {
            detail: { userDevices: this.userDevices }
        }));
        console.log('Список пользовательских устройств: ', this.userDevices);
        return true;
    }


    /**
     * Удаляет пользовательское устройство
     * @param {string} vid - Vendor ID
     * @param {string} pid - Product ID
     */
    removeDevice(vid, pid) {
        if (!/^[0-9A-F]{4}$/i.test(vid) || !/^[0-9A-F]{4}$/i.test(pid)) {
            return false;
        }
        const vendorId = vid.toUpperCase();
        const productId = pid.toUpperCase();

        // Проверяем, существует ли это пользовательское устройство
        if (!this.userDevices[vendorId] || !this.userDevices[vendorId].devices[productId]) {
            this.dispatchEvent(new CustomEvent('status', {
                detail: {
                    message: `Устройство (VID:0x${vendorId}, PID:0x${productId}) не найдено в списке пользовательских`
                }
            }));
            return false;
        }

        // Удаляем устройство
        delete this.userDevices[vendorId].devices[productId];

        // Если у производителя не осталось устройств, удаляем и самого производителя
        if (Object.keys(this.userDevices[vendorId].devices).length === 0) {
            delete this.userDevices[vendorId];
        }

        this.saveSettings();

        this.dispatchEvent(new CustomEvent('status', {
            detail: {
                message: `Устройство (VID:0x${vendorId}, PID:0x${productId}) удалено из списка пользовательских`
            }
        }));

        // Дополнительное событие для обновления UI
        this.dispatchEvent(new CustomEvent('user-devices-updated', {
            detail: { userDevices: this.userDevices }
        }));

        console.log('Список пользовательских устройств после удаления: ', this.userDevices);
        return true;
    }

    /** Включает автоподключение */
    enableAutoConnect() {
        this.autoConnectEnabled = true;
        this.saveSettings();
        this.checkForDevices();
    }

    /** Отключает автоподключение */
    disableAutoConnect() {
        this.autoConnectEnabled = false;
        if (this.autoConnectIntervalID) {
            clearTimeout(this.autoConnectIntervalID);
            this.autoConnectIntervalID = null;
        }
        this.saveSettings();
    }
}

// if (typeof exports !== 'undefined') {
//     exports.WebSerialBarcodeScanner = WebSerialBarcodeScanner;
// }

export { WebSerialBarcodeScanner, DEVICES };