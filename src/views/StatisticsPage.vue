<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Statistics</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading" class="state-box"><ion-spinner /></div>

      <template v-else>
        <ion-grid>
          <ion-row>
            <ion-col size="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <p class="stat-card__label">Task Selesai</p>
                  <p class="stat-card__value">{{ stats.completedTasks }} / {{ stats.totalTasks }}</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <p class="stat-card__label">Sesi Pomodoro</p>
                  <p class="stat-card__value">{{ stats.totalSessions }}</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <p class="stat-card__label">Total Focus Time</p>
                  <p class="stat-card__value">{{ focusTimeLabel }}</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <p class="stat-card__label">Level & XP</p>
                  <p class="stat-card__value">LV.{{ stats.level }} · {{ stats.xp }} XP</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>

          <ion-row>
            <ion-col size="12">
              <div class="streak-banner">
                <span class="streak-banner__emoji">🔥</span>
                <div>
                  <p class="streak-banner__value">
                    {{ currentStreak }} hari beruntun
                  </p>
                  <p class="streak-banner__hint">
                    {{ currentStreak > 0 ? 'Terus lanjutkan!' : 'Selesaikan task hari ini untuk mulai streak!' }}
                  </p>
                </div>
              </div>
            </ion-col>
          </ion-row>
        </ion-grid>

        <h3 class="section-title">Produktivitas 7 Hari Terakhir</h3>
        <p class="week-total">Total {{ weeklyTotal }} task selesai minggu ini</p>

        <div class="chart">
          <div v-for="day in weeklyData" :key="day.date" class="chart__bar-wrapper">
            <div class="chart__bar-track">
              <div
                class="chart__bar"
                :style="{ height: barHeight(day.count) + '%' }"
              />
            </div>
            <span class="chart__count">{{ day.count }}</span>
            <span class="chart__label">{{ day.label }}</span>
          </div>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonSpinner,
} from '@ionic/vue';
import { getOverallStats, getWeeklyCompletedTasks, initializeDB } from '@/services/sqlite.js';

const loading = ref(true);
const stats = ref({
  totalTasks: 0, completedTasks: 0, totalSessions: 0, totalMinutes: 0, xp: 0, level: 1,
});
const weeklyData = ref([]);

async function loadData() {
  loading.value = true;
  try {
    await initializeDB();
    stats.value = await getOverallStats();
    weeklyData.value = await getWeeklyCompletedTasks();
  } catch (err) {
    console.error('[StatisticsPage] Gagal load data:', err);
  } finally {
    loading.value = false;
  }
}

onIonViewWillEnter(() => {
  loadData();
});

const focusTimeLabel = computed(() => {
  const totalMinutes = Math.round(stats.value.totalMinutes);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
});

const maxCount = computed(() => {
  const max = Math.max(...weeklyData.value.map((d) => d.count), 1);
  return max;
});

const weeklyTotal = computed(() =>
  weeklyData.value.reduce((sum, d) => sum + d.count, 0)
);

const currentStreak = computed(() => {
  const data = weeklyData.value;
  if (data.length === 0) return 0;

  let i = data.length - 1; // index hari ini
  // Kalau hari ini belum ada task selesai, jangan langsung putus —
  // mulai hitung dari kemarin (hari ini masih "berjalan")
  if (data[i].count === 0) i--;

  let streak = 0;
  for (; i >= 0; i--) {
    if (data[i].count > 0) streak++;
    else break;
  }
  return streak;
});

function barHeight(count) {
  if (count === 0) return 4; // biar tetap kelihatan sedikit garis dasar
  return Math.max(8, (count / maxCount.value) * 100);
}
</script>

<style scoped>
.state-box {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.stat-card {
  border-radius: var(--ff-card-radius);
  box-shadow: var(--ff-shadow-hard-sm);
  --background: var(--ff-surface);
  margin: 0 0 8px 0;
}

.stat-card__label {
  font-size: 0.7rem;
  color: var(--ff-ink-soft);
  margin: 0;
}

.stat-card__value {
  font-family: var(--ff-font-pixel);
  font-size: 1rem;
  margin: 6px 0 0;
  color: var(--ff-primary);
}

.section-title {
  margin-top: 16px;
  margin-bottom: 12px;
  color: var(--ff-ink);
}

.chart {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  background: var(--ff-surface);
  border-radius: var(--ff-card-radius);
  box-shadow: var(--ff-shadow-hard-sm);
  padding: 16px 12px;
  height: 160px;
}

.chart__bar-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.chart__bar-track {
  width: 20px;
  height: 90px;
  display: flex;
  align-items: flex-end;
  background: #EDEBFA;
  border-radius: 4px;
  overflow: hidden;
}

.chart__bar {
  width: 100%;
  background: var(--ff-accent-warm);
  border-radius: 4px 4px 0 0;
  transition: height 0.3s ease;
}

.chart__count {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--ff-ink);
}

.chart__label {
  font-size: 0.65rem;
  color: var(--ff-ink-soft);
}

.streak-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--ff-surface);
  border-radius: var(--ff-card-radius);
  box-shadow: var(--ff-shadow-hard-sm);
  padding: 14px 16px;
}

.streak-banner__emoji {
  font-size: 1.8rem;
}

.streak-banner__value {
  margin: 0;
  font-family: var(--ff-font-pixel);
  font-size: 0.95rem;
  color: var(--ff-ink);
}

.streak-banner__hint {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--ff-ink-soft);
}

.week-total {
  margin: -6px 0 12px;
  font-size: 0.8rem;
  color: var(--ff-ink-soft);
}
</style>