import { defineStore, storeToRefs } from "pinia";
import { Ref, ref } from "vue";
import { useLevelStore } from "../instruments/level";
import { useChartCandelStore } from "./candel";
import { useChartPriceStore } from "./price";
import { useChartVolumeStore } from "./volume";
import { useChartEmaStore } from "./ema";
import { useChartTimeStore } from "./time";

export const TIME_CANVAS_HEIGHT = 40;

export const useChartMainStore = defineStore("chartMain", () => {
  const offset = ref({ x: 0, y: 0 });
  const scale = ref(1);

  function drawWicksUnscaled(
    ctx,
    height: number,
    priceScale: number,
    spacing: number
  ) {
    const candelStore = useChartCandelStore();
    const { candles, candleWidth } = storeToRefs(candelStore);
    const priceStore = useChartPriceStore();
    const { scaleYFromPrice } = priceStore;

    candles.value.forEach((c, i) => {
      const x = i * (candleWidth.value + spacing) + candleWidth.value / 2;
      const highY = scaleYFromPrice(c.high, height, priceScale);
      const lowY = scaleYFromPrice(c.low, height, priceScale);
      const color = c.close >= c.open ? "#4caf50" : "#f44336";

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x * scale.value + offset.value.x, highY);
      ctx.lineTo(x * scale.value + offset.value.x, lowY);
      ctx.stroke();
    });
  }

  function drawChart(
    timeCtx,
    priceCtx,
    mainCtx,
    width: number,
    height: number,
    mouse: { x: number; y: number },
    priceScale: number,
    spacing: number
  ) {
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
    context.clearRect(0, 0, width, height);

    context.save();
    context.translate(offset.value.x, 0);
    context.scale(scale.value, 1);

    drawLevels(context, width, height, priceScale);
    drawCandlesBodiesOnly(context, height, priceScale, spacing);
    drawVolumes(context, height, spacing);
    drawEMA(context, false, height, priceScale, spacing);

    context.restore();

    drawHoverDate(context, height, width, mouse, spacing);
    drawWicksUnscaled(context, height, priceScale, spacing);
    drawHoverLine(context, width, height, mouse, priceScale);

    drawPriceScale(priceCtx, height, mouse, priceScale);
    drawHoverPriceLine(context, width, height, mouse, priceScale, spacing);
    drawHoverHighLowLine(context, height, priceScale, mouse, spacing);
    drawTimeAxis(width, candleWidth, spacing, offset, scale, candles, timeCtx);
  }

  return {
    offset,
    scale,
    drawChart,
  };
});
