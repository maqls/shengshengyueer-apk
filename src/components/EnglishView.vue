<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLearnStore } from '../stores/learn'
import {
  nextEnglishTask,
  checkEnglish,
  makeEnglishRecord,
  type EnglishTask,
  type EnglishMode
} from '../core/english'
import { speakEnglish, speechSupported } from '../core/speech'
import GradePicker from './GradePicker.vue'

const app = useLearnStore()
const mode = ref<EnglishMode>('card')
const grade = ref<number | undefined>(undefined)
const task = ref<EnglishTask | null>(null)
const input = ref('')
const result = ref<'correct' | 'wrong' | null>(null)
const showDetail = ref(false)

function newTask(): void {
  task.value = nextEnglishTask(mode.value, grade.value ?? 1)
  input.value = ''
  result.value = null
  showDetail.value = mode.value === 'card'
  if (mode.value === 'dictation' && task.value) speakEnglish(task.value.word)
}

function changeMode(m: EnglishMode): void {
  mode.value = m
  newTask()
}

function flip(): void {
  showDetail.value = !showDetail.value
}

function submit(): void {
  if (!task.value || result.value) return
  if (!input.value.trim()) {
    app.notify('请先写出单词')
    return
  }
  const correct = checkEnglish(task.value, input.value)
  result.value = correct ? 'correct' : 'wrong'
  app.applyTextRecord(makeEnglishRecord(task.value, input.value, 3000))
  if (!correct) speakEnglish(task.value.word)
}

onMounted(newTask)
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>🔤 英语学习</h1>
        <div class="sub">单词卡 · 听写 · 跟读发音</div>
      </div>
    </div>

    <div class="card">
      <div class="segment">
        <button :class="{ on: mode === 'card' }" @click="changeMode('card')">单词卡</button>
        <button :class="{ on: mode === 'dictation' }" @click="changeMode('dictation')">听写</button>
      </div>
      <div class="segment">
        <GradePicker :model-value="grade" @update:model-value="(g) => { grade = g; newTask() }" />
      </div>
    </div>

    <div v-if="task" class="card" style="text-align:center">
      <template v-if="mode === 'card'">
        <div style="font-size:44px;font-weight:700">{{ task.word }}</div>
        <div style="font-size:18px;color:var(--accent-deep);margin:4px 0">{{ task.phonetic }}</div>
        <div class="row" style="justify-content:center">
          <button class="btn ghost small" @click="speakEnglish(task.word)" :disabled="!speechSupported()">🔊 读一读</button>
          <button class="btn ghost small" @click="flip">{{ showDetail ? '收起' : '看释义例句' }}</button>
        </div>
        <div v-if="showDetail" class="explain" style="text-align:left">
          <div><strong>释义：</strong>{{ task.meaning }}</div>
          <div style="margin-top:6px"><strong>例句：</strong>{{ task.sentence }}</div>
        </div>
        <button class="btn primary block" style="margin-top:14px" @click="newTask">下一个词</button>
      </template>

      <template v-else>
        <div class="badge">{{ task.meaning }}</div>
        <div class="row" style="justify-content:center;margin:12px 0">
          <button class="btn ghost small" @click="speakEnglish(task.word)" :disabled="!speechSupported()">🔊 再听一遍</button>
        </div>
        <input
          class="answer-input"
          v-model="input"
          placeholder="写出听到的英文单词"
          autocapitalize="off"
          autocomplete="off"
          @keyup.enter="submit"
        />
        <div v-if="result" class="explain">
          <span class="badge" :class="result === 'correct' ? 'ok' : 'err'">
            {{ result === 'correct' ? '拼对了！' : `再想想，正确答案是「${task.answer}」` }}
          </span>
          <div style="margin-top:8px">{{ task.phonetic }} · {{ task.meaning }}</div>
        </div>
        <div class="row" style="margin-top:14px">
          <button class="btn primary" style="flex:1" :disabled="!!result" @click="submit">提交</button>
          <button class="btn ghost small" @click="newTask">换一个</button>
        </div>
        <button v-if="result" class="btn ghost block" style="margin-top:10px" @click="newTask">下一个词</button>
      </template>
    </div>
  </div>
</template>
