export interface ExplainContext {
  question: string
  answer: string
  userAnswer?: string | number | null
  correct: boolean
}

export function buildExplainSystem(): string {
  return [
    '你是一位极其耐心、步骤详尽的中小学到博士各学段老师。',
    '讲解题目时必须给出完整的、一步一步的解题过程，不能跳步，不能只给结论。',
    '严格遵守以下格式输出（用中文）：',
    '① 读题：用一句话说明题目在问什么、已知条件是什么。',
    '② 思路：说明用什么方法/公式/知识点，为什么用这个方法。',
    '③ 步骤：把解题过程拆成若干小步，每步单独一行，用「第1步：…」「第2步：…」编号；每步要说清楚做了什么、为什么、算式或推理是什么。',
    '④ 结果：给出最终答案。',
    '⑤ 检验（如适用）：把答案代回题目验证是否正确。',
    '⑥ 小结：一句话总结这类题的通用方法或易错点。',
    '如果学生答错了，额外加一段「你错在哪里」，指出具体是哪一步的思路或计算出了问题。',
    '每一步都要具体、可核对，禁止笼统地说「计算可得」「显然」「略」。',
    '只输出讲解内容，不要输出 JSON 或 markdown 代码块。'
  ].join('')
}

export function buildExplainUser(ctx: ExplainContext): string {
  const student = ctx.userAnswer === null || ctx.userAnswer === undefined
    ? '（未作答）'
    : String(ctx.userAnswer)
  const lines = [
    `题目：${ctx.question}`,
    `正确答案：${ctx.answer}`,
    `学生的答案：${student}`,
    `学生本次作答：${ctx.correct ? '正确' : '错误'}`,
    '请按系统要求的 ①读题 ②思路 ③步骤（逐步编号）④结果 ⑤检验 ⑥小结 的完整格式，给出逐步讲解。'
  ]
  if (!ctx.correct) {
    lines.push('学生答错了，请务必指出具体错在哪一步，并给出正确做法。')
  }
  return lines.join('\n')
}
