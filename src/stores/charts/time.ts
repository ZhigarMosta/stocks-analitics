import { defineStore, storeToRefs } from "pinia";
import { Ref } from "vue";
import { useChartCandelStore } from "./candel";
import { ICandel } from "../user/user";

export const TIME_CANVAS_HEIGHT = 40;

export const useChartTimeStore = defineStore("chartTime", () => {
  function drawTimeAxis(
    width: number,
    candleWidth: number,
    spacing: number,
    offset: { x: number; y: number },
    scale: number,
    candles: Array<ICandel>,
    timeCtx
  ) {
    const ctx = timeCtx;

    if (!ctx) return;

    ctx.clearRect(0, 0, width, TIME_CANVAS_HEIGHT);
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "#000";
    ctx.textAlign = "center";

    const candleStep = candleWidth + spacing;
    const visibleStart = -offset.x / scale;
    const visibleEnd = (width - offset.x) / scale;

    const skip = Math.ceil(60 / (candleWidth * scale));

    candles.forEach((candle, i) => {
      const x = i * candleStep;
      if (x < visibleStart || x > visibleEnd || i % skip !== 0) return;

      const posX = x * scale + offset.x + candleWidth / 2;
      const d = new Date(candle.date);
      const label = d.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      });

      ctx.fillText(label, posX, 20);
    });
  }

  function drawHoverDate(
    ctx,
    height: number,
    width: number,
    mouse: { x: number; y: number },
    spacing: number,
    offset: { x: number; y: number },
    scale: number,
    candleWidth: number,
    candles: Array<ICandel>
  ) {
    if (!candles.length) return;

    const relativeMouseX = (mouse.x - offset.x) / scale;
    const totalCandleWidth = candleWidth + spacing;
    const index = Math.floor(relativeMouseX / totalCandleWidth);

    const candle = candles[index];
    if (!candle) return;

    const x = index * totalCandleWidth + candleWidth / 2;
    const posX = x * scale + offset.x;
    const label = candle.date || `#${index + 1}`;

    const textWidth = ctx.measureText(label).width;
    const labelX = Math.max(
      5,
      Math.min(width - textWidth - 5, posX - textWidth / 2)
    );
    const labelY = height - 8;

    ctx.save();
    ctx.fillStyle = "#000";
    ctx.fillRect(labelX - 4, labelY - 12, textWidth + 8, 20);
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.fillText(label, labelX, labelY + 4);
    ctx.restore();
  }

  function drawHoverHighLowLine(
    ctx,
    height: number,
    priceScale: number,
    mouse: { x: number; y: number },
    spacing: number,
    offset: { x: number; y: number },
    scale: number,
    candleWidth: number,
    candles: Array<ICandel>
  ) {
    // const priceStore = useChartPriceStore();
    // const { scaleYFromPrice } = priceStore;

    if (!candles.length) return;

    const relativeMouseX = (mouse.x - offset.x) / scale;
    const totalCandleWidth = candleWidth + spacing;
    const index = Math.floor(relativeMouseX / totalCandleWidth);

    const candle = candles[index];
    if (!candle) return;

    // const highY = scaleYFromPrice(
    //   candle.high,
    //   height,
    //   priceScale,
    //   offset,
    //   centerPrice
    // );
    // const lowY = scaleYFromPrice(
    //   candle.low,
    //   height,
    //   priceScale,
    //   offset,
    //   centerPrice
    // );

    // const distToHigh = Math.abs(mouse.y - highY);
    // const distToLow = Math.abs(mouse.y - lowY);
    // const y = distToHigh < distToLow ? highY : lowY;
    // const price = distToHigh < distToLow ? candle.high : candle.low;

    const x = index * totalCandleWidth + candleWidth / 2;

    ctx.save();
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x * scale + offset.x, 0);
    ctx.lineTo(x * scale + offset.x, height);
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
    drawTimeAxis,
    drawHoverDate,
    drawHoverHighLowLine,
  };
});
