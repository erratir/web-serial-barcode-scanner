# Web Serial Barcode Scanner - Parser

[![npm version](https://img.shields.io/npm/v/@web-serial-barcode-scanner/parser.svg)](https://www.npmjs.com/package/@web-serial-barcode-scanner/parser)
[![License](https://img.shields.io/npm/l/@web-serial-barcode-scanner/parser.svg)](LICENSE)

An example parser for barcode data received from the Web Serial Barcode Scanner core library.

**Note:** This is only an example implementation. In a real-world application, you should implement your own custom parser tailored to your specific barcode formats and requirements. Pass your custom parser instance to the `WebSerialBarcodeScanner` constructor via the `barcodeDataParser` option.

## 📦 Installation

```bash
    npm install @web-serial-barcode-scanner/parser
    # or
    pnpm add @web-serial-barcode-scanner/parser
```


## 🚀 Usage

```javascript
import { BarcodeDataParser } from '@web-serial-barcode-scanner/parser';
import { WebSerialBarcodeScanner } from '@web-serial-barcode-scanner/core';

const parser = new BarcodeDataParser();
const scanner = new WebSerialBarcodeScanner({
barcodeDataParser: parser
});

// The parser will process incoming data and emit parsed results in the 'data' event
scanner.addEventListener('data', (event) => {
if (event.detail.parsed) {
console.log('Parsed data:', event.detail.parsed);
} else if (event.detail.error) {
console.error('Parsing error:', event.detail.error);
}
});

```

## Custom Parser Implementation

To create your own parser, implement a class with a `parse(rawData, decodedString)` method that returns an object with `type`, `parsed`, and optionally `error`. For example:

```javascript
class CustomBarcodeParser {
    parse(raw, str) {
        // Your custom parsing logic here
        if (/* matches your format */) {
        return { type: 'CUSTOM', parsed: { /* extracted data */ } };
    }
    return { error: 'Unknown format' };
    }
}

// Then use it:

const customParser = new CustomBarcodeParser();
const scanner = new WebSerialBarcodeScanner({ barcodeDataParser: customParser });
```

This example parser supports basic formats like SSCC, EAN13, Prescription, MDLP (DataMatrix), and a placeholder for OMC. Extend or replace it as needed.

## API

- `parse(data: Uint8Array, str: string)`: Parses the raw binary data and its string representation. Returns `{ type?: string, parsed?: object, error?: string }`.

## License

MIT