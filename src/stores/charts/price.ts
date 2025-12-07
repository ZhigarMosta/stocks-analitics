import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useChartMainStore } from "./main";
import { useChartCandelStore } from "./candel";
import { useDragStore } from "./drag";

export const PRICE_CANVAS_WIDTH = 80;

export const useChartPriceStore = defineStore("chartPrice", () => {
  function scaleYFromPrice(
    price,
    height: number,
    priceScale: number,
    offset: { x: number; y: number },
    centerPrice: number,
    priceRange: number
  ) {
    const drawableHeight = height - 100;
    const visualCenter = height / 2 + offset.y;
    const normalized = (price - centerPrice) / priceRange;
    return visualCenter - normalized * drawableHeight * priceScale;
  }

  function priceFromY(
    y,
    height: number,
    priceScale: number,
    offset: { x: number; y: number },
    centerPrice: number,
    priceRange: number
  ) {
    const drawableHeight = height - 100;
    const visualCenter = height / 2 + offset.y;
    const normalized = (visualCenter - y) / (drawableHeight * priceScale);
    return centerPrice + normalized * priceRange;
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
    centerPrice: number,
    priceRange: number
  ) {
    const candelChart = useChartCandelStore();
    const { candles } = storeToRefs(candelChart);

    if (!candles.value.length) return;

    const relativeMouseX = (mouse.x - offset.x) / scale;
    const totalCandleWidth = candleWidth + spacing;
    const index = Math.floor(relativeMouseX / totalCandleWidth);

    const candle = candles.value[index];
    if (!candle) return;

    const highY = scaleYFromPrice(
      candle.high,
      height,
      priceScale,
      offset,
      centerPrice,
      priceRange
    );
    const lowY = scaleYFromPrice(
      candle.low,
      height,
      priceScale,
      offset,
      centerPrice,
      priceRange
    );

    const distToHigh = Math.abs(mouse.y - highY);
    const distToLow = Math.abs(mouse.y - lowY);
    const y = distToHigh < distToLow ? highY : lowY;
    const price = distToHigh < distToLow ? candle.high : candle.low;

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

  function drawPriceScale(
    priceCtx,
    height: number,
    mouse: { x: number; y: number },
    priceScale: number,
    offset: { x: number; y: number },
    centerPrice: number,
    priceRange: number
  ) {
    const context = priceCtx;

    context.clearRect(0, 0, PRICE_CANVAS_WIDTH, height);

    const visiblePriceStart = priceFromY(
      height,
      height,
      priceScale,
      offset,
      centerPrice,
      priceRange
    );
    const visiblePriceEnd = priceFromY(
      0,
      height,
      priceScale,
      offset,
      centerPrice,
      priceRange
    );
    const visibleRange = visiblePriceEnd - visiblePriceStart;

    const spaceBetweenPrice = 50;
    const approxLineCount = Math.floor(height / spaceBetweenPrice);
    const step = getNicePriceStep(visibleRange, approxLineCount);

    const firstPrice = Math.ceil(visiblePriceStart / step) * step;
    const lastPrice = Math.floor(visiblePriceEnd / step) * step;

    for (let price = firstPrice; price <= lastPrice; price += step) {
      const y = scaleYFromPrice(
        price,
        height,
        priceScale,
        offset,
        centerPrice,
        priceRange
      );
      if (y < 0 || y > height) continue;

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

    const hoveredPrice = priceFromY(
      mouse.y,
      height,
      priceScale,
      offset,
      centerPrice,
      priceRange
    );
    context.strokeStyle = "#888";
    context.beginPath();
    context.moveTo(0, mouse.y);
    context.lineTo(PRICE_CANVAS_WIDTH, mouse.y);
    context.stroke();

    context.fillStyle = "#000";
    context.fillRect(0, mouse.y - 10, PRICE_CANVAS_WIDTH, 20);

    context.fillStyle = "#fff";
    context.textAlign = "center";
    context.font = "12px Arial";
    context.fillText(
      hoveredPrice.toFixed(2),
      PRICE_CANVAS_WIDTH / 2,
      mouse.y + 4
    );
  }

  function drawHoverPriceLine(
    ctx,
    width: number,
    height: number,
    mouse: { x: number; y: number },
    priceScale: number,
    spacing: number,
    offset: { x: number; y: number },
    scale: number,
    candleWidth: number,
    centerPrice: number,
    priceRange: number
  ) {
    const candelChart = useChartCandelStore();
    const { candles } = storeToRefs(candelChart);

    if (!candles.value.length) return;

    const mouseX = (mouse.x - offset.x) / scale;
    const totalWidth = candleWidth + spacing;
    const index = Math.floor(mouseX / totalWidth);

    const candle = candles.value[index];
    if (!candle) return;

    const y = scaleYFromPrice(
      candle.high,
      height,
      priceScale,
      offset,
      centerPrice,
      priceRange
    );

    ctx.strokeStyle = "#ff9900";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawHoverLine(
    ctx,
    width: number,
    height: number,
    mouse: { x: number; y: number },
    priceScale: number,
    offset: { x: number; y: number },
    centerPrice: number,
    priceRange: number
  ) {
    ctx.strokeStyle = "#cccccc";
    ctx.beginPath();
    ctx.moveTo(0, mouse.y);
    ctx.lineTo(width, mouse.y);
    ctx.stroke();

    const price = priceFromY(
      mouse.y,
      height,
      priceScale,
      offset,
      centerPrice,
      priceRange
    );
    ctx.fillStyle = "#000";
    ctx.font = "12px sans-serif";
    ctx.fillText(price.toFixed(2), 5, mouse.y - 5);
  }

  function endPriceScaleDrag() {
    const storeDrag = useDragStore();
    const { scalingPriceByDrag } = storeToRefs(storeDrag);
    scalingPriceByDrag.value = false;
  }

  return {
    scaleYFromPrice,
    priceFromY,
    drawHoverHighLowLine,
    drawPriceScale,
    drawHoverPriceLine,
    drawHoverLine,
    endPriceScaleDrag,
  };
});
