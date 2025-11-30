<template>
  <div class="chart-content">
    <div class="chart-main-area" :style="{ height: height + 'px' }">
      <div class="chart-wrapper">
        <canvas
          ref="mainCanvas"
          class="chart-candles"
          :width="width"
          :height="height"
          @mousedown="startPan"
          @mouseup="endPan"
          @mouseleave="endPan"
          @mousemove="onMouseMove"
          @wheel="
            (e) =>
              onMainWheel(
                e,
                timeCtx,
                priceCtx,
                mainCtx,
                props.width,
                props.height,
                mouse,
                priceScale
              )
          "
          @contextmenu.prevent="onCanvasContextMenu"
        />
        <canvas
          ref="priceCanvas"
          class="chart-price"
          :width="PRICE_CANVAS_WIDTH"
          :height="height"
          @wheel="onPriceWheel"
          @mousedown="startPriceScaleDrag"
          @mousemove="onPriceScaleDrag"
          @mouseup="endPriceScaleDrag"
          @mouseleave="endPriceScaleDrag"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { resizeEventBus } from "@/eventBuses/resize-bus";
import { useChartCandelStore } from "@/stores/charts/candel";
import { useDragStore } from "@/stores/charts/drag";
import { useChartEmaStore } from "@/stores/charts/ema";
import { useChartMainStore } from "@/stores/charts/main";
import { PRICE_CANVAS_WIDTH, useChartPriceStore } from "@/stores/charts/price";
import { useInstrumentStore } from "@/stores/instruments/main";
import { storeToRefs } from "pinia";
import { onMounted, onUnmounted, ref, Ref } from "vue";

const props = defineProps<{
  timeCtx: Ref;
  width: number;
  height: number;
}>();

const storeChartMain = useChartMainStore();
const { spacing, offset, scale } = storeToRefs(storeChartMain);
const { drawChart, onMainWheel } = storeChartMain;
const priceChart = useChartPriceStore();
const { centerPrice, priceRange } = storeToRefs(priceChart);
const { priceFromY, endPriceScaleDrag } = priceChart;
const candelChart = useChartCandelStore();
const { candleWidth, candles } = storeToRefs(candelChart);
const emaStore = useChartEmaStore();
const { isClickOnEMA } = emaStore;
const instrumentStore = useInstrumentStore();
const { onAddInstrument } = instrumentStore;

const priceCanvas = ref(null);
const priceCtx = ref(null);
const priceScale = ref(1);

const mainCanvas = ref(null);
const mainCtx = ref(null);

const dragging = ref(false);
const lastMouse = ref({ x: 0, y: 0 });
const mouse = ref({ x: 0, y: 0 });

function startPan(e) {
  dragging.value = true;
  lastMouse.value = { x: e.offsetX, y: e.offsetY };
}

function endPan() {
  dragging.value = false;
}

function onMouseMove(e) {
  const priceChart = useChartPriceStore();
  const { centerPrice, priceRange } = storeToRefs(priceChart);

  mouse.value = { x: e.offsetX, y: e.offsetY };

  if (dragging.value) {
    const dx = e.offsetX - lastMouse.value.x;
    const dy = e.offsetY - lastMouse.value.y;

    offset.value.x += dx;

    const priceDelta =
      ((dy / (props.height - 100)) * priceRange.value) / priceScale.value;
    centerPrice.value += priceDelta;

    lastMouse.value = { x: e.offsetX, y: e.offsetY };

    clampHorizontalOffset();
  }

  drawChart(
    props.timeCtx,
    priceCtx.value,
    mainCtx.value,
    props.width,
    props.height,
    mouse.value,
    priceScale.value
  );
}

function clampHorizontalOffset() {
  const candelStore = useChartCandelStore();
  const { candleWidth, candles } = storeToRefs(candelStore);

  const totalCandleWidth = candleWidth.value + spacing.value;
  const totalWidth = totalCandleWidth * candles.value.length * scale.value;

  const minOffsetX = -(totalWidth - candleWidth.value * scale.value);
  const maxOffsetX = candleWidth.value * scale.value;

  if (offset.value.x < minOffsetX) {
    offset.value.x = minOffsetX;
  }
  if (offset.value.x > maxOffsetX) {
    offset.value.x = maxOffsetX;
  }
}

function onPriceWheel(e) {
  const mainChart = useChartMainStore();
  const { drawChart } = mainChart;

  e.preventDefault();
  const zoomFactor = 1.1;
  const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

  const centerY = props.height / 2;
  const priceBefore = priceFromY(centerY, props.height, priceScale.value);

  priceScale.value = Math.min(100, Math.max(0.01, priceScale.value * delta));

  const priceAfter = priceFromY(centerY, props.height, priceScale.value);
  centerPrice.value += priceBefore - priceAfter;

  drawChart(
    props.timeCtx,
    priceCtx.value,
    mainCtx.value,
    props.width,
    props.height,
    mouse.value,
    priceScale.value
  );
}

function onPriceScaleDrag(e) {
  const drag = useDragStore();
  const { scalingPriceByDrag } = storeToRefs(drag);

  if (!scalingPriceByDrag.value) return;

  const dy = e.offsetY - lastMouse.value.y;

  const zoomFactor = 1.038; // чувствительность
  const delta = dy > 0 ? 1 / zoomFactor : zoomFactor;

  const centerY = props.height / 2;

  const priceBefore = priceFromY(centerY, props.height, priceScale.value);
  priceScale.value = Math.max(0.01, Math.min(100, priceScale.value * delta));
  const priceAfter = priceFromY(centerY, props.height, priceScale.value);

  centerPrice.value += priceBefore - priceAfter;
  lastMouse.value = { x: e.offsetX, y: e.offsetY };

  drawChart(
    props.timeCtx,
    priceCtx.value,
    mainCtx.value,
    props.width,
    props.height,
    mouse.value,
    priceScale.value
  );
}

function startPriceScaleDrag(e) {
  const drag = useDragStore();
  const { scalingPriceByDrag } = storeToRefs(drag);
  scalingPriceByDrag.value = true;
  lastMouse.value = { x: e.offsetX, y: e.offsetY };
}

function onCanvasContextMenu(e) {
  const rect = mainCanvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isClickOnEMA(x, y, 5, props.height, priceScale.value)) {
    e.preventDefault();
    console.log("hello - EMA clicked!");
    return;
  }

  onAddInstrument(
    e,
    props.timeCtx.value,
    priceCtx.value,
    mainCtx.value,
    props.width,
    props.height,
    mouse.value,
    priceScale.value
  );
}

const handleResize = () => {
  drawChart(
    props.timeCtx.value,
    priceCtx.value,
    mainCtx.value,
    props.width,
    props.height,
    mouse.value,
    priceScale.value
  );
};

onMounted(() => {
  const highs = candles.value.map((c) => c.high);
  const lows = candles.value.map((c) => c.low);
  centerPrice.value = (Math.max(...highs) + Math.min(...lows)) / 2;
  priceRange.value = Math.max(...highs) - Math.min(...lows);
  if (priceRange.value === 0) priceRange.value = 10;

  mainCtx.value = mainCanvas.value.getContext("2d");
  priceCtx.value = priceCanvas.value.getContext("2d");

  const visibleCandles = 10;
  const totalCandleWidth = candleWidth.value + spacing.value;
  const candlesWidthOnScreen = totalCandleWidth * visibleCandles;

  const halfScreenWidth = props.width / 2;
  scale.value = halfScreenWidth / candlesWidthOnScreen;

  const totalCandlesWidth = totalCandleWidth * candles.value.length;
  offset.value.x = -(totalCandlesWidth * scale.value) + props.width * 0.75;

  resizeEventBus.value.onResize(handleResize);

  drawChart(
    props.timeCtx,
    priceCtx.value,
    mainCtx.value,
    props.width,
    props.height,
    mouse.value,
    priceScale.value
  );
});

onUnmounted(() => {
  resizeEventBus.value.offResize(handleResize);
});
</script>
<style scoped>
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

.chart {
  display: flex;
  width: 0;
  position: relative;
}

.chart-content {
  margin-top: 25px;
  position: relative;
}

.chart-main-area {
  position: relative;
}

.chart-indicator-area {
  position: relative;
  border-top: 1px solid #e0e0e0;
  background: #fafafa;
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

.chart-indicators {
  display: block;
  background: #fafafa;
}

.chart-indicator-price {
  display: block;
  background: #f5f5f5;
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
</style>
