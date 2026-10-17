import {
  getCategoriesFromApi, getProfileApi, updateProfileApi, getCharacterItemsApi,
  createCharacterItemApi, equipAccessoryApi, unequipAccessoryApi, getTasksFromApi,
} from '@/services/api.js';
import {
  getUserState, setXpLevelDirect, updateUsername, updateCharacterKey,
  getCharacterItems, importCharacterItemIfMissing, getTaskCount, importTaskFromServer,
} from '@/services/sqlite.js';
import { getPomodoroApi } from '@/services/api.js';
import { getPomodoroSessionCount, importPomodoroSession } from '@/services/sqlite.js';

export function isOnline() {
  return typeof navigator !== 'undefined' && navigator.onLine;
}

export async function syncCategoriesFromServer() {
  try {
    await getCategoriesFromApi();
    // Kategori sudah di-seed default saat initializeDB, tidak perlu di-overwrite
  } catch (err) {
    console.error('[SYNC] Gagal cek categories:', err.message);
  }
}

// Fresh install -> tarik task dari server. Device dengan task sudah ada -> biarkan (push terjadi langsung di sqlite.js tiap create/update/delete/complete)
export async function syncTasksWithServer() {
  try {
    const localCount = await getTaskCount();
    if (localCount > 0) return; // bukan fresh install, tidak perlu tarik

    const serverTasks = await getTasksFromApi();
    for (const task of serverTasks) {
      await importTaskFromServer(task);
    }
  } catch (err) {
    console.error('[SYNC] Gagal sync tasks:', err.message);
  }
}

export async function syncProfileWithServer() {
  try {
    const local = await getUserState();
    const localItems = await getCharacterItems();
    const looksFresh = local.xp === 0 && local.level === 1 && localItems.length <= 1;

    const server = await getProfileApi();
    const serverItems = await getCharacterItemsApi();

    if (looksFresh && (server.xp > 0 || serverItems.length > 1)) {
      await setXpLevelDirect(server.xp, server.level);
      if (server.name) await updateUsername(server.name);
      if (server.character_key) await updateCharacterKey(server.character_key);

      for (const item of serverItems) {
        await importCharacterItemIfMissing(item.item_name, item.item_type, item.asset_path, item.is_equipped);
      }
    } else {
      await updateProfileApi({
        name: local.username,
        xp: local.xp,
        level: local.level,
        characterKey: local.characterKey,
      });

      for (const item of localItems) {
        await createCharacterItemApi({
          itemName: item.item_name,
          itemType: item.item_type,
          assetPath: item.asset_path,
        });
        if (item.is_equipped && item.item_type !== 'character') {
          await equipAccessoryApi(item.item_name);
        }
      }
    }
  } catch (err) {
    console.error('[SYNC] Gagal sync profile:', err.message);
  }
}

// Dipanggil sekali saat app start (App.vue)
export async function processSyncQueue() {
  await syncCategoriesFromServer();
  await syncTasksWithServer();
  await syncPomodoroWithServer();
  await syncProfileWithServer();
}

export async function syncPomodoroWithServer() {
  try {
    const localCount = await getPomodoroSessionCount();
    if (localCount > 0) return; // bukan fresh login, tidak perlu tarik

    const serverSessions = await getPomodoroApi();
    for (const session of serverSessions) {
      await importPomodoroSession(session.task_id, session.duration, session.completed_at);
    }
  } catch (err) {
    console.error('[SYNC] Gagal sync pomodoro:', err.message);
  }
}