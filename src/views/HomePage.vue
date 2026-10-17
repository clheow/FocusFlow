<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading" class="state-box"><ion-spinner /></div>

      <template v-else>
      <div class="speech-bubble">
        <p class="speech-bubble__text">{{ displayedGreeting }}</p>
      </div>

     <Character
        :equipped-items="equippedItems"
        :character-key="userState.characterKey"
        :username="userState.username"
        :show-username="false"
        :character-name="currentCharacterName"
         @character-tap="onCharacterTap"
      />

        <div class="ion-margin-top">
          <XPProgress :level="userState.level" :xp="userState.xpIntoLevel" :xp-to-next-level="userState.xpToNextLevel" />
        </div>

        <ion-grid class="ion-margin-top">
          <ion-row>
            <ion-col size="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <p class="stat-card__label">Progress Hari ini</p>
                  <p class="stat-card__value">{{ todayCompleted }} / {{ todayTotal }}</p>
                  <p class="stat-card__sub">Tasks Selesai</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
            <ion-col size="6">
              <ion-card class="stat-card">
                <ion-card-content>
                  <p class="stat-card__label">Focus Time</p>
                  <p class="stat-card__value">{{ focusTimeLabel }}</p>
                  <p class="stat-card__sub">Hari ini</p>
                </ion-card-content>
              </ion-card>
            </ion-col>
          </ion-row>
        </ion-grid>

        <ion-button expand="block" router-link="/tabs/pomodoro" class="ion-margin-top">
          Mulai Sesi Pomodoro
        </ion-button>
        <ion-button expand="block" fill="outline" router-link="/tabs/ai-planner" class="plan-my-day-btn">
          Buat Jadwal Hari Ini
        </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { initializeDB, getUserState, getCharacterItems, getTasks, getPomodoroSessionsToday } from '@/services/sqlite.js';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonButton, IonSpinner,
} from '@ionic/vue';
import { ref, computed, onBeforeUnmount} from 'vue';
import { onIonViewWillEnter } from '@ionic/vue';
import Character from '@/components/Character.vue';
import XPProgress from '@/components/XPProgress.vue';
import { CHARACTERS } from '@/data/characters.js';

const loading = ref(true);
const userState = ref({ level: 1, xp: 0, xpIntoLevel: 0, xpToNextLevel: 100 });
const equippedItems = ref([]);
const todayCompleted = ref(0);
const todayTotal = ref(0);
const focusMinutesToday = ref(0);
const greetingText = ref('Good Morning!');
const displayedGreeting = ref('');
let typewriterInterval = null;
const currentCharacterName = computed(() => {
  const found = CHARACTERS.find((c) => c.key === userState.value.characterKey);
  return found ? found.name : '';

});
  const CAT_QUOTES = [
  'You\'re doing great today!✨✨✨',
  'Don\’t forget to drink some water!🥤💧',
  'sometimes a short break can boost your focus!',
  'It\'s okay to take some break.',
  'Is it snack time? I really want some tuna 🐟',
  'Do you have snacks? 👀🐱',
  'I\'m feeling sleepy.....💤💤💤',
  'I could sleep all day.',
  'I have important cat business😼.',
  'Keep going, You can do it!',
];

let revertTimeout = null;

function onCharacterTap() {
  clearTimeout(revertTimeout);
  const quote = CAT_QUOTES[Math.floor(Math.random() * CAT_QUOTES.length)];
  playTypewriter(quote);

  revertTimeout = setTimeout(() => {
    playTypewriter(greetingText.value);
  }, 60000);
}

onIonViewWillEnter(async () => {
  loading.value = true;
  try {
    await initializeDB();
    userState.value = await getUserState();
    greetingText.value = getGreeting();
    playTypewriter(greetingText.value);

    const items = await getCharacterItems();
    equippedItems.value = items.filter((i) => i.is_equipped);

    const tasks = await getTasks();
    const todayStr = new Date().toISOString().slice(0, 10);
    const dueToday = tasks.filter((t) => t.deadline === todayStr);
    todayTotal.value = dueToday.length;
    todayCompleted.value = dueToday.filter((t) => t.status === 'completed').length;

    const sessions = await getPomodoroSessionsToday();
    focusMinutesToday.value = sessions.reduce((sum, s) => sum + (s.duration ?? 0), 0);
  } catch (err) {
    console.error('[HomePage] Gagal load data:', err);
  } finally {
    loading.value = false;
  }
});

const focusTimeLabel = computed(() => {
  const totalMinutes = Math.round(focusMinutesToday.value);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
});

function getGreeting() {
  const hour = new Date().getHours();
  const name = userState.value.username || 'user';
  if (hour >= 5 && hour < 12) return `Good Morning, ${name}!`;
  if (hour >= 12 && hour < 18) return `Good Afternoon, ${name}!`;
  if (hour >= 18 && hour < 23) return `Good Evening, ${name}!`;
  return `Good Night, ${name}!`;
}

function playTypewriter(text) {
  clearInterval(typewriterInterval);
  displayedGreeting.value = '';
  let i = 0;
  typewriterInterval = setInterval(() => {
    displayedGreeting.value += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(typewriterInterval);
    }
  }, 70);
}

onBeforeUnmount(() => {
  clearInterval(typewriterInterval);
   clearTimeout(revertTimeout);
});
</script>

<style scoped>
.state-box {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}

.plan-my-day-btn {
  margin-top: 10px;
}

.speech-bubble {
  position: relative;
  max-width: 260px;
  min-width: 220px;
  min-height: 50px;
  margin: 0 auto 16px;
  padding: 10px 16px;
  background: var(--ff-surface);
  border: 3px solid var(--ff-ink);
  border-radius: 10px;
  box-shadow: 3px 3px 0 var(--ff-ink);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.speech-bubble__text {
  margin: 0;
  font-family: var(--ff-font-pixel);
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--ff-ink);
  letter-spacing: 0.5px;
}

.speech-bubble::after {
  content: '';
  position: absolute;
  bottom: -13px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-top: 10px solid var(--ff-ink);
}

.speech-bubble::before {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-top: 7px solid var(--ff-surface);
  z-index: 1;
}

.stat-card {
  border-radius: var(--ff-card-radius);
  box-shadow: var(--ff-shadow-hard-sm);
  --background: var(--ff-surface);
  margin: 0;
}

.stat-card__label {
  font-size: 0.75rem;
  color: var(--ff-ink-soft);
  margin: 0;
}

.stat-card__value {
  font-family: var(--ff-font-pixel);
  font-size: 1.1rem;
  margin: 6px 0;
  color: var(--ff-primary);
}

.stat-card__sub {
  font-size: 0.7rem;
  color: var(--ff-ink-soft);
  margin: 0;
}
</style>