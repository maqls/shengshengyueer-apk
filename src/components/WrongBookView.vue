<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLearnStore } from '../stores/learn'
import { templateById } from '../core/templates'
import type { Subject } from '../core/types'

const store = useLearnStore()
const filter = ref<'all' | Subject>('all')
const showAll = ref(false)

const subjects: { key: 'all' | Subject; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'math', label: '数学' },
  { key: 'literacy', label: '识字' },
  { key: 'english', label: '英语' }
]

const wrongs = computed(() => {
  let list = store.records.filter((r) => !r.correct)
  if (filter.value !== 'all') list = list.filter((r) => r.subject === filter.value)
  list = list.slice().reverse()
  return showAll.value ? list : list.slice(0, 20)
})

const totalWrong = computed(() => store.records.filter((r) => !r.correct).length)

function subjectLabel(subject: Subject): string {
  return { math: '数学', literacy: '识字', english: '英语' }[subject]
}

function itemName(id: string, subject: Subject, prompt: string): string {
  if (subject === 'math') {
    const names: Record<string, string> = {
      add_2digit_carry: '两位数进位加法',
      add_2digit_no_carry: '两位数不进位加法',
      sub_2digit_borrow: '两位数退位减法',
      mul_table: '乘法口诀'
    }
    return names[id] ?? templateById(id)?.id ?? '数学题'
  }
  return prompt
}
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>📕 错题本</h1>
        <div class="sub">共 {{ totalWrong }} 道错题，各科目练习会自动安排巩固</div>
      </div>
    </div>

    <div class="card">
      <div class="segment">
        <button
          v-for="s in subjects"
          :key="s.key"
          :class="{ on: filter === s.key }"
          @click="filter = s.key"
        >{{ s.label }}</button>
      </div>

      <div v-if="!wrongs.length" class="empty">该分类下没有错题，继续保持！</div>
      <ul v-else class="list">
        <li v-for="record in wrongs" :key="record.id">
          <div style="min-width:0;flex:1">
            <div class="row tight" style="align-items:center">
              <span class="badge">{{ subjectLabel(record.subject) }}</span>
              <span style="font-weight:600">{{ itemName(record.templateId, record.subject, record.prompt) }}</span>
            </div>
            <div class="source-tag">
              你的答案 {{ record.userAnswer }} · 正确 {{ record.answer }} ·
              {{ new Date(record.at).toLocaleDateString() }}
            </div>
          </div>
        </li>
      </ul>
      <button
        v-if="!showAll && totalWrong > 20"
        class="btn ghost block"
        style="margin-top:12px"
        @click="showAll = true"
      >显示全部</button>
    </div>
  </div>
</template>
