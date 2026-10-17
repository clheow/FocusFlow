<template>
  <ion-page>
    <ion-content class="ion-padding auth-content">
      <div class="auth-wrap">
        <div class="auth-mascot">
          <img src="/icon-foreground.png" class="auth-mascot__img" />
        </div>

        <h1 class="auth-title">FocusFlow</h1>
        <p class="auth-subtitle">Buat akun baru</p>

        <div class="auth-card">
          <div class="auth-field">
            <ion-icon :icon="personOutline" class="auth-field__icon" />
            <ion-input v-model="name" placeholder="Username" class="auth-field__input" />
          </div>

          <div class="auth-field">
            <ion-icon :icon="mailOutline" class="auth-field__icon" />
            <ion-input v-model="email" type="email" placeholder="Email" class="auth-field__input" />
          </div>

          <div class="auth-field">
            <ion-icon :icon="lockClosedOutline" class="auth-field__icon" />
            <ion-input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Buat Password Anda"
              class="auth-field__input"
            />
            <ion-icon
              :icon="showPassword ? eyeOffOutline : eyeOutline"
              class="auth-field__toggle"
              @click="showPassword = !showPassword"
            />
          </div>

          <ion-button expand="block" class="auth-submit" :disabled="loading" @click="onRegister">
            <ion-spinner v-if="loading" name="dots" />
            <span v-else>Daftar</span>
          </ion-button>
        </div>

        <p class="auth-switch">
          Sudah punya akun?
          <span class="auth-link" @click="router.replace('/login')">Masuk</span>
        </p>
      </div>

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
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonContent, IonInput, IonButton, IonSpinner, IonToast, IonIcon,
} from '@ionic/vue';
import { register, login } from '@/services/api.js';
import { processSyncQueue } from '@/services/sync.js';
import { updateUsername } from '@/services/sqlite.js';
import { eyeOutline, eyeOffOutline, mailOutline, lockClosedOutline, personOutline } from 'ionicons/icons';

const router = useRouter();
const name = ref('');
const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMsg = ref('');
const showPassword = ref(false);

async function onRegister() {
  if (!name.value || !email.value || !password.value) {
    errorMsg.value = 'Semua field wajib diisi';
    return;
  }
  if (password.value.length < 8) {
    errorMsg.value = 'Password minimal 8 karakter';
    return;
  }
  loading.value = true;
  errorMsg.value = '';
  try {
    await register(name.value, email.value, password.value);
    const result = await login(email.value, password.value);
    await updateUsername(result.user?.name || name.value.trim());
    await processSyncQueue();
    window.location.href = '/';
  } catch (err) {
    errorMsg.value = err.message || 'Gagal mendaftar';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-content {
  --background: radial-gradient(circle at 50% 0%, var(--ff-primary) 0%, transparent 45%), var(--ff-bg);
}

.auth-wrap {
  max-width: 360px;
  margin: 40px auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.auth-mascot {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: var(--ff-surface);
  border: 3px solid var(--ff-ink);
  box-shadow: var(--ff-shadow-hard);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 12px;
  animation: auth-float 3s ease-in-out infinite;
}

.auth-mascot__img {
  width: 70%;
  height: auto;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

@keyframes auth-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.auth-title {
  font-family: var(--ff-font-pixel);
  text-align: center;
  color: var(--ff-primary);
  font-size: 1.6rem;
  letter-spacing: 1px;
  margin: 0 0 4px;
}

.auth-subtitle {
  text-align: center;
  color: var(--ff-ink-soft);
  font-size: 0.85rem;
  margin-bottom: 24px;
}

.auth-card {
  width: 100%;
  background: var(--ff-surface);
  border: 3px solid var(--ff-ink);
  border-radius: 16px;
  box-shadow: var(--ff-shadow-hard);
  padding: 20px 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.auth-field {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--ff-ink);
  border-radius: 10px;
  padding: 4px 12px;
  background: var(--ff-bg);
}

.auth-field__icon {
  font-size: 1.1rem;
  color: var(--ff-ink-soft);
  flex-shrink: 0;
}

.auth-field__toggle {
  font-size: 1.1rem;
  color: var(--ff-ink-soft);
  cursor: pointer;
  flex-shrink: 0;
}

.auth-field__input {
  --padding-start: 0;
  --padding-end: 0;
  --background: transparent;
  --color: var(--ff-ink);
  flex: 1;
}

.auth-submit {
  margin-top: 4px;
}

.auth-switch {
  text-align: center;
  margin-top: 20px;
  font-size: 0.85rem;
  color: var(--ff-ink-soft);
}

.auth-link {
  color: var(--ff-primary);
  font-weight: 600;
  cursor: pointer;
}
</style>