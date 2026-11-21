<script setup lang="ts">
import { ref, markRaw, type Component } from 'vue'
import MasteryView from './MasteryView.vue'
import SettingsView from './SettingsView.vue'

const sub = ref<'mastery' | 'settings'>('mastery')
const tabs: { key: typeof sub.value; label: string; comp: Component }[] = [
  { key: 'mastery', label: '学习进度', comp: markRaw(MasteryView) },
  { key: 'settings', label: '设置', comp: markRaw(SettingsView) }
]
</script>

<template>
  <div>
    <div class="sub-tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        :class="{ on: sub === t.key }"
        @click="sub = t.key"
      >{{ t.label }}</button>
    </div>
    <component :is="tabs.find((t) => t.key === sub)!.comp" />
  </div>
</template>

<style scoped>
.sub-tabs {
  display: flex;
  gap: 6px;
  padding: 8px 14px 0;
  max-width: 720px;
  margin: 0 auto;
}
.sub-tabs button {
  flex: 1;
  padding: 9px 4px;
  border: 1.5px solid var(--line);
  background: #fff;
  border-radius: 10px;
  font-size: 13px;
  color: var(--muted);
  cursor: pointer;
}
.sub-tabs button.on {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  font-weight: 700;
}
</style>
