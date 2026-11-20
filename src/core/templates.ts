import type { QuestionTemplate } from './types'

export const TEMPLATES: QuestionTemplate[] = [
  {
    id: 'add_2digit_carry',
    knowledge: ['two_digit_addition', 'carry'],
    grade: 1,
    difficulty: 2,
    type: 'number',
    params: {
      a: { min: 15, max: 89 },
      b: { min: 15, max: 89 }
    },
    constraint: 'a + b >= 100 && a % 10 + b % 10 >= 10',
    question: '{a} + {b} = ?',
    answer: '{a} + {b}',
    distractors: ['{a} + {b} - 1', '{a} + {b} + 1', '{a} + {b} - 10'],
    explainPrompt: '这是两位数的进位加法。请分三步讲：1) 个位相加是否进位；2) 十位相加再加进位；3) 得出最终结果。用一年级孩子能懂的话。',
    fallbackExplain: '先算个位，满十向十位进 1，再算十位。'
  },
  {
    id: 'add_2digit_no_carry',
    knowledge: ['two_digit_addition'],
    grade: 1,
    difficulty: 1,
    type: 'number',
    params: {
      a: { min: 10, max: 60 },
      b: { min: 10, max: 30 }
    },
    constraint: 'a % 10 + b % 10 < 10',
    question: '{a} + {b} = ?',
    answer: '{a} + {b}',
    distractors: ['{a} + {b} + 1', '{a} + {b} - 1', '{a} + {b} + 10'],
    explainPrompt: '这是两位数的不进位加法。请分两步讲：1) 个位相加；2) 十位相加。用一年级孩子能懂的话。',
    fallbackExplain: '个位和个位相加，十位和十位相加，合起来就是答案。'
  },
  {
    id: 'sub_2digit_borrow',
    knowledge: ['two_digit_subtraction', 'borrow'],
    grade: 2,
    difficulty: 2,
    type: 'number',
    params: {
      a: { min: 30, max: 99 },
      b: { min: 11, max: 29 }
    },
    constraint: 'b > 10 && a % 10 < b % 10',
    question: '{a} - {b} = ?',
    answer: '{a} - {b}',
    distractors: ['{a} - {b} + 1', '{a} - {b} - 1', '{a} - {b} + 10'],
    explainPrompt: '这是两位数的退位减法。请分三步讲：1) 个位不够减怎么办；2) 十位借 1 当 10；3) 得出结果。用二年级孩子能懂的话。',
    fallbackExplain: '个位不够减时，向十位借 1 当 10，再分别相减。'
  },
  {
    id: 'mul_table',
    knowledge: ['multiplication_table'],
    grade: 2,
    difficulty: 1,
    type: 'number',
    params: {
      a: { min: 2, max: 9 },
      b: { min: 2, max: 9 }
    },
    question: '{a} × {b} = ?',
    answer: '{a} * {b}',
    distractors: ['{a} * {b} + {a}', '{a} * {b} - {a}', '{a} + {b}'],
    explainPrompt: '这是乘法口诀题。请讲：{a}×{b} 表示 {a} 个 {b} 相加，可以用口诀得出结果。用二年级孩子能懂的话。',
    fallbackExplain: '用乘法口诀：几乘以几等于多少。'
  }
]

export function templateById(id: string): QuestionTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
