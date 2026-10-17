import { SQLiteConnection, CapacitorSQLite } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { CHARACTERS } from '@/data/characters.js';
import { createCharacterItemApi, updateProfileApi } from '@/services/api.js';
import {
  createTaskApi, updateTaskApi, deleteTaskApi, completeTaskApi, getTasksFromApi,
} from '@/services/api.js';
import { createPomodoroApi } from '@/services/api.js';

const sqlite = new SQLiteConnection(CapacitorSQLite);
const DB_NAME = 'focusflow_db';
let db = null;
let ready = false;

const CREATE_CATEGORIES = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  );
`;

const CREATE_TASKS = `
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT,
    deadline TEXT,
    status TEXT DEFAULT 'pending',
    xp_reward INTEGER DEFAULT 10,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

const CREATE_POMODORO = `
  CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    duration INTEGER,
    completed_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

const CREATE_USER_STATE = `
  CREATE TABLE IF NOT EXISTS user_state (
    id INTEGER PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1
  );
`;

const CREATE_CHARACTER_ITEMS = `
  CREATE TABLE IF NOT EXISTS character_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    item_type TEXT,
    asset_path TEXT,
    is_equipped INTEGER DEFAULT 0,
    unlocked_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

export const REWARD_MILESTONES = [
  { level: 2, name: 'Si Belang', type: 'character', asset: 'Si_Belang.png' },
  { level: 4, name: 'Si Beton', type: 'character', asset: 'Si_Beton.png' },
  { level: 6, name: 'Si Blacky', type: 'character', asset: 'Si_Blacky.png' },
  { level: 8, name: 'Si Kapas', type: 'character', asset: 'Si_Kapas.png' },
  { level: 10, name: 'Si Oyen', type: 'character', asset: 'Si_Oyen.png' },
  { level: 13, name: 'Leaf', type: 'accessory', asset: 'Leaf.png' },
  { level: 16, name: 'Ribbon', type: 'accessory', asset: 'Ribbon.png' },
  { level: 19, name: 'Headphone', type: 'outfit', asset: 'Headphone.png' },
  { level: 22, name: 'Love Bar', type: 'accessory', asset: 'Love_Bar.png' },
  { level: 25, name: 'Bunny Ears', type: 'accessory', asset: 'Bunny_Ears.png' },
  { level: 28, name: 'Glasses', type: 'accessory', asset: 'Glasses.png' },
];

export async function initializeDB() {
  if (ready) return db;

  try {
    if (Capacitor.getPlatform() === 'web') {
      await sqlite.initWebStore();
    }

    const consistency = await sqlite.checkConnectionsConsistency();
    const isConn = (await sqlite.isConnection(DB_NAME, false)).result;

    if (consistency.result && isConn) {
      db = await sqlite.retrieveConnection(DB_NAME, false);
    } else {
      db = await sqlite.createConnection(DB_NAME, false, 'no-encryption', 1, false);
    }

    await db.open();

    await db.execute(CREATE_CATEGORIES);
    await db.execute(CREATE_TASKS);
    await db.execute(CREATE_POMODORO);
    await db.execute(CREATE_USER_STATE);
    await db.execute(CREATE_CHARACTER_ITEMS);
    await migrateUserStateColumns();
    await migrateTasksColumns();

    await seedCategoriesIfEmpty();
    await seedUserStateIfEmpty();
    await seedStartingCharacterIfEmpty();

    if (Capacitor.getPlatform() === 'web') {
      await sqlite.saveToStore(DB_NAME);
    }

    ready = true;
    return db;
  } catch (err) {
    console.error('[DB] ERROR initializeDB:', err.message);
    throw err;
  }
}

async function ensureDb() {
  if (!ready) {
    await initializeDB();
  }
  return db;
}

async function seedCategoriesIfEmpty() {
  const result = await db.query('SELECT COUNT(*) as count FROM categories;');
  const count = result.values?.[0]?.count ?? 0;
  if (count === 0) {
    await db.run('INSERT INTO categories (name) VALUES (?);', ['Kuliah']);
    await db.run('INSERT INTO categories (name) VALUES (?);', ['Organisasi']);
    await db.run('INSERT INTO categories (name) VALUES (?);', ['Pribadi']);
  }
}

async function seedUserStateIfEmpty() {
  const result = await db.query('SELECT COUNT(*) as count FROM user_state;');
  const count = result.values?.[0]?.count ?? 0;
  if (count === 0) {
    await db.run('INSERT INTO user_state (id, xp, level) VALUES (1, 0, 1);');
  }
}

async function seedStartingCharacterIfEmpty() {
  const result = await db.query(
    "SELECT COUNT(*) as count FROM character_items WHERE item_type = 'character';"
  );
  const count = result.values?.[0]?.count ?? 0;
  if (count === 0) {
    const starter = CHARACTERS[0];
    await db.run(
      'INSERT INTO character_items (item_name, item_type, asset_path, is_equipped) VALUES (?, ?, ?, 1);',
      [starter.name, 'character', starter.asset]
    );
  }
}

async function migrateUserStateColumns() {
  const columnsToAdd = [
    { name: 'username', def: "TEXT DEFAULT 'user'" },
    { name: 'character_key', def: "TEXT DEFAULT 'garong'" },
  ];
  for (const col of columnsToAdd) {
    try {
      await db.execute(`ALTER TABLE user_state ADD COLUMN ${col.name} ${col.def};`);
    } catch (err) {
      // Kolom sudah ada dari sebelumnya — aman diabaikan
    }
  }
}

async function migrateTasksColumns() {
  try {
    await db.execute('ALTER TABLE tasks ADD COLUMN server_id INTEGER;');
  } catch (err) {}
  try {
    await db.execute('ALTER TABLE tasks ADD COLUMN completed_at TEXT;');
  } catch (err) {}
}

async function persist() {
  if (Capacitor.getPlatform() === 'web') {
    await sqlite.saveToStore(DB_NAME);
  }
}

const XP_PER_LEVEL = 100;

function levelFromXp(xp) {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function xpRangeForLevel(level) {
  const min = (level - 1) * XP_PER_LEVEL;
  const max = min + XP_PER_LEVEL;
  return { min, max };
}

// ===== CATEGORIES =====

export async function getCategories() {
  const database = await ensureDb();
  const result = await database.query('SELECT * FROM categories ORDER BY name;');
  return result.values ?? [];
}

// ===== TASKS =====

export async function getTasks() {
  const database = await ensureDb();
  const result = await database.query(
    `SELECT * FROM tasks
     ORDER BY
       CASE WHEN status = 'completed' THEN 1 ELSE 0 END ASC,
       created_at DESC;`
  );
  return result.values ?? [];
}

export async function getTaskById(id) {
  const database = await ensureDb();
  const result = await database.query('SELECT * FROM tasks WHERE id = ?;', [id]);
  return result.values?.[0] ?? null;
}

function normalizeServerDeadline(deadline) {
  if (typeof deadline !== 'string') return deadline;
  const match = deadline.match(/^(\d{4}-\d{2}-\d{2})(?:$|T)/);
  return match ? match[1] : deadline;
}

async function getTaskServerId(localId) {
  const database = await ensureDb();
  const result = await database.query('SELECT server_id FROM tasks WHERE id = ?;', [localId]);
  return result.values?.[0]?.server_id ?? null;
}

export async function importTaskFromServer(serverTask) {
  const database = await ensureDb();
  const existing = await database.query('SELECT id FROM tasks WHERE server_id = ?;', [serverTask.id]);
  if (existing.values && existing.values.length > 0) return;

  await database.run(
    `INSERT INTO tasks (server_id, category_id, title, description, priority, deadline, status)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [serverTask.id, serverTask.category_id, serverTask.title, serverTask.description,
     serverTask.priority, normalizeServerDeadline(serverTask.deadline), serverTask.status]
  );
  await persist();
}

export async function getTaskCount() {
  const database = await ensureDb();
  const result = await database.query('SELECT COUNT(*) as count FROM tasks;');
  return result.values?.[0]?.count ?? 0;
}

export async function createTask(task) {
  const database = await ensureDb();
  const result = await database.run(
    `INSERT INTO tasks (category_id, title, description, priority, deadline, status)
     VALUES (?, ?, ?, ?, ?, 'pending');`,
    [task.categoryId, task.title, task.description, task.priority, task.deadline]
  );
  const localId = result.changes.lastId;
  await persist();

  // Tidak di-await -> UI tidak menunggu proses jaringan
  createTaskApi(task)
    .then((res) => database.run('UPDATE tasks SET server_id = ? WHERE id = ?;', [res.id, localId]))
    .then(() => persist())
    .catch(() => {});

  return localId;
}

export async function updateTask(id, task) {
  const database = await ensureDb();
  await database.run(
    `UPDATE tasks
     SET category_id = ?, title = ?, description = ?, priority = ?, deadline = ?
     WHERE id = ?;`,
    [task.categoryId, task.title, task.description, task.priority, task.deadline, id]
  );
  await persist();

  try {
    const serverId = await getTaskServerId(id);
    updateTaskApi(serverId, task).catch(() => {});
  } catch (err) {}
}

export async function deleteTask(id) {
  const database = await ensureDb();
  const serverId = await getTaskServerId(id);
  await database.run('DELETE FROM tasks WHERE id = ?;', [id]);
  await persist();

  try {
    if (serverId) deleteTaskApi(serverId).catch(() => {});
  } catch (err) {}
}

export async function completeTask(id) {
  await ensureDb();
  const task = await getTaskById(id);
  if (!task || task.status === 'completed') {
    return { leveledUp: false, newReward: null };
  }

await db.run("UPDATE tasks SET status = 'completed', completed_at = datetime('now') WHERE id = ?;", [id]);
  const xpResult = await addXp(10);
  await persist();

  if (task.server_id) {
    completeTaskApi(task.server_id).catch(() => {});
  }

  return xpResult;
}


// ===== POMODORO =====

export async function createPomodoroSession(taskId, durationMinutes) {
  const database = await ensureDb();
  await database.run(
    'INSERT INTO pomodoro_sessions (task_id, duration) VALUES (?, ?);',
    [taskId, durationMinutes]
  );
  const xpResult = await addXp(50);
  await persist();

  createPomodoroApi(taskId, durationMinutes).catch(() => {});

  return xpResult;
}

export async function getPomodoroSessionsToday() {
  const database = await ensureDb();
  const result = await database.query(
    `SELECT * FROM pomodoro_sessions
     WHERE date(completed_at, 'localtime') = date('now', 'localtime')
     ORDER BY completed_at DESC;`
  );
  return result.values ?? [];
}

export async function getPomodoroStats() {
  const database = await ensureDb();
  const result = await database.query(
    'SELECT COUNT(*) as totalSessions, COALESCE(SUM(duration), 0) as totalMinutes FROM pomodoro_sessions;'
  );
  return result.values?.[0] ?? { totalSessions: 0, totalMinutes: 0 };
}

export async function getPomodoroSessionCount() {
  const database = await ensureDb();
  const result = await database.query('SELECT COUNT(*) as count FROM pomodoro_sessions;');
  return result.values?.[0]?.count ?? 0;
}

export async function importPomodoroSession(taskId, duration, completedAt) {
  const database = await ensureDb();
  await database.run(
    'INSERT INTO pomodoro_sessions (task_id, duration, completed_at) VALUES (?, ?, ?);',
    [taskId, duration, completedAt]
  );
  await persist();
}

// ===== USER STATE (XP & LEVEL) =====

export async function getUserState() {
  const database = await ensureDb();
  const result = await database.query('SELECT * FROM user_state WHERE id = 1;');
  const state = result.values?.[0] ?? { xp: 0, level: 1, username: 'user', character_key: 'cat' };
  const { min, max } = xpRangeForLevel(state.level);
  return {
    xp: state.xp,
    level: state.level,
    xpIntoLevel: state.xp - min,
    xpToNextLevel: max - min,
    username: state.username ?? 'user',
    characterKey: state.character_key ?? 'cat',
  };
}

export async function updateUsername(name) {
  const database = await ensureDb();
  await database.run('UPDATE user_state SET username = ? WHERE id = 1;', [name]);
  await persist();
}

export async function updateCharacterKey(key) {
  const database = await ensureDb();
  await database.run('UPDATE user_state SET character_key = ? WHERE id = 1;', [key]);
  await persist();

  getUserState()
    .then((state) => updateProfileApi({ name: state.username, xp: state.xp, level: state.level, characterKey: key }))
    .catch(() => {});
}

async function addXp(amount) {
  const current = await db.query('SELECT xp FROM user_state WHERE id = 1;');
  const oldXp = current.values?.[0]?.xp ?? 0;
  const oldLevel = levelFromXp(oldXp);

  const newXp = oldXp + amount;
  const newLevel = levelFromXp(newXp);

  await db.run('UPDATE user_state SET xp = ?, level = ? WHERE id = 1;', [newXp, newLevel]);

  let newReward = null;
  if (newLevel > oldLevel) {
    newReward = await checkLevelRewards(oldLevel, newLevel);
  }

  getUserState()
    .then((state) => updateProfileApi({ name: state.username, xp: newXp, level: newLevel, characterKey: state.characterKey }))
    .catch(() => {});

  if (newReward) {
    createCharacterItemApi({ itemName: newReward.name, itemType: newReward.type, assetPath: newReward.asset }).catch(() => {});
  }

  return { leveledUp: newLevel > oldLevel, newLevel, newReward };
}

// Cek semua milestone level di antara level lama dan baru (jaga-jaga kalau naik beberapa level sekaligus)
async function checkLevelRewards(oldLevel, newLevel) {
  for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
    const matching = REWARD_MILESTONES.find((r) => r.level === lvl);
    if (!matching) continue;

    const existing = await db.query(
      'SELECT * FROM character_items WHERE item_name = ?;',
      [matching.name]
    );
    if (existing.values && existing.values.length > 0) continue;

    await db.run(
      'INSERT INTO character_items (item_name, item_type, asset_path, is_equipped) VALUES (?, ?, ?, 0);',
      [matching.name, matching.type, matching.asset]
    );
    return matching; // cukup kembalikan satu reward pertama yang ketemu untuk notifikasi
  }
  return null;
}

// ===== CHARACTER ITEMS =====

export async function getCharacterItems() {
  const database = await ensureDb();
  const result = await database.query('SELECT * FROM character_items ORDER BY unlocked_at;');
  return result.values ?? [];
}

export async function equipItem(id) {
  const database = await ensureDb();
  const itemResult = await database.query('SELECT item_name FROM character_items WHERE id = ?;', [id]);
  const itemName = itemResult.values?.[0]?.item_name;

  await database.run('UPDATE character_items SET is_equipped = 1 WHERE id = ?;', [id]);
  await persist();

  if (itemName) {
    import('@/services/api.js').then(({ equipAccessoryApi }) => equipAccessoryApi(itemName)).catch(() => {});
  }
}

export async function unequipItem(id) {
  const database = await ensureDb();
  const itemResult = await database.query('SELECT item_name FROM character_items WHERE id = ?;', [id]);
  const itemName = itemResult.values?.[0]?.item_name;

  await database.run('UPDATE character_items SET is_equipped = 0 WHERE id = ?;', [id]);
  await persist();

  if (itemName) {
    import('@/services/api.js').then(({ unequipAccessoryApi }) => unequipAccessoryApi(itemName)).catch(() => {});
  }
}

// ===== STATISTICS =====

export async function getOverallStats() {
  const database = await ensureDb();

  const taskResult = await database.query(
    `SELECT COUNT(*) as total, SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
     FROM tasks;`
  );
  const pomodoroResult = await database.query(
    'SELECT COUNT(*) as totalSessions, COALESCE(SUM(duration), 0) as totalMinutes FROM pomodoro_sessions;'
  );
  const userResult = await database.query('SELECT xp, level FROM user_state WHERE id = 1;');

  const taskStats = taskResult.values?.[0] ?? { total: 0, completed: 0 };
  const pomodoroStats = pomodoroResult.values?.[0] ?? { totalSessions: 0, totalMinutes: 0 };
  const userStats = userResult.values?.[0] ?? { xp: 0, level: 1 };

  return {
    totalTasks: taskStats.total ?? 0,
    completedTasks: taskStats.completed ?? 0,
    totalSessions: pomodoroStats.totalSessions ?? 0,
    totalMinutes: pomodoroStats.totalMinutes ?? 0,
    xp: userStats.xp ?? 0,
    level: userStats.level ?? 1,
  };
}

// Jumlah task selesai per hari, 7 hari terakhir (termasuk hari ini)
export async function getWeeklyCompletedTasks() {
  const database = await ensureDb();
  const result = await database.query(
    `SELECT date(completed_at, 'localtime') as day, COUNT(*) as count
     FROM tasks
     WHERE status = 'completed'
       AND completed_at IS NOT NULL
       AND date(completed_at, 'localtime') >= date('now', '-6 days', 'localtime')
     GROUP BY date(completed_at, 'localtime');`
  );
  const rows = result.values ?? [];

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().slice(0, 10);
    const found = rows.find((r) => r.day === dayStr);
    days.push({
      date: dayStr,
      label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      count: found ? found.count : 0,
    });
  }
  return days;
}

// ===== SYNC HELPERS (dipakai sync.js) =====

export async function setXpLevelDirect(xp, level) {
  const database = await ensureDb();
  await database.run('UPDATE user_state SET xp = ?, level = ? WHERE id = 1;', [xp, level]);
  await persist();
}

export async function importCharacterItemIfMissing(itemName, itemType, assetPath, isEquipped) {
  const database = await ensureDb();
  const existing = await database.query(
    'SELECT id FROM character_items WHERE item_name = ?;',
    [itemName]
  );
  if (existing.values && existing.values.length > 0) return;
  await database.run(
    'INSERT INTO character_items (item_name, item_type, asset_path, is_equipped) VALUES (?, ?, ?, ?);',
    [itemName, itemType, assetPath, isEquipped ? 1 : 0]
  );
  await persist();
}

export async function clearLocalUserData() {
  const database = await ensureDb();
  await database.run('DELETE FROM tasks;');
  await database.run('DELETE FROM pomodoro_sessions;');
  await database.run('DELETE FROM character_items;');
  await database.run(
    "UPDATE user_state SET xp = 0, level = 1, character_key = 'garong' WHERE id = 1;"
  );
  await seedStartingCharacterIfEmpty();
  await persist();
}