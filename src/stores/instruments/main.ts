import { defineStore } from "pinia";
import { ref } from "vue";
import { useLevelStore } from "./level";
export enum Instruments {
  LVL = 1,
}
export const useInstrumentStore = defineStore("instrument", () => {
  const instrimentActiv = ref(null);
  function onAddInstrument(e, timeCtx, priceCtx, mainCtx) {
    const levelStore = useLevelStore();
    const { addLevls } = levelStore;
    if (instrimentActiv.value === Instruments.LVL) {
      addLevls(e, timeCtx, priceCtx, mainCtx);
    }
  }

  return {
    instrimentActiv,
    onAddInstrument,
  };
});
