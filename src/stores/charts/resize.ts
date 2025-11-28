import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useDragStore } from "./drag";
import { useChartMainStore } from "./main";

export const useResizeStore = defineStore("resize", () => {
  const isResizing = ref(false);
  const resizeDirection = ref("");
  const resizeStart = ref({ x: 0, y: 0 });
  const startSize = ref({ width: 0, height: 0 });

  function startResize(direction, e, width: number, height: number) {
    e.preventDefault();
    e.stopPropagation();

    isResizing.value = true;
    resizeDirection.value = direction;
    resizeStart.value = { x: e.clientX, y: e.clientY };
    startSize.value = { width: width, height: height };

    document.addEventListener("mousemove", (e) =>
      onResizeMove(e, width, height)
    );
    document.addEventListener("mouseup", (e) => stopResize(e, width, height));
  }

  function onResizeMove(e, width: number, height: number) {
    const storeDrag = useDragStore();
    const { containerPosition } = storeToRefs(storeDrag);

    if (!isResizing.value) return;

    const dx = e.clientX - resizeStart.value.x;
    const dy = e.clientY - resizeStart.value.y;

    let newWidth = startSize.value.width;
    let newHeight = startSize.value.height;
    let newX = containerPosition.value.x;
    let newY = containerPosition.value.y;

    switch (resizeDirection.value) {
      case "top":
        newHeight = Math.max(200, startSize.value.height - dy);
        if (height > 200) {
          newY = e.clientY;
        }
        break;
      case "right":
        newWidth = Math.max(300, startSize.value.width + dx);
        break;
      case "bottom":
        newHeight = Math.max(200, startSize.value.height + dy);
        break;
      case "left":
        newWidth = Math.max(300, startSize.value.width - dx);
        if (width > 300) {
          newX = e.clientX;
        }
        break;
      case "top-left":
        newWidth = Math.max(300, startSize.value.width - dx);
        newHeight = Math.max(200, startSize.value.height - dy);
        if (width > 300) {
          newX = e.clientX;
        }
        if (height > 200) {
          newY = e.clientY;
        }
        break;
      case "top-right":
        newWidth = Math.max(300, startSize.value.width + dx);
        newHeight = Math.max(200, startSize.value.height - dy);
        if (height != 200) {
          newY = e.clientY;
        }
        break;
      case "bottom-left":
        newWidth = Math.max(300, startSize.value.width - dx);
        newHeight = Math.max(200, startSize.value.height + dy);
        if (width > 300) {
          newX = e.clientX;
        }
        break;
      case "bottom-right":
        newWidth = Math.max(300, startSize.value.width + dx);
        newHeight = Math.max(200, startSize.value.height + dy);
        break;
    }

    width = newWidth;
    height = newHeight;
    containerPosition.value.x = newX;
    containerPosition.value.y = newY;
  }

  function stopResize(e, width: number, height: number) {
    const mainStore = useChartMainStore();
    const { drawChart } = mainStore;

    isResizing.value = false;
    document.removeEventListener("mousemove", (e) => onResizeMove(e, width, height));
    document.removeEventListener("mouseup", (e) => stopResize(e, width, height));

    // drawChart();
  }

  return {
    stopResize,
    onResizeMove,
    startResize,
  };
});
