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
  },
  {
    id: 'mul_2digit',
    knowledge: ['multiplication'],
    grade: 3,
    difficulty: 2,
    type: 'number',
    params: { a: { min: 11, max: 99 }, b: { min: 2, max: 9 } },
    question: '{a} × {b} = ?',
    answer: '{a} * {b}',
    explainPrompt: '这是两位数乘一位数。请分步骤讲：1) 个位相乘；2) 十位相乘加进位。用三年级孩子能懂的话。',
    fallbackExplain: '按数位分别相乘再相加。'
  },
  {
    id: 'div_exact',
    knowledge: ['division'],
    grade: 3,
    difficulty: 2,
    type: 'number',
    params: { a: { min: 2, max: 9 }, b: { min: 2, max: 12 } },
    constraint: 'a * b <= 99',
    question: '{a} * {b} ÷ {a} = ?',
    answer: '{b}',
    explainPrompt: '这是除法。请讲：除法是乘法的逆运算，{a}×{b}÷{a} 等于 {b}。用三年级孩子能懂的话。',
    fallbackExplain: '一个数乘以另一个数再除以自己，等于另一个数。'
  },
  {
    id: 'fraction_add',
    knowledge: ['fraction'],
    grade: 5,
    difficulty: 2,
    type: 'number',
    params: { a: { min: 1, max: 9 }, b: { min: 2, max: 9 } },
    question: '{a}/{b} + {a}/{b} = ? （请填分子，分母为 {b}）',
    answer: '{a} * 2',
    explainPrompt: '这是同分母分数加法。请讲：分母相同，分子相加，分母不变。{a}+{a}={a}*2。用五年级孩子能懂的话。',
    fallbackExplain: '同分母分数相加，分母不变，分子相加。'
  },
  {
    id: 'decimal_add',
    knowledge: ['decimal'],
    grade: 5,
    difficulty: 2,
    type: 'number',
    params: { a: { min: 10, max: 90, step: 5 }, b: { min: 10, max: 90, step: 5 } },
    question: '{a}/10 + {b}/10 = ? （结果请乘以 10 后填整数）',
    answer: '{a} + {b}',
    explainPrompt: '这是小数加法。{a}/10 加 {b}/10 等于 ({a}+{b})/10。结果是 {a}+{b} 再除以 10。用五年级孩子能懂的话。',
    fallbackExplain: '小数点对齐后相加。'
  },
  {
    id: 'linear_eq',
    knowledge: ['equation'],
    grade: 7,
    difficulty: 2,
    type: 'number',
    params: { a: { min: 2, max: 9 }, x: { min: 1, max: 12 } },
    question: '解方程：{a}x = {a}*{x}，x = ?',
    answer: '{x}',
    explainPrompt: '这是一元一次方程。两边同时除以 {a}，得 x={x}。用初一孩子能懂的话。',
    fallbackExplain: '等式两边同除以 x 的系数。'
  },
  {
    id: 'square',
    knowledge: ['power'],
    grade: 8,
    difficulty: 2,
    type: 'number',
    params: { a: { min: 2, max: 20 } },
    question: '{a}² = ?',
    answer: '{a} * {a}',
    explainPrompt: '这是平方运算。{a}² 表示 {a}×{a}={a}*{a}。用初二孩子能懂的话。',
    fallbackExplain: '平方就是自己乘自己。'
  },
  {
    id: 'trig',
    knowledge: ['trigonometry'],
    grade: 10,
    difficulty: 3,
    type: 'number',
    params: {},
    question: 'sin30° + cos60° = ? （结果保留一位小数，如 1.0 填 10）',
    answer: '10',
    explainPrompt: '这是特殊角三角函数。sin30°=0.5，cos60°=0.5，相加等于 1.0。用高一孩子能懂的话。',
    fallbackExplain: 'sin30°=cos60°=0.5，和为 1。'
  },
  {
    id: 'quadratic',
    knowledge: ['quadratic'],
    grade: 11,
    difficulty: 3,
    type: 'number',
    params: { r: { min: 1, max: 9 } },
    question: '方程 x² - {r}x = 0 的两个根之和是？',
    answer: '{r}',
    explainPrompt: '由韦达定理，x²-{r}x=0 的两根之和等于 {r}。用高二孩子能懂的话。',
    fallbackExplain: '一元二次方程两根之和等于一次项系数的相反数。'
  },
  {
    id: 'derivative',
    knowledge: ['derivative'],
    grade: 12,
    difficulty: 3,
    type: 'number',
    params: { a: { min: 2, max: 9 } },
    question: 'f(x) = x³，则 f′({a}) = 3×{a}² = ?',
    answer: '3 * {a} * {a}',
    explainPrompt: '幂函数求导：f(x)=x³ 的导数是 3x²。代入 x={a}，得 3×{a}²={a}*{a}*3。用高三孩子能懂的话。',
    fallbackExplain: 'x^n 的导数是 n·x^(n-1)。'
  },
  {
    id: 'matrix_det',
    knowledge: ['linear_algebra'],
    grade: 14,
    difficulty: 3,
    type: 'number',
    params: { a: { min: 1, max: 9 }, b: { min: 1, max: 9 } },
    question: '二阶行列式 |{a} 0; 0 {b}| 的值 = ?',
    answer: '{a} * {b}',
    explainPrompt: '二阶对角行列式的值等于主对角线元素之积：{a}×{b}={a}*{b}。用大一孩子能懂的话。',
    fallbackExplain: '对角矩阵的行列式等于对角元素相乘。'
  },
  {
    id: 'mod_inverse',
    knowledge: ['number_theory'],
    grade: 17,
    difficulty: 3,
    type: 'number',
    params: { a: { min: 4, max: 7 } },
    question: '{a} × 3 mod 11 的余数 = ?（a 为 4~7）',
    answer: '{a} * 3 - 11',
    explainPrompt: '这是模运算。先算 {a}×3={a}*3，再减去 11 得余数 {a}*3-11。用研一孩子能懂的话。',
    fallbackExplain: '模运算 a mod m 是 a 除以 m 的余数。'
  },
  {
    id: 'entropy',
    knowledge: ['information_theory'],
    grade: 20,
    difficulty: 3,
    type: 'number',
    params: {},
    question: '抛一枚公平硬币的信息熵是几位？（0 或 1，填整数）',
    answer: '1',
    explainPrompt: '公平二值随机变量的信息熵为 log2(2)=1 比特。用博士阶段能懂的话讲清信息量与熵的关系。',
    fallbackExplain: '等概率二值信源的熵是 1 比特。'
  }
]

export function templateById(id: string): QuestionTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
