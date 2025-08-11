import { DEVICES } from "./supported-devices.js";
import { InterByteTimeoutStream } from "./inter-byte-timeout-stream.js";

/**
 * WebSerialBarcodeScanner class for interacting with barcode scanners via Web Serial API.
 * Emits events for data and status updates.
 *
 * This class provides a robust interface for connecting to and reading data from barcode scanners
 * through the Web Serial API. It handles connection management, data parsing, and device
 * auto-detection for supported scanners.
 *
 * @example
 * import { WebSerialBarcodeScanner } from '@web-serial-barcode-scanner/core';
 * const scanner = new WebSerialBarcodeScanner();
 *
 * scanner.addEventListener('data', (event) => {
 *   console.log('Barcode received:', event.detail.data);
 * });
 *
 * scanner.addEventListener('status', (event) => {
 *   console.log('Connection status:', event.detail.status, event.detail.message);
 * });
 *
 * document.getElementById('connect-btn').addEventListener('click', async () => {
 *   await scanner.connect();
 * });
 */
class WebSerialBarcodeScanner extends EventTarget {
    /**
     * Creates an instance of WebSerialBarcodeScanner.
     *
     * @param {Object} [options={}] - Configuration options
     * @param {number} [options.baudRate=9600] - Baud rate for serial communication
     * @param {number} [options.reconnectDelay=3000] - Delay in ms before reconnect scanner attempts
     * @param {number} [options.interByteTimeout=100] - Interval of waiting for a portion of data from the scanner (serial port), ms
     * @param {Object} [options.barcodeDataParser=null] - Optional barcode data parser instance
     * @param {function} [options.onData] - Callback for received data (deprecated, use 'data' event)
     * @param {function} [options.onStatusUpdate] - Callback for status updates (deprecated, use 'status' event)
     */
    constructor(options = {}) {
        super();
        this.port = null;
        this.reader = null;
        this.isConnected = false;
        this.autoConnectEnabled = false;
        this.supportedDevices = DEVICES; // Supported devices (see supported-devices.js)
        this.userDevices = {}; // User-defined devices (stored in localStorage)
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

    /**
     * Converts a number to hexadecimal string format (4 digits, uppercase)
     * @param {number|string} num - Number to convert
     * @returns {string} Hexadecimal string (padded to 4 characters)
     * @private
     */
    _toRadix16String(num) {
        return num?.toString(16).padStart(4, '0').toUpperCase();
    }

    /**
     * Returns a combined object of all devices (standard + user-defined)
     * @returns {Object} Combined device information
     */
    getAllDevices() {
        return {
            ...this.supportedDevices,
            ...this.userDevices
        };
    }

    /**
     * Loads settings from localStorage
     * @private
     */
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('WebSerialBarcodeScannerSettings')) || {};
        this.autoConnectEnabled = settings.autoConnectEnabled || false;
        // Load only user-defined devices
        this.userDevices = settings.userDevices || {};
    }

    /**
     * Saves settings to localStorage
     * @private
     */
    saveSettings() {
        const settings = {
            autoConnectEnabled: this.autoConnectEnabled,
            userDevices: this.userDevices
        };
        localStorage.setItem('WebSerialBarcodeScannerSettings', JSON.stringify(settings));
    }

    /**
     * Sets up a visibility change listener for auto-reconnection when tab becomes visible
     * @private
     */
    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && this.autoConnectEnabled && !this.autoConnectIntervalID) {
                this.checkForDevices();
            } else if (document.visibilityState === 'hidden' && this.autoConnectIntervalID) {
                clearTimeout(this.autoConnectIntervalID);
            }
        });
    }

    /** Manually connects to a barcode scanner */
    async connect() {
        try {
            console.log('Connecting to scanner..', this.port);
            if (this.port) {
                await this.disconnect()
            }
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: this.baudRate });
            this.port = port;
            this.isConnected = true;
            const info = port.getInfo();
            // Use combined device list
            const allDevices = this.getAllDevices();
            const vendorId = this._toRadix16String(info.usbVendorId);
            const productId = this._toRadix16String(info.usbProductId);
            const vendor = allDevices[vendorId];
            const device = vendor && vendor.devices[productId];
            const vidPidString = `(VID:${vendorId}, PID:${productId})`;
            const deviceName = `${device?.name || vendor?.vendorName || 'device'} ${vidPidString}`;
            this.dispatchEvent(new CustomEvent('status', { detail: { message: `Connected to ${deviceName}`, status: 'connected' } }));
            await this.readData(port);
        } catch (error) {
            console.error('Connection error:', error);
            this.dispatchEvent(new CustomEvent('status', { detail: { message: 'Failed to connect to scanner', status: 'disconnected' } }));
            if (this.port) {
                await this.port.close().catch(() => {});
                this.port = null;
            }
            this.isConnected = false;
        }
    }

    /** Disconnects from the barcode scanner  */
    async disconnect() {
        console.log('Disconnecting scanner..', this.port);
        if (this.reader) {
            await this.aborter?.abort('user_disconnect_scanner');
            await this.reader.releaseLock();
            this.reader = null;
        }
        console.log('wait.. 1s', this.port);
        /** Disconnect SerialPort issues:
         * - https://github.com/WICG/serial/issues/209
         * - https://stackoverflow.com/questions/71262432/how-can-i-close-a-web-serial-port-that-ive-piped-through-a-transformstream
         */
        await delay(1000)
        console.log('close port', this.port);
        if (this.port) {
            await this?.port?.close();
            this.port = null;
        }
        this.isConnected = false;
        this.dispatchEvent(new CustomEvent('status', { detail: { message: 'Scanner disconnected', status: 'disconnected' } }));
    }

    /**
     * Checks for connected devices for auto-connection
     * @private
     */
    async checkForDevices() {
        console.log(`🔎 Checking connected devices`);
        if (this.port?.readable) return;
        try {
            const ports = await navigator.serial.getPorts();
            const allDevices = this.getAllDevices(); // Use combined device list
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
                    console.log('Port opened: ', port);
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
                    // Use combined device list
                    const allDevices = this.getAllDevices();
                    const vendorId = this._toRadix16String(info.usbVendorId);
                    const productId = this._toRadix16String(info.usbProductId);
                    const vendor = allDevices[vendorId];
                    const device = vendor && vendor.devices[productId];
                    const vidPidString = `(VID:${vendorId}, PID:${productId})`;
                    const deviceName = `${device?.name || vendor?.vendorName || 'device'} ${vidPidString}`;
                    this.dispatchEvent(new CustomEvent('status', { detail: { message: `Auto-connected to ${deviceName}`, status: 'connected' } }));
                    await this.readData(port);
                } catch (openError) {
                    console.error('Port opening error:', openError);
                    this.dispatchEvent(new CustomEvent('status', { detail: { message: 'Auto-connection error', status: 'disconnected' } }));
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
            console.error('Port checking error:', error);
            this.isConnected = false;
            if (this.autoConnectEnabled) {
                setTimeout(() => this.checkForDevices(), this.reconnectDelay);
            }
        }
    }

    /**
     * Reads data from the scanner with partial data handling
     * @param {SerialPort} port - Serial port to read from
     * @private
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
                            console.error('Parsing error:', parseResult.error);
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
            console.error('Data reading error:', error);
            this.dispatchEvent(new CustomEvent('status', {
                detail: { message: error.message || error || 'Data reading error' }
            }));
            if (error === 'user_disconnect_scanner') {
                console.log('User canceled scanner connection');
            }
        } finally {
            this.reader = null;
        }
    }

    /**
     * Adds a custom device to the auto-connection list
     * @param {string} vid - Vendor ID (4 hex characters)
     * @param {string} pid - Product ID (4 hex characters)
     * @returns {boolean} True if device was added successfully, false otherwise
     */
    addDevice(vid, pid) {
        if (!/^[0-9A-F]{4}$/i.test(vid) || !/^[0-9A-F]{4}$/i.test(pid)) {
            return false;
        }
        const vendorId = vid.toUpperCase();
        const productId = pid.toUpperCase();
        // Check if this is already a standard device
        if (this.supportedDevices[vendorId] && this.supportedDevices[vendorId].devices[productId]) {
            this.dispatchEvent(new CustomEvent('status', {
                detail: {
                    message: `Device (VID:0x${vendorId}, PID:0x${productId}) is already in the supported devices list`
                }
            }));
            return false;
        }
        // Create vendor if it doesn't exist in user devices
        if (!this.userDevices[vendorId]) {
            this.userDevices[vendorId] = {
                vendorName: `Vendor ${vendorId}`,
                devices: {}
            };
        }
        // Add the device
        this.userDevices[vendorId].devices[productId] = {
            name: `Custom device (VID:0x${vendorId}, PID:0x${productId})`
        };
        this.saveSettings();
        this.dispatchEvent(new CustomEvent('status', {
            detail: {
                message: `Device (VID:0x${vendorId}, PID:0x${productId}) added for auto-connection`
            }
        }));
        // Additional event for UI updates
        this.dispatchEvent(new CustomEvent('user-devices-updated', {
            detail: { userDevices: this.userDevices }
        }));
        console.log('User devices list: ', this.userDevices);
        return true;
    }

    /**
     * Removes a custom device from the auto-connection list
     * @param {string} vid - Vendor ID (4 hex characters)
     * @param {string} pid - Product ID (4 hex characters)
     * @returns {boolean} True if device was removed successfully, false otherwise
     */
    removeDevice(vid, pid) {
        if (!/^[0-9A-F]{4}$/i.test(vid) || !/^[0-9A-F]{4}$/i.test(pid)) {
            return false;
        }
        const vendorId = vid.toUpperCase();
        const productId = pid.toUpperCase();
        // Check if this user device exists
        if (!this.userDevices[vendorId] || !this.userDevices[vendorId].devices[productId]) {
            this.dispatchEvent(new CustomEvent('status', {
                detail: {
                    message: `Device (VID:0x${vendorId}, PID:0x${productId}) not found in user devices list`
                }
            }));
            return false;
        }
        // Remove the device
        delete this.userDevices[vendorId].devices[productId];
        // If no devices left for this vendor, remove the vendor too
        if (Object.keys(this.userDevices[vendorId].devices).length === 0) {
            delete this.userDevices[vendorId];
        }
        this.saveSettings();
        this.dispatchEvent(new CustomEvent('status', {
            detail: {
                message: `Device (VID:0x${vendorId}, PID:0x${productId}) removed from user devices list`
            }
        }));
        // Additional event for UI updates
        this.dispatchEvent(new CustomEvent('user-devices-updated', {
            detail: { userDevices: this.userDevices }
        }));
        console.log('User devices list after removal: ', this.userDevices);
        return true;
    }

    /** Enables auto-connection to supported devices */
    enableAutoConnect() {
        this.autoConnectEnabled = true;
        this.saveSettings();
        this.checkForDevices();
    }

    /** Disables auto-connection to devices */
    disableAutoConnect() {
        this.autoConnectEnabled = false;
        if (this.autoConnectIntervalID) {
            clearTimeout(this.autoConnectIntervalID);
            this.autoConnectIntervalID = null;
        }
        this.saveSettings();
    }
}

/**
 * Helper function to create a delay (used for port disconnection)
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>} Resolves after specified time
 * @private
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export { WebSerialBarcodeScanner, DEVICES };