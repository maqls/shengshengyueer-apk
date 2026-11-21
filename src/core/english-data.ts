export interface EnglishWord {
  word: string
  phonetic: string
  meaning: string
  grade: number
  sentence: string
}

export const ENGLISH_WORDS: EnglishWord[] = [
  { word: 'hi', phonetic: '/haɪ/', meaning: '你好', grade: 0, sentence: 'Hi, hello!' },
  { word: 'bye', phonetic: '/baɪ/', meaning: '再见', grade: 0, sentence: 'Bye-bye!' },
  { word: 'one', phonetic: '/wʌn/', meaning: '一', grade: 0, sentence: 'I have one ball.' },
  { word: 'two', phonetic: '/tuː/', meaning: '二', grade: 0, sentence: 'I see two birds.' },
  { word: 'apple', phonetic: '/ˈæpl/', meaning: '苹果', grade: 1, sentence: 'I eat an apple.' },
  { word: 'banana', phonetic: '/bəˈnɑːnə/', meaning: '香蕉', grade: 1, sentence: 'The banana is yellow.' },
  { word: 'cat', phonetic: '/kæt/', meaning: '猫', grade: 1, sentence: 'The cat is sleeping.' },
  { word: 'dog', phonetic: '/dɒɡ/', meaning: '狗', grade: 1, sentence: 'The dog is running.' },
  { word: 'egg', phonetic: '/eɡ/', meaning: '鸡蛋', grade: 1, sentence: 'I have an egg.' },
  { word: 'fish', phonetic: '/fɪʃ/', meaning: '鱼', grade: 1, sentence: 'The fish can swim.' },
  { word: 'go', phonetic: '/ɡəʊ/', meaning: '去', grade: 1, sentence: 'Let us go to school.' },
  { word: 'hat', phonetic: '/hæt/', meaning: '帽子', grade: 1, sentence: 'He wears a hat.' },
  { word: 'ink', phonetic: '/ɪŋk/', meaning: '墨水', grade: 1, sentence: 'The ink is black.' },
  { word: 'jump', phonetic: '/dʒʌmp/', meaning: '跳', grade: 1, sentence: 'The rabbit can jump.' },
  { word: 'book', phonetic: '/bʊk/', meaning: '书', grade: 1, sentence: 'This is my book.' },
  { word: 'pen', phonetic: '/pen/', meaning: '钢笔', grade: 1, sentence: 'I write with a pen.' },
  { word: 'red', phonetic: '/red/', meaning: '红色', grade: 1, sentence: 'The apple is red.' },
  { word: 'sun', phonetic: '/sʌn/', meaning: '太阳', grade: 1, sentence: 'The sun is bright.' },
  { word: 'milk', phonetic: '/mɪlk/', meaning: '牛奶', grade: 1, sentence: 'I drink milk.' },
  { word: 'bird', phonetic: '/bɜːd/', meaning: '鸟', grade: 2, sentence: 'A bird is flying.' },
  { word: 'chair', phonetic: '/tʃeə/', meaning: '椅子', grade: 2, sentence: 'Sit on the chair.' },
  { word: 'desk', phonetic: '/desk/', meaning: '书桌', grade: 2, sentence: 'The book is on the desk.' },
  { word: 'green', phonetic: '/ɡriːn/', meaning: '绿色', grade: 2, sentence: 'The grass is green.' },
  { word: 'happy', phonetic: '/ˈhæpi/', meaning: '高兴的', grade: 2, sentence: 'I am happy today.' },
  { word: 'water', phonetic: '/ˈwɔːtə/', meaning: '水', grade: 2, sentence: 'I drink water.' },
  { word: 'school', phonetic: '/skuːl/', meaning: '学校', grade: 2, sentence: 'I go to school.' },
  { word: 'friend', phonetic: '/frend/', meaning: '朋友', grade: 2, sentence: 'He is my friend.' },
  { word: 'family', phonetic: '/ˈfæməli/', meaning: '家庭', grade: 2, sentence: 'I love my family.' },
  { word: 'teacher', phonetic: '/ˈtiːtʃə/', meaning: '老师', grade: 2, sentence: 'She is a teacher.' },
  { word: 'because', phonetic: '/bɪˈkɒz/', meaning: '因为', grade: 3, sentence: 'I stay home because it rains.' },
  { word: 'important', phonetic: '/ɪmˈpɔːtnt/', meaning: '重要的', grade: 4, sentence: 'Study is important.' },
  { word: 'although', phonetic: '/ɔːlˈðəʊ/', meaning: '虽然', grade: 5, sentence: 'Although it is late, I study.' },
  { word: 'environment', phonetic: '/ɪnˈvaɪrənmənt/', meaning: '环境', grade: 6, sentence: 'We protect the environment.' },
  { word: 'achieve', phonetic: '/əˈtʃiːv/', meaning: '实现', grade: 7, sentence: 'Work hard to achieve your goal.' },
  { word: 'significant', phonetic: '/sɪɡˈnɪfɪkənt/', meaning: '重要的', grade: 9, sentence: 'This is a significant discovery.' },
  { word: 'philosophy', phonetic: '/fɪˈlɒsəfi/', meaning: '哲学', grade: 11, sentence: 'He studies philosophy.' },
  { word: 'analysis', phonetic: '/əˈnæləsɪs/', meaning: '分析', grade: 14, sentence: 'Data analysis is essential.' },
  { word: 'hypothesis', phonetic: '/haɪˈpɒθəsɪs/', meaning: '假设', grade: 17, sentence: 'We test the hypothesis.' },
  { word: 'paradigm', phonetic: '/ˈpærədaɪm/', meaning: '范式', grade: 20, sentence: 'A new research paradigm emerged.' }
]

export function wordsByGrade(grade: number): EnglishWord[] {
  return ENGLISH_WORDS.filter((w) => w.grade === grade)
}

export function wordByName(word: string): EnglishWord | undefined {
  return ENGLISH_WORDS.find((w) => w.word === word)
}
