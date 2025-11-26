import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useLevelStore } from "../instruments/level";
import { useChartCandelStore } from "./candel";
import { useChartPriceStore } from "./price";
import { useChartVolumeStore } from "./volume";
import { useChartEmaStore } from "./ema";
import { useChartTimeStore } from "./time";
import { useDragStore } from "./drag";

export const TIME_CANVAS_HEIGHT = 40;

export const useChartMainStore = defineStore("chartMain", () => {
  const ctx = ref(null);
  const spacing = ref(4);
  const width = ref(500);
  const height = ref(500);
  const offset = ref({ x: 0, y: 0 });
  const mouse = ref({ x: 0, y: 0 });
  const scale = ref(1);
  const lastMouse = ref({ x: 0, y: 0 });
  const mainCanvas = ref(null);

  function drawWicksUnscaled(ctx) {
    const candelStore = useChartCandelStore();
    const { candles, candleWidth } = storeToRefs(candelStore);
    const priceStore = useChartPriceStore();
    const { scaleYFromPrice } = priceStore;

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

  function drawChart(timeCtx, priceCtx, mainCtx) {
    const levelStore = useLevelStore();
    const { drawLevels } = levelStore;
    const candelStore = useChartCandelStore();
    const { drawCandlesBodiesOnly } = candelStore;
    const { candleWidth, candles } = storeToRefs(candelStore);
    const volumeStore = useChartVolumeStore();
    const { drawVolumes } = volumeStore;
    const emaStore = useChartEmaStore();
    const { drawEMA } = emaStore;
    const timeStore = useChartTimeStore();
    const { drawTimeAxis, drawHoverDate, drawHoverHighLowLine } = timeStore;
    const priceStore = useChartPriceStore();
    const { drawPriceScale, drawHoverPriceLine, drawHoverLine } = priceStore;

    const context = mainCtx;
    context.clearRect(0, 0, width.value, height.value);

    context.save();
    context.translate(offset.value.x, 0);
    context.scale(scale.value, 1);

    drawLevels(context);
    drawCandlesBodiesOnly(context);
    drawVolumes(context);
    drawEMA(context, height.value);

    context.restore();

    drawHoverDate(context, height);
    drawWicksUnscaled(context);
    drawHoverLine(context);
    // console.trace(priceCtx);

    drawPriceScale(priceCtx);
    drawHoverPriceLine(context);
    drawHoverHighLowLine(context);
    drawTimeAxis(width, candleWidth, spacing, offset, scale, candles, timeCtx);
  }

  function onMainWheel(e, timeCtx, priceCtx, mainCtx) {
    const candelStore = useChartCandelStore();
    const { candleWidth, candles } = storeToRefs(candelStore);

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

      const totalGraphWidth =
        candles.value.length * newTotalWidth * scale.value;
      const minOffsetX = Math.min(width.value - totalGraphWidth, 0);
      offset.value.x = Math.max(minOffsetX, offset.value.x);
    }

    clampHorizontalOffset();

    drawChart(timeCtx, priceCtx, mainCtx);
  }

  function onMouseMove(e, timeCtx, priceCtx, mainCtx) {
    const priceChart = useChartPriceStore();
    const { priceScale, centerPrice, priceRange } = storeToRefs(priceChart);
    const storeDrag = useDragStore();
    const { dragging } = storeToRefs(storeDrag);

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

    drawChart(timeCtx, priceCtx, mainCtx);
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

  function startPan(e) {
    const storeDrag = useDragStore();
    const { dragging } = storeToRefs(storeDrag);
    dragging.value = true;
    lastMouse.value = { x: e.offsetX, y: e.offsetY };
  }

  function endPan() {
    const storeDrag = useDragStore();
    const { dragging } = storeToRefs(storeDrag);
    dragging.value = false;
  }

  return {
    width,
    height,
    spacing,
    offset,
    mouse,
    scale,
    lastMouse,
    ctx,
    mainCanvas,
    drawChart,
    onMainWheel,
    onMouseMove,
    startPan,
    endPan,
  };
});
