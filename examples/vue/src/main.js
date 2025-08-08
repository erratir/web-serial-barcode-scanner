import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import barcodeScannerPlugin from './plugins/wsbs.js';
import { BarcodeDataParser } from '@web-serial-barcode-scanner/parser';

const pinia = createPinia()
const app = createApp(App)

const barcodeDataParser = new BarcodeDataParser();
app.use(barcodeScannerPlugin, {
    baudRate: 9600,
    reconnectDelay: 3000,
    interByteTimeout: 300,
    barcodeDataParser
});

app.use(pinia)
app.mount('#app')
