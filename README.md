# Web Serial Barcode Scanner

A library for integrating barcode scanners with the Web Serial API. This monorepo includes core functionality and a parser example, published as separate NPM packages.

## 📦 Packages

- [@web-serial-barcode-scanner/core](packages/core/README.md): Core library for connecting and reading from barcode scanners. [![npm version](https://img.shields.io/npm/v/@web-serial-barcode-scanner/core.svg)](https://www.npmjs.com/package/@web-serial-barcode-scanner/core) 
- [@web-serial-barcode-scanner/parser](packages/parser/README.md): Example parser for barcode data (customizable). [![npm version](https://img.shields.io/npm/v/@web-serial-barcode-scanner/parser.svg)](https://www.npmjs.com/package/@web-serial-barcode-scanner/parser)

## 🔥 Features

- Connect to barcode scanners via Web Serial API.
- Auto-detection and connection for supported devices.
- Event-based API for data and status updates.
- Custom device support via VID/PID.
- Optional data parsing integration.
- Examples in vanilla JS and Vue.

## 🖥️ Supported Devices

The core library includes a list of supported devices from manufacturers like Honeywell, Zebra, Datalogic, and others. See the core README for details.

## 🏷️ Examples ([DEMO](https://erratir.github.io/web-serial-barcode-scanner/))

- Vanilla JS: See [examples/vanilla/index.html](examples/vanilla/index.html)
- Vue: See [examples/vue](examples/vue).
  


## ⚒️ Installation

Install the core package and parser package (example only):

```bash
  npm install @web-serial-barcode-scanner/core @web-serial-barcode-scanner/parser
```


## 🚀 Quick Start

See the core package README for usage examples.
[@web-serial-barcode-scanner/core](packages/core/README.md)

## Contributing

Contributions are welcome! Please open an issue or PR on GitHub.

## License

MIT