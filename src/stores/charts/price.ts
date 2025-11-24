import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useChartMainStore } from "./main";
import { useChartCandelStore } from "./candel";
import { useDragStore } from "./drag";

export const PRICE_CANVAS_WIDTH = 80;

export const useChartPriceStore = defineStore("chartPrice", () => {
  const priceScale = ref(1);
  const centerPrice = ref();
  const priceRange = ref();
  const priceCanvas = ref(null);
  const priceCtx = ref(null);

  function scaleYFromPrice(price) {
    const mainChart = useChartMainStore();
    const { offset, height } = storeToRefs(mainChart);

    const drawableHeight = height.value - 100;
    const visualCenter = height.value / 2 + offset.value.y;
    const normalized = (price - centerPrice.value) / priceRange.value;
    return visualCenter - normalized * drawableHeight * priceScale.value;
  }

  function priceFromY(y) {
    const mainChart = useChartMainStore();
    const { offset, height } = storeToRefs(mainChart);

    const drawableHeight = height.value - 100;
    const visualCenter = height.value / 2 + offset.value.y;
    const normalized = (visualCenter - y) / (drawableHeight * priceScale.value);
    return centerPrice.value + normalized * priceRange.value;
  }

  function drawHoverHighLowLine(ctx) {
    const candelChart = useChartCandelStore();
    const { candleWidth, candles } = storeToRefs(candelChart);
    const mainChart = useChartMainStore();
    const { offset, height, mouse, spacing, scale } = storeToRefs(mainChart);

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
    const mainChart = useChartMainStore();
    const { height, mouse } = storeToRefs(mainChart);

    const context = priceCtx.value;

    context.clearRect(0, 0, PRICE_CANVAS_WIDTH, height.value);

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
      context.lineTo(PRICE_CANVAS_WIDTH, y);
      context.stroke();

      context.fillStyle = "#333";
      context.font = "12px Arial";
      context.textAlign = "right";
      context.fillText(price.toFixed(2), PRICE_CANVAS_WIDTH - 5, y + 4);
    }

    const hoveredPrice = priceFromY(mouse.value.y);
    context.strokeStyle = "#888";
    context.beginPath();
    context.moveTo(0, mouse.value.y);
    context.lineTo(PRICE_CANVAS_WIDTH, mouse.value.y);
    context.stroke();

    context.fillStyle = "#000";
    context.fillRect(0, mouse.value.y - 10, PRICE_CANVAS_WIDTH, 20);

    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.font = "12px Arial";
    context.fillText(
      hoveredPrice.toFixed(2),
      PRICE_CANVAS_WIDTH / 2,
      mouse.value.y + 4
    );
  }

  function onPriceWheel(e, timeCtx) {
    const mainChart = useChartMainStore();
    const { height } = storeToRefs(mainChart);
    const { drawChart } = mainChart;

    e.preventDefault();
    const zoomFactor = 1.1;
    const delta = e.deltaY < 0 ? zoomFactor : 1 / zoomFactor;

    const centerY = height.value / 2;
    const priceBefore = priceFromY(centerY);

    priceScale.value = Math.min(100, Math.max(0.01, priceScale.value * delta));

    const priceAfter = priceFromY(centerY);
    centerPrice.value += priceBefore - priceAfter;

    drawChart(timeCtx);
  }

  function onPriceScaleDrag(e, timeCtx) {
    const drag = useDragStore();
    const { scalingPriceByDrag } = storeToRefs(drag);
    const mainChart = useChartMainStore();
    const { height, lastMouse } = storeToRefs(mainChart);
    const { drawChart } = mainChart;

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

    drawChart(timeCtx);
  }

  function drawHoverPriceLine(ctx) {
    const candelChart = useChartCandelStore();
    const { candleWidth, candles } = storeToRefs(candelChart);
    const mainChart = useChartMainStore();
    const { offset, mouse, spacing, scale, width } = storeToRefs(mainChart);

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

  function drawHoverLine(ctx) {
    const mainChart = useChartMainStore();
    const { mouse, width } = storeToRefs(mainChart);

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

  function endPriceScaleDrag() {
    const storeDrag = useDragStore();
    const { scalingPriceByDrag } = storeToRefs(storeDrag);
    scalingPriceByDrag.value = false;
  }

  return {
    priceScale,
    centerPrice,
    priceRange,
    priceCanvas,
    priceCtx,
    scaleYFromPrice,
    priceFromY,
    drawHoverHighLowLine,
    drawPriceScale,
    onPriceWheel,
    drawHoverPriceLine,
    drawHoverLine,
    onPriceScaleDrag,
    endPriceScaleDrag,
  };
});
