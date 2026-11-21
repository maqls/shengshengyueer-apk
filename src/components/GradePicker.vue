<script setup lang="ts">
import { ref, computed } from 'vue'
import { GRADE_STAGES, GRADE_LABELS } from '../core/question-bank'

const props = defineProps<{ modelValue: number | undefined }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: number | undefined): void }>()

const stage = ref<string | undefined>(undefined)
const currentStage = computed(() => GRADE_STAGES.find((s) => s.key === stage.value))
const gradesInStage = computed(() => currentStage.value?.grades ?? [])

function chooseStage(key: string | undefined): void {
  stage.value = key
  emit('update:modelValue', undefined)
}
function chooseGrade(g: number | undefined): void {
  emit('update:modelValue', g)
}
function label(g: number): string {
  return GRADE_LABELS[g] ?? `${g}年级`
}
</script>

<template>
  <div>
    <div class="chips">
      <button class="chip" :class="{ on: modelValue === undefined && !stage }" @click="chooseStage(undefined)">不限</button>
      <button
        v-for="s in GRADE_STAGES"
        :key="s.key"
        class="chip"
        :class="{ on: stage === s.key }"
        @click="chooseStage(s.key)"
      >{{ s.label }}</button>
    </div>
    <div v-if="currentStage" class="chips" style="margin-top:8px">
      <button class="chip" :class="{ on: modelValue === undefined }" @click="chooseGrade(undefined)">全学段</button>
      <button
        v-for="g in gradesInStage"
        :key="g"
        class="chip"
        :class="{ on: modelValue === g }"
        @click="chooseGrade(g)"
      >{{ label(g) }}</button>
    </div>
  </div>
</template>
