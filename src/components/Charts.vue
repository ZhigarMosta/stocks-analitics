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

      <div>
        <Chart
          v-if="timeCtx"
          :timeCtx="timeCtx"
          :width="width"
          :height="height"
        />
        <canvas
          ref="timeCanvas"
          class="time-canvas"
          :width="width"
          :height="TIME_CANVAS_HEIGHT"
        />
      </div>
    </div>

    <div
      class="resizer resizer-top"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('top', $event, width, height)"
    ></div>
    <div
      class="resizer resizer-right"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('right', $event, width, height)"
    ></div>
    <div
      class="resizer resizer-bottom"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('bottom', $event, width, height)"
    ></div>
    <div
      class="resizer resizer-left"
      @mousedown="startResize('left', $event, width, height)"
    ></div>

    <div
      class="resizer resizer-top-left"
      @mousedown="startResize('top-left', $event, width, height)"
    ></div>
    <div
      class="resizer resizer-top-right"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('top-right', $event, width, height)"
    ></div>
    <div
      class="resizer resizer-bottom-left"
      @mousedown="startResize('bottom-left', $event, width, height)"
    ></div>
    <div
      class="resizer resizer-bottom-right"
      :style="{ right: -width - widthInstrumentsAndPrice - 8 + 'px' }"
      @mousedown="startResize('bottom-right', $event, width, height)"
    ></div>
  </div>
</template>
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { ref, computed, watch, onMounted } from "vue";
import { useDragStore } from "@/stores/charts/drag";
import { useResizeStore } from "@/stores/charts/resize";
import { useLevelStore } from "@/stores/instruments/level";
import { Instruments, useInstrumentStore } from "@/stores/instruments/main";
import Chart from "./Chart.vue";
import { TIME_CANVAS_HEIGHT } from "@/stores/charts/time";

const storeDrag = useDragStore();
const { containerPosition } = storeToRefs(storeDrag);
const { startContainerDrag } = storeDrag;
const chartContainer = ref(null);
const widthInstrumentsAndPrice = 160;
const resizeStore = useResizeStore();
// const { startResize } = resizeStore;
const levelStore = useLevelStore();
const { onSwitchInstrumentToLevels } = levelStore;
const instrumentStore = useInstrumentStore();
const { instrimentActiv } = storeToRefs(instrumentStore);
const isResizing = ref(false);
const resizeDirection = ref("");
const resizeStart = ref({ x: 0, y: 0 });
const startSize = ref({ width: 0, height: 0 });

const width = ref(500);
const height = ref(500);

const timeCanvas = ref(null);
const timeCtx = ref(null);

const containerStyle = computed(() => ({
  transform: `translate(${containerPosition.value.x}px, ${containerPosition.value.y}px)`,
}));

function startResize(direction, e) {
  e.preventDefault();
  e.stopPropagation();

  isResizing.value = true;
  resizeDirection.value = direction;
  resizeStart.value = { x: e.clientX, y: e.clientY };
  startSize.value = { width: width.value, height: height.value };

  document.addEventListener("mousemove", (e) => onResizeMove(e));
  document.addEventListener("mouseup", (e) => stopResize(e));
}

function onResizeMove(e) {
  const storeDrag = useDragStore();
  const { containerPosition } = storeToRefs(storeDrag);

  if (!isResizing.value) return;

  const dx = e.clientX - resizeStart.value.x;
  const dy = e.clientY - resizeStart.value.y;

  let newWidth = startSize.value.width;
  let newHeight = startSize.value.height;
  let newX = containerPosition.value.x;
  let newY = containerPosition.value.y;

  switch (resizeDirection.value) {
    case "top":
      newHeight = Math.max(200, startSize.value.height - dy);
      if (height.value > 200) {
        newY = e.clientY;
      }
      break;
    case "right":
      newWidth = Math.max(300, startSize.value.width + dx);
      break;
    case "bottom":
      newHeight = Math.max(200, startSize.value.height + dy);
      break;
    case "left":
      newWidth = Math.max(300, startSize.value.width - dx);
      if (width.value > 300) {
        newX = e.clientX;
      }
      break;
    case "top-left":
      newWidth = Math.max(300, startSize.value.width - dx);
      newHeight = Math.max(200, startSize.value.height - dy);
      if (width.value > 300) {
        newX = e.clientX;
      }
      if (height.value > 200) {
        newY = e.clientY;
      }
      break;
    case "top-right":
      newWidth = Math.max(300, startSize.value.width + dx);
      newHeight = Math.max(200, startSize.value.height - dy);
      if (height.value != 200) {
        newY = e.clientY;
      }
      break;
    case "bottom-left":
      newWidth = Math.max(300, startSize.value.width - dx);
      newHeight = Math.max(200, startSize.value.height + dy);
      if (width.value > 300) {
        newX = e.clientX;
      }
      break;
    case "bottom-right":
      newWidth = Math.max(300, startSize.value.width + dx);
      newHeight = Math.max(200, startSize.value.height + dy);
      break;
  }

  width.value = newWidth;
  height.value = newHeight;
  containerPosition.value.x = newX;
  containerPosition.value.y = newY;
}

function stopResize(e) {
  isResizing.value = false;
  document.removeEventListener("mousemove", (e) =>
    onResizeMove(e)
  );
  document.removeEventListener("mouseup", (e) => stopResize(e));

  // drawChart();
}

watch([width, height], () => {
  if (timeCanvas.value) {
    timeCanvas.value.width = width.value;
  }
});

onMounted(() => {
  timeCtx.value = timeCanvas.value.getContext("2d");
});
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
