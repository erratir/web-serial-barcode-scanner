<template>
  <div class="modal-backdrop" @click.self="emitClose">
    <div class="modal">
      <h3>Настройки сканера</h3>

      <div class="grid">
        <label class="row">
          <span>Интервал опроса COM порта:</span>
          <select v-model="localInterByteTimeout">
            <option v-for="interval in timeoutOptions" :key="interval" :value="interval">{{ interval }} мс</option>
          </select>
        </label>

        <label class="row">
          <span>Скорость передачи COM-порта:</span>
          <select v-model="localBaudRate">
            <option v-for="rate in baudRateOptions" :key="rate" :value="rate">{{ rate }}</option>
          </select>
        </label>

        <label class="row">
          <span>Интервал проверки подключенных устройств:</span>
          <select v-model="localReconnectDelay">
            <option v-for="delay in reconnectDelayOptions" :key="delay" :value="delay">{{ delay }} мс</option>
          </select>
        </label>
      </div>

      <div class="actions">
        <button class="btn primary" @click="applySettings">Сохранить</button>
        <button class="btn" @click="emitClose">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue';
import { storeToRefs } from 'pinia';
import { useBarcodeScannerStore } from '../stores/web-serial-barcode-scanner.js'

const emit = defineEmits(['close']);

const store = useBarcodeScannerStore();
const { autoConnectEnabled, interByteTimeout, baudRate, reconnectDelay } = storeToRefs(store);

const scanner = inject('barcodeScanner');

const timeoutOptions = [10, 30, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
const baudRateOptions = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
const reconnectDelayOptions = [500, 1000, 2000, 3000, 5000, 10000, 50000, 100000];

const localInterByteTimeout = ref(interByteTimeout.value);
const localBaudRate = ref(baudRate.value);
const localReconnectDelay = ref(reconnectDelay.value);

const applySettings = () => {
  scanner.interByteTimeout = parseInt(localInterByteTimeout.value);
  store.setInterByteTimeout(localInterByteTimeout.value);

  scanner.baudRate = parseInt(localBaudRate.value);
  store.setBaudRate(localBaudRate.value);

  scanner.reconnectDelay = parseInt(localReconnectDelay.value);
  store.setReconnectDelay(localReconnectDelay.value);
  if (autoConnectEnabled.value) {
    scanner.disableAutoConnect();
    scanner.enableAutoConnect();
  }

  emitClose();
};

const emitClose = () => emit('close');
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: min(560px, 92vw);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 16px;
  border: 1px solid #e6e6e6;
}

.modal h3 { margin: 0 0 10px 0; font-size: 18px; color: #333; }

.grid { display: grid; gap: 12px; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.row span { color: #444; font-size: 14px; }
.row select { padding: 6px 8px; border: 1px solid #ddd; border-radius: 6px; min-width: 140px; background: #fff; }

.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.btn { padding: 8px 12px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; }
.btn.primary { background: #4361ee; color: #fff; border-color: #4361ee; }
.btn.primary:hover { background: #3a56d4; border-color: #3a56d4; }
.btn:hover { background: #f5f5f5; }
</style>


