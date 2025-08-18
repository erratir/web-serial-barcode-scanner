<!-- src/components/DeviceLists.vue -->
<template>
  <div class="devices-summary">
    <div class="counts-left">
      <div class="devices-count-container">
      <span>Поддерживаемые устройства: </span>
      <span
          class="devices-count"
          @click="toggleSupportedDevices"
      >
        {{ supportedDevicesCount }}
      </span>
      <div
          id="supportedDevicesList"
          class="devices-list"
          :class="{ show: showSupportedDevices }"
          @click.stop
      >
        <div v-if="Object.keys(scanner.supportedDevices).length === 0" class="empty-message">
          Нет поддерживаемых устройств
        </div>
        <div v-else>
          <div v-for="(vendor, vendorId) in scanner.supportedDevices" :key="vendorId" class="vendor-section">
            <div class="vendor-name">{{ vendor.vendorName }} (VID: {{ vendorId }})</div>
            <div class="devices">
              <div
                  v-for="(device, productId) in vendor.devices"
                  :key="productId"
                  class="device-item"
              >
                {{ device.name }} (PID: {{ productId }})
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      <div class="devices-count-container">
      <span>Пользовательские устройства: </span>
      <span
          class="devices-count"
          @click="toggleUserDevices"
      >
        {{ userDevicesCount }}
      </span>
      <button
          class="add-user-device-btn"
          title="Добавить пользовательское устройство"
          @click.stop="emit('add-user-device')"
      >
        +
      </button>
      <div
          id="userDevicesList"
          class="devices-list"
          :class="{ show: showUserDevices }"
          @click.stop
      >
        <div v-if="Object.keys(scanner.userDevices).length === 0" class="empty-message">
          Нет добавленных пользовательских устройств
        </div>
        <div v-else>
          <div v-for="(vendor, vendorId) in scanner.userDevices" :key="vendorId" class="vendor-section">
            <div class="vendor-name">{{ vendor.vendorName }} (VID: {{ vendorId }})</div>
            <div class="devices">
              <div
                  v-for="(device, productId) in vendor.devices"
                  :key="productId"
                  class="device-item"
              >
                {{ device.name }} (PID: {{ productId }})
                <button
                    class="remove-device"
                    @click.stop="removeUserDevice(vendorId, productId)"
                    title="Удалить устройство"
                >❌</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>

    <label class="auto-connect-inline">
      <input type="checkbox" :checked="props.autoConnectEnabled" @change="onToggleAutoConnect" />
      <span>Автоподключение</span>
      <span class="status-badge" :class="props.autoConnectEnabled ? 'status-active' : 'status-inactive'">
        {{ props.autoConnectEnabled ? 'Включено' : 'Выключено' }}
      </span>
    </label>
  </div>
</template>

<script setup>
import {ref, computed, onMounted, inject, onUnmounted} from 'vue';

const props = defineProps({
  autoConnectEnabled: { type: Boolean, default: false }
});

const emit = defineEmits(['add-user-device', 'toggle-auto-connect']);

// Инъекция сканера
const scanner = inject('barcodeScanner');

// Реактивные переменные для управления видимостью списков
const showSupportedDevices = ref(false);
const showUserDevices = ref(false);

// Вычисляемые свойства для подсчета количества устройств
const supportedDevicesCount = computed(() => {
  return Object.values(scanner.supportedDevices).reduce((count, vendor) =>
      count + Object.keys(vendor.devices).length, 0);
});

// Создаем реактивную ссылку для userDevices
const userDevicesRef = ref({ ...scanner.userDevices });

const userDevicesCount = computed(() => {
  return Object.values(userDevicesRef.value).reduce((count, vendor) =>
      count + Object.keys(vendor.devices).length, 0);
});

// Методы для управления списками
const toggleSupportedDevices = () => {
  showSupportedDevices.value = !showSupportedDevices.value;
  if (showSupportedDevices.value) {
    showUserDevices.value = false;
  }
};

const toggleUserDevices = () => {
  showUserDevices.value = !showUserDevices.value;
  if (showUserDevices.value) {
    showSupportedDevices.value = false;
  }
};

const handleUserDevicesChange = () => {
  userDevicesRef.value = { ...scanner.userDevices };
};

const removeUserDevice = (vendorId, productId) => {
  if (confirm(`Удалить устройство (VID:0x${vendorId}, PID:0x${productId})?`)) {
    scanner.removeDevice(vendorId, productId);
  }
};

// Подписываемся на событие добавления устройств
onMounted(() => {
  // Сначала инициализируем
  userDevicesRef.value = { ...scanner.userDevices };

  // Подписываемся на событие status, чтобы отслеживать добавление устройств
  scanner.addEventListener('status', (e) => {
    if (e.detail.message && (e.detail.message.includes('добавлено') ||
        e.detail.message.includes('удалено'))) {
      handleUserDevicesChange();
    }
  });

  // Также подписываемся на событие, которое генерируется при изменении пользовательских устройств
  scanner.addEventListener('user-devices-updated', handleUserDevicesChange);

  // Скрытие списков при клике вне области
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.devices-count-container') && !e.target.closest('.devices-list')) {
      showSupportedDevices.value = false;
      showUserDevices.value = false;
    }
  });
});

onUnmounted(() => {
  document.removeEventListener('click', () => {});
  document.removeEventListener('user-devices-updated', handleUserDevicesChange);
});

const onToggleAutoConnect = (e) => {
  emit('toggle-auto-connect', e.target.checked);
};
</script>

<style scoped>
.devices-summary {
  margin: 8px 0;
  padding: 8px;
  background-color: #f8f9fa;
  border-radius: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.devices-count-container {
  position: relative;
  display: inline-block;
  margin-right: 10px;
}

.counts-left { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 12px; }

.devices-count {
  cursor: pointer;
  text-decoration: underline;
  color: #4361ee;
  font-weight: bold;
}

.add-user-device-btn {
  margin-left: 6px;
  width: 22px;
  height: 22px;
  line-height: 20px;
  text-align: center;
  border-radius: 50%;
  border: 1px solid #4361ee;
  background: #ffffff;
  color: #4361ee;
  cursor: pointer;
  padding: 0;
  font-weight: 700;
}

.add-user-device-btn:hover {
  background: #4361ee;
  color: #ffffff;
}

.auto-connect-inline { display: inline-flex; align-items: center; gap: 8px; }
.auto-connect-inline .status-badge { padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: bold; }
.status-active { background-color: #d4edda; color: #155724; }
.status-inactive { background-color: #f8d7da; color: #721c24; }

.devices-list {
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  width: 500px;
  z-index: 100;
  display: none;
  margin-top: 5px;
}

.devices-list.show {
  display: block;
}

.vendor-section {
  margin-bottom: 15px;
}

.vendor-section:last-child {
  margin-bottom: 0;
}

.vendor-name {
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}

.device-item {
  padding: 3px 0 3px 10px;
  border-left: 2px solid #4361ee;
  margin: 2px 0;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-message {
  color: #666;
  font-style: italic;
  padding: 10px;
}
</style>