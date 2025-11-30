import { defineStore } from "pinia";
import { ref } from "vue";

export const useDragStore = defineStore("drag", () => {
  const containerPosition = ref({ x: 0, y: 0 });
  const isDraggingContainer = ref(false);
  const dragStart = ref({ x: 0, y: 0 });
  const scalingPriceByDrag = ref(false);

  function startContainerDrag(e) {
    if (e.button !== 0) return;
    isDraggingContainer.value = true;
    dragStart.value = { x: e.clientX, y: e.clientY };
    document.addEventListener("mousemove", onContainerDrag);
    document.addEventListener("mouseup", stopContainerDrag);
  }

  function onContainerDrag(e) {
    if (!isDraggingContainer.value) return;

    const dx = e.clientX - dragStart.value.x;
    const dy = e.clientY - dragStart.value.y;

    containerPosition.value.x += dx;
    containerPosition.value.y += dy;

    dragStart.value = { x: e.clientX, y: e.clientY };
  }

  function stopContainerDrag() {
    isDraggingContainer.value = false;
    document.removeEventListener("mousemove", onContainerDrag);
    document.removeEventListener("mouseup", stopContainerDrag);
  }

  return {
    containerPosition,
    isDraggingContainer,
    dragStart,
    scalingPriceByDrag,
    startContainerDrag,
    onContainerDrag,
    stopContainerDrag,
  };
});
