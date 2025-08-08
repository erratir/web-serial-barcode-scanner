import { WebSerialBarcodeScanner } from '@web-serial-barcode-scanner/core';

export default {
    install(app, options = {}) {
        // Создаем парсер данных
        const barcodeDataParser = options.barcodeDataParser || new (window.BarcodeDataParser ||
            class {
                parse() { return { error: 'Parser not available' }; }
            })();

        // Создаем экземпляр сканера
        const scanner = new WebSerialBarcodeScanner({
            baudRate: options.baudRate || 9600,
            reconnectDelay: options.reconnectDelay || 3000,
            interByteTimeout: options.interByteTimeout || 300,
            barcodeDataParser
        });

        // Добавляем сканер в глобальные свойства
        app.config.globalProperties.$scanner = scanner;

        // Добавляем в provide/inject систему
        app.provide('barcodeScanner', scanner);

        // Возвращаем сканер для использования в setup()
        return scanner;
    }
};