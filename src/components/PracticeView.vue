<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useLearnStore } from '../stores/learn'
import GradePicker from './GradePicker.vue'

const store = useLearnStore()
const answer = ref<number | null>(null)
const inputText = ref('')
const submitted = ref(false)

const options = computed(() => store.current?.options ?? [])

watch(
  () => store.current?.id,
  () => {
    answer.value = null
    inputText.value = ''
    submitted.value = false
  }
)

function choose(value: number): void {
  answer.value = value
}

function submit(): void {
  if (submitted.value || store.loading) return
  let value = answer.value
  if (value === null && inputText.value.trim() !== '') {
    const parsed = Number(inputText.value)
    value = Number.isFinite(parsed) ? parsed : null
  }
  if (value === null) {
    store.notify('请先作答')
    return
  }
  submitted.value = true
  store.submit(value)
}

onMounted(() => {
  if (!store.current) store.nextQuestion()
})
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>📖 声声悦耳 · 数学练习</h1>
        <div class="sub">出题 → 作答 → 讲解 → 错题巩固</div>
      </div>
      <div style="text-align:right">
        <div class="badge ok">今日 {{ store.todayCount }} 题</div>
      </div>
    </div>

    <div class="card">
      <GradePicker
        :model-value="store.mathGrade"
        @update:model-value="(g) => { store.setMathGrade(g); store.nextQuestion() }"
      />
    </div>

    <div v-if="store.loading && !store.current" class="card empty">正在出题…</div>

    <template v-else-if="store.current">
      <div class="card">
        <div class="row tight" style="justify-content:space-between;align-items:center">
          <span v-if="store.isReview" class="badge review">错题巩固</span>
          <span v-else class="badge">新题</span>
          <span class="badge">难度 {{ store.current.difficulty }}</span>
        </div>

        <div class="question-text">{{ store.current.text }}</div>

        <div v-if="options.length" class="options">
          <div
            v-for="(opt, i) in options"
            :key="i"
            class="option"
            :class="{ selected: answer === opt }"
            @click="choose(opt)"
          >{{ opt }}</div>
        </div>
        <input
          v-else
          class="answer-input"
          type="number"
          inputmode="numeric"
          placeholder="输入答案"
          v-model="inputText"
          @keyup.enter="submit"
        />

        <div class="row" style="margin-top:14px">
          <button class="btn primary" style="flex:1" :disabled="submitted || store.loading" @click="submit">
            {{ submitted ? '已提交' : '提交答案' }}
          </button>
          <button class="btn ghost small" @click="store.nextQuestion()">换一题</button>
        </div>
      </div>

      <div v-if="submitted" class="card">
        <div class="row tight" style="align-items:center">
          <span class="badge" :class="store.lastCorrect ? 'ok' : 'err'">
            {{ store.lastCorrect ? '答对了' : '再想想' }}
          </span>
          <span v-if="!store.lastCorrect" style="font-size:13px;color:var(--muted)">
            正确答案 {{ store.current.answer }}
          </span>
        </div>
        <div class="explain">{{ store.explanation || (store.loading ? '讲解生成中…（本地模型首次加载可能需 1–2 分钟）' : '') }}</div>
        <div v-if="store.explainSource" class="source-tag">
          讲解来源：{{ { ollama: '电脑本地模型', cloud: '云端模型', fallback: '预设解析', cache: '缓存', preset: '预设' }[store.explainSource] ?? store.explainSource }}
        </div>
        <button class="btn primary block" style="margin-top:14px" @click="store.nextQuestion()">下一题</button>
      </div>
    </template>

  </div>
</template>
