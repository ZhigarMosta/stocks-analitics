import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useLevelStore } from "./level";
export enum Instruments {
  LVL = 1,
}
export const useInstrumentStore = defineStore("instrument", () => {
  const instrimentActiv = ref(null);
  function onAddInstrument(e) {
    const levelStore = useLevelStore();
    const { addLevls } = levelStore;
    if (instrimentActiv.value === Instruments.LVL) {
      addLevls(e);
    }
  }

  return {
    instrimentActiv,
    onAddInstrument,
  };
});
