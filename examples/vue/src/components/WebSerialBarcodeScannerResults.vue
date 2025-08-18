<template>
  <div class="scan-results">
    <h2>Результаты сканирования</h2>

    <div class="data-columns">
      <div class="column">
        <h3>Отсканированные данные:</h3>
        <div class="data-container">
          <div v-if="rawData.length === 0" class="empty-message">
            Данные от сканера будут отображаться здесь
          </div>
          <div v-else class="data-list">
            <div v-for="(item, index) in formattedRawData" :key="index" class="data-item">
              <div class="timestamp">{{ formatDate(item.timestamp) }}</div>
              <div class="data-value">{{ item.data }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="column">
        <h3>Обработанные данные:</h3>
        <div class="data-container">
          <div v-if="parsedData.length === 0" class="empty-message">
            Обработанные данные будут отображаться здесь
          </div>
          <div v-else class="data-list">
            <div v-for="(item, index) in formattedParsedData" :key="index" class="data-item parsed">
              <div class="timestamp">{{ formatDate(item.timestamp) }}</div>

              <div v-if="item.error" class="error">
                <strong>Ошибка:</strong> {{ item.error }}
                <div class="raw-data">Исходные данные: {{ item.raw }}</div>
              </div>

              <div v-else>
                <div v-if="item.type" class="data-type">Тип: {{ item.type }}</div>
                <pre class="parsed-json">{{ formatParsedData(item.data) }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useBarcodeScannerStore } from '../stores/web-serial-barcode-scanner.js'

const store = useBarcodeScannerStore();
const { rawData, parsedData } = storeToRefs(store);

// Форматируем данные для отображения
const formattedRawData = computed(() => {
  return [...rawData.value].reverse();
});

const formattedParsedData = computed(() => {
  return [...parsedData.value].reverse();
});

// Форматируем дату
const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString() + '.' +
      date.getMilliseconds().toString().padStart(3, '0');
};

// Форматируем parsed данные для отображения
const formatParsedData = (data) => {
  if (!data) return '';
  return JSON.stringify(data, null, 2);
};
</script>

<style scoped>
.scan-results {
  max-width: 100%;
  margin: 8px 0 0 0;
  padding: 0 12px;
}

.data-columns {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.column {
  flex: 1;
  min-width: 280px;
}

.column h3 {
  margin: 0 0 6px 0;
  font-size: 1em;
  color: #444;
}

.data-container {
  border: 1px solid #ccc;
  border-radius: 4px;
  height: calc(100vh - 260px);
  overflow-y: auto;
  background-color: #f9f9f9;
}

.empty-message {
  padding: 12px;
  text-align: center;
  color: #666;
  font-style: italic;
}

.data-list {
  padding: 8px;
}

.data-item {
  padding: 8px;
  margin-bottom: 6px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}

.timestamp {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.data-value {
  word-break: break-all;
  font-family: monospace;
  font-size: 13px;
}

.parsed .data-type {
  font-weight: bold;
  color: #4361ee;
  margin-bottom: 5px;
}

.parsed-json {
  margin: 0;
  padding: 6px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
  border: 1px solid #ddd;
}

.error {
  color: #dc3545;
}

.raw-data {
  margin-top: 5px;
  font-size: 12px;
  color: #666;
  font-family: monospace;
}
</style>