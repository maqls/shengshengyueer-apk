<script setup lang="ts">
function openTool(): void {
  window.location.href = 'tool/index.html'
}
</script>

<template>
  <div class="app">
    <div class="topbar">
      <div>
        <h1>🧰 原工具箱</h1>
        <div class="sub">完整保留原「声声悦耳」的全部功能</div>
      </div>
    </div>

    <div class="card">
      <h2>多语朗读 · 标音 · 翻译 · 图片识别</h2>
      <div class="source-tag" style="line-height:1.9">
        这是原本的「声声悦耳」网页版，功能完整保留：<br />
        • 整段 / 逐句朗读，显示拼音、IPA、粤语等标音<br />
        • 多语言互译（百度 / 阿里云，可在工具内设置）<br />
        • 拍照 / 上传图片 OCR 识别文字并朗读<br />
        • 多语种切换、内置离线读音规则
      </div>
      <button class="btn primary block" style="margin-top:16px" @click="openTool">打开原工具箱 →</button>
    </div>

    <div class="card">
      <div class="source-tag">
        进入工具箱后，左下角有「← 返回学习」按钮可回到数学 / 识字 / 英语学习界面。
      </div>
    </div>
  </div>
</template>
