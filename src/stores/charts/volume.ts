import { defineStore, storeToRefs } from "pinia";
import { useChartMainStore } from "./main";
import { useChartCandelStore } from "./candel";

export const useChartVolumeStore = defineStore("chartVolume", () => {
  function drawVolumes(ctx) {
    const chartMain = useChartMainStore();
    const { spacing, height } = storeToRefs(chartMain);
    const chartCandels = useChartCandelStore();
    const { candles, candleWidth } = storeToRefs(chartCandels);

    const maxVolume = Math.max(...candles.value.map((c) => c.volume));
    const volumeAreaHeight = 100;
    const volumeTop = height.value - volumeAreaHeight;

    candles.value.forEach((c, i) => {
      const x = i * (candleWidth.value + spacing.value);
      const barWidth = candleWidth.value;
      const barHeight = (c.volume / maxVolume) * (volumeAreaHeight - 20);

      ctx.fillStyle = "#1976d2";
      ctx.fillRect(
        x,
        volumeTop + (volumeAreaHeight - barHeight),
        barWidth,
        barHeight
      );
    });
  }

  return {
    drawVolumes,
  };
});
