<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Focus</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <PomodoroTimer @session-complete="onSessionComplete" @running-change="onRunningChange" />

      <h3 class="history-title">Riwayat Hari Ini</h3>

      <div v-if="loading" class="state-box"><ion-spinner /></div>

      <div v-else-if="sessions.length === 0" class="empty-state">
        <p>Belum ada sesi focus hari ini.</p>
      </div>

      <ion-list v-else>
        <ion-item v-for="s in sessions" :key="s.id">
          <ion-icon :icon="timerOutline" slot="start" color="primary" />
          <ion-label>
            <p>{{ formatDuration(s.duration) }}</p>
          </ion-label>
          <ion-note slot="end">{{ formatTime(s.completed_at) }}</ion-note>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref } from 'vue';
import { onIonViewWillEnter, toastController } from '@ionic/vue';
import { onBeforeRouteLeave } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonNote, IonIcon, IonSpinner,
} from '@ionic/vue';
import { timerOutline } from 'ionicons/icons';
import PomodoroTimer from '@/components/PomodoroTimer.vue';
import { createPomodoroSession, getPomodoroSessionsToday, initializeDB } from '@/services/sqlite.js';

const sessions = ref([]);
const loading = ref(true);
const isSessionRunning = ref(false);

async function loadSessions() {
  loading.value = true;
  try {
    await initializeDB();
    sessions.value = await getPomodoroSessionsToday();
  } catch (err) {
    console.error('[PomodoroPage] Gagal load data:', err);
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(() => {
  loadSessions();
});

function onRunningChange(running) {
  isSessionRunning.value = running;
}

onBeforeRouteLeave((to, from, next) => {
  if (isSessionRunning.value) {
    showToast('Selesaikan, pause, atau reset sesi fokus dulu sebelum pindah halaman.', 'warning');
    next(false);
  } else {
    next();
  }
});

// Tampilkan satu toast, tunggu sampai hilang, baru lanjut ke toast berikutnya
async function showToast(message, color = 'success', duration = 1800) {
  const colorClassMap = {
    success: 'pixel-toast--success',
    tertiary: 'pixel-toast--levelup',
    warning: 'pixel-toast--warning',
  };
  const toast = await toastController.create({
    message,
    duration,
    cssClass: `pixel-toast ${colorClassMap[color] ?? 'pixel-toast--success'}`,
  });
  await toast.present();
  await toast.onDidDismiss();
}

async function onSessionComplete(durationMinutes) {
  const result = await createPomodoroSession(null, durationMinutes);
  await loadSessions();

  await showToast('Sesi focus selesai! +50 XP', 'success');

  if (result.leveledUp) {
    await showToast(`⭐ Level Up! Sekarang Level ${result.newLevel}`, 'tertiary');
  }

  if (result.newReward) {
    await showToast(`🎉 Karakter/Item baru: ${result.newReward.name}!`, 'success');
  }
}

function formatDuration(minutes) {
  if (minutes < 1) {
    const seconds = Math.round(minutes * 60);
    return `${seconds} detik`;
  }
  return `${Math.round(minutes)} menit`;
}

function formatTime(isoString) {
  const date = new Date(isoString + 'Z');
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}
</script>

<style scoped>
.history-title {
  margin-top: 24px;
  margin-bottom: 8px;
  font-size: 1rem;
  color: var(--ff-ink);
}

.state-box {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.empty-state {
  text-align: center;
  color: var(--ff-ink-soft);
  padding: 20px 0;
  font-size: 0.85rem;
}
</style>