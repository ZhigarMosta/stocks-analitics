import { createPinia, defineStore, storeToRefs } from "pinia";
import { Ref, ref } from "vue";
import { useChartMainStore } from "./main";
import { useChartCandelStore } from "./candel";
import { useChartPriceStore } from "./price";

export const TIME_CANVAS_HEIGHT = 40;

export const useChartTimeStore = defineStore("chartTime", () => {
  const timeCanvas = ref(null);
  const timeCtx = ref(null);

  function drawTimeAxis(
    width: Ref,
    candleWidth: Ref,
    spacing: Ref,
    offset: Ref,
    scale: Ref,
    candles: Ref
  ) {
    const ctx = timeCtx.value;
    if (!ctx) return;

    ctx.clearRect(0, 0, width.value, TIME_CANVAS_HEIGHT);
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
  }

  function drawHoverDate(ctx, mainAreaHeight) {
    const mainStore = useChartMainStore();
    const { mouse, offset, spacing, scale, width } = storeToRefs(mainStore);
    const candelStore = useChartCandelStore();
    const { candles, candleWidth } = storeToRefs(candelStore);

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
    const labelY = mainAreaHeight.value - 8;

    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(labelX - 4, labelY - 12, textWidth + 8, 20);
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.fillText(label, labelX, labelY + 4);
    ctx.restore();
  }

  function drawHoverHighLowLine(ctx) {
    const mainStore = useChartMainStore();
    const { mouse, offset, spacing, scale, height } = storeToRefs(mainStore);
    const candelStore = useChartCandelStore();
    const { candles, candleWidth } = storeToRefs(candelStore);
    const priceStore = useChartPriceStore();
    const { scaleYFromPrice } = priceStore;

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

  return {
    timeCanvas,
    timeCtx,
    drawTimeAxis,
    drawHoverDate,
    drawHoverHighLowLine,
  };
});
