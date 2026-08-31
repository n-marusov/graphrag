<script setup lang="ts">
// Трассируемость: `BR-constraint.ui-session-history` (список, поиск, новая/переименование/удаление,
// активная подсвечена, серверное хранение).
import { computed, inject, nextTick, onMounted, ref } from 'vue';
import { useI18n } from '../../adapters/i18n';
import { chatStoreKey } from '../../adapters/state/chat-store';
import Icon from '../icons/Icon.vue';

const injectedStore = inject(chatStoreKey);
if (!injectedStore) {
  throw new Error('[sidebar] chatStoreKey не предоставлен (composition root)');
}
// Суженный тип для замыканий (функции объявлены как function declarations — hoisting)
const store = injectedStore;
const i18n = useI18n();

const search = ref('');
const editingId = ref<string | null>(null);
const editTitle = ref('');
const renameInput = ref<HTMLInputElement | null>(null);

onMounted(() => {
  store.loadSessions();
});

const visibleSessions = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return store.state.sessions;
  return store.state.sessions.filter((s) => s.title.toLowerCase().includes(q));
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function setRenameInput(el: unknown): void {
  renameInput.value = el as HTMLInputElement | null;
}

function startRename(sessionId: string, currentTitle: string): void {
  editingId.value = sessionId;
  editTitle.value = currentTitle;
  void nextTick(() => renameInput.value?.focus());
}

function cancelRename(): void {
  editingId.value = null;
  editTitle.value = '';
}

function saveRename(): void {
  const id = editingId.value;
  const title = editTitle.value.trim();
  cancelRename();
  if (id && title) {
    void store.renameSession(id, title);
  }
}
</script>

<template>
  <nav class="flex h-full flex-col" :aria-label="i18n.t('sidebar.sessions')">
    <div class="p-3">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-accent"
        @click="store.createSession()"
      >
        <Icon name="edit-square" :size="14" />
        {{ i18n.t('sidebar.new-session') }}
      </button>
    </div>

    <div class="px-3 pb-2">
      <div class="relative">
        <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint">
          <Icon name="search" :size="14" />
        </span>
        <input
          v-model="search"
          type="search"
          class="h-8 w-full rounded-lg border border-border bg-surface-2 pl-8 pr-3 text-sm text-text placeholder:text-faint focus-visible:outline-2 focus-visible:outline-accent"
          :placeholder="i18n.t('sidebar.search-placeholder')"
        />
      </div>
    </div>

    <ul class="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
      <li v-for="session in visibleSessions" :key="session.id" class="group relative">
        <div v-if="editingId === session.id" class="flex items-center rounded-lg bg-surface-2 px-2 py-1.5">
          <input
            :ref="setRenameInput"
            v-model="editTitle"
            type="text"
            class="h-7 w-full rounded border border-accent bg-surface px-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-accent"
            :aria-label="i18n.t('sidebar.rename')"
            @keydown.enter.prevent="saveRename"
            @keydown.esc.prevent="cancelRename"
            @blur="cancelRename"
          />
        </div>
        <button
          v-else
          type="button"
          class="flex w-full flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-accent"
          :class="
            session.id === store.state.activeSession?.id
              ? 'border-l-2 border-accent bg-surface-2 pl-2.5 text-text'
              : 'text-muted hover:bg-surface-2 hover:text-text'
          "
          @click="store.selectSession(session.id)"
        >
          <span class="w-full truncate text-sm font-medium">{{ session.title }}</span>
          <span class="text-xs text-faint">{{ formatDate(session.updatedAt) }}</span>
        </button>
        <span
          v-if="editingId !== session.id"
          class="absolute right-1.5 top-1/2 hidden -translate-y-1/2 gap-1 rounded-lg bg-surface-2 p-0.5 group-hover:flex"
        >
          <button
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded text-faint hover:text-text"
            :aria-label="i18n.t('sidebar.rename')"
            :title="i18n.t('sidebar.rename')"
            @click="startRename(session.id, session.title)"
          >
            <Icon name="pencil" :size="12" />
          </button>
          <button
            type="button"
            class="flex h-6 w-6 items-center justify-center rounded text-faint hover:text-danger"
            :aria-label="i18n.t('sidebar.delete')"
            :title="i18n.t('sidebar.delete')"
            @click="store.removeSession(session.id)"
          >
            <Icon name="trash" :size="12" />
          </button>
        </span>
      </li>
    </ul>

    <p v-if="store.state.sessions.length === 0" class="px-3 pb-3 text-xs text-faint">
      {{ i18n.t('sidebar.no-sessions') }}
    </p>
  </nav>
</template>
