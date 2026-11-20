<script setup lang="ts">
import { ref, onMounted, markRaw, type Component } from 'vue'
import { useLearnStore } from './stores/learn'
import PracticeView from './components/PracticeView.vue'
import LiteracyView from './components/LiteracyView.vue'
import EnglishView from './components/EnglishView.vue'
import MasteryView from './components/MasteryView.vue'
import WrongBookView from './components/WrongBookView.vue'
import SettingsView from './components/SettingsView.vue'

const store = useLearnStore()
const tab = ref<'practice' | 'literacy' | 'english' | 'wrong' | 'mastery' | 'settings'>('practice')

const tabs: { key: typeof tab.value; ico: string; label: string; comp: Component }[] = [
  { key: 'practice', ico: '✏️', label: '数学', comp: markRaw(PracticeView) },
  { key: 'literacy', ico: '🈶', label: '识字', comp: markRaw(LiteracyView) },
  { key: 'english', ico: '🔤', label: '英语', comp: markRaw(EnglishView) },
  { key: 'wrong', ico: '📕', label: '错题', comp: markRaw(WrongBookView) },
  { key: 'mastery', ico: '📊', label: '进度', comp: markRaw(MasteryView) },
  { key: 'settings', ico: '⚙️', label: '设置', comp: markRaw(SettingsView) }
]

onMounted(() => {
  store.init()
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

  <div v-if="store.toast" class="toast">{{ store.toast }}</div>
</template>
