# Web Serial Barcode Scanner - Core

[![npm version](https://img.shields.io/npm/v/@web-serial-barcode-scanner/core.svg)](https://www.npmjs.com/package/@web-serial-barcode-scanner/core)
[![License](https://img.shields.io/npm/l/@web-serial-barcode-scanner/core.svg)](LICENSE)

Library for working with barcode scanners via Web Serial API.

## 📦 Installation
```bash
    npm install @web-serial-barcode-scanner/core
    # or
    pnpm add @web-serial-barcode-scanner/core
```
## 🚀 Quick Start

```javascript
import { WebSerialBarcodeScanner } from '@web-serial-barcode-scanner/core';

const scanner = new WebSerialBarcodeScanner();

// Listen for scanner data
scanner.addEventListener('data', (event) => {
console.log('Received barcode:', event.detail.data);
});

// Listen for status changes
scanner.addEventListener('status', (event) => {
console.log('Status:', event.detail.status, event.detail.message);
});

// Connect to the scanner
document.getElementById('connect-btn').addEventListener('click', async () => {
    await scanner.connect();
});
```

## ⚙️ Configuration
```javascript
const scanner = new WebSerialBarcodeScanner({
baudRate: 9600,          // Data transmission speed
reconnectDelay: 3000,    // Delay before reconnection attempt (ms)
interByteTimeout: 100,   // Timeout between bytes (ms)
});
```

## 🔌 API

### Methods
- `connect()` - Connect to the scanner
- `disconnect()` - Disconnect from the scanner
- `enableAutoConnect()` - Enable auto-connection
- `disableAutoConnect()` - Disable auto-connection
- `addDevice(vid, pid)` - Add a custom device
- `removeDevice(vid, pid)` - Remove a custom device

### Events
- `data` - Scanner data
    - `detail.raw` - Raw data (Uint8Array)
    - `detail.data` - Decoded data (string)
    - `detail.type` - Recognized barcode type (if applicable)
    - `detail.parsed` - Parsed data (object)
    - `detail.error` - Parsing error (if any)
- `status` - Connection status
    - `detail.status` - 'connected' | 'disconnected'
    - `detail.message` - Status description

## 🧩 Integration with Parser

```javascript
npm install @web-serial-barcode-scanner/parser

import { BarcodeDataParser } from '@web-serial-barcode-scanner/parser';

const parser = new BarcodeDataParser();
const scanner = new WebSerialBarcodeScanner({ barcodeDataParser: parser });
```

## 🖥️ Vue Integration

See [examples/vue](examples/vue)

Demo [demo/vue](https://erratir.github.io/web-serial-barcode-scanner/)