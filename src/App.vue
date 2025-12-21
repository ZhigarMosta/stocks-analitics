<script setup lang="ts">
import { storeToRefs } from "pinia";
import Charts from "./components/Charts.vue";
import { useUserStore } from "./stores/user/user";
const userStore = useUserStore();
const { windiows } = storeToRefs(userStore);
</script>

<template>
  <div class="charts">
    <Charts
      v-for="windiow in windiows"
      :key="windiow.window_id"
      :window_id="windiow.window_id"
      :height="windiow.height"
      :charts="windiow.charts"
    />
  </div>
</template>

<style lang="scss" scoped></style>
