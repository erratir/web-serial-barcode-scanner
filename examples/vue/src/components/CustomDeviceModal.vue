<template>
  <div class="modal-backdrop" @click.self="emitClose">
    <div class="modal">
      <h3>Добавить пользовательское устройство</h3>

      <div class="form">
        <div class="field">
          <label for="vid">VID (4 символа)</label>
          <input id="vid" v-model="vid" maxlength="4" :class="{ error: vidError }" placeholder="Например, 1A86" />
          <div v-if="vidError" class="error-text">{{ vidError }}</div>
        </div>

        <div class="field">
          <label for="pid">PID (4 символа)</label>
          <input id="pid" v-model="pid" maxlength="4" :class="{ error: pidError }" placeholder="Например, 5723" />
          <div v-if="pidError" class="error-text">{{ pidError }}</div>
        </div>
      </div>

      <div class="actions">
        <button class="btn primary" @click="onSubmit">Добавить</button>
        <button class="btn" @click="emitClose">Отмена</button>
      </div>
    </div>
  </div>
  
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const emit = defineEmits(['submit', 'close']);

const vid = ref('');
const pid = ref('');
const vidError = ref('');
const pidError = ref('');

const validate = () => {
  vidError.value = '';
  pidError.value = '';
  let ok = true;
  if (!/^[0-9A-F]{4}$/i.test(vid.value)) {
    vidError.value = 'VID должен содержать 4 шестнадцатеричных символа';
    ok = false;
  }
  if (!/^[0-9A-F]{4}$/i.test(pid.value)) {
    pidError.value = 'PID должен содержать 4 шестнадцатеричных символа';
    ok = false;
  }
  return ok;
};

const onSubmit = () => {
  if (!validate()) return;
  emit('submit', { vid: vid.value.toUpperCase(), pid: pid.value.toUpperCase() });
};

const emitClose = () => emit('close');

const onKeydown = (e) => {
  if (e.key === 'Escape') emitClose();
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
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
  width: min(520px, 92vw);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 16px;
  border: 1px solid #e6e6e6;
}

.modal h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field { display: flex; flex-direction: column; }
.field label { font-size: 13px; color: #444; margin-bottom: 4px; }
.field input { padding: 8px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.field input.error { border-color: #dc3545; }
.error-text { color: #dc3545; font-size: 12px; margin-top: 4px; }

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.btn { padding: 8px 12px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; }
.btn.primary { background: #4361ee; color: #fff; border-color: #4361ee; }
.btn.primary:hover { background: #3a56d4; border-color: #3a56d4; }
.btn:hover { background: #f5f5f5; }

@media (max-width: 560px) { .form { grid-template-columns: 1fr; } }
</style>


