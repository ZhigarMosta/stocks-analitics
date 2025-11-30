import { ref } from 'vue';

export const resizeEventBus = ref({
  listeners: [] as (() => void)[],
  
  onResize(callback: () => void) {
    this.listeners.push(callback);
  },
  
  offResize(callback: () => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  },
  
  emitResize() {
    this.listeners.forEach(callback => callback());
  }
});