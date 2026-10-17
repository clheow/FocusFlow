<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/home" />
        </ion-buttons>
        <ion-title>AI Planner</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <template v-if="!schedule">
        <p class="intro">Pilih task yang ingin dikerjakan hari ini, lalu masukkan waktu yang tersedia.</p>

        <div v-if="loadingTasks" class="state-box"><ion-spinner /></div>

        <div v-else-if="pendingTasks.length === 0" class="state-box state-box--empty">
          <ion-icon :icon="documentTextOutline" />
          <p>Tidak ada task.<br />Buat task dulu di halaman Tasks!</p>
        </div>

        <ion-list v-else>
          <ion-item v-for="task in pendingTasks" :key="task.id">
            <ion-checkbox
              slot="start"
              :checked="selectedIds.includes(task.id)"
              @ionChange="toggleSelect(task.id)"
            />
            <ion-label>
              <p>{{ task.title }}</p>
              <p class="task-meta">{{ task.priority }} · {{ task.deadline }}</p>
            </ion-label>
          </ion-item>
        </ion-list>

        <ion-item class="ion-margin-top">
          <ion-label position="stacked">Waktu tersedia (menit)</ion-label>
          <ion-input v-model="availableMinutes" type="number" placeholder="contoh: 120" />
        </ion-item>

        <ion-button
          expand="block"
          class="ion-margin-top"
          :disabled="selectedIds.length === 0 || !availableMinutes || generating"
          @click="onGenerate"
        >
          <ion-spinner v-if="generating" name="dots" />
          <span v-else>Buat Jadwal</span>
        </ion-button>
      </template>

      <template v-else>
        <h3 class="section-title">Jadwal Hari Ini</h3>
        <ion-card v-for="(item, i) in schedule" :key="i" class="schedule-card">
          <ion-card-content>
            <p class="schedule-time">{{ item.time }}</p>
            <p class="schedule-activity">{{ item.activity }}</p>
          </ion-card-content>
        </ion-card>

        <ion-button expand="block" fill="outline" class="ion-margin-top" @click="reset">
          Buat Jadwal Baru
        </ion-button>
      </template>

      <ion-toast
        :is-open="!!errorMsg"
        :message="errorMsg"
        color="danger"
        :duration="3000"
        @didDismiss="errorMsg = ''"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonList, IonItem, IonCheckbox, IonLabel, IonInput, IonButton, IonSpinner,
  IonCard, IonCardContent, IonToast, IonIcon
} from '@ionic/vue';
import { getTasks, initializeDB } from '@/services/sqlite.js';
import { generatePlan } from '@/services/ai.js';

const allTasks = ref([]);
const loadingTasks = ref(true);
const selectedIds = ref([]);
const availableMinutes = ref('');
const generating = ref(false);
const schedule = ref(null);
const errorMsg = ref('');

const pendingTasks = computed(() => allTasks.value.filter((t) => t.status !== 'completed'));

onIonViewWillEnter(async () => {
  loadingTasks.value = true;
  try {
    await initializeDB();
    allTasks.value = await getTasks();
  } catch (err) {
    console.error('[AIPlannerPage] Gagal load tasks:', err);
  } finally {
    loadingTasks.value = false;
  }
});

function toggleSelect(id) {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((i) => i !== id);
  } else {
    selectedIds.value = [...selectedIds.value, id];
  }
}

async function onGenerate() {
  generating.value = true;
  errorMsg.value = '';
  try {
    const selectedTasks = allTasks.value
      .filter((t) => selectedIds.value.includes(t.id))
      .map((t) => ({ title: t.title, priority: t.priority, deadline: t.deadline }));

    schedule.value = await generatePlan(selectedTasks, Number(availableMinutes.value));
  } catch (err) {
    errorMsg.value = err.message || 'Gagal membuat jadwal. Coba lagi.';
  } finally {
    generating.value = false;
  }
}

function reset() {
  schedule.value = null;
  selectedIds.value = [];
  availableMinutes.value = '';
}
</script>

<style scoped>
.intro {
  color: var(--ff-ink-soft);
  font-size: 0.85rem;
  margin-bottom: 12px;
}

.task-meta {
  font-size: 0.75rem;
  color: var(--ff-ink-soft);
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}

.section-title {
  margin-bottom: 12px;
  color: var(--ff-ink);
}

.schedule-card {
  border-radius: var(--ff-card-radius);
  box-shadow: var(--ff-shadow-hard-sm);
  --background: var(--ff-surface);
  margin: 0 0 8px 0;
}

.schedule-time {
  font-family: var(--ff-font-pixel);
  font-size: 0.85rem;
  color: var(--ff-primary);
  margin: 0 0 4px;
}

.schedule-activity {
  margin: 0;
  color: var(--ff-ink);
}

.state-box--empty {
  flex-direction: column;
  gap: 8px;
  color: var(--ff-ink-soft);
  text-align: center;
}

.state-box--empty ion-icon {
  font-size: 40px;
}
</style>