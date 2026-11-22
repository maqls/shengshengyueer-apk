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
  7: '初一', 8: '初二', 9: '初三',
  10: '高一', 11: '高二', 12: '高三',
  13: '大一', 14: '大二', 15: '大三', 16: '大四',
  17: '研一', 18: '研二',
  19: '博一', 20: '博二', 21: '博三', 22: '博四'
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

export interface GradeStage {
  key: string
  label: string
  grades: number[]
}

export const GRADE_STAGES: GradeStage[] = [
  { key: 'preschool', label: '学前', grades: [0] },
  { key: 'primary', label: '小学', grades: [1, 2, 3, 4, 5, 6] },
  { key: 'junior', label: '初中', grades: [7, 8, 9] },
  { key: 'senior', label: '高中', grades: [10, 11, 12] },
  { key: 'college', label: '大学', grades: [13, 14, 15, 16] },
  { key: 'graduate', label: '研究生', grades: [17, 18, 19, 20, 21, 22] }
]

export interface SubjectGroup {
  key: string
  label: string
  subjects: Subject[]
}

export const SUBJECT_GROUPS: SubjectGroup[] = [
  { key: 'main', label: '主科', subjects: ['math', 'chinese', 'english'] },
  { key: 'foundation', label: '启蒙', subjects: ['literacy', 'thinking'] },
  { key: 'science', label: '理科', subjects: ['science'] },
  { key: 'humanity', label: '人文', subjects: ['history', 'geography'] }
]

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
  q('literacy', [0, 1, 2], 'choice', '“火”字怎么读？', 'huǒ', '火读作 huǒ，与水相对。', ['huǒ', 'shuǐ', 'mù', 'tǔ'], 'literacy:认字'),
  q('literacy', [0, 1, 2], 'choice', '哪个字表示“跑得很快的动物”，也指“马”？', '马', '马是跑得很快的动物。', ['马', '鸟', '鱼', '虫'], 'literacy:认字'),
  q('literacy', [1, 2, 3], 'choice', '“春”的反义季节字是？', '秋', '春天与秋天相对。', ['秋', '天', '日', '月'], 'literacy:识字'),
  q('literacy', [1, 2, 3], 'fill', '“明”字由“日”和____组成。', '月', '日+月=明。', undefined, 'literacy:字形'),
  q('literacy', [2, 3, 4, 5, 6], 'choice', '“hungry”想表达“口渴”该用哪个字组成词？', '渴', '口渴的“渴”与水有关，带三点水。', ['渴', '饿', '喝', '喝'], 'literacy:识字'),
  q('literacy', [3, 4, 5, 6], 'fill', '“森”字由三个____字组成。', '木', '三个木组成森，表示很多树。', undefined, 'literacy:字形'),
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
  q('history', [0, 1, 2], 'choice', '古代人写字最早写在什么上？', '竹简', '造纸术发明前，古人把字写在竹片木片上，叫竹简。', ['竹简', '电脑', '手机', '玻璃'], 'history:常识'),
  q('history', [0, 1, 2], 'choice', '春节是中国传统节日吗？', '是', '春节是中国最重要的传统节日。', ['是', '不是'], 'history:节日'),
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

// ============ 高中 ============
add(
  q('math', [10, 11, 12], 'fill', '已知函数 f(x)=x²-2x，则 f(3)=____。', '3', 'f(3)=9-6=3。', undefined, 'math:函数'),
  q('math', [10, 11], 'choice', 'sin30° 的值是？', '1/2', '特殊角的三角函数值，sin30°=1/2。', ['1/2', '√2/2', '√3/2', '1'], 'math:三角函数'),
  q('chinese', [10, 11, 12], 'fill', '《红楼梦》的作者是____。', '曹雪芹', '清代小说家曹雪芹著《红楼梦》。', undefined, 'chinese:文学常识'),
  q('english', [10, 11, 12], 'fill', '虚拟语气：If I ____ you, I would study harder.', 'were', '与现在事实相反的虚拟语气用 were。', undefined, 'english:语法'),
  q('science', [10, 11, 12], 'choice', '牛顿第二定律的表达式是？', 'F=ma', '力等于质量乘以加速度。', ['F=ma', 'E=mc²', 'F=mv', 'P=Fv'], 'science:物理'),
  q('history', [10, 11, 12], 'choice', '标志着中国进入社会主义初级阶段的是？', '三大改造完成', '1956年三大改造基本完成。', ['三大改造完成', '新中国成立', '改革开放', '五四运动'], 'history:近现代史'),
  q('geography', [10, 11, 12], 'fill', '地球自转一圈约需____小时。', '24', '地球自转周期约24小时，形成昼夜交替。', undefined, 'geography:地球'),
  q('thinking', [10, 11, 12], 'choice', '等差数列 2,5,8,11,… 的第10项是？', '29', '公差3，第n项=2+3(n-1)，第10项=2+27=29。', ['26', '29', '32', '35'], 'thinking:数列'),
  q('math', [12], 'fill', 'lim(x→0) sinx/x = ____。', '1', '重要极限：x 趋于 0 时 sinx/x 趋于 1。', undefined, 'math:极限'),
  q('chinese', [10, 11, 12], 'choice', '《雷雨》的作者是？', '曹禺', '曹禺创作的话剧《雷雨》是中国现代话剧代表作。', ['老舍', '曹禺', '巴金', '茅盾'], 'chinese:文学常识'),
  q('english', [10, 11, 12], 'choice', '“他昨天去了北京”的地道英文是？', 'He went to Beijing yesterday.', '过去时间用一般过去式 went。', ['He go to Beijing yesterday.', 'He went to Beijing yesterday.', 'He gone to Beijing yesterday.', 'He goes to Beijing yesterday.'], 'english:时态'),
  q('science', [12], 'fill', '水的分子式是 H₂____。', 'O', '一个水分子由两个氢原子和一个氧原子构成。', undefined, 'science:化学'),
  q('history', [12], 'fill', '新文化运动高举的两面大旗是“民主”与“____”。', '科学', '新文化运动提倡民主与科学（德先生与赛先生）。', undefined, 'history:近代史'),
  q('geography', [12], 'choice', '对流层气温随高度升高的变化是？', '递减', '对流层气温随海拔升高而递减，约每百米降 0.6℃。', ['递增', '递减', '不变', '先增后减'], 'geography:大气'),
  q('thinking', [12], 'fill', '排列数 A(3,3) = ____。', '6', 'A(3,3)=3!=6。', undefined, 'thinking:组合')
)

// ============ 本科 ============
add(
  q('math', [13, 14, 15, 16], 'fill', '∫₂x dx（从0到1的定积分）=____。', '1/2', '∫x dx=x²/2，0到1为1/2。', undefined, 'math:微积分'),
  q('math', [13, 14, 15, 16], 'choice', '矩阵 A 的行列式 |A|=0 说明 A？', '不可逆', '行列式为零则矩阵奇异、不可逆。', ['可逆', '不可逆', '正交', '对称'], 'math:线性代数'),
  q('english', [13, 14, 15, 16], 'fill', 'The data ____ analyzed yesterday.', 'was', 'data 作单数且被动语态，用 was。', undefined, 'english:学术写作'),
  q('science', [13, 14, 15, 16], 'choice', '下列哪个是时间复杂度 O(log n) 的算法？', '二分查找', '二分查找每次折半，复杂度 O(log n)。', ['冒泡排序', '二分查找', '线性查找', '选择排序'], 'science:计算机'),
  q('chinese', [13, 14, 15, 16], 'fill', '“先天下之忧而忧”的下一句是____。', '后天下之乐而乐', '出自范仲淹《岳阳楼记》。', undefined, 'chinese:古文'),
  q('thinking', [13, 14, 15, 16], 'choice', '二进制 1010 转换为十进制是？', '10', '1×8+0×4+1×2+0=10。', ['8', '10', '12', '16'], 'thinking:计算机'),
  q('history', [13, 14, 15, 16], 'fill', '文艺复兴运动起源于____（国家）。', '意大利', '14世纪文艺复兴最早兴起于意大利。', undefined, 'history:世界史'),
  q('history', [13, 14, 15, 16], 'choice', '提出“历史唯物主义”的思想家是？', '马克思', '马克思与恩格斯创立了历史唯物主义。', ['黑格尔', '马克思', '康德', '尼采'], 'history:史学理论'),
  q('geography', [13, 14, 15, 16], 'choice', '板块构造学说中，全球分为几大板块？', '六大板块', '全球岩石圈划分为六大板块。', ['四大板块', '五大板块', '六大板块', '八大板块'], 'geography:构造'),
  q('geography', [13, 14, 15, 16], 'fill', '人口自然增长率 = 出生率 − ____。', '死亡率', '自然增长率等于出生率减去死亡率。', undefined, 'geography:人口')
)

// ============ 硕士 ============
add(
  q('science', [17, 18], 'choice', '机器学习中，过拟合指模型？', '在训练集表现好、测试集差', '过拟合是泛化能力差。', ['欠拟合', '在训练集表现好、测试集差', '无法收敛', '偏差过大'], 'science:人工智能'),
  q('science', [17, 18], 'fill', '梯度下降中控制步长的超参数叫____。', '学习率', '学习率（learning rate）控制更新步长。', undefined, 'science:人工智能'),
  q('math', [17, 18], 'choice', '协方差矩阵的特征值用于？', '主成分分析', 'PCA 通过特征值分解协方差矩阵降维。', ['主成分分析', '线性回归', '聚类', '分类'], 'math:统计学习'),
  q('english', [17, 18], 'fill', '学术写作中 “however” 通常用作____连接词。', '转折', 'however 表示转折关系。', undefined, 'english:学术写作'),
  q('thinking', [17, 18], 'choice', '贝叶斯公式的核心思想是？', '用新证据更新先验概率', '贝叶斯更新：后验∝先验×似然。', ['只用先验概率', '用新证据更新先验概率', '只看频率', '不用概率'], 'thinking:统计推理'),
  q('chinese', [17, 18], 'fill', '“路漫漫其修远兮，吾将上下而求索”出自《____》。', '离骚', '屈原《离骚》中的名句。', undefined, 'chinese:古文'),
  q('history', [17, 18], 'fill', '“实事求是”这一思想路线在党内确立于____运动。', '延安整风', '延安整风运动确立了实事求是的思想路线。', undefined, 'history:近现代史'),
  q('geography', [17, 18], 'fill', 'GIS 的中文全称是地理____系统。', '信息', 'GIS（Geographic Information System）即地理信息系统。', undefined, 'geography:技术')
)

// ============ 博士 ============
add(
  q('science', [19, 20, 21, 22], 'choice', '证明 NP 完全问题最常用的方法是？', '多项式时间归约', '通过多项式时间归约证明 NP 完全性。', ['数学归纳法', '多项式时间归约', '反证法', '动态规划'], 'science:理论计算机'),
  q('science', [19, 20, 21, 22], 'fill', '深度学习中通过跨层直连来缓解梯度消失的结构叫____连接。', '残差', '残差连接（ResNet）通过跨层直连缓解梯度消失。', undefined, 'science:深度学习'),
  q('math', [19, 20, 21, 22], 'choice', '中心极限定理说明样本均值近似服从？', '正态分布', '大样本下样本均值近似正态分布。', ['正态分布', '均匀分布', '泊松分布', '二项分布'], 'math:概率论'),
  q('thinking', [19, 20, 21, 22], 'fill', '时间复杂度 O(2^n) 的算法属于____复杂度。', '指数', '2^n 为指数级复杂度。', undefined, 'thinking:算法'),
  q('english', [19, 20, 21, 22], 'fill', '论文中“本文提出一种新方法”常译为：This paper ____ a novel method.', 'proposes', 'propose 表示提出。', undefined, 'english:学术写作'),
  q('chinese', [19, 20, 21, 22], 'fill', '学术论文摘要的英文是____。', 'abstract', '论文摘要通常译为 abstract。', undefined, 'chinese:学术写作'),
  q('history', [19, 20, 21, 22], 'choice', '“李约瑟难题”探讨的是？', '近代科学为何未在中国产生', '李约瑟难题讨论中国近代科学落后的原因。', ['中国人口问题', '近代科学为何未在中国产生', '丝绸之路起源', '科举制利弊'], 'history:史学理论'),
  q('geography', [19, 20, 21, 22], 'fill', '遥感影像的空间分辨率指一个像素代表的地面____大小。', '范围', '空间分辨率是单个像素对应的地面尺寸。', undefined, 'geography:遥感')
)

// ============ 博士 ============
add(
  q('science', [19, 20, 21, 22], 'choice', '证明 NP 完全问题最常用的方法是？', '多项式时间归约', '通过多项式时间归约证明 NP 完全性。', ['数学归纳法', '多项式时间归约', '反证法', '动态规划'], 'science:理论计算机'),
  q('science', [19, 20, 21, 22], 'fill', '深度学习中通过跨层直连来缓解梯度消失的结构叫____连接。', '残差', '残差连接（ResNet）通过跨层直连缓解梯度消失。', undefined, 'science:深度学习'),
  q('math', [19, 20, 21, 22], 'choice', '中心极限定理说明样本均值近似服从？', '正态分布', '大样本下样本均值近似正态分布。', ['正态分布', '均匀分布', '泊松分布', '二项分布'], 'math:概率论'),
  q('thinking', [19, 20, 21, 22], 'fill', '时间复杂度 O(2^n) 的算法属于____复杂度。', '指数', '2^n 为指数级复杂度。', undefined, 'thinking:算法'),
  q('english', [19, 20, 21, 22], 'fill', '论文中“本文提出一种新方法”常译为：This paper ____ a novel method.', 'proposes', 'propose 表示提出。', undefined, 'english:学术写作')
)

/** K12 教材版本（统一配置，默认人教版）；模型出题时作为知识点范围约束 */
export const TEXTBOOK_VERSIONS: string[] = [
  '人教版', '部编版', '北师大版', '苏教版', '华师大版', '外研版',
  '译林版', '沪教版', '鲁教版', '冀教版', '浙教版', '粤教版', '西师版'
]

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
