<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLearnStore } from '../stores/learn'
import { SUBJECT_GROUPS, SUBJECT_LABELS, GRADE_STAGES } from '../core/question-bank'
import type { Subject } from '../core/types'
import GradePicker from './GradePicker.vue'
import AiQuizCard from './AiQuizCard.vue'
import { resolveSettings } from '../llm/resolve'

const app = useLearnStore()
const subjectGroup = ref<string | undefined>(undefined)
const subject = ref<Subject | undefined>(undefined)
const grade = ref<number | undefined>(undefined)
const year = ref<number | undefined>(undefined)

const YEARS = Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i)

const currentGroup = computed(() => SUBJECT_GROUPS.find((g) => g.key === subjectGroup.value))
const subjectsInGroup = computed<Subject[]>(() => currentGroup.value?.subjects ?? [])
const gradeLabelOf = (g: number) => GRADE_STAGES.find((s) => s.grades.includes(g))?.label ?? `${g}年级`

function chooseGroup(key: string | undefined): void {
  subjectGroup.value = key
  subject.value = undefined
}
function chooseSubject(s: Subject | undefined): void {
  subject.value = s
}
function clearFilters(): void {
  subjectGroup.value = undefined
  subject.value = undefined
  grade.value = undefined
  year.value = undefined
}

onMounted(async () => {
  if (!app.settings) await app.init()
  if (app.settings) {
    const resolved = await resolveSettings(app.settings)
    app.settings = resolved
  }
})
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>📅 历年真题</h1>
        <div class="sub">教材版本：{{ app.settings?.textbookVersion ?? '人教版' }} · 真题风格模拟</div>
      </div>
    </div>

    <div class="card">
      <div class="source-tag">
        按所选教材版本与年份，由电脑模型生成真题风格模拟题（非原题照抄）。在「我的 → 设置」中统一切换教材版本。
      </div>
      <h2 style="margin-top:12px">学科</h2>
      <div class="chips">
        <button class="chip" :class="{ on: subjectGroup === undefined }" @click="chooseGroup(undefined)">不限</button>
        <button
          v-for="g in SUBJECT_GROUPS"
          :key="g.key"
          class="chip"
          :class="{ on: subjectGroup === g.key }"
          @click="chooseGroup(g.key)"
        >{{ g.label }}</button>
      </div>
      <div v-if="currentGroup" class="chips" style="margin-top:8px">
        <button class="chip" :class="{ on: subject === undefined }" @click="chooseSubject(undefined)">全类</button>
        <button
          v-for="s in subjectsInGroup"
          :key="s"
          class="chip"
          :class="{ on: subject === s }"
          @click="chooseSubject(s)"
        >{{ SUBJECT_LABELS[s] }}</button>
      </div>

      <h2 style="margin-top:14px">学段 / 年级</h2>
      <GradePicker :model-value="grade" @update:model-value="(g) => (grade = g)" />

      <h2 style="margin-top:14px">真题年份</h2>
      <div class="chips">
        <button class="chip" :class="{ on: year === undefined }" @click="year = undefined">不限年份</button>
        <button
          v-for="y in YEARS"
          :key="y"
          class="chip"
          :class="{ on: year === y }"
          @click="year = y"
        >{{ y }} 年</button>
      </div>

      <button class="btn ghost small block" style="margin-top:12px" @click="clearFilters">重置筛选</button>
    </div>

    <AiQuizCard
      :subject="subject"
      :grade="grade"
      :exam-year="year"
      :key="`${subject ?? 'all'}|${grade}|${year}|${app.settings?.textbookVersion}`"
    />
  </div>
</template>
