<template>
  <ion-item button @click="$emit('open', task.id)" class="task-card" lines="none">
    <div class="task-card__content">
      <div class="task-card__top">
        <h3 :class="{ 'task-card__title--done': task.status === 'completed' }">
          {{ task.title }}
        </h3>
        <ion-badge :color="priorityColor">{{ task.priority }}</ion-badge>
      </div>
      <p v-if="task.description" class="task-card__desc">{{ task.description }}</p>
      <div class="task-card__meta">
        <ion-icon :icon="calendarOutline" />
        <span>{{ task.deadline }}</span>
        <ion-icon :icon="pricetagOutline" style="margin-left: 12px" />
        <span>{{ categoryName }}</span>
      </div>
    </div>
  </ion-item>
</template>

<script setup>
import { computed } from 'vue';
import { IonItem, IonBadge, IonIcon } from '@ionic/vue';
import { calendarOutline, pricetagOutline } from 'ionicons/icons';

const props = defineProps({
  task: { type: Object, required: true },
  categories: { type: Array, default: () => [] },
});

defineEmits(['open']);

const categoryName = computed(() => {
  const cat = props.categories.find((c) => c.id === props.task.categoryId);
  return cat ? cat.name : '-';
});

const priorityColor = computed(() => {
  if (props.task.priority === 'High') return 'danger';
  if (props.task.priority === 'Medium') return 'warning';
  return 'medium';
});
</script>

<style scoped>
.task-card {
  margin: 8px 12px;
  border-radius: var(--ff-card-radius);
  box-shadow: var(--ff-shadow-hard-sm);
  --background: var(--ff-surface);
  --padding-start: 0;
  --inner-padding-end: 0;
}

.task-card__content {
  width: 100%;
  padding: 12px;
}

.task-card__top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.task-card__top h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--ff-ink);
}

.task-card__title--done {
  text-decoration: line-through;
  color: var(--ff-ink-soft);
}

.task-card__desc {
  margin: 4px 0 8px;
  font-size: 0.85rem;
  color: var(--ff-ink-soft);
}

.task-card__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--ff-ink-soft);
}
</style>