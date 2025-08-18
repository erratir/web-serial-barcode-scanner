<template>
  <div class="barcode-scanner-control">
    <div class="title-row">
      <h2>Управление сканером штрихкодов</h2>
      <div class="title-actions">
        <button @click="toggleConnection" class="main-control-btn">
          {{ isConnected ? 'Отключить сканер' : 'Подключить сканер' }}
        </button>
        <button class="settings-btn" @click="showSettingsModal = true" title="Настройки сканера" aria-label="Настройки">⚙️</button>
      </div>
    </div>
    <device-lists
        :auto-connect-enabled="autoConnectEnabled"
        @toggle-auto-connect="toggleAutoConnectFromList"
        @add-user-device="showCustomDeviceForm = true"
    />

    

    <custom-device-modal
        v-if="showCustomDeviceForm"
        @submit="onCustomDeviceSubmit"
        @close="showCustomDeviceForm = false"
    />

    <settings-modal
        v-if="showSettingsModal"
        @close="showSettingsModal = false"
    />

    <div class="status-section" :class="statusClass">
      {{ statusMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue';
import { storeToRefs } from 'pinia';
import { useBarcodeScannerStore } from '../stores/web-serial-barcode-scanner.js'
import DeviceLists from './DeviceLists.vue';
import CustomDeviceModal from './CustomDeviceModal.vue';
import SettingsModal from './SettingsModal.vue';

// Получаем доступ к хранилищу
const store = useBarcodeScannerStore();
const {
  status,
  statusMessage,
  isConnected,
  autoConnectEnabled,
  interByteTimeout,
  baudRate,
  reconnectDelay
} = storeToRefs(store);

// Инъекция сканера
const scanner = inject('barcodeScanner');

// Реактивные переменные для формы
const showCustomDeviceForm = ref(false);
const vid = ref('');
const pid = ref('');
const vidError = ref('');
const pidError = ref('');
const showSettingsModal = ref(false);

const onCustomDeviceSubmit = ({ vid: v, pid: p }) => {
  vid.value = v;
  pid.value = p;
  addCustomDevice();
};
// Опции для выпадающих списков
const timeoutOptions = [10, 30, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000];
const baudRateOptions = [300, 1200, 2400, 4800, 9600, 19200, 38400, 57600, 115200];
const reconnectDelayOptions = [500, 1000, 2000, 3000, 5000, 10000, 50000, 100000];

// Вычисляемые свойства
const statusClass = computed(() => {
  return isConnected.value ? 'status-connected' : 'status-disconnected';
});

const autoConnectStatusText = computed(() => {
  return autoConnectEnabled.value ? 'Включено' : 'Выключено';
});

const autoConnectStatusClass = computed(() => {
  return autoConnectEnabled.value ? 'status-active' : 'status-inactive';
});

// Методы
const toggleConnection = async () => {
  try {
    if (isConnected.value) {
      await scanner.disconnect();
    } else {
      await scanner.connect();
    }
  } catch (error) {
    console.error('Ошибка управления подключением:', error);
  }
};

const toggleAutoConnect = (e) => {
  console.log(e.target.checked);
  if (autoConnectEnabled.value) {
    scanner.enableAutoConnect();
  } else {
    scanner.disableAutoConnect();
  }
  store.setAutoConnect(e.target.checked);
};

const toggleAutoConnectFromList = (checked) => {
  if (checked) {
    scanner.enableAutoConnect();
  } else {
    scanner.disableAutoConnect();
  }
  store.setAutoConnect(checked);
};

const updateInterByteTimeout = () => {
  scanner.interByteTimeout = parseInt(interByteTimeout.value);
  store.setInterByteTimeout(interByteTimeout.value);
};

const updateBaudRate = () => {
  scanner.baudRate = parseInt(baudRate.value);
  store.setBaudRate(baudRate.value);
};

const updateReconnectDelay = () => {
  scanner.reconnectDelay = parseInt(reconnectDelay.value);
  store.setReconnectDelay(reconnectDelay.value);

  // Если автоподключение включено, перезапускаем его с новым интервалом
  if (autoConnectEnabled.value) {
    scanner.disableAutoConnect();
    scanner.enableAutoConnect();
  }
};

const validateDeviceIds = () => {
  vidError.value = '';
  pidError.value = '';
  let isValid = true;

  if (!/^[0-9A-F]{4}$/i.test(vid.value)) {
    vidError.value = 'VID должен содержать 4 шестнадцатеричных символа';
    isValid = false;
  }

  if (!/^[0-9A-F]{4}$/i.test(pid.value)) {
    pidError.value = 'PID должен содержать 4 шестнадцатеричных символа';
    isValid = false;
  }

  return isValid;
};

const addCustomDevice = () => {
  if (!validateDeviceIds()) return;

  const success = scanner.addDevice(vid.value, pid.value);
  if (success) {
    vid.value = '';
    pid.value = '';
    vidError.value = '';
    pidError.value = '';
    showCustomDeviceForm.value = false;
  }
};

// Инициализация
onMounted(() => {
  // Подписываемся на события сканера
  scanner.addEventListener('data', (event) => {
    if (event.detail.data) {
      store.addRawData(event.detail.data);
    }

    if (event.detail.parsed || event.detail.error) {
      store.addParsedData({
        type: event.detail.type,
        data: event.detail.parsed,
        error: event.detail.error,
        raw: event.detail.raw
      });
    }
  });

  scanner.addEventListener('status', (event) => {
    store.updateStatus(event.detail.status, event.detail.message);
  });

  // Инициализируем состояние автоподключения

  store.setAutoConnect(scanner.autoConnectEnabled);

  // Если автоподключение включено, запускаем его
  if (scanner.autoConnectEnabled) {
    scanner.enableAutoConnect();
  }
});
</script>

<style scoped>
.barcode-scanner-control {
  width: 100%;
  max-width: none;
  margin: 8px 0 12px 0;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.barcode-scanner-control h2 {
  margin: 0 0 8px 0;
  font-size: 18px;
}

.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.title-actions { display: inline-flex; align-items: center; gap: 8px; }

.settings-btn {
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 16px;
}

.settings-btn:hover {
  background: #f5f5f5;
}

.control-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.main-control-btn {
  padding: 6px 12px;
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.main-control-btn:hover {
  background-color: #3a56d4;
}

.auto-connect-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: bold;
}

.status-active {
  background-color: #d4edda;
  color: #155724;
}

.status-inactive {
  background-color: #f8d7da;
  color: #721c24;
}

.settings-section {
  margin: 8px 0 6px 0;
}

.settings-section h3 {
  margin: 0 0 6px 0;
  font-size: 14px;
  color: #444;
}

.setting-group {
  margin: 0;
  display: inline-flex;
  align-items: center;
  margin-right: 12px;
}

.setting-group label {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

select {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  min-width: 120px;
  font-size: 13px;
}

.custom-device-section {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.custom-device-section h4 {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #444;
}

.device-inputs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 10px;
  margin-top: 6px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
}

input {
  padding: 6px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 13px;
}

.error-input {
  border-color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
}

.add-device-btn {
  background-color: #4cc9f0;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-start;
  font-size: 13px;
}

.add-device-btn:hover {
  background-color: #48b9d1;
}

.cancel-device-btn {
  background-color: transparent;
  color: #666;
  border: 1px solid #ddd;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-start;
  font-size: 13px;
}

.cancel-device-btn:hover {
  background-color: #f2f2f2;
}

.status-section {
  margin-top: 12px;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  font-size: 0.95em;
  font-weight: 500;
}

.status-connected {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-disconnected {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>