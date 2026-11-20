<script setup lang="ts">
import { computed } from 'vue'
import { useLearnStore } from '../stores/learn'

const store = useLearnStore()

const knowledgeName: Record<string, string> = {
  two_digit_addition: '两位数加法',
  carry: '进位',
  two_digit_subtraction: '两位数减法',
  borrow: '退位',
  multiplication_table: '乘法口诀'
}

function displayName(key: string): string {
  if (key.startsWith('literacy:')) return `识字：${key.slice(9)}`
  if (key.startsWith('english:')) return `英语：${key.slice(8)}`
  return knowledgeName[key] ?? key
}

const items = computed(() =>
  Object.values(store.masteries)
    .map((m) => ({ ...m, name: displayName(m.knowledge) }))
    .sort((a, b) => a.value - b.value)
)

function color(value: number): string {
  if (value >= 0.75) return '#4d9f6d'
  if (value >= 0.4) return '#e0a92c'
  return '#d9603b'
}
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>📊 学习进度</h1>
        <div class="sub">掌握度越高，题目越有针对性</div>
      </div>
    </div>

    <div class="card">
      <h2>知识点掌握度</h2>
      <div v-if="!items.length" class="empty">还没有数据，先做几道题吧</div>
      <div v-for="item in items" :key="item.knowledge" style="margin-bottom:14px">
        <div class="row tight" style="justify-content:space-between;font-size:14px">
          <span>{{ item.name }}</span>
          <span :style="{ color: color(item.value), fontWeight: 700 }">
            {{ Math.round(item.value * 100) }}%
          </span>
        </div>
        <div class="bar-wrap" style="margin-top:6px">
          <div class="bar-fill" :style="{ width: item.value * 100 + '%', background: color(item.value) }"></div>
        </div>
        <div class="source-tag">练习 {{ item.attempts }} 次</div>
      </div>
    </div>

    <div class="card">
      <h2>累计数据</h2>
      <ul class="list">
        <li><span>总答题数</span><strong>{{ store.records.length }}</strong></li>
        <li>
          <span>正确率</span>
          <strong>
            {{ store.records.length ? Math.round(store.records.filter(r => r.correct).length / store.records.length * 100) : 0 }}%
          </strong>
        </li>
        <li><span>今日练习</span><strong>{{ store.todayCount }} 题</strong></li>
      </ul>
    </div>
  </div>
</template>
