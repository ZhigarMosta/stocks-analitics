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
          @mousemove="(e) => onMouseMove(e ,timeCtx)"
          @wheel="(e) => onMainWheel(e, timeCtx)"
          @contextmenu.prevent="onCanvasContextMenu"
        />
        <canvas
          ref="priceCanvas"
          class="chart-price"
          :width="PRICE_CANVAS_WIDTH"
          :height="height"
          @wheel="(e) => onPriceWheel(e, timeCtx)"
          @mousedown="startPriceScaleDrag"
          @mousemove="(e) => onPriceScaleDrag(e, timeCtx)"
          @mouseup="endPriceScaleDrag"
          @mouseleave="endPriceScaleDrag"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChartCandelStore } from "@/stores/charts/candel";
import { useDragStore } from "@/stores/charts/drag";
import { useChartEmaStore } from "@/stores/charts/ema";
import { useChartMainStore } from "@/stores/charts/main";
import { PRICE_CANVAS_WIDTH, useChartPriceStore } from "@/stores/charts/price";
import { useInstrumentStore } from "@/stores/instruments/main";
import { storeToRefs } from "pinia";
import { onMounted, Ref, watch } from "vue";

const props = defineProps<{
  timeCtx: Ref;
}>();

const storeChartMain = useChartMainStore();
const { width, height, spacing, offset, scale, ctx, mainCanvas } =
  storeToRefs(storeChartMain);
const { drawChart, onMainWheel, onMouseMove, startPan, endPan } =
  storeChartMain;
const storeDrag = useDragStore();
const { startPriceScaleDrag } = storeDrag;
const priceChart = useChartPriceStore();
const { centerPrice, priceRange, priceCanvas, priceCtx } =
  storeToRefs(priceChart);
const { onPriceWheel, onPriceScaleDrag, endPriceScaleDrag } = priceChart;
const candelChart = useChartCandelStore();
const { candleWidth, candles } = storeToRefs(candelChart);
const emaStore = useChartEmaStore();
const { isClickOnEMA } = emaStore;
const instrumentStore = useInstrumentStore();
const { onAddInstrument } = instrumentStore;

function onCanvasContextMenu(e) {
  const rect = mainCanvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isClickOnEMA(x, y)) {
    e.preventDefault();
    console.log("hello - EMA clicked!");
    return;
  }

  onAddInstrument(e);
}

// watch([scale, offset], drawChart);
watch([width, height], () => {
  if (mainCanvas.value) mainCanvas.value.width = width.value;
  if (mainCanvas.value) mainCanvas.value.height = height.value;
  if (priceCanvas.value) priceCanvas.value.height = height.value;
  drawChart(props.timeCtx);
});

onMounted(() => {
  const highs = candles.value.map((c) => c.high);
  const lows = candles.value.map((c) => c.low);
  centerPrice.value = (Math.max(...highs) + Math.min(...lows)) / 2;
  priceRange.value = Math.max(...highs) - Math.min(...lows);
  if (priceRange.value === 0) priceRange.value = 10;

  ctx.value = mainCanvas.value.getContext("2d");
  priceCtx.value = priceCanvas.value.getContext("2d");

  const visibleCandles = 10;
  const totalCandleWidth = candleWidth.value + spacing.value;
  const candlesWidthOnScreen = totalCandleWidth * visibleCandles;

  const halfScreenWidth = width.value / 2;
  scale.value = halfScreenWidth / candlesWidthOnScreen;

  const totalCandlesWidth = totalCandleWidth * candles.value.length;
  offset.value.x = -(totalCandlesWidth * scale.value) + width.value * 0.75;
  console.log(props.timeCtx);

  drawChart(props.timeCtx);
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
