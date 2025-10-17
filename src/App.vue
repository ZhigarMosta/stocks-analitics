<template>
  <div class="chart-wrapper-with-resizers" :style="containerStyle">
    <div class="chart" 
      :height="height">
      <div
        class="chart-drag-layer"
        ref="chartContainer"
        :style="{ width: (width + widthInstrumentsAndPrice) + 'px' }"
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
      <div class="chart-content">
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
            @wheel="onMainWheel"
            @contextmenu.prevent="onCanvasContextMenu"
          />
          <canvas
            ref="priceCanvas"
            class="chart-price"
            :width="priceCanvasWidth"
            :height="height"
            @wheel="onPriceWheel"
            @mousedown="startPriceScaleDrag"
            @mousemove="onPriceScaleDrag"
            @mouseup="endPriceScaleDrag"
            @mouseleave="endPriceScaleDrag"
          />
        </div>
        <canvas
          ref="timeCanvas"
          class="time-canvas"
          :width="width"
          :height="timeCanvasHeight"
        />
      </div>
    </div>
    
    <!-- Ресайзеры вокруг всего .chart -->
    <div class="resizer resizer-top" @mousedown="startResize('top', $event)"></div>
    <div class="resizer resizer-right" :style="{ right: (-width - widthInstrumentsAndPrice - 8) + 'px' }" @mousedown="startResize('right', $event)"></div>
    <div class="resizer resizer-bottom" :style="{ right: (-width - widthInstrumentsAndPrice - 8) + 'px' }" @mousedown="startResize('bottom', $event)"></div>
    <div class="resizer resizer-left" @mousedown="startResize('left', $event)"></div>
    <!-- Угловые ресайзеры -->
    <div class="resizer resizer-top-left" @mousedown="startResize('top-left', $event)"></div>
    <div class="resizer resizer-top-right" :style="{ right: (-width - widthInstrumentsAndPrice - 8) + 'px' }" @mousedown="startResize('top-right', $event)"></div> 
    <div class="resizer resizer-bottom-left" @mousedown="startResize('bottom-left', $event)"></div>
    <div class="resizer resizer-bottom-right" :style="{ right: (-width - widthInstrumentsAndPrice - 8) + 'px' }" @mousedown="startResize('bottom-right', $event)"></div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed } from "vue";

// drag
const chartContainer = ref(null);
const containerPosition = ref({ x: 0, y: 0 });
const isDraggingContainer = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const widthInstrumentsAndPrice = 160;
// ресайз
const isResizing = ref(false);
const resizeDirection = ref('');
const resizeStart = ref({ x: 0, y: 0 });
const startSize = ref({ width: 0, height: 0 });

const mainCanvas = ref(null);
const priceCanvas = ref(null);
const ctx = ref(null);
const priceCtx = ref(null);

const width = ref(500);
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
const scalingPriceByDrag = ref(false);

enum Instruments {
  LVL = 1,
}
const instrimentActiv = ref(null);

const candles = ref([
  {
    time: 1,
    open: 150,
    high: 110,
    low: 95,
    close: 105,
    date: "2024-04-25",
    volume: 1000,
  },
  {
    time: 2,
    open: 105,
    high: 112,
    low: 102,
    close: 108,
    date: "2024-04-26",
    volume: 2000,
  },
  {
    time: 3,
    open: 108,
    high: 115,
    low: 107,
    close: 109,
    date: "2024-04-27",
    volume: 500,
  },
  {
    time: 4,
    open: 109,
    high: 200,
    low: 105,
    close: 106,
    date: "2024-04-28",
    volume: 4000,
  },
  {
    time: 5,
    open: 106,
    high: 109,
    low: 100,
    close: 101,
    date: "2024-04-29",
    volume: 6000,
  },
  {
    time: 6,
    open: 101,
    high: 103,
    low: 97,
    close: 100,
    date: "2024-04-30",
    volume: 2000,
  },
  {
    time: 7,
    open: 200,
    high: 200,
    low: 98,
    close: 104,
    date: "2024-05-01",
    volume: 1000,
  },
  {
    time: 3,
    open: 18,
    high: 18,
    low: 17,
    close: 19,
    date: "2024-05-02",
    volume: 500,
  },
  {
    time: 4,
    open: 55,
    high: 55,
    low: 23,
    close: 11,
    date: "2024-05-03",
    volume: 4000,
  },
  {
    time: 5,
    open: 106,
    high: 109,
    low: 100,
    close: 101,
    date: "2024-05-04",
    volume: 6000,
  },
  {
    time: 6,
    open: 101,
    high: 103,
    low: 97,
    close: 100,
    date: "2024-05-06",
    volume: 2000,
  },
  {
    time: 7,
    open: 200,
    high: 200,
    low: 98,
    close: 104,
    date: "2024-05-07",
    volume: 1000,
  },
  {
    time: 3,
    open: 18,
    high: 18,
    low: 17,
    close: 19,
    date: "2024-05-02",
    volume: 500,
  },
  {
    time: 4,
    open: 55,
    high: 55,
    low: 23,
    close: 11,
    date: "2024-05-03",
    volume: 4000,
  },
  {
    time: 5,
    open: 106,
    high: 109,
    low: 100,
    close: 101,
    date: "2024-05-04",
    volume: 6000,
  },
  {
    time: 6,
    open: 101,
    high: 103,
    low: 97,
    close: 100,
    date: "2024-05-06",
    volume: 20000,
  },
  {
    time: 7,
    open: 150,
    high: 200,
    low: 98,
    close: 50,
    date: "2024-05-07",
    volume: 1000,
  },
]);

//drag
const containerStyle = computed(() => ({
  transform: `translate(${containerPosition.value.x}px, ${containerPosition.value.y}px)`,
}));

// ресайз
// Функции для ресайза
function startResize(direction, e) {
  e.preventDefault();
  e.stopPropagation();
  
  isResizing.value = true;
  resizeDirection.value = direction;
  resizeStart.value = { x: e.clientX, y: e.clientY };
  startSize.value = { width: width.value, height: height.value };
  
  document.addEventListener("mousemove", onResizeMove);
  document.addEventListener("mouseup", stopResize);
}
function onResizeMove(e) {
  if (!isResizing.value) return;
  
  const dx = e.clientX - resizeStart.value.x;
  const dy = e.clientY - resizeStart.value.y;
  
  let newWidth = startSize.value.width;
  let newHeight = startSize.value.height;
  let newX = containerPosition.value.x;
  let newY = containerPosition.value.y;
  
  switch (resizeDirection.value) {
    case 'top':
      newHeight = Math.max(200, startSize.value.height - dy);
      newY = containerPosition.value.y + dy;
      break;
    case 'right':
      newWidth = Math.max(300, startSize.value.width + dx);
      break;
    case 'bottom':
      newHeight = Math.max(200, startSize.value.height + dy);
      break;
    case 'left':
      newWidth = Math.max(300, startSize.value.width - dx);
      newX = containerPosition.value.x + dx;
      break;
    case 'top-left':
      newWidth = Math.max(300, startSize.value.width - dx);
      newHeight = Math.max(200, startSize.value.height - dy);
      newX = containerPosition.value.x + dx;
      newY = containerPosition.value.y + dy;
      break;
    case 'top-right':
      newWidth = Math.max(300, startSize.value.width + dx);
      newHeight = Math.max(200, startSize.value.height - dy);
      newY = containerPosition.value.y + dy;
      break;
    case 'bottom-left':
      newWidth = Math.max(300, startSize.value.width - dx);
      newHeight = Math.max(200, startSize.value.height + dy);
      newX = containerPosition.value.x + dx;
      break;
    case 'bottom-right':
      newWidth = Math.max(300, startSize.value.width + dx);
      newHeight = Math.max(200, startSize.value.height + dy);
      break;
  }
  
  width.value = newWidth;
  height.value = newHeight;
  containerPosition.value.x = newX;
  containerPosition.value.y = newY;
  
  drawChart();
}

function stopResize() {
  isResizing.value = false;
  document.removeEventListener("mousemove", onResizeMove);
  document.removeEventListener("mouseup", stopResize);
}

// Функции для перемещения контейнера
function startContainerDrag(e) {
  if (e.button !== 0) return; // Только левая кнопка мыши
  isDraggingContainer.value = true;
  dragStart.value = { x: e.clientX, y: e.clientY };
  document.addEventListener("mousemove", onContainerDrag);
  document.addEventListener("mouseup", stopContainerDrag);
}

function onContainerDrag(e) {
  if (!isDraggingContainer.value) return;

  const dx = e.clientX - dragStart.value.x;
  const dy = e.clientY - dragStart.value.y;

  containerPosition.value.x += dx;
  containerPosition.value.y += dy;

  dragStart.value = { x: e.clientX, y: e.clientY };
}

function stopContainerDrag() {
  isDraggingContainer.value = false;
  document.removeEventListener("mousemove", onContainerDrag);
  document.removeEventListener("mouseup", stopContainerDrag);
}

// EMA
function drawEMA(ctx: CanvasRenderingContext2D) {
  if (!candles.value.length) return;

  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000";
  ctx.beginPath();

  const stepX = candleWidth.value + spacing.value;

  candles.value.forEach((candle, i) => {
    const x = i * stepX + candleWidth.value / 2;
    const y = scaleYFromPrice(candle.close);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
  ctx.restore();
}

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
  if (timeCanvas.value) timeCanvas.value.width = width.value;
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

  // Если нужно будет что то отображать возле свечи
  // ctx.fillStyle = "#000";
  // ctx.fillRect(x * scale.value + offset.value.x + 5, y - 10, 60, 20);
  // ctx.fillStyle = "#fff";
  // ctx.font = "12px sans-serif";
  // ctx.fillText(price.toFixed(2), x * scale.value + offset.value.x + 10, y + 4);

  ctx.restore();
}
function drawVolumes(ctx) {
  const maxVolume = Math.max(...candles.value.map((c) => c.volume));
  const volumeAreaHeight = 100;
  const volumeTop = height.value - volumeAreaHeight;

  candles.value.forEach((c, i) => {
    const x = i * (candleWidth.value + spacing.value);
    const barWidth = candleWidth.value;
    const barHeight = (c.volume / maxVolume) * (volumeAreaHeight - 20);

    ctx.fillStyle = "#1976d2";
    ctx.fillRect(
      x,
      volumeTop + (volumeAreaHeight - barHeight),
      barWidth,
      barHeight
    );
  });
}

function onAddInstrument(e) {
  if (instrimentActiv.value === Instruments.LVL) {
    addLevls(e);
  }
}

function onSwitchInstrumentToLevels() {
  instrimentActiv.value === Instruments.LVL
    ? (instrimentActiv.value = null)
    : (instrimentActiv.value = Instruments.LVL);
}

function addLevls(e) {
  e.preventDefault();
  levels.value.push(priceFromY(e.offsetY));

  drawChart();
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

function priceFromY(y) {
  const drawableHeight = height.value - 100;
  const visualCenter = height.value / 2 + offset.value.y;
  const normalized = (visualCenter - y) / (drawableHeight * priceScale.value);
  return centerPrice.value + normalized * priceRange.value;
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

function drawChart() {
  const context = ctx.value;
  context.clearRect(0, 0, width.value, height.value);

  context.save();

  context.translate(offset.value.x, 0);
  context.scale(scale.value, 1);
  drawLevels(context);
  drawCandlesBodiesOnly(context);
  // EMA

  drawVolumes(context);
  drawEMA(context);

  context.restore();

  drawHoverDate(context);
  drawWicksUnscaled(context);
  drawHoverLine(context);
  // drawGrid(context);
  drawPriceScale();
  drawHoverPriceLine(context);
  drawHoverHighLowLine(context);
  drawTimeAxis();
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
    const pivotX = width.value;
    const worldPivotBefore = (pivotX - offset.value.x) / scale.value;

    candleWidth.value = Math.max(2, candleWidth.value * delta);
    spacing.value = Math.max(1, spacing.value * delta);
    const newTotalWidth = candleWidth.value + spacing.value;

    const worldPivotAfter = (pivotX - offset.value.x) / scale.value;
    const deltaWorldPivot = worldPivotAfter - worldPivotBefore;
    offset.value.x += deltaWorldPivot * scale.value;

    const totalGraphWidth = candles.value.length * newTotalWidth * scale.value;
    const minOffsetX = Math.min(width.value - totalGraphWidth, 0);
    offset.value.x = Math.max(minOffsetX, offset.value.x);
  }

  clampHorizontalOffset();

  drawChart();
}

function onPriceWheel(e) {
  e.preventDefault();
  const zoomFactor = 1.1;
  const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

  const centerY = height.value / 2;
  const priceBefore = priceFromY(centerY);

  priceScale.value = Math.min(100, Math.max(0.01, priceScale.value * delta));

  const priceAfter = priceFromY(centerY);
  centerPrice.value += priceBefore - priceAfter;

  drawChart();
}

function startPan(e) {
  dragging.value = true;
  lastMouse.value = { x: e.offsetX, y: e.offsetY };
}

function endPan() {
  dragging.value = false;
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

    clampHorizontalOffset();
  }

  drawChart();
}

function startPriceScaleDrag(e) {
  scalingPriceByDrag.value = true;
  lastMouse.value = { x: e.offsetX, y: e.offsetY };
}

function onPriceScaleDrag(e) {
  if (!scalingPriceByDrag.value) return;

  const dy = e.offsetY - lastMouse.value.y;

  const zoomFactor = 1.038; // чувствительность
  const delta = dy > 0 ? 1 / zoomFactor : zoomFactor;

  const centerY = height.value / 2;

  const priceBefore = priceFromY(centerY);
  priceScale.value = Math.max(0.01, Math.min(100, priceScale.value * delta));
  const priceAfter = priceFromY(centerY);

  centerPrice.value += priceBefore - priceAfter;
  lastMouse.value = { x: e.offsetX, y: e.offsetY };

  drawChart();
}

function endPriceScaleDrag() {
  scalingPriceByDrag.value = false;
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

  const visibleCandles = 10;
  const totalCandleWidth = candleWidth.value + spacing.value;
  const candlesWidthOnScreen = totalCandleWidth * visibleCandles;

  const halfScreenWidth = width.value / 2;
  scale.value = halfScreenWidth / candlesWidthOnScreen;

  const totalCandlesWidth = totalCandleWidth * candles.value.length;
  offset.value.x = -(totalCandlesWidth * scale.value) + width.value * 0.75;

  drawChart();
});

function clampHorizontalOffset() {
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

function onCanvasContextMenu(e) {
  const rect = mainCanvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  if (isClickOnEMA(x, y)) {
    e.preventDefault();
    console.log("hello - EMA clicked!");
    return;
  }

  // Если не на EMA, то выполняем оригинальную логику
  onAddInstrument(e);
}

// Вспомогательная функция для проверки клика на линии EMA
function isClickOnEMA(x, y, threshold = 5) {
  if (!candles.value.length) return false;

  const stepX = candleWidth.value + spacing.value;

  for (let i = 0; i < candles.value.length - 1; i++) {
    const currentCandle = candles.value[i];
    const nextCandle = candles.value[i + 1];

    const x1 = i * stepX + candleWidth.value / 2;
    const y1 = scaleYFromPrice(currentCandle.close);

    const x2 = (i + 1) * stepX + candleWidth.value / 2;
    const y2 = scaleYFromPrice(nextCandle.close);

    const transformedX1 = x1 * scale.value + offset.value.x;
    const transformedX2 = x2 * scale.value + offset.value.x;

    if (
      isPointNearLine(x, y, transformedX1, y1, transformedX2, y2, threshold)
    ) {
      return true;
    }
  }

  return false;
}

// Функция для проверки близости точки к линии
function isPointNearLine(px, py, x1, y1, x2, y2, threshold) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;

  return Math.sqrt(dx * dx + dy * dy) < threshold;
}
</script>

<style scoped>
.chart-wrapper-with-resizers {
  display: inline-block;
  position: relative;
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
  right: -6px;
  top: 8px;
  bottom: 8px;
  width: 12px;
  cursor: e-resize;
}

.resizer-bottom {
  bottom: -6px;
  left: 8px;
  right: 8px;
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
</style>
