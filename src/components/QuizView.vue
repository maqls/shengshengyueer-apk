<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useLearnStore } from '../stores/learn'
import { nextQuiz, checkQuiz, makeQuizRecord, type QuizTask } from '../core/quiz'
import { SUBJECT_LABELS, GRADE_LABELS, availableGrades } from '../core/question-bank'
import type { Subject } from '../core/types'
import { shuffle } from '../core/random'

const app = useLearnStore()
const subject = ref<Subject | undefined>(undefined)
const grade = ref<number | undefined>(undefined)
const task = ref<QuizTask | null>(null)
const input = ref('')
const selected = ref('')
const result = ref<'correct' | 'wrong' | null>(null)
const historyIds = ref<string[]>([])

const allSubjects: (Subject | undefined)[] = [
  undefined, 'math', 'chinese', 'english', 'literacy', 'science', 'history', 'geography', 'thinking'
]
const grades = computed(() => availableGrades())

function subjectLabel(s: Subject | undefined): string {
  return s ? SUBJECT_LABELS[s] : '全部学科'
}
function gradeLabel(g: number | undefined): string {
  return g === undefined ? '不限年级' : (GRADE_LABELS[g] ?? `${g}年级`)
}

function newTask(): void {
  task.value = nextQuiz(subject.value, grade.value, historyIds.value)
  input.value = ''
  selected.value = ''
  result.value = null
  if (task.value) historyIds.value.push(task.value.id)
}

function choose(option: string): void {
  selected.value = option
}

function submit(): void {
  if (!task.value || result.value) return
  const answer = task.value.kind === 'choice' ? selected.value : input.value
  if (!answer.trim()) {
    app.notify('请先作答')
    return
  }
  const correct = checkQuiz(task.value, answer)
  result.value = correct ? 'correct' : 'wrong'
  app.applyTextRecord(makeQuizRecord(task.value, answer, 3000))
}

function resetFilter(): void {
  subject.value = undefined
  grade.value = undefined
  historyIds.value = []
  newTask()
}

const options = computed(() => {
  if (!task.value?.options) return []
  return shuffle(task.value.options)
})

onMounted(newTask)
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>📚 综合学习</h1>
        <div class="sub">全年级 · 多学科 · 题库可持续扩展</div>
      </div>
    </div>

    <div class="card">
      <h2>选择学科</h2>
      <div class="chips">
        <button
          v-for="s in allSubjects"
          :key="s ?? 'all'"
          class="chip"
          :class="{ on: subject === s }"
          @click="subject = s; newTask()"
        >{{ subjectLabel(s) }}</button>
      </div>
      <h2 style="margin-top:14px">选择年级</h2>
      <div class="chips">
        <button class="chip" :class="{ on: grade === undefined }" @click="grade = undefined; newTask()">不限</button>
        <button
          v-for="g in grades"
          :key="g"
          class="chip"
          :class="{ on: grade === g }"
          @click="grade = g; newTask()"
        >{{ gradeLabel(g) }}</button>
      </div>
    </div>

    <div v-if="task" class="card">
      <div class="row tight" style="justify-content:space-between;align-items:center">
        <span class="badge">{{ SUBJECT_LABELS[task.subject] }}</span>
        <span class="badge">{{ task.kind === 'choice' ? '选择题' : task.kind === 'judge' ? '判断题' : '填空题' }}</span>
      </div>

      <div style="font-size:18px;line-height:1.7;margin:16px 0">{{ task.prompt }}</div>

      <div v-if="task.kind === 'choice' && options.length" class="options">
        <div
          v-for="(opt, i) in options"
          :key="i"
          class="option"
          :class="{ selected: selected === opt }"
          @click="choose(opt)"
        >{{ opt }}</div>
      </div>
      <div v-else-if="task.kind === 'judge'" class="options">
        <div class="option" :class="{ selected: selected === '对' }" @click="choose('对')">对</div>
        <div class="option" :class="{ selected: selected === '错' }" @click="choose('错')">错</div>
      </div>
      <input
        v-else
        class="answer-input"
        v-model="input"
        placeholder="输入答案"
        @keyup.enter="submit"
      />

      <div class="row" style="margin-top:14px">
        <button class="btn primary" style="flex:1" :disabled="!!result" @click="submit">提交答案</button>
        <button class="btn ghost small" @click="newTask">换一题</button>
      </div>

      <div v-if="result" class="explain">
        <div class="row tight" style="align-items:center">
          <span class="badge" :class="result === 'correct' ? 'ok' : 'err'">
            {{ result === 'correct' ? '答对了！' : `正确答案是：${task.answer}` }}
          </span>
        </div>
        <div style="margin-top:8px">{{ task.explain }}</div>
        <button class="btn primary block" style="margin-top:12px" @click="newTask">下一题</button>
      </div>
    </div>

    <div v-else class="card">
      <div class="empty">当前筛选条件下暂无题目</div>
      <button class="btn ghost block" @click="resetFilter">重置筛选</button>
    </div>

    <div class="card">
      <button class="btn ghost block" @click="resetFilter">重置筛选与答题记录</button>
    </div>
  </div>
</template>
