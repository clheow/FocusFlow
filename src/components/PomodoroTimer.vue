<template>
  <div class="timer">
    <div class="timer__mode-switch">
      <button
        v-for="m in modes"
        :key="m.key"
        class="timer__mode-btn"
        :class="{ 'timer__mode-btn--active': mode === m.key }"
        :disabled="isRunning"
        @click="switchMode(m.key)"
      >
        {{ m.label }}
      </button>
    </div>

    <div class="timer__circle">
      <span class="timer__time">{{ formattedTime }}</span>
      <span class="timer__label">{{ currentModeLabel }}</span>
    </div>

    <div class="timer__controls">
      <ion-button v-if="!isRunning" expand="block" @click="start">
        {{ hasStarted ? 'Resume' : 'Start' }}
      </ion-button>
      <ion-button v-else expand="block" color="warning" @click="pause">
        Pause
      </ion-button>
      <ion-button expand="block" fill="outline" @click="reset">
        Reset
      </ion-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { IonButton, alertController } from '@ionic/vue';
import timerSound from '@/assets/sounds/timer-done.mp3';

const emit = defineEmits(['sessionComplete', 'runningChange']);

const DURATIONS = {
  focus: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const modes = [
  { key: 'focus', label: 'Focus' },
  { key: 'short', label: 'Short Break' },
  { key: 'long', label: 'Long Break' },
];

const mode = ref('focus');
const secondsLeft = ref(DURATIONS.focus);
const isRunning = ref(false);
const hasStarted = ref(false);
let intervalId = null;

const timerAudio = new Audio(timerSound);
timerAudio.preload = 'auto';

onMounted(() => {
  timerAudio.load(); // paksa browser buffer file dari awal, supaya tidak ada delay saat play()
});

function playTimerSound() {
  timerAudio.currentTime = 0;
  timerAudio.play().catch((err) => {
    console.warn('[Timer] Gagal memutar suara:', err);
  });
}

const FINISH_MESSAGES = {
  focus: { title: 'Fokus Selesai!🎉', message: 'Kerja bagus! Saatnya istirahat sebentar.' },
  short: { title: 'Istirahat Selesai ⏰', message: 'Yuk lanjut fokus lagi!' },
  long: { title: 'Istirahat Panjang Selesai⏰', message: 'Siap lanjut kerja lagi?' },
};

async function showFinishAlert() {
  const info = FINISH_MESSAGES[mode.value];
  const alert = await alertController.create({
    header: info.title,
    message: info.message,
    cssClass: 'pixel-alert',
    buttons: ['OK'],
  });
  await alert.present();
}

const currentModeLabel = computed(() => modes.find((m) => m.key === mode.value)?.label ?? '');

const formattedTime = computed(() => {
  const m = Math.floor(secondsLeft.value / 60).toString().padStart(2, '0');
  const s = (secondsLeft.value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});


function switchMode(key) {
  if (isRunning.value) return;
  mode.value = key;
  secondsLeft.value = DURATIONS[key];
  hasStarted.value = false;
}

function start() {
  isRunning.value = true;
  hasStarted.value = true;
  emit('runningChange', true);
  intervalId = setInterval(() => {
    if (secondsLeft.value > 0) {
      secondsLeft.value -= 1;
    } else {
      finishSession();
    }
  }, 1000);
}

function pause() {
  isRunning.value = false;
  clearInterval(intervalId);
  emit('runningChange', false);
}

function reset() {
  pause();
  secondsLeft.value = DURATIONS[mode.value];
  hasStarted.value = false;
}

function finishSession() {
  pause();
  playTimerSound();
  showFinishAlert();
  const durationMinutes = DURATIONS[mode.value] / 60;
  if (mode.value === 'focus') {
    emit('sessionComplete', durationMinutes);
  }
  secondsLeft.value = DURATIONS[mode.value];
  hasStarted.value = false;
}

onBeforeUnmount(() => {
  clearInterval(intervalId);
});
</script>

<style scoped>
.timer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 16px 0;
}

.timer__mode-switch {
  display: flex;
  gap: 8px;
  background: var(--ff-surface);
  padding: 4px;
  border-radius: 12px;
  box-shadow: var(--ff-shadow-hard-sm);
}

.timer__mode-btn {
  border: none;
  background: transparent;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ff-ink-soft);
  cursor: pointer;
}

.timer__mode-btn--active {
  background: var(--ff-primary);
  color: white;
}

.timer__mode-btn:disabled {
  cursor: not-allowed;
}

.timer__circle {
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: var(--ff-surface);
  border: 4px solid var(--ff-ink);
  box-shadow: var(--ff-shadow-hard);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.timer__time {
  font-family: var(--ff-font-pixel);
  font-size: 2rem;
  color: var(--ff-primary);
}

.timer__label {
  margin-top: 8px;
  font-size: 0.8rem;
  color: var(--ff-ink-soft);
}

.timer__controls {
  width: 100%;
  max-width: 280px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>