<script setup lang="ts">
function openStandalone(): void {
  window.location.href = 'tool/index.html'
}
</script>

<template>
  <div class="tool-wrap">
    <iframe src="tool/index.html" class="tool-frame" title="声声悦耳原工具"></iframe>
  </div>
  <button class="tool-standalone" @click="openStandalone">全屏</button>
</template>

<style scoped>
.tool-wrap {
  position: fixed;
  inset: 0 0 60px 0;
  width: 100%;
}
.tool-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
.tool-standalone {
  position: fixed;
  right: 12px;
  bottom: 70px;
  z-index: 9998;
  background: rgba(47,42,34,.85);
  color: #fff;
  border: none;
  border-radius: 999px;
  padding: 7px 14px;
  font-size: 12px;
}
</style>
