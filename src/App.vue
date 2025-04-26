<template>
  <div class="chart-container">
    <canvas
      ref="mainCanvas"
      class="main-canvas"
      :width="width"
      :height="height"
      @mousedown="startPan"
      @mouseup="endPan"
      @mouseleave="endPan"
      @mousemove="onMouseMove"
      @wheel="onMainWheel"
    />

    <canvas
      ref="priceCanvas"
      class="price-canvas"
      :width="priceCanvasWidth"
      :height="height"
      @wheel="onPriceWheel"
    />
  </div>

  <canvas
    ref="timeCanvas"
    class="time-canvas"
    :width="width"
    :height="timeCanvasHeight"
  />
</template>

<script setup>
import { ref, onMounted, watch } from "vue";

const mainCanvas = ref(null);
const priceCanvas = ref(null);
const ctx = ref(null);
const priceCtx = ref(null);

const width = ref(1000);
const height = ref(500);
const priceCanvasWidth = 80;

const mouse = ref({ x: 0, y: 0 });
const levels = ref([100, 107, 110]);
const scale = ref(1);
const offset = ref({ x: 0, y: 0 });
const priceScale = ref(1);
const dragging = ref(false);
const lastMouse = ref({ x: 0, y: 0 });
const candleWidth = ref(8);
const spacing = ref(4);

const centerPrice = ref();
const priceRange = ref();

const timeCanvas = ref(null);
const timeCtx = ref(null);
const timeCanvasHeight = 40;

const candles = ref([
  { time: 1, open: 150, high: 110, low: 95, close: 105, date: "2024-04-25" },
  { time: 2, open: 105, high: 112, low: 102, close: 108, date: "2024-04-26" },
  { time: 3, open: 108, high: 115, low: 107, close: 109, date: "2024-04-27" },
  { time: 4, open: 109, high: 200, low: 105, close: 106, date: "2024-04-28" },
  { time: 5, open: 106, high: 109, low: 100, close: 101, date: "2024-04-29" },
  { time: 6, open: 101, high: 103, low: 97, close: 100, date: "2024-04-30" },
  { time: 7, open: 200, high: 105, low: 98, close: 104, date: "2024-05-01" },
]);

function drawGrid(ctx) {
  ctx.save();
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;

  const stepPxY = 50;
  const stepPrice = stepPxY / priceScale.value;
  const minYPrice = priceFromY(height);
  const maxYPrice = priceFromY(0);
  const firstGridPrice = Math.floor(minYPrice / stepPrice) * stepPrice;

  for (
    let price = firstGridPrice;
    price <= maxYPrice + stepPrice;
    price += stepPrice
  ) {
    const y = scaleYFromPrice(price);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width.value, y);
    ctx.stroke();
  }

  const stepPxX = 100;
  const totalLines = Math.ceil(width.value / stepPxX);

  for (let i = 0; i <= totalLines; i++) {
    const x = i * stepPxX;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height.value);
    ctx.stroke();
  }

  ctx.restore();
}

function drawTimeAxis() {
  const ctx = timeCtx.value;
  if (!ctx) return;

  ctx.clearRect(0, 0, width.value, timeCanvasHeight);
  ctx.font = "12px sans-serif";
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";

  const candleStep = candleWidth.value + spacing.value;
  const visibleStart = -offset.value.x / scale.value;
  const visibleEnd = (width.value - offset.value.x) / scale.value;

  const skip = Math.ceil(60 / (candleWidth.value * scale.value));

  candles.value.forEach((candle, i) => {
    const x = i * candleStep;
    if (x < visibleStart || x > visibleEnd || i % skip !== 0) return;

    const posX = x * scale.value + offset.value.x + candleWidth.value / 2;
    const d = new Date(candle.date);
    const label = d.toLocaleDateString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });

    ctx.fillText(label, posX, 20);
  });

  ctx.strokeStyle = "#ccc";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width.value, 0);
  ctx.stroke();
}

function startPan(e) {
  dragging.value = true;
  lastMouse.value = { x: e.offsetX, y: e.offsetY };
}

function endPan() {
  dragging.value = false;
}

function priceFromY(y) {
  const drawableHeight = height.value - 100;
  const visualCenter = height.value / 2 + offset.value.y;
  const normalized = (visualCenter - y) / (drawableHeight * priceScale.value);
  return centerPrice.value + normalized * priceRange.value;
}
function drawHoverDate(ctx) {
  if (!candles.value.length) return;

  const relativeMouseX = (mouse.value.x - offset.value.x) / scale.value;
  const totalCandleWidth = candleWidth.value + spacing.value;
  const index = Math.floor(relativeMouseX / totalCandleWidth);

  const candle = candles.value[index];
  if (!candle) return;

  const x = index * totalCandleWidth + candleWidth.value / 2;

  const posX = x * scale.value + offset.value.x;

  const label = candle.date || `#${index + 1}`;

  const textWidth = ctx.measureText(label).width;
  const labelX = Math.max(
    5,
    Math.min(width.value - textWidth - 5, posX - textWidth / 2)
  );
  const labelY = height.value - 8;

  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(labelX - 4, labelY - 12, textWidth + 8, 20);
  ctx.fillStyle = "#fff";
  ctx.font = "12px sans-serif";
  ctx.fillText(label, labelX, labelY + 4);
  ctx.restore();
}

function scaleYFromPrice(price) {
  const drawableHeight = height.value - 100;
  const visualCenter = height.value / 2 + offset.value.y;
  const normalized = (price - centerPrice.value) / priceRange.value;
  return visualCenter - normalized * drawableHeight * priceScale.value;
}

watch([scale, priceScale, offset], drawChart);
watch([width, height], () => {
  if (mainCanvas.value) mainCanvas.value.width = width.value;
  if (mainCanvas.value) mainCanvas.value.height = height.value;
  if (priceCanvas.value) priceCanvas.value.height = height.value;
  drawChart();
});
function drawHoverPriceLine(ctx) {
  if (!candles.value.length) return;

  const mouseX = (mouse.value.x - offset.value.x) / scale.value;
  const totalWidth = candleWidth.value + spacing.value;
  const index = Math.floor(mouseX / totalWidth);

  const candle = candles.value[index];
  if (!candle) return;

  const y = scaleYFromPrice(candle.high);

  ctx.strokeStyle = "#ff9900";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  ctx.setLineDash([]);
}
function drawHoverHighLowLine(ctx) {
  if (!candles.value.length) return;

  const relativeMouseX = (mouse.value.x - offset.value.x) / scale.value;
  const totalCandleWidth = candleWidth.value + spacing.value;
  const index = Math.floor(relativeMouseX / totalCandleWidth);

  const candle = candles.value[index];
  if (!candle) return;

  const highY = scaleYFromPrice(candle.high);
  const lowY = scaleYFromPrice(candle.low);

  const distToHigh = Math.abs(mouse.value.y - highY);
  const distToLow = Math.abs(mouse.value.y - lowY);
  const y = distToHigh < distToLow ? highY : lowY;
  const price = distToHigh < distToLow ? candle.high : candle.low;

  const x = index * totalCandleWidth + candleWidth.value / 2;

  ctx.save();
  ctx.strokeStyle = "#cccccc";
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(x * scale.value + offset.value.x, 0);
  ctx.lineTo(x * scale.value + offset.value.x, height.value);
  ctx.stroke();

  //если нужно будет что то отображать возле свечи
  // ctx.fillStyle = "#000";
  // ctx.fillRect(x * scale.value + offset.value.x + 5, y - 10, 60, 20);
  // ctx.fillStyle = "#fff";
  // ctx.font = "12px sans-serif";
  // ctx.fillText(price.toFixed(2), x * scale.value + offset.value.x + 10, y + 4);

  ctx.restore();
}

function drawChart() {
  const context = ctx.value;
  context.clearRect(0, 0, width.value, height.value);

  context.save();

  context.translate(offset.value.x, 0);
  context.scale(scale.value, 1);
  drawLevels(context);
  drawCandlesBodiesOnly(context);
  drawTimeAxis()
  context.restore();

  drawHoverDate(context);
  drawWicksUnscaled(context);
  drawHoverLine(context);
  drawGrid(context);
  drawPriceScale();
  drawHoverPriceLine(context);
  drawHoverHighLowLine(context);
}

function drawCandlesBodiesOnly(ctx) {
  candles.value.forEach((c, i) => {
    const x = i * (candleWidth.value + spacing.value);
    const openY = scaleYFromPrice(c.open);
    const closeY = scaleYFromPrice(c.close);
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(openY - closeY);
    const color = c.close >= c.open ? "#4caf50" : "#f44336";

    ctx.fillStyle = color;
    ctx.fillRect(x, bodyTop, candleWidth.value, Math.max(1, bodyHeight));
  });
}

function drawWicksUnscaled(ctx) {
  candles.value.forEach((c, i) => {
    const x = i * (candleWidth.value + spacing.value) + candleWidth.value / 2;
    const highY = scaleYFromPrice(c.high);
    const lowY = scaleYFromPrice(c.low);
    const color = c.close >= c.open ? "#4caf50" : "#f44336";

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x * scale.value + offset.value.x, highY);
    ctx.lineTo(x * scale.value + offset.value.x, lowY);
    ctx.stroke();
  });
}

function drawLevels(ctx) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "#8888ff";
  ctx.setLineDash([4, 4]);

  levels.value.forEach((price) => {
    const y = scaleYFromPrice(price);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width.value + priceCanvasWidth, y);
    ctx.stroke();
  });

  ctx.setLineDash([]);
  ctx.restore();
}

function getNicePriceStep(range, lines) {
  const roughStep = range / lines;
  const exponent = Math.floor(Math.log10(roughStep));
  const fraction = roughStep / Math.pow(10, exponent);

  let niceFraction;
  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;

  return niceFraction * Math.pow(10, exponent);
}

function drawPriceScale() {
  const context = priceCtx.value;
  context.clearRect(0, 0, priceCanvasWidth, height.value);

  const visiblePriceStart = priceFromY(height.value);
  const visiblePriceEnd = priceFromY(0);
  const visibleRange = visiblePriceEnd - visiblePriceStart;

  const spaceBetweenPrice = 50;
  const approxLineCount = Math.floor(height.value / spaceBetweenPrice);
  const step = getNicePriceStep(visibleRange, approxLineCount);

  const firstPrice = Math.ceil(visiblePriceStart / step) * step;
  const lastPrice = Math.floor(visiblePriceEnd / step) * step;

  for (let price = firstPrice; price <= lastPrice; price += step) {
    const y = scaleYFromPrice(price);
    if (y < 0 || y > height.value) continue;

    context.strokeStyle = "#ccc";
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(priceCanvasWidth, y);
    context.stroke();

    context.fillStyle = "#333";
    context.font = "12px Arial";
    context.textAlign = "right";
    context.fillText(price.toFixed(2), priceCanvasWidth - 5, y + 4);
  }

  const hoveredPrice = priceFromY(mouse.value.y);
  context.strokeStyle = "#888";
  context.beginPath();
  context.moveTo(0, mouse.value.y);
  context.lineTo(priceCanvasWidth, mouse.value.y);
  context.stroke();

  context.fillStyle = "#000";
  context.fillRect(0, mouse.value.y - 10, priceCanvasWidth, 20);

  context.fillStyle = "#fff";
  context.textAlign = "center";
  context.font = "12px Arial";
  context.fillText(
    hoveredPrice.toFixed(2),
    priceCanvasWidth / 2,
    mouse.value.y + 4
  );
}

function drawHoverLine(ctx) {
  ctx.strokeStyle = "#cccccc";
  ctx.beginPath();
  ctx.moveTo(0, mouse.value.y);
  ctx.lineTo(width.value, mouse.value.y);
  ctx.stroke();

  const price = priceFromY(mouse.value.y);
  ctx.fillStyle = "#000";
  ctx.font = "12px sans-serif";
  ctx.fillText(price.toFixed(2), 5, mouse.value.y - 5);
}

function onMainWheel(e) {
  e.preventDefault();
  const zoomFactor = 1.1;
  const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

  if (e.ctrlKey) {
    const worldXBeforeZoom = (e.offsetX - offset.value.x) / scale.value;

    scale.value = Math.max(0.1, Math.min(20, scale.value * delta));

    const worldXAfterZoom = (e.offsetX - offset.value.x) / scale.value;

    const dx = (worldXAfterZoom - worldXBeforeZoom) * scale.value;
    offset.value.x += dx;
  } else {
    candleWidth.value = Math.max(2, candleWidth.value * delta);
    spacing.value = Math.max(1, spacing.value * delta);
  }

  drawChart();
}

function onPriceWheel(e) {
  e.preventDefault();
  const zoomFactor = 1.1;
  const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

  const priceBefore = priceFromY(e.offsetY);
  priceScale.value = Math.min(100, Math.max(0.01, priceScale.value * delta));
  const priceAfter = priceFromY(e.offsetY);
  centerPrice.value += priceBefore - priceAfter;

  drawChart();
}

function onMouseMove(e) {
  mouse.value = { x: e.offsetX, y: e.offsetY };

  if (dragging.value) {
    const dx = e.offsetX - lastMouse.value.x;
    const dy = e.offsetY - lastMouse.value.y;

    offset.value.x += dx;

    const priceDelta =
      ((dy / (height.value - 100)) * priceRange.value) / priceScale.value;
    centerPrice.value += priceDelta;

    lastMouse.value = { x: e.offsetX, y: e.offsetY };
    drawChart();
  } else {
    drawChart();
  }
}
onMounted(() => {
  const highs = candles.value.map((c) => c.high);
  const lows = candles.value.map((c) => c.low);
  centerPrice.value = (Math.max(...highs) + Math.min(...lows)) / 2;
  priceRange.value = Math.max(...highs) - Math.min(...lows);
  if (priceRange.value === 0) priceRange.value = 10;

  ctx.value = mainCanvas.value.getContext("2d");
  priceCtx.value = priceCanvas.value.getContext("2d");
  timeCtx.value = timeCanvas.value.getContext("2d");

  drawChart();
});
</script>

<style scoped>
.chart-container {
  display: flex;
  background: #fff;
  overflow: hidden;
}

.main-canvas {
  display: block;
  background: #ffffff;
  cursor: grab;
}

.price-canvas {
  display: block;
  background: #f0f0f0;
}

.time-canvas {
  display: block;
  background: #f9f9f9;
}
</style>
