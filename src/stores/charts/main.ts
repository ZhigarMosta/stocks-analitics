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
  function drawWicksUnscaled(
    ctx,
    height: number,
    priceScale: number,
    spacing: number,
    offset: { x: number; y: number },
    scale: number
  ) {
    const candelStore = useChartCandelStore();
    const { candles, candleWidth } = storeToRefs(candelStore);
    const priceStore = useChartPriceStore();
    const { scaleYFromPrice } = priceStore;

    candles.value.forEach((c, i) => {
      const x = i * (candleWidth.value + spacing) + candleWidth.value / 2;
      const highY = scaleYFromPrice(c.high, height, priceScale, offset);
      const lowY = scaleYFromPrice(c.low, height, priceScale, offset);
      const color = c.close >= c.open ? "#4caf50" : "#f44336";

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x * scale + offset.x, highY);
      ctx.lineTo(x * scale + offset.x, lowY);
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
    spacing: number,
    offset: { x: number; y: number },
    scale: number
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
    context.translate(offset.x, 0);
    context.scale(scale, 1);

    drawLevels(context, width, height, priceScale, offset);
    drawCandlesBodiesOnly(context, height, priceScale, spacing, offset);
    drawVolumes(context, height, spacing);
    drawEMA(context, false, height, priceScale, spacing, offset);

    context.restore();

    drawHoverDate(context, height, width, mouse, spacing, offset, scale);
    drawWicksUnscaled(context, height, priceScale, spacing, offset, scale);
    drawHoverLine(context, width, height, mouse, priceScale, offset);

    drawPriceScale(priceCtx, height, mouse, priceScale, offset);
    drawHoverPriceLine(
      context,
      width,
      height,
      mouse,
      priceScale,
      spacing,
      offset,
      scale
    );
    drawHoverHighLowLine(
      context,
      height,
      priceScale,
      mouse,
      spacing,
      offset,
      scale
    );
    drawTimeAxis(width, candleWidth, spacing, offset, scale, candles, timeCtx);
  }

  return {
    drawChart,
  };
});
