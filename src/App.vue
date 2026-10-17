<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
  <jeep-sqlite></jeep-sqlite>
</template>

<script setup>
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import { onMounted } from 'vue';
import { Capacitor } from '@capacitor/core';
import { initializeDB } from '@/services/sqlite.js';
import { syncCategoriesFromServer, isOnline, syncProfileWithServer } from '@/services/sync.js'

onMounted(async () => {
  // ...
  const token = localStorage.getItem('focusflow_token');
  if (token && isOnline()) {
    await processSyncQueue();
  }
});
</script>