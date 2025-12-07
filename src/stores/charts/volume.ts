import { defineStore, storeToRefs } from "pinia";
import { useChartCandelStore } from "./candel";

export const useChartVolumeStore = defineStore("chartVolume", () => {
  function drawVolumes(
    ctx,
    height: number,
    spacing: number,
    candleWidth: number
  ) {
    const chartCandels = useChartCandelStore();
    const { candles } = storeToRefs(chartCandels);

    const maxVolume = Math.max(...candles.value.map((c) => c.volume));
    const volumeAreaHeight = 100;
    const volumeTop = height - volumeAreaHeight;

    candles.value.forEach((c, i) => {
      const x = i * (candleWidth + spacing);
      const barWidth = candleWidth;
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
