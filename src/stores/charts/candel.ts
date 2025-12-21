import { defineStore } from "pinia";
import { ref } from "vue";
import { useChartPriceStore } from "./price";
import { ICandel } from "../user/user";

export const useChartCandelStore = defineStore("candelChart", () => {
  function drawCandlesBodiesOnly(
    ctx,
    height: number,
    priceScale: number,
    spacing: number,
    offset: { x: number; y: number },
    candleWidth: number,
    centerPrice: number,
    priceRange: number,
    candles: Array<ICandel>
  ) {
    const priceStore = useChartPriceStore();
    const { scaleYFromPrice } = priceStore;

    candles.forEach((c, i) => {
      const x = i * (candleWidth + spacing);
      const openY = scaleYFromPrice(
        c.open,
        height,
        priceScale,
        offset,
        centerPrice,
        priceRange
      );
      const closeY = scaleYFromPrice(
        c.close,
        height,
        priceScale,
        offset,
        centerPrice,
        priceRange
      );
      const bodyTop = Math.min(openY, closeY);
      const bodyHeight = Math.abs(openY - closeY);
      const color = c.close >= c.open ? "#4caf50" : "#f44336";

      ctx.fillStyle = color;
      ctx.fillRect(x, bodyTop, candleWidth, Math.max(1, bodyHeight));
    });
  }

  return {
    drawCandlesBodiesOnly,
  };
});
