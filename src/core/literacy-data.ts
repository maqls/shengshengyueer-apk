export interface LiteracyChar {
  char: string
  pinyin: string
  grade: number
  words: string[]
  sentence: string
}

export const LITERACY_CHARS: LiteracyChar[] = [
  { char: '一', pinyin: 'yī', grade: 1, words: ['一个', '一天', '第一'], sentence: '我有一个苹果。' },
  { char: '二', pinyin: 'èr', grade: 1, words: ['二月', '第二', '二人'], sentence: '二月天气很冷。' },
  { char: '三', pinyin: 'sān', grade: 1, words: ['三个', '三月', '第三'], sentence: '桌上有三本书。' },
  { char: '四', pinyin: 'sì', grade: 1, words: ['四个', '四月', '第四'], sentence: '一年有四个季节。' },
  { char: '五', pinyin: 'wǔ', grade: 1, words: ['五个', '五月', '第五'], sentence: '我有五支铅笔。' },
  { char: '六', pinyin: 'liù', grade: 1, words: ['六个', '六月', '第六'], sentence: '六月一日是儿童节。' },
  { char: '七', pinyin: 'qī', grade: 1, words: ['七个', '七月', '第七'], sentence: '一周有七天。' },
  { char: '八', pinyin: 'bā', grade: 1, words: ['八个', '八月', '第八'], sentence: '八点该上学了。' },
  { char: '九', pinyin: 'jiǔ', grade: 1, words: ['九个', '九月', '第九'], sentence: '九月开始上学。' },
  { char: '十', pinyin: 'shí', grade: 1, words: ['十个', '十月', '第十'], sentence: '我有十个手指。' },
  { char: '人', pinyin: 'rén', grade: 1, words: ['人们', '大人', '家人'], sentence: '家里有三个人。' },
  { char: '大', pinyin: 'dà', grade: 1, words: ['大小', '大人', '长大'], sentence: '这棵树很大。' },
  { char: '小', pinyin: 'xiǎo', grade: 1, words: ['大小', '小孩', '小河'], sentence: '小猫在睡觉。' },
  { char: '上', pinyin: 'shàng', grade: 1, words: ['上面', '上学', '早上'], sentence: '我早上七点起床。' },
  { char: '下', pinyin: 'xià', grade: 1, words: ['下面', '下雨', '下午'], sentence: '下午我们去公园。' },
  { char: '日', pinyin: 'rì', grade: 1, words: ['日子', '生日', '日月'], sentence: '今天是我的生日。' },
  { char: '月', pinyin: 'yuè', grade: 1, words: ['月亮', '五月', '明月'], sentence: '月亮挂在天上。' },
  { char: '水', pinyin: 'shuǐ', grade: 1, words: ['水果', '喝水', '河水'], sentence: '我要喝一杯水。' },
  { char: '火', pinyin: 'huǒ', grade: 1, words: ['火车', '大火', '火苗'], sentence: '火车开得很快。' },
  { char: '山', pinyin: 'shān', grade: 1, words: ['大山', '山上', '山水'], sentence: '山上有很多树。' },
  { char: '天', pinyin: 'tiān', grade: 1, words: ['天空', '今天', '白天'], sentence: '今天天气很好。' },
  { char: '木', pinyin: 'mù', grade: 1, words: ['木头', '树木', '木马'], sentence: '这是一棵树木。' },
  { char: '口', pinyin: 'kǒu', grade: 1, words: ['开口', '门口', '口水'], sentence: '请在门口等我。' },
  { char: '手', pinyin: 'shǒu', grade: 1, words: ['手心', '小手', '手指'], sentence: '我的手很干净。' },
  { char: '中', pinyin: 'zhōng', grade: 1, words: ['中间', '中文', '中心'], sentence: '我在中间站着。' },
  { char: '花', pinyin: 'huā', grade: 2, words: ['花朵', '开花', '花园'], sentence: '花园里开满了花。' },
  { char: '草', pinyin: 'cǎo', grade: 2, words: ['小草', '草地', '青草'], sentence: '草地上有一只羊。' },
  { char: '鸟', pinyin: 'niǎo', grade: 2, words: ['小鸟', '鸟儿', '飞鸟'], sentence: '小鸟在树上唱歌。' },
  { char: '鱼', pinyin: 'yú', grade: 2, words: ['小鱼', '鱼儿', '金鱼'], sentence: '小鱼在水里游。' },
  { char: '风', pinyin: 'fēng', grade: 2, words: ['大风', '风雨', '风筝'], sentence: '今天风很大。' },
  { char: '雨', pinyin: 'yǔ', grade: 2, words: ['下雨', '雨水', '大雨'], sentence: '外面下起了雨。' },
  { char: '云', pinyin: 'yún', grade: 2, words: ['白云', '云朵', '乌云'], sentence: '天上飘着白云。' },
  { char: '春', pinyin: 'chūn', grade: 2, words: ['春天', '春风', '春雨'], sentence: '春天来了，花开了。' },
  { char: '夏', pinyin: 'xià', grade: 2, words: ['夏天', '夏日', '夏季'], sentence: '夏天天气很热。' },
  { char: '秋', pinyin: 'qiū', grade: 2, words: ['秋天', '秋风', '秋叶'], sentence: '秋天树叶黄了。' },
  { char: '冬', pinyin: 'dōng', grade: 2, words: ['冬天', '冬日', '冬季'], sentence: '冬天会下雪。' },
  { char: '红', pinyin: 'hóng', grade: 2, words: ['红色', '红花', '火红'], sentence: '这个苹果是红色的。' },
  { char: '绿', pinyin: 'lǜ', grade: 2, words: ['绿色', '绿草', '碧绿'], sentence: '小草是绿色的。' },
  { char: '白', pinyin: 'bái', grade: 2, words: ['白色', '白云', '雪白'], sentence: '云朵是白色的。' },
  { char: '学', pinyin: 'xué', grade: 2, words: ['学习', '上学', '学生'], sentence: '我每天认真学习。' },
  { char: '书', pinyin: 'shū', grade: 2, words: ['书本', '读书', '书包'], sentence: '我喜欢读书。' },
  { char: '朋', pinyin: 'péng', grade: 3, words: ['朋友', '好友', '小朋友'], sentence: '他是我最好的朋友。' },
  { char: '远', pinyin: 'yuǎn', grade: 3, words: ['远方', '遥远', '远处'], sentence: '远方有一座山。' },
  { char: '忙', pinyin: 'máng', grade: 3, words: ['忙碌', '帮忙', '急忙'], sentence: '妈妈今天很忙。' },
  { char: '甜', pinyin: 'tián', grade: 3, words: ['甜美', '香甜', '甜蜜'], sentence: '这个西瓜很甜。' },
  { char: '觉', pinyin: 'jué', grade: 4, words: ['感觉', '发觉', '自觉'], sentence: '我觉得很开心。' },
  { char: '值', pinyin: 'zhí', grade: 4, words: ['值日', '价值', '值得'], sentence: '今天我值日。' },
  { char: '貌', pinyin: 'mào', grade: 5, words: ['礼貌', '面貌', '外貌'], sentence: '我们要讲礼貌。' },
  { char: '慧', pinyin: 'huì', grade: 5, words: ['智慧', '聪慧', '慧眼'], sentence: '智慧来自学习。' },
  { char: '德', pinyin: 'dé', grade: 6, words: ['品德', '道德', '美德'], sentence: '良好的品德很重要。' },
  { char: '毅', pinyin: 'yì', grade: 7, words: ['毅力', '坚毅', '刚毅'], sentence: '学习需要毅力。' },
  { char: '涵', pinyin: 'hán', grade: 8, words: ['内涵', '涵养', '海涵'], sentence: '这篇文章很有内涵。' },
  { char: '睿', pinyin: 'ruì', grade: 10, words: ['睿智', '聪睿', '睿见'], sentence: '他是一位睿智的学者。' },
  { char: '博', pinyin: 'bó', grade: 13, words: ['博学', '广博', '渊博'], sentence: '博学多才的人受人尊敬。' },
  { char: '研', pinyin: 'yán', grade: 17, words: ['研究', '钻研', '研讨'], sentence: '科学研究需要严谨。' },
  { char: '笃', pinyin: 'dǔ', grade: 20, words: ['笃定', '笃行', '诚笃'], sentence: '笃行致远，践行所学。' }
]

export function charsByGrade(grade: number): LiteracyChar[] {
  return LITERACY_CHARS.filter((c) => c.grade === grade)
}

export function charById(char: string): LiteracyChar | undefined {
  return LITERACY_CHARS.find((c) => c.char === char)
}
