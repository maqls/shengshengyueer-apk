<script setup lang="ts">
import { ref, onMounted, markRaw, type Component } from 'vue'
import { useLearnStore } from './stores/learn'
import QuizView from './components/QuizView.vue'
import SpecialView from './components/SpecialView.vue'
import ToolView from './components/ToolView.vue'
import WrongBookView from './components/WrongBookView.vue'
import MineView from './components/MineView.vue'

const store = useLearnStore()
const tab = ref<'quiz' | 'special' | 'tool' | 'wrong' | 'mine'>('quiz')

const tabs: { key: typeof tab.value; ico: string; label: string; comp: Component }[] = [
  { key: 'quiz', ico: '📚', label: '综合', comp: markRaw(QuizView) },
  { key: 'special', ico: '✏️', label: '专项', comp: markRaw(SpecialView) },
  { key: 'tool', ico: '🧰', label: '工具', comp: markRaw(ToolView) },
  { key: 'wrong', ico: '📕', label: '错题', comp: markRaw(WrongBookView) },
  { key: 'mine', ico: '👤', label: '我的', comp: markRaw(MineView) }
]

onMounted(async () => {
  await store.init()
})
</script>

<template>
  <component :is="tabs.find((t) => t.key === tab)!.comp" />

  <nav class="tabbar">
    <button
      v-for="t in tabs"
      :key="t.key"
      :class="{ on: tab === t.key }"
      @click="tab = t.key"
    >
      <span class="ico">{{ t.ico }}</span>
      <span>{{ t.label }}</span>
    </button>
  </nav>
</template>
