import { BASE_URL } from '@/config.js';

function getToken() {
  return localStorage.getItem('focusflow_token');
}

export async function generatePlan(tasks, availableMinutes) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}/ai-planner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ tasks, availableMinutes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Gagal membuat jadwal');
  }
  const data = await res.json();
  return data.schedule;
}