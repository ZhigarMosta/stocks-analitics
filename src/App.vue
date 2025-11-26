<script setup lang="ts">
import Charts from "./components/Charts.vue";
</script>

<template>
  <div class="charts">
    <Charts />
    <Charts />
  </div>
</template>

<style lang="scss" scoped>
.charts {
  display: flex;
  gap: 500px;
}
</style>
