# Web Serial Barcode Scanner - Core

[![npm version](https://img.shields.io/npm/v/@web-serial-barcode-scanner/core.svg)](https://www.npmjs.com/package/@web-serial-barcode-scanner/core)
[![License](https://img.shields.io/npm/l/@web-serial-barcode-scanner/core.svg)](LICENSE)

Библиотека для работы со сканерами штрихкодов через Web Serial API.

## 📦 Установка

```bash
  npm install @web-serial-barcode-scanner/core
  # или
  pnpm add @web-serial-barcode-scanner/core
```

## 🚀 Быстрый старт
```javascript
import { WebSerialBarcodeScanner } from '@web-serial-barcode-scanner/core';

const scanner = new WebSerialBarcodeScanner();

// Слушаем данные со сканера
scanner.addEventListener('data', (event) => {
console.log('Получен штрихкод:', event.detail.data);
});

// Слушаем изменения статуса
scanner.addEventListener('status', (event) => {
console.log('Статус:', event.detail.status, event.detail.message);
});

// Подключаемся к сканеру
document.getElementById('connect-btn').addEventListener('click', async () => {
await scanner.connect();
});
```

## ⚙️ Конфигурация

```javascript
const scanner = new WebSerialBarcodeScanner({
  baudRate: 9600,          // Скорость передачи данных
  reconnectDelay: 3000,    // Задержка перед повторной попыткой подключения (мс)
  interByteTimeout: 100,   // Таймаут между байтами (мс)
});

```

## 🔌 API
Методы
- connect() - Подключиться к сканеру
- disconnect() - Отключиться от сканера
- enableAutoConnect() - Включить автоподключение
- disableAutoConnect() - Выключить автоподключение
- addDevice(vid, pid) - Добавить пользовательское устройство
- removeDevice(vid, pid) - Удалить пользовательское устройство

События
- data - Данные со сканера
- etail.raw - Сырые данные (Uint8Array)
- detail.data - Декодированные данные (string)
- detail.type - Тип распознанного штрихкода (если применимо)
- detail.parsed - Распаршенные данные (объект)
- detail.error - Ошибка парсинга (если есть)
- status - Статус подключения
- detail.status - 'connected' | 'disconnected'
- detail.message - Описание статуса 

## 🧩 Интеграция с парсером

```bash
  npm install @web-serial-barcode-scanner/parser
```

```javascript
import { BarcodeDataParser } from '@web-serial-barcode-scanner/parser';

const parser = new BarcodeDataParser();
const scanner = new WebSerialBarcodeScanner({ barcodeDataParser: parser });
```

## 🖥️ Vue интеграция

см. examples/vue