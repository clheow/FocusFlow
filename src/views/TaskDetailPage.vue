<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tasks" />
        </ion-buttons>
        <ion-title>{{ isNew ? 'Tambah Task' : 'Edit Task' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading" class="state-box"><ion-spinner /></div>

      <template v-else>
        <ion-item>
          <ion-label position="stacked">Judul *</ion-label>
          <ion-input v-model="form.title" placeholder="Judul task" />
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Deskripsi</ion-label>
          <ion-textarea v-model="form.description" placeholder="Opsional" />
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Prioritas *</ion-label>
          <ion-select v-model="form.priority" placeholder="Pilih prioritas">
            <ion-select-option value="High">High</ion-select-option>
            <ion-select-option value="Medium">Medium</ion-select-option>
            <ion-select-option value="Low">Low</ion-select-option>
          </ion-select>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Deadline *</ion-label>
          <ion-input v-model="form.deadline" type="date" />
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Kategori</ion-label>
          <ion-select v-model="form.categoryId" placeholder="Pilih kategori">
            <ion-select-option v-for="c in categories" :key="c.id" :value="c.id">
              {{ c.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>

        <ion-button expand="block" class="ion-margin-top" @click="save">
          Simpan
        </ion-button>

        <ion-button
          v-if="!isNew"
          expand="block"
          fill="outline"
          color="danger"
          @click="confirmDelete"
        >
          Hapus Task
        </ion-button>
      </template>

      <ion-toast
        :is-open="toastOpen"
        :message="toastMessage"
        :color="toastColor"
        :duration="2000"
        @didDismiss="toastOpen = false"
      />

      <ion-alert
        :is-open="alertOpen"
        header="Hapus task?"
        message="Task yang dihapus tidak bisa dikembalikan."
        :buttons="alertButtons"
        @didDismiss="alertOpen = false"
      />
    </ion-content>
  </ion-page>
</template>

<script setup>
import { initializeDB, getUserState, getCharacterItems, getTasks, getPomodoroSessionsToday } from '@/services/sqlite.js';
import { reactive, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { onIonViewWillEnter } from '@ionic/vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton,
  IonSpinner, IonToast, IonAlert,
} from '@ionic/vue';
import {
  getCategories, getTaskById, createTask, updateTask, deleteTask,
} from '@/services/sqlite.js';

const route = useRoute();
const router = useRouter();

const isNew = computed(() => !route.params.id || route.params.id === 'new');
const loading = ref(true);
const categories = ref([]);

const form = reactive({
  title: '',
  description: '',
  priority: '',
  deadline: '',
  categoryId: null,
});

const toastOpen = ref(false);
const toastMessage = ref('');
const toastColor = ref('danger');

const alertOpen = ref(false);
const alertButtons = [
  { text: 'Batal', role: 'cancel' },
  { text: 'Hapus', role: 'destructive', handler: doDelete },
];

onIonViewWillEnter(async () => {
  loading.value = true;
  await initializeDB();
  categories.value = await getCategories();
  // ...baris-baris setelahnya tetap sama, tidak usah diubah

  if (!isNew.value) {
    const existing = await getTaskById(Number(route.params.id));
    if (existing) {
      form.title = existing.title;
      form.description = existing.description ?? '';
      form.priority = existing.priority ?? '';
      form.deadline = existing.deadline ?? '';
      form.categoryId = existing.category_id;
    }
  } else {
    form.title = '';
    form.description = '';
    form.priority = '';
    form.deadline = '';
    form.categoryId = null;
  }

  loading.value = false;
});

function showError(message) {
  toastColor.value = 'danger';
  toastMessage.value = message;
  toastOpen.value = true;
}

function validate() {
  if (!form.title.trim()) return 'Judul tidak boleh kosong';
  if (!form.priority) return 'Priority harus dipilih';
  if (!form.deadline) return 'Deadline tidak boleh kosong';
  return null;
}

async function save() {
  const error = validate();
  if (error) {
    showError(error);
    return;
  }

  if (isNew.value) {
    await createTask(form);
  } else {
    await updateTask(Number(route.params.id), form);
  }
  router.push('/tabs/tasks');
}

function confirmDelete() {
  alertOpen.value = true;
}

async function doDelete() {
  await deleteTask(Number(route.params.id));
  router.push('/tabs/tasks');
}
</script>

<style scoped>
.state-box {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
</style>