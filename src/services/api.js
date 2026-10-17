import { BASE_URL } from '@/config.js';

function getToken() {
  return localStorage.getItem('focusflow_token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(name, email, password) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal mendaftar');
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Gagal login');
  const data = await res.json();
  localStorage.setItem('focusflow_token', data.token);
  return data;
}

export async function getCategoriesFromApi() {
  const res = await fetch(`${BASE_URL}/categories`);
  if (!res.ok) throw new Error('Gagal fetch categories');
  return res.json();
}

export async function getTasksFromApi() {
  const res = await fetch(`${BASE_URL}/tasks`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal fetch tasks');
  return res.json();
}

export async function createTaskApi(task) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Gagal membuat task di server');
  return res.json();
}

export async function updateTaskApi(id, task) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(task),
  });
  if (!res.ok) throw new Error('Gagal update task di server');
  return res.json();
}

export async function deleteTaskApi(id) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal hapus task di server');
  return res.json();
}

export async function completeTaskApi(id) {
  const res = await fetch(`${BASE_URL}/tasks/${id}/complete`, {
    method: 'PUT',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal menyelesaikan task di server');
  return res.json();
}

export async function getStatisticsFromApi() {
  const res = await fetch(`${BASE_URL}/statistics`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal fetch statistics');
  return res.json();
}

export async function getProfileApi() {
  const res = await fetch(`${BASE_URL}/profile`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal fetch profile');
  return res.json();
}

export async function updateProfileApi(data) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Gagal update profile');
  return res.json();
}

export async function getCharacterItemsApi() {
  const res = await fetch(`${BASE_URL}/character/items`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal fetch items');
  return res.json();
}

export async function createCharacterItemApi(item) {
  const res = await fetch(`${BASE_URL}/character/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error('Gagal simpan item');
  return res.json();
}

export async function equipAccessoryApi(itemName) {
  const res = await fetch(`${BASE_URL}/character/items/equip`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ itemName }),
  });
  if (!res.ok) throw new Error('Gagal equip di server');
  return res.json();
}

export async function unequipAccessoryApi(itemName) {
  const res = await fetch(`${BASE_URL}/character/items/unequip`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ itemName }),
  });
  if (!res.ok) throw new Error('Gagal unequip di server');
  return res.json();
}

export async function deleteAccountApi() {
  const res = await fetch(`${BASE_URL}/account`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Gagal menghapus akun');
  return res.json();
}

export async function getPomodoroApi() {
  const res = await fetch(`${BASE_URL}/pomodoro`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Gagal fetch pomodoro');
  return res.json();
}

export async function createPomodoroApi(taskId, duration) {
  const res = await fetch(`${BASE_URL}/pomodoro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ taskId, duration }),
  });
  if (!res.ok) throw new Error('Gagal simpan pomodoro ke server');
  return res.json();
}