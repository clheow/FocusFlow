<template>
  <div class="xp-progress">
    <div class="xp-progress__labels">
      <span class="xp-progress__level">LV.{{ level }}</span>
      <span class="xp-progress__count">{{ xp }} / {{ xpToNextLevel }} XP</span>
    </div>
    <div class="xp-progress__bar">
      <div
        v-for="i in segmentCount"
        :key="i"
        class="xp-progress__segment"
        :class="{ 'xp-progress__segment--filled': i <= filledSegments }"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  level: { type: Number, required: true },
  xp: { type: Number, required: true },
  xpToNextLevel: { type: Number, required: true },
});

const segmentCount = 20;
const filledSegments = computed(() =>
  Math.round((props.xp / props.xpToNextLevel) * segmentCount)
);
</script>

<style scoped>
.xp-progress__labels {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.xp-progress__level {
  font-family: var(--ff-font-pixel);
  font-size: 0.85rem;
  color: var(--ff-primary);
}

.xp-progress__count {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--ff-ink-soft);
}

.xp-progress__bar {
  display: flex;
  gap: 2px;
}

.xp-progress__segment {
  flex: 1;
  height: 14px;
  background: #E5E3F5;
  border-radius: 2px;
}

.xp-progress__segment--filled {
  background: var(--ff-accent-warm);
}
</style>