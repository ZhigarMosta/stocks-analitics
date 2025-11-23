import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useChartMainStore } from "../charts/main";
import { PRICE_CANVAS_WIDTH, useChartPriceStore } from "../charts/price";
import { Instruments, useInstrumentStore } from "./main";

export const useLevelStore = defineStore("level", () => {
  const levels = ref([100, 107, 110]);

  function addLevls(e) {
    const priceStore = useChartPriceStore();
    const { priceFromY } = priceStore;
    const mainStore = useChartMainStore();
    const { drawChart } = mainStore;

    e.preventDefault();
    levels.value.push(priceFromY(e.offsetY));

    drawChart();
  }

  function drawLevels(ctx) {
    const priceStore = useChartPriceStore();
    const { scaleYFromPrice } = priceStore;
    const mainStore = useChartMainStore();
    const { width } = storeToRefs(mainStore);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#8888ff";
    ctx.setLineDash([4, 4]);

    levels.value.forEach((price) => {
      const y = scaleYFromPrice(price);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width.value + PRICE_CANVAS_WIDTH, y);
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
