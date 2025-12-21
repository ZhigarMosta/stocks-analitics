import { defineStore } from "pinia";
import { ref } from "vue";
import { useLevelStore } from "./level";
import { ICandel } from "../user/user";
export enum Instruments {
  LVL = 1,
}
export const useInstrumentStore = defineStore("instrument", () => {
  const instrimentActiv = ref(null);
  function onAddInstrument(
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
    candleWidth: number,
    centerPrice: number,
    priceRange: number,
    candles: Array<ICandel>
  ) {
    const levelStore = useLevelStore();
    const { addLevls } = levelStore;
    if (instrimentActiv.value === Instruments.LVL) {
      addLevls(
        e,
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
        candleWidth,
        centerPrice,
        priceRange,
        candles
      );
    }
  }

  return {
    instrimentActiv,
    onAddInstrument,
  };
});
