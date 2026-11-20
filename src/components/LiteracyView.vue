<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLearnStore } from '../stores/learn'
import {
  nextLiteracyTask,
  checkLiteracy,
  makeLiteracyRecord,
  type LiteracyTask,
  type LiteracyMode
} from '../core/literacy'
import { speakChinese, speechSupported } from '../core/speech'

const app = useLearnStore()
const mode = ref<LiteracyMode>('card')
const grade = ref(1)
const task = ref<LiteracyTask | null>(null)
const input = ref('')
const result = ref<'correct' | 'wrong' | null>(null)
const showDetail = ref(false)

function newTask(): void {
  task.value = nextLiteracyTask(mode.value, grade.value)
  input.value = ''
  result.value = null
  showDetail.value = mode.value === 'card'
  if (mode.value === 'dictation' && task.value) speakChinese(task.value.char)
}

function flip(): void {
  showDetail.value = !showDetail.value
}

function submit(): void {
  if (!task.value || result.value) return
  if (!input.value.trim()) {
    app.notify('请先写出汉字')
    return
  }
  const correct = checkLiteracy(task.value, input.value)
  result.value = correct ? 'correct' : 'wrong'
  app.applyTextRecord(makeLiteracyRecord(task.value, input.value, 3000))
  if (!correct) speakChinese(task.value.char)
}

function changeMode(m: LiteracyMode): void {
  mode.value = m
  newTask()
}

onMounted(newTask)
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>🈶 识字学习</h1>
        <div class="sub">生字卡认读 · 听写巩固</div>
      </div>
    </div>

    <div class="card">
      <div class="segment">
        <button :class="{ on: mode === 'card' }" @click="changeMode('card')">生字卡</button>
        <button :class="{ on: mode === 'dictation' }" @click="changeMode('dictation')">听写</button>
      </div>
      <div class="segment">
        <button :class="{ on: grade === 1 }" @click="grade = 1; newTask()">一年级</button>
        <button :class="{ on: grade === 2 }" @click="grade = 2; newTask()">二年级</button>
      </div>
    </div>

    <div v-if="task" class="card" style="text-align:center">
      <template v-if="mode === 'card'">
        <div style="font-size:72px;font-weight:700;line-height:1.2">{{ task.char }}</div>
        <div style="font-size:22px;color:var(--accent-deep);margin:6px 0">{{ task.pinyin }}</div>
        <div class="row" style="justify-content:center">
          <button class="btn ghost small" @click="speakChinese(task.char)" :disabled="!speechSupported()">🔊 读一读</button>
          <button class="btn ghost small" @click="flip">{{ showDetail ? '收起' : '看组词例句' }}</button>
        </div>
        <div v-if="showDetail" class="explain" style="text-align:left">
          <div><strong>组词：</strong>{{ task.words.join('、') }}</div>
          <div style="margin-top:6px"><strong>例句：</strong>{{ task.sentence }}</div>
        </div>
        <button class="btn primary block" style="margin-top:14px" @click="newTask">下一个字</button>
      </template>

      <template v-else>
        <div class="badge">{{ task.pinyin }}</div>
        <div class="row" style="justify-content:center;margin:12px 0">
          <button class="btn ghost small" @click="speakChinese(task.char)" :disabled="!speechSupported()">🔊 再听一遍</button>
        </div>
        <input
          class="answer-input"
          v-model="input"
          placeholder="写出你听到的汉字"
          @keyup.enter="submit"
        />
        <div v-if="result" class="explain">
          <span class="badge" :class="result === 'correct' ? 'ok' : 'err'">
            {{ result === 'correct' ? '写对了！' : `再想想，正确答案是「${task.answer}」` }}
          </span>
          <div style="margin-top:8px">{{ task.words.join('、') }}</div>
        </div>
        <div class="row" style="margin-top:14px">
          <button class="btn primary" style="flex:1" :disabled="!!result" @click="submit">提交</button>
          <button class="btn ghost small" @click="newTask">换一个</button>
        </div>
        <button v-if="result" class="btn ghost block" style="margin-top:10px" @click="newTask">下一个字</button>
      </template>
    </div>
  </div>
</template>
