<template>
  <ion-tabs>
    <ion-router-outlet></ion-router-outlet>

    <ion-tab-bar slot="bottom">
      <ion-tab-button tab="home" href="/tabs/home">
        <ion-icon :icon="homeOutline" />
        <ion-label>Home</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="tasks" href="/tabs/tasks">
        <ion-icon :icon="checkboxOutline" />
        <ion-label>Tasks</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="pomodoro" href="/tabs/pomodoro">
        <ion-icon :icon="timerOutline" />
        <ion-label>Focus</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="statistics" href="/tabs/statistics">
        <ion-icon :icon="statsChartOutline" />
        <ion-label>Statistics</ion-label>
      </ion-tab-button>

      <ion-tab-button tab="profile" href="/tabs/profile">
        <ion-icon :icon="personOutline" />
        <ion-label>Profile</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  </ion-tabs>
</template>

<script setup>
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonRouterOutlet } from '@ionic/vue';
import {
  homeOutline,
  checkboxOutline,
  timerOutline,
  statsChartOutline,
  personOutline,
} from 'ionicons/icons';
</script>