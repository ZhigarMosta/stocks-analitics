<template>
  <div class="chart-wrapper-with-resizers" :style="containerStyle">
    <div class="chart" :style="{ height: height + 'px' }">
      <div
        class="chart-drag-layer"
        ref="chartContainer"
        :style="{ width: width + widthInstrumentsAndPrice + 'px' }"
        @mousedown="startContainerDrag"
      ></div>
      <div class="chart-instruments">
        <div class="chart-instrument">
          <input
            type="radio"
            @click="onSwitchInstrumentToLevels"
            :checked="instrimentActiv === Instruments.LVL"
            name="instruments"
          />
          <p class="chart-instrument__text">LVL</p>
        </div>
      </div>

      <Chart />
    </div>

    <div
      class="resizer resizer-top"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('top', $event)"
    ></div>
    <div
      class="resizer resizer-right"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('right', $event)"
    ></div>
    <div
      class="resizer resizer-bottom"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('bottom', $event)"
    ></div>
    <div
      class="resizer resizer-left"
      @mousedown="startResize('left', $event)"
    ></div>

    <div
      class="resizer resizer-top-left"
      @mousedown="startResize('top-left', $event)"
    ></div>
    <div
      class="resizer resizer-top-right"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('top-right', $event)"
    ></div>
    <div
      class="resizer resizer-bottom-left"
      @mousedown="startResize('bottom-left', $event)"
    ></div>
    <div
      class="resizer resizer-bottom-right"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('bottom-right', $event)"
    ></div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, computed } from "vue";
import { useDragStore } from "@/stores/charts/drag";
import { useChartMainStore } from "@/stores/charts/main";
import { useResizeStore } from "@/stores/charts/resize";
import { useLevelStore } from "@/stores/instruments/level";
import { Instruments, useInstrumentStore } from "@/stores/instruments/main";
import Chart from "./Chart.vue";

const storeChartMain = useChartMainStore();
const { width, height } = storeToRefs(storeChartMain);
const storeDrag = useDragStore();
const { containerPosition } = storeToRefs(storeDrag);
const { startContainerDrag } = storeDrag;
const chartContainer = ref(null);
const widthInstrumentsAndPrice = 160;
const resizeStore = useResizeStore();
const { startResize } = resizeStore;
const levelStore = useLevelStore();
const { onSwitchInstrumentToLevels } = levelStore;
const instrumentStore = useInstrumentStore();
const { instrimentActiv } = storeToRefs(instrumentStore);

const containerStyle = computed(() => ({
  transform: `translate(${containerPosition.value.x}px, ${containerPosition.value.y}px)`,
}));
</script>

<style scoped>
.chart-wrapper-with-resizers {
  display: inline-block;
  position: relative;
}

.chart-content {
  margin-top: 25px;
  position: relative;
}

.chart-drag-layer {
  position: absolute;
  height: 25px;
  cursor: move;
  z-index: 100;
  margin-bottom: -10px;
  background: rgba(255, 0, 0, 0.1);
}

.chart-wrapper {
  display: flex;
  background: #fff;
  overflow: hidden;
}

.chart-candles {
  display: block;
  background: #ffffff;
  cursor: grab;
}

.chart-price {
  display: block;
  background: #f0f0f0;
  cursor: pointer;
}

.chart-instruments {
  margin-top: 25px;
  border: 1px solid red;
  display: flex;
  flex-direction: column;
  min-width: 80px;
  gap: 10px;
}

.chart-instrument {
  display: flex;
  gap: 5px;
  align-items: center;
}

.time-canvas {
  display: block;
  background: #f9f9f9;
  border-top: 1px solid #ccc;
}

/* Стили для ресайзеров вокруг .chart */
.resizer {
  position: absolute;
  background: transparent;
  z-index: 1000;
}

/* Боковые ресайзеры (полоски) */
.resizer-top {
  top: -6px;
  left: 8px;
  right: 8px;
  height: 12px;
  cursor: n-resize;
}

.resizer-right {
  top: 8px;
  bottom: 8px;
  width: 12px;
  cursor: e-resize;
}

.resizer-bottom {
  bottom: -6px;
  left: 8px;
  height: 12px;
  cursor: s-resize;
}

.resizer-left {
  left: -6px;
  top: 8px;
  bottom: 8px;
  width: 12px;
  cursor: w-resize;
}

/* Угловые ресайзеры (квадратики) */
.resizer-top-left {
  top: -8px;
  left: -8px;
  width: 16px;
  height: 16px;
  cursor: nw-resize;
  background: #1976d2;
  border-radius: 2px;
}

.resizer-top-right {
  top: -8px;
  width: 16px;
  height: 16px;
  cursor: ne-resize;
  background: #1976d2;
  border-radius: 2px;
}

.resizer-bottom-left {
  bottom: -8px;
  left: -8px;
  width: 16px;
  height: 16px;
  cursor: sw-resize;
  background: #1976d2;
  border-radius: 2px;
}

.resizer-bottom-right {
  bottom: -8px;
  width: 16px;
  height: 16px;
  cursor: se-resize;
  background: #1976d2;
  border-radius: 2px;
}

/* Hover эффекты */
.resizer-top:hover,
.resizer-right:hover,
.resizer-bottom:hover,
.resizer-left:hover {
  background: rgba(25, 118, 210, 0.3);
}

.resizer-top-left:hover,
.resizer-top-right:hover,
.resizer-bottom-left:hover,
.resizer-bottom-right:hover {
  background: #1565c0;
  transform: scale(1.1);
}

.chart-wrapper-with-resizers {
  display: inline-block;
  position: relative;
}

.chart {
  display: flex;
  width: 0;
  position: relative;
}
</style>
