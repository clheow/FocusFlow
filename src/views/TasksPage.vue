<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Tasks</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-searchbar v-model="searchTerm" placeholder="Cari task..." />
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment v-model="statusFilter">
          <ion-segment-button value="all"><ion-label>Semua</ion-label></ion-segment-button>
          <ion-segment-button value="pending"><ion-label>Pending</ion-label></ion-segment-button>
          <ion-segment-button value="completed"><ion-label>Selesai</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="state-box">
        <ion-spinner />
      </div>

      <div v-else-if="filteredTasks.length === 0" class="state-box">
        <ion-icon :icon="documentTextOutline" />
        <p>Tidak ada task.<br />Buat task pertamamu!</p>
      </div>

        <template v-else>
          <div class="swipe-hint">
            <ion-icon :icon="handLeftOutline" />
            <span>Geser task ke kiri untuk menandai selesai</span>
          </div>
          <transition-group name="task-list" tag="div">
            <ion-item-sliding v-for="task in filteredTasks" :key="task.id" :ref="setSlidingRef(task.id)">
              <TaskCard :task="mapTask(task)" :categories="categories" @open="goToDetail" />
              <ion-item-options side="end">
                <ion-item-option
                  v-if="task.status !== 'completed'"
                  class="complete-btn"
                  @click="onComplete(task.id)"
                >
                  <ion-icon :icon="checkmarkDoneOutline" slot="start" />
                  Selesai
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </transition-group>
        </template>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button router-link="/tabs/tasks/new">
          <ion-icon :icon="addOutline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { onIonViewWillEnter, toastController } from '@ionic/vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonSearchbar,
  IonSegment, IonSegmentButton, IonLabel, IonFab, IonFabButton, IonIcon,
  IonSpinner, IonItemSliding, IonItemOptions, IonItemOption,
} from '@ionic/vue';
import TaskCard from '@/components/TaskCard.vue';
import { getTasks, getCategories, completeTask, initializeDB } from '@/services/sqlite.js';
import { addOutline, documentTextOutline, handLeftOutline, checkmarkDoneOutline } from 'ionicons/icons';


const router = useRouter();
const tasks = ref([]);
const categories = ref([]);
const loading = ref(true);
const hasLoaded = ref(false);

const searchTerm = ref('');
const statusFilter = ref('all');

const slidingRefs = {};
function setSlidingRef(id) {
  return (el) => {
    if (el) slidingRefs[id] = el;
  };
}

async function loadData() {
  if (!hasLoaded.value) loading.value = true;
  try {
    await initializeDB();
    tasks.value = await getTasks();
    categories.value = await getCategories();
  } catch (err) {
    console.error('[TasksPage] Gagal load data:', err);
  } finally {
    loading.value = false;
    hasLoaded.value = true;
  }
}

onIonViewWillEnter(() => {
  loadData();
});

function mapTask(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    deadline: t.deadline,
    status: t.status,
    categoryId: t.category_id,
  };
}

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.value.toLowerCase());
    const matchesStatus = statusFilter.value === 'all' || t.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

function goToDetail(id) {
  router.push(`/tabs/tasks/${id}`);
}

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

async function onComplete(id) {
  // Tutup sliding item dulu supaya gesture-nya tuntas sebelum data di-reload
  if (slidingRefs[id]) {
    await slidingRefs[id].$el.close();
  }

  const result = await completeTask(id);
  await loadData();

  await showToast('Task selesai! +10 XP', 'success');

  if (result.leveledUp) {
    await showToast(`⭐ Level Up! Sekarang Level ${result.newLevel}`, 'tertiary');
  }

  if (result.newReward) {
    await showToast(`🎉 Karakter/Item baru: ${result.newReward.name}!`, 'success');
  }
}
</script>

<style scoped>
.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--ff-ink-soft);
  text-align: center;
}

.state-box ion-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.swipe-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 8px 12px 4px;
  padding: 8px 12px;
  background: var(--ff-surface);
  border: 2px dashed var(--ff-ink-soft);
  border-radius: 10px;
  font-size: 0.7rem;
  color: var(--ff-ink-soft);
}

.swipe-hint ion-icon {
  font-size: 1rem;
  flex-shrink: 0;
}

.complete-btn {
  --background: var(--ff-success);
  --color: var(--ff-ink);
  font-weight: 700;
  font-family: var(--ff-font-pixel);
  font-size: 0.7rem;
  border-radius: 15px;
  margin: 8px 10px 8px;
  padding: 1px;
}

.task-list-move {
  transition: transform 0.4s ease;
}
</style>