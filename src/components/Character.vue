<template>
  <div class="character-frame">
    <p
      v-if="showUsername && usernameFirst"
      class="character-frame__username"
      :class="{ 'character-frame__username--editable': usernameEditable }"
      @click="usernameEditable && $emit('edit-username')"
    >
      {{ username }}
      <ion-icon v-if="usernameEditable" :icon="pencilOutline" class="character-frame__username-icon" />
    </p>

    <div class="character-frame__border" @click="$emit('character-tap')">
      <div class="character-frame__inner">
        <transition name="char-fade">
            <div
              :key="characterAsset"
              class="character-sprite"
              :class="{ 'character-sprite--blink': isBlinking }"
              :style="{ backgroundImage: `url(${getCharacterUrl(characterAsset)})` }"
            ></div>
          </transition>
        <transition-group name="char-fade">
          <img
            v-for="item in headAccessories"
            :key="item.id"
            :src="getAssetUrl(item.asset_path)"
            class="character-accessory character-accessory--head"
          />
        </transition-group>
      </div>
    </div>

    <p v-if="characterName" class="character-frame__character-name">{{ characterName }}</p>

    <p
      v-if="showUsername && !usernameFirst"
      class="character-frame__username"
      :class="{ 'character-frame__username--editable': usernameEditable }"
      @click="usernameEditable && $emit('edit-username')"
    >
      {{ username }}
      <ion-icon v-if="usernameEditable" :icon="pencilOutline" class="character-frame__username-icon" />
    </p>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { IonIcon } from '@ionic/vue';
import { CHARACTERS } from '@/data/characters.js';
import { pencilOutline } from 'ionicons/icons';

const props = defineProps({
  equippedItems: { type: Array, default: () => [] },
  characterKey: { type: String, default: 'cat' },
  username: { type: String, default: 'user' },
  usernameEditable: { type: Boolean, default: false },
  showUsername: { type: Boolean, default: true },
  characterName: { type: String, default: '' },
  usernameFirst: { type: Boolean, default: false },
});

defineEmits(['edit-username', 'character-tap']);

const characterAsset = computed(() => {
  const found = CHARACTERS.find((c) => c.key === props.characterKey);
  return found ? found.asset : CHARACTERS[0].asset;
});

const characterModules = import.meta.glob('@/assets/characters/*.png', { eager: true, import: 'default' });
function getCharacterUrl(assetName) {
  const match = Object.entries(characterModules).find(([path]) => path.endsWith(assetName));
  return match ? match[1] : '';
}

const accessoryModules = import.meta.glob('@/assets/accessories/*.png', { eager: true, import: 'default' });
function getAssetUrl(assetPath) {
  if (!assetPath) return '';
  const match = Object.entries(accessoryModules).find(([path]) => path.endsWith(assetPath));
  return match ? match[1] : '';
}

const headAccessories = computed(() => props.equippedItems.filter((item) => item.asset_path));

const isBlinking = ref(false);
let blinkInterval = null;
let blinkTimeout = null;

function startBlinkLoop() {
  blinkInterval = setInterval(() => {
    isBlinking.value = true;
    blinkTimeout = setTimeout(() => { isBlinking.value = false; }, 200);
  }, 1500);
}

onMounted(startBlinkLoop);
onBeforeUnmount(() => {
  clearInterval(blinkInterval);
  clearTimeout(blinkTimeout);
});
</script>

<style scoped>
.character-frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.character-frame__border {
  position: relative;
  width: 136px;
  height: 136px;
  padding: 6px;
  background: var(--ff-ink);
  box-shadow: 0 0 0 3px var(--ff-surface), 0 0 0 6px var(--ff-ink), var(--ff-shadow-hard);
  clip-path: polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px), 0 10px);
  margin-bottom: 4px;
}

.character-frame__inner {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--ff-surface);
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  clip-path: polygon(7px 0, calc(100% - 7px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0 calc(100% - 7px), 0 7px);
}

.character-sprite-wrap {
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transform: scale(1) translateY(5%);
}

/* Sprite sekarang jadi background-position, bukan translateX pada <img> — lebih stabil, tanpa jitter */
.character-sprite {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-size: 240% 120%;
  background-position: 8.28% 20%;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

.character-sprite--blink {
  background-position: 94% 20%;
}

.character-accessory {
  position: absolute;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
  pointer-events: none;
}

.character-accessory--head {
  top: 7%;
  left: 48.50%;
  width: 100%;
  height: auto;
  transform: translateX(-50%) scale(1.2);
}

.character-frame__username {
  margin: 0;
  font-weight: 600;
  color: var(--ff-ink);
  display: flex;
  align-items: center;
  gap: 4px;
}

.character-frame__username--editable {
  cursor: pointer;
}

.character-frame__username-icon {
  font-size: 0.9rem;
  color: var(--ff-ink);
}

.character-frame__character-name {
  margin: 0;
  font-weight: 700;
  font-size: 0.75rem;
  color: #ffffff;
  background: #26262b;
  padding: 3px 6px;
  border-radius: 6px;
}

.char-fade-enter-active, .char-fade-leave-active { transition: opacity 0.25s ease; }
.char-fade-enter-from, .char-fade-leave-to { opacity: 0; }
</style>