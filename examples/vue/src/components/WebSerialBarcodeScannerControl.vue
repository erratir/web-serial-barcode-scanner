<template>
  <div class="barcode-scanner-control">
    <h2>Управление сканером штрихкодов</h2>
    <device-lists />

    <div class="control-section">
      <button @click="toggleConnection" class="main-control-btn">
        {{ isConnected ? 'Отключить сканер' : 'Подключить сканер' }}
      </button>

      <div class="auto-connect-control">
        <label>
          <input
              type="checkbox"
              v-model="autoConnectEnabled"
              @change="toggleAutoConnect"
          />
          Автоподключение
        </label>
        <span class="status-badge" :class="autoConnectStatusClass">
          {{ autoConnectStatusText }}
        </span>
      </div>
    </div>

    <div class="settings-section">
      <h3>Настройки сканера</h3>

      <div class="setting-group">
        <label>
          Интервал опроса COM порта:
          <select v-model="interByteTimeout" @change="updateInterByteTimeout">
            <option v-for="interval in timeoutOptions" :key="interval" :value="interval">
              {{ interval }} мс
            </option>
          </select>
        </label>
      </div>

      <div class="setting-group">
        <label>
          Скорость передачи COM-порта:
          <select v-model="baudRate" @change="updateBaudRate">
            <option v-for="rate in baudRateOptions" :key="rate" :value="rate">
              {{ rate }}
            </option>
          </select>
        </label>
      </div>

      <div class="setting-group">
        <label>
          Интервал проверки подключенных устройств:
          <select v-model="reconnectDelay" @change="updateReconnectDelay">
            <option v-for="delay in reconnectDelayOptions" :key="delay" :value="delay">
              {{ delay }} мс
            </option>
          </select>
        </label>
      </div>

      <div class="custom-device-section">
        <h4>Добавить пользовательское устройство</h4>
        <div class="device-inputs">
          <div class="input-group">
            <label>
              VID (4 символа):
              <input
                  v-model="vid"
                  maxlength="4"
                  :class="{ 'error-input': vidError }"
                  placeholder="Например, 1A86"
              />
            </label>
            <span v-if="vidError" class="error-message">{{ vidError }}</span>
          </div>

          <div class="input-group">
            <label>
              PID (4 символа):
              <input
                  v-model="pid"
                  maxlength="4"
                  :class="{ 'error-input': pidError }"
                  placeholder="Например, 5723"
              />
            </label>
            <span v-if="pidError" class="error-message">{{ pidError }}</span>
          </div>

          <button @click="addCustomDevice" class="add-device-btn">Добавить устройство</button>
        </div>
      </div>
    </div>

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
const vid = ref('');
const pid = ref('');
const vidError = ref('');
const pidError = ref('');

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
  max-width: 80%;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.control-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.main-control-btn {
  padding: 10px 20px;
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.main-control-btn:hover {
  background-color: #3a56d4;
}

.auto-connect-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 14px;
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
  margin: 20px 0;
}

.setting-group {
  margin: 15px 0;
  display: flex;
  align-items: center;
}

.setting-group label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
}

select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  min-width: 120px;
}

.custom-device-section {
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.device-inputs {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 10px;
}

.input-group {
  display: flex;
  flex-direction: column;
}

.input-group label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
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
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  align-self: flex-start;
}

.add-device-btn:hover {
  background-color: #48b9d1;
}

.status-section {
  margin-top: 20px;
  padding: 15px;
  border-radius: 6px;
  text-align: center;
  font-size: 1.1em;
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