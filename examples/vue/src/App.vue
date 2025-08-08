<template>
  <div id="app">
    <header>
      <h1>Web Serial Barcode Scanner</h1>
      <p>Интеграция с Web Serial API для сканеров штрихкодов</p>
    </header>

    <main>
      <barcode-scanner-control />
      <barcode-scan-results />
    </main>

    <footer>
      <p>Это приложение использует Web Serial API для подключения сканеров штрихкодов</p>
      <p>Поддерживаемые устройства: {{ supportedDevicesCount }} моделей</p>
    </footer>
  </div>
</template>

<script setup>
import {computed, inject} from 'vue';
import BarcodeScannerControl from './components/WebSerialBarcodeScannerControl.vue';
import BarcodeScanResults from './components/WebSerialBarcodeScannerResults.vue';
const scanner = inject('barcodeScanner');

// Подсчитываем количество поддерживаемых устройств
const supportedDevicesCount = computed(() => {
  return Object.values(scanner.supportedDevices).reduce((count, vendor) =>
      count + Object.keys(vendor.devices).length, 0);
});
</script>

<style>
:root {
  --primary-color: #4361ee;
  --secondary-color: #3a0ca3;
  --success-color: #4cc9f0;
  --error-color: #f72585;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f5f7fa;
  min-height: 100vh;
}

header {
  text-align: center;
  margin-bottom: 30px;
  padding: 20px 0;
}

header h1 {
  color: var(--secondary-color);
  margin-bottom: 10px;
}

header p {
  color: #666;
  font-size: 1.1em;
}

footer {
  text-align: center;
  margin-top: 40px;
  padding: 20px 0;
  color: #666;
  font-size: 0.9em;
  border-top: 1px solid #eee;
}
</style>