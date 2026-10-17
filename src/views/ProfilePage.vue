<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Profile</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="loading" class="state-box"><ion-spinner /></div>

      <template v-else>
       <Character
        :equipped-items="equippedAccessories"
        :character-key="userState.characterKey"
        :username="userState.username"
        :username-editable="true"
        :character-name="currentCharacterName"
        :username-first="true"
        @edit-username="openUsernameAlert"
      />

        <div class="ion-margin-top">
          <XPProgress :level="userState.level" :xp="userState.xpIntoLevel" :xp-to-next-level="userState.xpToNextLevel" />
        </div>

        <h3 class="section-title">Ganti Karakter</h3>
        <div class="grid">
          <button
            v-for="c in CHARACTERS"
            :key="c.key"
            class="grid-card"
            :class="{
              'grid-card--active': isCharacterOwned(c.name) && c.key === userState.characterKey,
              'grid-card--locked': !isCharacterOwned(c.name),
            }"
            :disabled="!isCharacterOwned(c.name)"
            @click="selectCharacter(c)"
          >
            <div class="grid-card__thumb">
              <div class="thumb-viewport">
                <img
                  v-if="isCharacterOwned(c.name)"
                  :src="getCharacterUrl(c.asset)"
                  class="thumb-img"
                />
                <ion-icon v-else :icon="lockClosedOutline" class="grid-card__placeholder-icon" />
              </div>
            </div>
            <span class="grid-card__name">{{ c.name }}</span>
            <span v-if="!isCharacterOwned(c.name)" class="grid-card__hint">{{ characterHint(c) }}</span>
            <ion-icon
              v-else-if="c.key === userState.characterKey"
              :icon="checkmarkCircle"
              class="grid-card__badge"
            />
          </button>
        </div>

        <h3 class="section-title">Ganti Aksesoris</h3>

        <div v-if="!allCharactersOwned" class="locked-banner">
          <ion-icon :icon="lockClosedOutline" />
          <p>Kumpulkan semua karakter dulu untuk membuka aksesoris!</p>
        </div>

        <div v-else class="grid">
          <button
            v-for="entry in accessoryDisplayList"
            :key="entry.name"
            class="grid-card"
            :class="{ 'grid-card--active': entry.equipped, 'grid-card--locked': !entry.unlocked }"
            :disabled="!entry.unlocked"
            @click="toggleAccessory(entry)"
          >
            <div class="grid-card__thumb">
              <img v-if="entry.asset && entry.unlocked" :src="getAccessoryUrl(entry.asset)" class="thumb-img thumb-img--accessory" />
              <ion-icon v-else :icon="entry.unlocked ? shirtOutline : lockClosedOutline" class="grid-card__placeholder-icon" />
            </div>
            <span class="grid-card__name">{{ entry.name }}</span>
            <span v-if="!entry.unlocked" class="grid-card__hint">Level {{ entry.level }}</span>
            <ion-icon v-else-if="entry.equipped" :icon="checkmarkCircle" class="grid-card__badge" />
          </button>
        </div>
        <ion-button expand="block" fill="outline" color="danger" class="ion-margin-top" @click="onLogout">
          Logout
        </ion-button>
        <ion-button expand="block" fill="clear" color="danger" class="ion-margin-top" @click="confirmDeleteAccount">
          Hapus Akun
        </ion-button>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { onIonViewWillEnter} from '@ionic/vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonSpinner, IonButton, IonIcon,
} from '@ionic/vue';
import { checkmarkCircle, shirtOutline, lockClosedOutline } from 'ionicons/icons';
import Character from '@/components/Character.vue';
import XPProgress from '@/components/XPProgress.vue';
import { CHARACTERS } from '@/data/characters.js';
import {
  getUserState, getCharacterItems, equipItem, unequipItem,
  updateUsername, updateCharacterKey, initializeDB, REWARD_MILESTONES, clearLocalUserData,
} from '@/services/sqlite.js';
import { deleteAccountApi } from '@/services/api.js';
import { alertController } from '@ionic/vue';

const router = useRouter();
const loading = ref(true);
const hasLoaded = ref(false);
const userState = ref({ level: 1, xp: 0, xpIntoLevel: 0, xpToNextLevel: 100, username: 'user', characterKey: 'garong' });
const allItems = ref([]);
const currentCharacterName = computed(() => {
  const found = CHARACTERS.find((c) => c.key === userState.value.characterKey);
  return found ? found.name : '';
});

async function loadData() {
  if (!hasLoaded.value) loading.value = true;
  try {
    await initializeDB();
    userState.value = await getUserState();
    allItems.value = await getCharacterItems();
  } catch (err) {
    console.error('[ProfilePage] Gagal load data:', err);
  } finally {
    loading.value = false;
    hasLoaded.value = true;
  }
}

onIonViewWillEnter(() => {
  loadData();
});

const equippedAccessories = computed(() =>
  allItems.value.filter((i) => i.is_equipped && i.item_type !== 'character')
);

function isCharacterOwned(name) {
  return allItems.value.some((i) => i.item_type === 'character' && i.item_name === name);
}

function characterHint(c) {
  const milestone = REWARD_MILESTONES.find((r) => r.type === 'character' && r.name === c.name);
  return milestone ? `Level ${milestone.level}` : '';
}

const allCharactersOwned = computed(() =>
  CHARACTERS.every((c) => isCharacterOwned(c.name))
);

const accessoryMilestones = computed(() =>
  REWARD_MILESTONES.filter((r) => r.type !== 'character')
);

const accessoryDisplayList = computed(() =>
  accessoryMilestones.value.map((milestone) => {
    const owned = allItems.value.find((i) => i.item_name === milestone.name);
    return {
      ...milestone,
      unlocked: !!owned,
      equipped: owned ? !!owned.is_equipped : false,
      dbId: owned ? owned.id : null,
    };
  })
);

async function selectCharacter(c) {
  if (!isCharacterOwned(c.name)) return;
  const imageUrl = getCharacterUrl(c.asset);
  if (imageUrl) await preloadImage(imageUrl);
  await updateCharacterKey(c.key);
  userState.value = { ...userState.value, characterKey: c.key };
}

function preloadImage(url) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = url;
    if (image.complete) resolve();
  });
}

async function toggleAccessory(entry) {
  if (!entry.unlocked) return;

  if (entry.equipped) {
    await unequipItem(entry.dbId);
  } else {
    // Lepas dulu semua aksesoris lain yang sedang dipakai (hanya boleh 1 aktif)
    const otherEquipped = allItems.value.filter(
      (i) => i.item_type !== 'character' && i.is_equipped && i.id !== entry.dbId
    );
    for (const other of otherEquipped) {
      await unequipItem(other.id);
    }
    await equipItem(entry.dbId);
  }

  await loadData();
}


async function openUsernameAlert() {
  const alert = await alertController.create({
    header: 'Ubah Nama',
    inputs: [{ name: 'username', type: 'text', value: userState.value.username, placeholder: 'Nama kamu' }],
    buttons: [
      { text: 'Batal', role: 'cancel' },
      {
        text: 'Simpan',
        handler: async (data) => {
          const newName = data.username?.trim();
          if (newName) {
            try {
              await updateUsername(newName);
              await loadData();
            } catch (err) {
              console.error('[ProfilePage] Gagal update username:', err);
            }
          }
        },
      },
    ],
  });
  await alert.present();
}

async function confirmDeleteAccount() {
  const alert = await alertController.create({
    header: 'Hapus Akun?',
    message: 'Semua data akun kamu di server akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
    buttons: [
      { text: 'Batal', role: 'cancel' },
      {
        text: 'Hapus',
        role: 'destructive',
        handler: async () => {
          try {
            await deleteAccountApi();
            await clearLocalUserData();
            localStorage.removeItem('focusflow_token');
            router.replace('/login');
          } catch (err) {
            console.error('[ProfilePage] Gagal hapus akun:', err);
          }
        },
      },
    ],
  });
  await alert.present();
}

async function onLogout() {
  const alert = await alertController.create({
    header: 'Keluar?',
    message: 'Kamu akan keluar dari akun ini.',
    buttons: [
      { text: 'Batal', role: 'cancel' },
      {
        text: 'Keluar',
        role: 'destructive',
      handler: async () => {
        await clearLocalUserData();
        localStorage.removeItem('focusflow_token');
        router.replace('/login');
      },
      },
    ],
  });
  await alert.present();
}

const characterModules = import.meta.glob('@/assets/characters/*.png', { eager: true, import: 'default' });
function getCharacterUrl(assetName) {
  const match = Object.entries(characterModules).find(([path]) => path.endsWith(assetName));
  return match ? match[1] : '';
}

const accessoryModules = import.meta.glob('@/assets/accessories/*.png', { eager: true, import: 'default' });
function getAccessoryUrl(assetName) {
  const match = Object.entries(accessoryModules).find(([path]) => path.endsWith(assetName));
  return match ? match[1] : '';
}
</script>

<style scoped>
.state-box { display: flex; justify-content: center; padding: 60px 0; }
.section-title { margin-top: 24px; margin-bottom: 8px; color: var(--ff-ink); }

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.grid-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 6px;
  background: var(--ff-surface);
  border: 2px solid var(--ff-ink);
  border-radius: 12px;
  box-shadow: var(--ff-shadow-hard-sm);
  cursor: pointer;
}
.grid-card--active { border-color: var(--ff-primary); box-shadow: 3px 3px 0 var(--ff-primary); }
.grid-card--locked { opacity: 0.5; cursor: not-allowed; }

.grid-card__thumb { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.thumb-viewport { width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; }
.thumb-img { height: 100%; width: auto; max-width: none; image-rendering: pixelated; image-rendering: -moz-crisp-edges; image-rendering: crisp-edges; }
.thumb-img--accessory { height: auto; width: 70%; max-width: 100%; }
.grid-card__placeholder-icon {
  font-size: 1.8rem;
  color: var(--ff-ink-soft);
  display: block;
  width: 100%;
  text-align: center;
}
.grid-card__name { font-size: 0.7rem; font-weight: 600; color: var(--ff-ink); text-align: center; }
.grid-card__hint { font-size: 0.6rem; color: var(--ff-ink-soft); text-align: center; }
.grid-card__badge { position: absolute; top: -6px; right: -6px; font-size: 1.1rem; color: var(--ff-success); background: var(--ff-surface); border-radius: 50%; }

.locked-banner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px;
  color: var(--ff-ink-soft);
  font-size: 0.8rem;
  text-align: center;
}
.locked-banner ion-icon { font-size: 1.8rem; }
</style>