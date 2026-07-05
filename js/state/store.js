/*
  App.Store — single source of truth. Plain object state, localStorage persistence,
  tiny pub/sub so feature modules can react to changes without a framework.
*/
(function () {
  'use strict';
  window.App = window.App || {};
  const { uuid, debounce } = App.Helpers;

  const DEFAULT_SETTINGS = {
    theme: 'auto',
    accent: 'indigo',
    fontSize: 'md',
    density: 'comfortable',
    contrast: 'normal',
    reducedMotion: false,
    soundsEnabled: true,
    soundVolume: 0.5,
    notificationsEnabled: false,
    reminderMinutesBefore: 30,
    dailyReminderTime: null,
    weekStartsMonday: true,
    groupBy: 'date',
    onboardingComplete: false,
    pomodoro: { focusMin: 25, shortBreakMin: 5, longBreakMin: 15, sessionsBeforeLongBreak: 4, autoStartNext: false, soundOnFinish: true, dailyGoalMin: 120 },
  };

  const state = {
    tasks: [],
    trash: [],
    templates: [],
    categories: [],
    pomodoroSessions: [],
    achievementsUnlocked: [],
    activityLog: [],
    quoteFavorites: [],
    notes: [],
    tables: [],
    focusStickyNotes: [],
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    streak: { current: 0, longest: 0, lastCompletionDate: null },
  };

  const listeners = {};
  function on(evt, cb) { (listeners[evt] = listeners[evt] || []).push(cb); return () => off(evt, cb); }
  function off(evt, cb) { if (listeners[evt]) listeners[evt] = listeners[evt].filter((f) => f !== cb); }
  function emit(evt, payload) { (listeners[evt] || []).forEach((cb) => { try { cb(payload); } catch (e) { console.error(e); } }); }

  const persist = debounce(() => {
    App.Storage.set('state', {
      tasks: state.tasks, trash: state.trash, templates: state.templates, categories: state.categories,
      pomodoroSessions: state.pomodoroSessions, achievementsUnlocked: state.achievementsUnlocked,
      activityLog: state.activityLog.slice(0, 200), quoteFavorites: state.quoteFavorites,
      notes: state.notes, tables: state.tables, focusStickyNotes: state.focusStickyNotes,
      settings: state.settings, streak: state.streak,
    });
  }, 300);

  function save() { persist(); emit('persist'); }

  function init() {
    const saved = App.Storage.get('state', null);
    if (saved) {
      Object.assign(state, {
        tasks: saved.tasks || [],
        trash: saved.trash || [],
        templates: saved.templates || [],
        categories: saved.categories || [],
        pomodoroSessions: saved.pomodoroSessions || [],
        achievementsUnlocked: saved.achievementsUnlocked || [],
        activityLog: saved.activityLog || [],
        quoteFavorites: saved.quoteFavorites || [],
        notes: saved.notes || [],
        tables: saved.tables || [],
        focusStickyNotes: saved.focusStickyNotes || [],
        settings: Object.assign({}, DEFAULT_SETTINGS, saved.settings, {
          pomodoro: Object.assign({}, DEFAULT_SETTINGS.pomodoro, (saved.settings || {}).pomodoro),
        }),
        streak: saved.streak || { current: 0, longest: 0, lastCompletionDate: null },
      });
    } else {
      seedFirstRun();
    }
  }

  function seedFirstRun() {
    var D = App.DateUtils;
    var today = new Date();
    var td = D.toISODate(today);
    var tmw = D.toISODate(D.addDays(today, 1));
    var nextWeek = D.toISODate(D.addDays(today, 7));
    var nextMonth = D.toISODate(D.addDays(today, 30));

    state.categories = [
      { id: 'work', name: 'Work', color: '#5b5fef' },
      { id: 'personal', name: 'Personal', color: '#10b981' },
      { id: 'learning', name: 'Learning', color: '#f59e0b' },
      { id: 'health', name: 'Health', color: '#f43f5e' },
      { id: 'finance', name: 'Finance', color: '#14b8a6' },
    ];

    state.notes = [
      { id: uuid(), title: 'Project Alpha \u2014 Architecture Notes', content: '# Architecture\n\n## Overview\nThe new microservices architecture splits the monolith into three services:\n\n- **API Gateway** \u2014 rate limiting, auth, routing\n- **User Service** \u2014 profiles, preferences\n- **Analytics Service** \u2014 event tracking, reports\n\n## Tech Stack\n- Node.js + Express for the gateway\n- Go for the user service\n- Python (FastAPI) for analytics\n\n## Next Steps\n1. Finalize API contracts between services\n2. Set up CI/CD pipeline per service\n3. Write integration tests', linkedTaskIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: uuid(), title: 'Weekly Planning Template', content: '# Weekly Plan\n\n## Goals\n- [ ] Top priority this week\n- [ ] Secondary goal\n- [ ] Learning objective\n\n## Meetings\n- Monday standup\n- Wednesday sprint review\n\n## Notes\nUse this template every Monday morning to plan your week.', linkedTaskIds: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    var note1Id = state.notes[0].id;
    var note2Id = state.notes[1].id;

    state.tasks = [
      // ── Work Category ──
      makeTask({ title: 'Q3 Planning \u2014 draft roadmap', description: 'Compile team goals, OKRs, and key milestones for next quarter.', notes: '**Deadline:** End of month\n\n**Stakeholders:**\n- Engineering leads\n- Product team\n- Design', priority: 'high', dueDate: nextMonth, category: 'work', tags: ['planning', 'okrs'], estimatedDuration: 120, progress: 35, pinned: true, order: 0 }),
      makeTask({ title: 'Team sync preparation', description: 'Review last week\u2019s action items and prepare agenda.', notes: '## Agenda\n1. Product updates (10min)\n2. Engineering wins (5min)\n3. Blockers (15min)\n4. Action items', priority: 'medium', dueDate: tmw, dueTime: '09:00', category: 'work', tags: ['meeting'], estimatedDuration: 30, color: '#5b5fef', pinned: true, order: 1 }),
      makeTask({ title: 'Fix login timeout bug (P0)', description: 'Users are getting logged out after 2 minutes of inactivity on the dashboard.', priority: 'urgent', dueDate: td, category: 'work', tags: ['bug', 'urgent'], estimatedDuration: 120, progress: 80, order: 2 }),
      makeTask({ title: 'Update onboarding docs', description: 'Add screenshots and rewrite the quick start guide for new users.', priority: 'low', dueDate: nextWeek, category: 'work', tags: ['docs'], estimatedDuration: 60, order: 3 }),
      makeTask({ title: 'Code review: notifications feature', description: 'Review PR #342 \u2014 push notification system for mobile clients.', priority: 'medium', dueDate: td, dueTime: '14:00', category: 'work', tags: ['pr-review'], estimatedDuration: 45, order: 4 }),
      makeTask({ title: 'Daily standup notes', description: 'What I did yesterday, what I\u2019ll do today, blockers.', priority: 'low', recurrence: { type: 'daily' }, category: 'work', tags: ['standup'], estimatedDuration: 10, order: 5 }),

      // ── Personal Category ──
      makeTask({ title: 'Plan weekend hiking trip', description: 'Research trails, check weather, prepare gear list.', notes: '**Trail options:**\n- Mount Rainier \u2014 advanced (8h)\n- Rattlesnake Ridge \u2014 moderate (4h)\n- Poo Poo Point \u2014 easy (2h)\n\n**Gear checklist:**\n- [ ] Hiking boots\n- [ ] Water reservoir\n- [ ] Sunscreen\n- [ ] First aid kit\n- [ ] Snacks', priority: 'medium', category: 'personal', tags: ['outdoor', 'weekend'], estimatedDuration: 120, progress: 40, color: '#10b981', order: 6 }),
      makeTask({ title: 'Read \u201CDeep Work\u201D \u2014 chapters 4-6', description: 'Finish the second part of the book before book club meeting.', priority: 'low', dueDate: nextWeek, category: 'personal', tags: ['reading', 'book-club'], estimatedDuration: 90, subtasks: [
        { title: 'Chapter 4: Deep Work Is Meaningful', done: true },
        { title: 'Chapter 5: The Bimodal Philosophy', done: false },
        { title: 'Chapter 6: The Rhythmic Philosophy', done: false },
        { title: 'Take notes for book club discussion', done: false },
      ], order: 7 }),
      makeTask({ title: 'Reset meal prep for the week', description: 'Plan breakfasts, lunches, and healthy snacks.', priority: 'medium', dueDate: tmw, category: 'personal', tags: ['health', 'meal-prep'], estimatedDuration: 60, subtasks: [
        { title: 'Make grocery list', done: true },
        { title: 'Shop at farmer\u2019s market', done: false },
        { title: 'Batch cook on Sunday', done: false },
        { title: 'Portion into containers', done: false },
      ], progress: 25, order: 8 }),
      makeTask({ title: 'Call mom \u2014 birthday!', description: 'Don\u2019t forget to call before noon!', priority: 'high', dueDate: td, dueTime: '10:00', category: 'personal', tags: ['family'], color: '#f43f5e', favorite: true, order: 9 }),
      makeTask({ title: 'Gym session \u2014 upper body', description: 'Push day: chest, shoulders, triceps.', priority: 'medium', recurrence: { type: 'custom', days: [0, 2, 4] }, category: 'health', tags: ['fitness', 'routine'], estimatedDuration: 60, subtasks: [
        { title: 'Bench press 4x8', done: false },
        { title: 'Overhead press 3x10', done: false },
        { title: 'Lateral raises 3x15', done: false },
        { title: 'Tricep pushdowns 3x12', done: false },
      ], progress: 0, order: 10 }),

      // ── Learning Category ──
      makeTask({ title: 'Finish React Native course', description: 'Complete the last module on animations and gestures.', notes: '**Course progress:**\n- [x] Module 1: Fundamentals\n- [x] Module 2: Navigation\n- [x] Module 3: State Management\n- [ ] Module 4: Animations\n- [ ] Module 5: Deployment\n\n**Resources:**\n- Course repo: github.com/example/rn-course\n- Cheatsheet: /notes/react-native-cheatsheet', priority: 'high', dueDate: nextWeek, category: 'learning', tags: ['react-native', 'course'], estimatedDuration: 180, progress: 60, pinned: true, order: 11 }),
      makeTask({ title: 'Practice TypeScript generics', description: 'Work through advanced type challenges on type-challenges repo.', priority: 'low', category: 'learning', tags: ['typescript'], estimatedDuration: 45, subtasks: [
        { title: 'Easy: 4 challenges', done: true },
        { title: 'Medium: 4 challenges', done: true },
        { title: 'Hard: 3 challenges', done: false },
        { title: 'Extreme: 2 challenges', done: false },
      ], progress: 50, order: 12 }),
      makeTask({ title: 'Read \u201CDesigning Data-Intensive Applications\u201D', description: 'Chapter 7: Transactions \u2014 consistency, isolation levels.', priority: 'low', category: 'learning', tags: ['books', 'system-design'], estimatedDuration: 60, subtasks: [
        { title: 'Take notes on ACID vs BASE', done: true },
        { title: 'Summarize isolation levels', done: false },
        { title: 'Write down questions for study group', done: false },
      ], order: 13 }),

      // ── Finance Category ──
      makeTask({ title: 'Review monthly budget', description: 'Track spending vs budget for last month and adjust categories.', priority: 'medium', dueDate: D.toISODate(D.addDays(today, 3)), category: 'finance', tags: ['budget', 'tracking'], estimatedDuration: 60, progress: 10, subtasks: [
        { title: 'Categorize last month expenses', done: false },
        { title: 'Compare vs budget targets', done: false },
        { title: 'Adjust next month allocations', done: false },
      ], order: 14 }),
      makeTask({ title: 'Set up automatic savings transfer', description: 'Configure recurring transfer to high-yield savings account.', priority: 'high', dueDate: D.toISODate(D.addDays(today, 5)), category: 'finance', tags: ['savings', 'automation'], estimatedDuration: 20, order: 15 }),

      // ── Health Category ──
      makeTask({ title: 'Morning yoga routine', description: '15 min sun salutations \u2014 build the habit.', priority: 'low', recurrence: { type: 'daily' }, category: 'health', tags: ['yoga', 'habit'], estimatedDuration: 15, subtasks: [
        { title: 'Sun salutation A \u2014 5 rounds', done: false },
        { title: 'Sun salutation B \u2014 3 rounds', done: false },
        { title: 'Cool down stretches', done: false },
      ], order: 16 }),
      makeTask({ title: 'Schedule annual physical', description: 'Call Dr. Smith\u2019s office to book the appointment.', priority: 'medium', dueDate: nextWeek, category: 'health', tags: ['health', 'appointment'], estimatedDuration: 10, subtasks: [
        { title: 'Check insurance coverage', done: true },
        { title: 'Find available time slots', done: false },
        { title: 'Book appointment', done: false },
      ], progress: 30, order: 17 }),

      // ── Completed tasks ──
      makeTask({ title: 'Deploy v2.1 to staging', description: 'Includes the new notifications module and bug fixes.', priority: 'high', category: 'work', tags: ['deploy'], status: 'completed', completedAt: new Date().toISOString(), order: 18 }),
      makeTask({ title: 'Order new desk lamp', description: 'LED adjustable arm lamp for the home office.', priority: 'low', category: 'personal', tags: ['office'], status: 'completed', completedAt: new Date().toISOString(), order: 19 }),
    ];

    // Link some notes to tasks
    var projectTask = state.tasks[0];
    if (projectTask) {
      projectTask.linkedNoteIds = [note1Id];
      var n1 = state.notes[0];
      if (n1) n1.linkedTaskIds = [projectTask.id];
    }
    var syncTask = state.tasks[1];
    if (syncTask) {
      syncTask.linkedNoteIds = [note2Id];
      var n2 = state.notes[1];
      if (n2) n2.linkedTaskIds = [syncTask.id];
    }
  }

  function makeTask(overrides) {
    const now = new Date().toISOString();
    return Object.assign({
      id: uuid(), title: '', description: '', notes: '', priority: 'medium',
      dueDate: null, dueTime: null, category: null, tags: [], estimatedDuration: null,
      progress: 0, status: 'active', color: null, subtasks: [], recurrence: null,
      dependsOn: null, attachments: [], pinned: false, favorite: false, archived: false,
      linkedNoteIds: [],
      order: state.tasks.length, createdAt: now, updatedAt: now, completedAt: null,
    }, overrides);
  }

  // ---------------- Task CRUD ----------------
  function addTask(data) {
    const task = makeTask(data);
    state.tasks.unshift(task);
    logActivity('created', task.id, task.title);
    save();
    emit('tasks:changed', { type: 'add', task });
    return task;
  }

  function getTask(id) { return state.tasks.find((t) => t.id === id); }

  function updateTask(id, patch) {
    const task = getTask(id);
    if (!task) return null;
    Object.assign(task, patch, { updatedAt: new Date().toISOString() });
    save();
    emit('tasks:changed', { type: 'update', task });
    return task;
  }

  function toggleComplete(id) {
    const task = getTask(id);
    if (!task) return null;
    const wasComplete = task.status === 'completed';
    task.status = wasComplete ? 'active' : 'completed';
    task.completedAt = wasComplete ? null : new Date().toISOString();
    if (!wasComplete) task.progress = 100;
    task.updatedAt = new Date().toISOString();

    if (!wasComplete) {
      logActivity('completed', task.id, task.title);
      updateStreakOnCompletion();
      if (task.recurrence) spawnNextRecurrence(task);
    }
    save();
    emit('tasks:changed', { type: 'toggle', task, completed: !wasComplete });
    return task;
  }

  function spawnNextRecurrence(sourceTask) {
    const nextDate = App.DateUtils.nextOccurrence(sourceTask.recurrence, sourceTask.dueDate);
    if (!nextDate) return;
    const clone = makeTask(Object.assign({}, sourceTask, {
      id: uuid(), status: 'active', completedAt: null, progress: 0, dueDate: nextDate,
      subtasks: sourceTask.subtasks.map((s) => ({ ...s, done: false })),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }));
    delete clone.id; clone.id = uuid();
    state.tasks.unshift(clone);
  }

  function duplicateTask(id) {
    const task = getTask(id);
    if (!task) return null;
    const copy = makeTask(Object.assign({}, task, {
      id: uuid(), title: task.title + ' (copy)', status: 'active', completedAt: null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), pinned: false,
    }));
    state.tasks.unshift(copy);
    save();
    emit('tasks:changed', { type: 'add', task: copy });
    return copy;
  }

  function archiveTask(id) {
    const task = getTask(id);
    if (!task) return null;
    task.archived = true;
    task.updatedAt = new Date().toISOString();
    save();
    emit('tasks:changed', { type: 'update', task });
    return task;
  }

  function restoreFromArchive(id) {
    const task = getTask(id);
    if (!task) return null;
    task.archived = false;
    task.updatedAt = new Date().toISOString();
    save();
    emit('tasks:changed', { type: 'update', task });
    return task;
  }

  function deleteTask(id) {
    const idx = state.tasks.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const [task] = state.tasks.splice(idx, 1);
    task.deletedAt = new Date().toISOString();
    state.trash.unshift(task);
    save();
    emit('tasks:changed', { type: 'delete', task });
    return task;
  }

  function restoreTask(id) {
    const idx = state.trash.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    const [task] = state.trash.splice(idx, 1);
    delete task.deletedAt;
    state.tasks.unshift(task);
    save();
    emit('tasks:changed', { type: 'restore', task });
    return task;
  }

  function permanentlyDelete(id) {
    state.trash = state.trash.filter((t) => t.id !== id);
    save();
    emit('tasks:changed', { type: 'purge' });
  }

  function emptyTrash() { state.trash = []; save(); emit('tasks:changed', { type: 'purge' }); }

  function reorderTasks(orderedIds) {
    orderedIds.forEach((id, i) => { const t = getTask(id); if (t) t.order = i; });
    state.tasks.sort((a, b) => a.order - b.order);
    save();
    emit('tasks:changed', { type: 'reorder' });
  }

  function bulkUpdate(ids, patch) {
    ids.forEach((id) => { const t = getTask(id); if (t) Object.assign(t, patch, { updatedAt: new Date().toISOString() }); });
    save();
    emit('tasks:changed', { type: 'bulk-update' });
  }

  function bulkDelete(ids) { ids.forEach((id) => deleteTask(id)); }
  function bulkComplete(ids) { ids.forEach((id) => { const t = getTask(id); if (t && t.status !== 'completed') toggleComplete(id); }); }

  function addCategory(name, color) {
    const cat = { id: uuid(), name, color: color || '#5b5fef' };
    state.categories.push(cat);
    save();
    emit('categories:changed');
    return cat;
  }
  function updateCategory(id, patch) {
    const cat = state.categories.find((c) => c.id === id);
    if (!cat) return null;
    Object.assign(cat, patch);
    save();
    emit('categories:changed');
    return cat;
  }
  function deleteCategory(id) {
    state.categories = state.categories.filter((c) => c.id !== id);
    state.tasks.forEach((t) => { if (t.category === id) t.category = null; });
    save();
    emit('categories:changed');
  }

  function saveAsTemplate(id) {
    const task = getTask(id);
    if (!task) return null;
    const tpl = Object.assign({}, task, { id: uuid(), isTemplate: true });
    state.templates.push(tpl);
    save();
    emit('templates:changed');
    return tpl;
  }
  function createFromTemplate(templateId) {
    const tpl = state.templates.find((t) => t.id === templateId);
    if (!tpl) return null;
    return addTask(Object.assign({}, tpl, { id: undefined, status: 'active', completedAt: null, dueDate: null }));
  }
  function deleteTemplate(id) { state.templates = state.templates.filter((t) => t.id !== id); save(); emit('templates:changed'); }

  function updateStreakOnCompletion() {
    const today = App.DateUtils.toISODate(new Date());
    if (state.streak.lastCompletionDate === today) return; // already counted today
    const yesterday = App.DateUtils.toISODate(App.DateUtils.addDays(new Date(), -1));
    state.streak.current = state.streak.lastCompletionDate === yesterday ? state.streak.current + 1 : 1;
    state.streak.longest = Math.max(state.streak.longest, state.streak.current);
    state.streak.lastCompletionDate = today;
    emit('streak:changed', state.streak);
  }

  function logActivity(action, taskId, title) {
    state.activityLog.unshift({ id: uuid(), action, taskId, title, at: new Date().toISOString() });
  }

  // ---------------- Notes CRUD ----------------
  function addNote(data) {
    const now = new Date().toISOString();
    const note = { id: uuid(), title: data.title || 'Untitled', content: data.content || '', linkedTaskIds: [], createdAt: now, updatedAt: now };
    state.notes.unshift(note);
    save();
    emit('notes:changed', { type: 'add', note });
    return note;
  }
  function getNote(id) { return state.notes.find((n) => n.id === id); }
  function updateNote(id, patch) {
    const note = getNote(id);
    if (!note) return null;
    Object.assign(note, patch, { updatedAt: new Date().toISOString() });
    save();
    emit('notes:changed', { type: 'update', note });
    return note;
  }
  function deleteNote(id) {
    state.notes = state.notes.filter((n) => n.id !== id);
    save();
    emit('notes:changed', { type: 'delete', id });
  }

  // ---------------- Tables CRUD ----------------
  function addTable(data) {
    const now = new Date().toISOString();
    const rows = Math.max(1, data.rows || 3);
    const cols = Math.max(1, data.cols || 3);
    const cells = data.cells || Array.from({ length: rows }, () => Array(cols).fill(''));
    const headers = data.headers || Array(cols).fill('');
    const table = { id: uuid(), name: data.name || 'Untitled table', rows: cells.length, cols: headers.length, headers, cells, createdAt: now, updatedAt: now };
    state.tables.unshift(table);
    save();
    emit('tables:changed', { type: 'add', table });
    return table;
  }
  function getTable(id) { return state.tables.find((t) => t.id === id); }
  function updateTable(id, patch) {
    const table = getTable(id);
    if (!table) return null;
    Object.assign(table, patch, { updatedAt: new Date().toISOString() });
    save();
    emit('tables:changed', { type: 'update', table });
    return table;
  }
  function deleteTable(id) {
    state.tables = state.tables.filter((t) => t.id !== id);
    save();
    emit('tables:changed', { type: 'delete', id });
  }

  function updateSettings(patch) {
    Object.assign(state.settings, patch);
    save();
    emit('settings:changed', state.settings);
  }

  function linkNoteToTask(taskId, noteId) {
    var task = getTask(taskId);
    var note = getNote(noteId);
    if (!task || !note) return;
    if (!task.linkedNoteIds) task.linkedNoteIds = [];
    if (!note.linkedTaskIds) note.linkedTaskIds = [];
    if (!task.linkedNoteIds.includes(noteId)) {
      task.linkedNoteIds.push(noteId);
      task.updatedAt = new Date().toISOString();
    }
    if (!note.linkedTaskIds.includes(taskId)) {
      note.linkedTaskIds.push(taskId);
      note.updatedAt = new Date().toISOString();
    }
    save();
    emit('tasks:changed', { type: 'update', task: task });
    emit('notes:changed', { type: 'update', note: note });
  }

  function unlinkNoteFromTask(taskId, noteId) {
    var task = getTask(taskId);
    var note = getNote(noteId);
    if (!task || !note) return;
    if (task.linkedNoteIds) task.linkedNoteIds = task.linkedNoteIds.filter(function (id) { return id !== noteId; });
    if (note.linkedTaskIds) note.linkedTaskIds = note.linkedTaskIds.filter(function (id) { return id !== taskId; });
    save();
    emit('tasks:changed', { type: 'update', task: task });
    emit('notes:changed', { type: 'update', note: note });
  }

  // ---------------- Focus Sticky Notes CRUD ----------------
  function addFocusStickyNote(data) {
    const note = { id: uuid(), content: data.content || '', color: data.color || '#fef3c7', x: data.x || 20, y: data.y || 20, pinned: data.pinned || false, createdAt: new Date().toISOString() };
    state.focusStickyNotes.unshift(note);
    save();
    emit('focusStickyNotes:changed');
    return note;
  }
  function updateFocusStickyNote(id, patch) {
    const note = state.focusStickyNotes.find((n) => n.id === id);
    if (!note) return null;
    Object.assign(note, patch);
    save();
    emit('focusStickyNotes:changed');
    return note;
  }
  function deleteFocusStickyNote(id) {
    state.focusStickyNotes = state.focusStickyNotes.filter((n) => n.id !== id);
    save();
    emit('focusStickyNotes:changed');
  }

  App.Store = {
    state, on, off, emit, init, save, makeTask,
    addTask, getTask, updateTask, toggleComplete, duplicateTask, archiveTask, restoreFromArchive, deleteTask, restoreTask,
    permanentlyDelete, emptyTrash, reorderTasks, bulkUpdate, bulkDelete, bulkComplete,
    addCategory, updateCategory, deleteCategory, saveAsTemplate, createFromTemplate, deleteTemplate,
    addNote, getNote, updateNote, deleteNote,
    addTable, getTable, updateTable, deleteTable,
    addFocusStickyNote, updateFocusStickyNote, deleteFocusStickyNote,
    logActivity, updateSettings, DEFAULT_SETTINGS,
    linkNoteToTask, unlinkNoteFromTask,
  };
})();
