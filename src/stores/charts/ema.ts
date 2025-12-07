import { defineStore, storeToRefs } from "pinia";
import { useChartCandelStore } from "./candel";
import { useChartMainStore } from "./main";
import { useChartPriceStore } from "./price";

export const useChartEmaStore = defineStore("chartEma", () => {
  function drawEMA(
    ctx: CanvasRenderingContext2D,
    isIndicatorArea = false,
    height: number,
    priceScale: number,
    spacing: number,
    offset: { x: number; y: number },
    candleWidth: number,
    centerPrice: number
  ) {
    const candelStore = useChartCandelStore();
    const { candles } = storeToRefs(candelStore);
    const mainPrice = useChartPriceStore();
    const { scaleYFromPrice } = mainPrice;

    if (!candles.value.length) return;

    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = isIndicatorArea ? "#FF6B6B" : "#000";
    ctx.beginPath();

    const stepX = candleWidth + spacing;

    candles.value.forEach((candle, i) => {
      const x = i * stepX + candleWidth / 2;
      let y;

      y = scaleYFromPrice(
        candle.close,
        height,
        priceScale,
        offset,
        centerPrice
      );

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.restore();
  }

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

  function isClickOnEMA(
    x,
    y,
    threshold = 5,
    height: number,
    priceScale: number,
    spacing: number,
    offset: { x: number; y: number },
    scale: number,
    candleWidth: number,
    centerPrice: number
  ) {
    const candelStore = useChartCandelStore();
    const { candles } = storeToRefs(candelStore);
    const mainPrice = useChartPriceStore();
    const { scaleYFromPrice } = mainPrice;

    if (!candles.value.length) return false;

    const stepX = candleWidth + spacing;

    for (let i = 0; i < candles.value.length - 1; i++) {
      const currentCandle = candles.value[i];
      const nextCandle = candles.value[i + 1];

      const x1 = i * stepX + candleWidth / 2;
      const y1 = scaleYFromPrice(
        currentCandle.close,
        height,
        priceScale,
        offset,
        centerPrice
      );

      const x2 = (i + 1) * stepX + candleWidth / 2;
      const y2 = scaleYFromPrice(
        nextCandle.close,
        height,
        priceScale,
        offset,
        centerPrice
      );

      const transformedX1 = x1 * scale + offset.x;
      const transformedX2 = x2 * scale + offset.x;

      if (
        isPointNearLine(x, y, transformedX1, y1, transformedX2, y2, threshold)
      ) {
        return true;
      }
    }

    return false;
  }

  return {
    drawEMA,
    isClickOnEMA,
    isPointNearLine,
  };
});
