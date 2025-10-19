<template>
  <div class="popap" :style="{ left: left + 'px', top: top + 'px' }">
    <div id="move-action" class="action">
      <div class="action-name_container">
        <!-- <img class="action-image" src="" alt="" /> -->
         <p>123</p>
        <p class="action-name">Порядок слоев</p>
      </div>
      <!-- <img class="action-menu__arrow" src="" alt="" /> -->
       <p>123</p>
    </div>
  </div>
</template>
<script setup lang="ts">
const { top = 0, left = 0 } = defineProps<{
  top: number;
  left: number;
}>();
</script>
<style scoped>
.popap {
  width: 250px;
  height: 50px;
  position: absolute;
  background-color: black;
  z-index: 3;
}
.action {
  width: 100%;
  display: flex;
  justify-content: space-between;
  background-color: blueviolet;
}
.action-name_container {
  display: flex;
  gap: 20px;
  height: 20px;
}
</style>
