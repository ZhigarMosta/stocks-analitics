import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useChartMainStore } from "../charts/main";
import { PRICE_CANVAS_WIDTH, useChartPriceStore } from "../charts/price";
import { Instruments, useInstrumentStore } from "./main";

export const useLevelStore = defineStore("level", () => {
  const levels = ref([100, 107, 110]);

  function addLevls(
    e,
    timeCtx,
    priceCtx,
    mainCtx,
    width: number,
    height: number,
    mouse: { x: number; y: number },
    priceScale: number,
    spacing: number,
    offset: { x: number; y: number },
    scale: number,
    candleWidth: number
  ) {
    const priceStore = useChartPriceStore();
    const { priceFromY } = priceStore;
    const mainStore = useChartMainStore();
    const { drawChart } = mainStore;

    e.preventDefault();
    levels.value.push(priceFromY(e.offsetY, height, priceScale, offset));

    drawChart(
      timeCtx,
      priceCtx,
      mainCtx,
      width,
      height,
      mouse,
      priceScale,
      spacing,
      offset,
      scale,
      candleWidth
    );
  }

  function drawLevels(
    ctx,
    width: number,
    height: number,
    priceScale: number,
    offset: { x: number; y: number }
  ) {
    const priceStore = useChartPriceStore();
    const { scaleYFromPrice } = priceStore;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#8888ff";
    ctx.setLineDash([4, 4]);

    levels.value.forEach((price) => {
      const y = scaleYFromPrice(price, height, priceScale, offset);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width + PRICE_CANVAS_WIDTH, y);
      ctx.stroke();
    });

    ctx.setLineDash([]);
    ctx.restore();
  }

  function onSwitchInstrumentToLevels() {
    const instrumentStore = useInstrumentStore();
    const { instrimentActiv } = storeToRefs(instrumentStore);

    instrimentActiv.value === Instruments.LVL
      ? (instrimentActiv.value = null)
      : (instrimentActiv.value = Instruments.LVL);
  }

  return {
    addLevls,
    drawLevels,
    onSwitchInstrumentToLevels,
  };
});
