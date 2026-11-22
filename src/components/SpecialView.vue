<script setup lang="ts">
import { ref, markRaw, type Component } from 'vue'
import PracticeView from './PracticeView.vue'
import LiteracyView from './LiteracyView.vue'
import EnglishView from './EnglishView.vue'
import ExamView from './ExamView.vue'

const sub = ref<'exam' | 'math' | 'literacy' | 'english'>('exam')
const tabs: { key: typeof sub.value; label: string; comp: Component }[] = [
  { key: 'exam', label: '历年真题', comp: markRaw(ExamView) },
  { key: 'math', label: '数学专项', comp: markRaw(PracticeView) },
  { key: 'literacy', label: '识字专项', comp: markRaw(LiteracyView) },
  { key: 'english', label: '英语专项', comp: markRaw(EnglishView) }
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
