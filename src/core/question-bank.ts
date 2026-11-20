import type { Subject } from './types'

export type QKind = 'choice' | 'judge' | 'fill'

export interface BankQuestion {
  id: string
  subject: Subject
  grades: number[]
  kind: QKind
  prompt: string
  options?: string[]
  answer: string
  explain: string
  knowledge: string
}

export const GRADE_LABELS: Record<number, string> = {
  0: '学前',
  1: '一年级', 2: '二年级', 3: '三年级', 4: '四年级', 5: '五年级', 6: '六年级',
  7: '初一', 8: '初二', 9: '初三'
}

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: '数学',
  literacy: '识字',
  english: '英语',
  chinese: '语文',
  science: '科学',
  history: '历史',
  geography: '地理',
  thinking: '思维'
}

let seq = 0
function q(
  subject: Subject,
  grades: number[],
  kind: QKind,
  prompt: string,
  answer: string,
  explain: string,
  options?: string[],
  knowledge?: string
): BankQuestion {
  return {
    id: `b${++seq}`,
    subject,
    grades,
    kind,
    prompt,
    answer,
    explain,
    options,
    knowledge: knowledge ?? `${subject}:通用`
  }
}

export const BANK: BankQuestion[] = []

function add(...items: BankQuestion[]): void {
  for (const item of items) BANK.push(item)
}

// ============ 语文 ============
add(
  q('chinese', [0, 1, 2], 'choice', '“日”和“月”合起来是什么字？', '明', '日+月=明，明亮的明。', ['明', '朋', '阳', '目'], 'chinese:识字'),
  q('chinese', [0, 1, 2], 'choice', '下列哪个字是“大”的反义词？', '小', '大和小是一对反义词。', ['小', '多', '高', '长'], 'chinese:反义词'),
  q('chinese', [1, 2, 3], 'fill', '一去二三里，烟村四五家。下一句是：亭台六七座，____。', '八九十枝花', '这是古诗《山村咏怀》，数字诗。', undefined, 'chinese:古诗'),
  q('chinese', [2, 3, 4], 'choice', '“床前明月光”的下一句是？', '疑是地上霜', '出自李白《静夜思》。', ['疑是地上霜', '举头望明月', '低头思故乡', '春眠不觉晓'], 'chinese:古诗'),
  q('chinese', [3, 4, 5], 'choice', '成语“画蛇添足”的意思是？', '做了多余的事反而不好', '蛇本来没有脚，画上脚是多此一举。', ['做了多余的事反而不好', '画画很用心', '蛇会走路', '事情做得很完美'], 'chinese:成语'),
  q('chinese', [4, 5, 6], 'fill', '“三人行，必有我____焉。”横线处应填？', '师', '出自《论语》，意为虚心向别人学习。', undefined, 'chinese:古文'),
  q('chinese', [5, 6, 7], 'choice', '“忽如一夜春风来，千树万树梨花开”描写的是？', '雪景', '岑参诗句，以梨花比喻雪花。', ['雪景', '梨花', '春风', '秋天'], 'chinese:古诗'),
  q('chinese', [7, 8, 9], 'choice', '《西游记》的作者是？', '吴承恩', '明代小说家吴承恩著有《西游记》。', ['吴承恩', '罗贯中', '施耐庵', '曹雪芹'], 'chinese:文学常识'),
  q('chinese', [7, 8, 9], 'fill', '“先天下之忧而忧，后天下之乐而乐”出自范仲淹的《____》。', '岳阳楼记', '《岳阳楼记》中的名句。', undefined, 'chinese:古文')
)

// ============ 数学 ============
add(
  q('math', [0, 1], 'choice', '3 + 4 = ?', '7', '3加4等于7。', ['6', '7', '8', '9'], 'math:加法'),
  q('math', [1, 2], 'fill', '15 - 8 = ?', '7', '15减8等于7。', undefined, 'math:减法'),
  q('math', [2, 3], 'choice', '6 × 7 = ?', '42', '六七四十二，乘法口诀。', ['36', '42', '48', '49'], 'math:乘法'),
  q('math', [3, 4], 'fill', '一个长方形长5厘米，宽3厘米，周长是____厘米。', '16', '周长=(长+宽)×2=(5+3)×2=16。', undefined, 'math:几何'),
  q('math', [4, 5], 'choice', '1/2 + 1/4 = ?', '3/4', '通分后2/4+1/4=3/4。', ['2/6', '3/4', '1/2', '2/3'], 'math:分数'),
  q('math', [5, 6], 'fill', '一个数的20%是40，这个数是____。', '200', '40÷20%=40÷0.2=200。', undefined, 'math:百分数'),
  q('math', [6, 7], 'choice', '解方程 2x + 6 = 20，x = ?', '7', '2x=14，所以x=7。', ['6', '7', '8', '10'], 'math:方程'),
  q('math', [7, 8], 'fill', '直角三角形两条直角边分别为3和4，斜边是____。', '5', '勾股定理：3²+4²=5²。', undefined, 'math:几何'),
  q('math', [8, 9], 'choice', '函数 y = 2x + 1 中，当 x = 3 时 y = ?', '7', 'y=2×3+1=7。', ['5', '6', '7', '8'], 'math:函数')
)

// ============ 英语 ============
add(
  q('english', [0, 1], 'choice', '“苹果”的英文是？', 'apple', 'apple 是苹果。', ['apple', 'banana', 'cat', 'dog'], 'english:词汇'),
  q('english', [1, 2], 'fill', '“猫”的英文单词是____。', 'cat', 'cat 是猫。', undefined, 'english:词汇'),
  q('english', [2, 3], 'choice', 'I ____ a student.', 'am', '第一人称 I 用 am。', ['am', 'is', 'are', 'be'], 'english:语法'),
  q('english', [3, 4], 'fill', '“星期天”的英文是____。', 'Sunday', 'Sunday 是星期日。', undefined, 'english:词汇'),
  q('english', [4, 5], 'choice', 'He ____ to school every day.', 'goes', '第三人称单数，go 变 goes。', ['go', 'goes', 'going', 'gone'], 'english:语法'),
  q('english', [5, 6], 'fill', '“漂亮的”英文形容词是____。', 'beautiful', 'beautiful 意为美丽的。', undefined, 'english:词汇'),
  q('english', [6, 7], 'choice', 'I have ____ than you.', 'more books', 'more 是比较级，后接名词。', ['more books', 'many books', 'much books', 'most books'], 'english:语法'),
  q('english', [7, 8, 9], 'fill', '“如果”的英文连词是____。', 'if', 'if 引导条件状语从句。', undefined, 'english:语法')
)

// ============ 科学 ============
add(
  q('science', [0, 1, 2], 'choice', '太阳从哪个方向升起？', '东方', '地球自西向东转，太阳从东方升起。', ['东方', '西方', '南方', '北方'], 'science:天文'),
  q('science', [1, 2, 3], 'choice', '水在多少摄氏度结冰？', '0℃', '水的冰点是0摄氏度。', ['0℃', '10℃', '100℃', '-10℃'], 'science:物理'),
  q('science', [2, 3, 4], 'fill', '植物进行光合作用需要阳光、水和____。', '二氧化碳', '光合作用吸收二氧化碳，释放氧气。', undefined, 'science:生物'),
  q('science', [3, 4, 5], 'choice', '下列哪种动物是哺乳动物？', '鲸鱼', '鲸鱼用肺呼吸、胎生，是哺乳动物。', ['鲸鱼', '鲨鱼', '金鱼', '章鱼'], 'science:生物'),
  q('science', [4, 5, 6], 'fill', '声音在真空中____传播。（填“能”或“不能”）', '不能', '声音传播需要介质，真空不能传声。', undefined, 'science:物理'),
  q('science', [5, 6, 7], 'choice', '彩虹的形成是因为光的？', '色散', '阳光经水滴折射发生色散形成彩虹。', ['色散', '反射', '直线传播', '吸收'], 'science:物理'),
  q('science', [7, 8, 9], 'fill', '原子中带负电的粒子是____。', '电子', '电子带负电，质子带正电。', undefined, 'science:化学')
)

// ============ 历史 ============
add(
  q('history', [1, 2, 3], 'choice', '中国古代四大发明不包括以下哪项？', '地动仪', '四大发明是造纸术、印刷术、火药、指南针。', ['造纸术', '地动仪', '火药', '指南针'], 'history:科技'),
  q('history', [3, 4, 5], 'fill', '秦始皇统一中国后建立的朝代是____。', '秦朝', '公元前221年秦王嬴政统一六国，建立秦朝。', undefined, 'history:朝代'),
  q('history', [4, 5, 6], 'choice', '“贞观之治”出现在哪位皇帝统治时期？', '唐太宗', '唐太宗李世民开创贞观之治。', ['唐太宗', '唐玄宗', '汉武帝', '宋太祖'], 'history:朝代'),
  q('history', [5, 6, 7], 'fill', '明成祖朱棣把明朝都城迁到了____。', '北京', '明成祖朱棣迁都北京。', undefined, 'history:朝代'),
  q('history', [7, 8, 9], 'choice', '中国近代史的开端是哪场战争？', '鸦片战争', '1840年鸦片战争是中国近代史的开端。', ['鸦片战争', '甲午战争', '辛亥革命', '五四运动'], 'history:近代史')
)

// ============ 地理 ============
add(
  q('geography', [0, 1, 2], 'choice', '我们居住的星球叫什么？', '地球', '我们生活在地球上。', ['地球', '月球', '太阳', '火星'], 'geography:地球'),
  q('geography', [2, 3, 4], 'fill', '中国的首都是____。', '北京', '北京是中华人民共和国的首都。', undefined, 'geography:中国'),
  q('geography', [3, 4, 5], 'choice', '世界上面积最大的国家是？', '俄罗斯', '俄罗斯是世界上面积最大的国家。', ['俄罗斯', '中国', '美国', '加拿大'], 'geography:世界'),
  q('geography', [5, 6, 7], 'fill', '长江是中国第____长的河流。', '一', '长江是中国第一长河。', undefined, 'geography:中国'),
  q('geography', [7, 8, 9], 'choice', '地球上最大的海洋是？', '太平洋', '太平洋是地球上面积最大的海洋。', ['太平洋', '大西洋', '印度洋', '北冰洋'], 'geography:世界')
)

// ============ 思维训练 ============
add(
  q('thinking', [0, 1, 2], 'choice', '找规律：1, 2, 3, 4, ?', '5', '每次加1，所以下一个是5。', ['5', '6', '7', '8'], 'thinking:规律'),
  q('thinking', [2, 3, 4], 'fill', '找规律：2, 4, 6, 8, ____。', '10', '每次加2的等差数列。', undefined, 'thinking:规律'),
  q('thinking', [3, 4, 5], 'choice', '鸡和兔共10只，共28条腿，兔有几只？', '4', '假设全鸡20腿，多8腿，每兔多2腿，故兔4只。', ['3', '4', '5', '6'], 'thinking:逻辑'),
  q('thinking', [5, 6, 7], 'fill', '找规律：1, 1, 2, 3, 5, 8, ____。', '13', '斐波那契数列，前两项之和。', undefined, 'thinking:规律'),
  q('thinking', [7, 8, 9], 'choice', '一个正方体有几个面？', '6', '正方体有6个面、12条棱、8个顶点。', ['4', '6', '8', '12'], 'thinking:空间')
)

export function bankQuestions(filter: {
  subject?: Subject
  grade?: number
  knowledge?: string
} = {}): BankQuestion[] {
  return BANK.filter((item) => {
    if (filter.subject && item.subject !== filter.subject) return false
    if (filter.grade !== undefined && !item.grades.includes(filter.grade)) return false
    if (filter.knowledge && item.knowledge !== filter.knowledge) return false
    return true
  })
}

export function availableGrades(): number[] {
  const set = new Set<number>()
  for (const item of BANK) for (const g of item.grades) set.add(g)
  return Array.from(set).sort((a, b) => a - b)
}

export function checkBankAnswer(item: BankQuestion, userAnswer: string): boolean {
  const norm = (s: string): string => {
    let v = s.trim()
    if (item.kind === 'fill') v = v.replace(/[。．.]/g, '')
    return v.toLowerCase()
  }
  return norm(userAnswer) === norm(item.answer)
}
