import { defineStore, storeToRefs } from "pinia";
import { ref } from "vue";
import { useDragStore } from "./drag";
import { useChartMainStore } from "./main";

export const useResizeStore = defineStore("resize", () => {
  const isResizing = ref(false);
  const resizeDirection = ref("");
  const resizeStart = ref({ x: 0, y: 0 });
  const startSize = ref({ width: 0, height: 0 });

  function startResize(direction, e) {
    const mainStore = useChartMainStore();
    const { width, height } = storeToRefs(mainStore);
    const { drawChart } = mainStore;

    e.preventDefault();
    e.stopPropagation();

    isResizing.value = true;
    resizeDirection.value = direction;
    resizeStart.value = { x: e.clientX, y: e.clientY };
    startSize.value = { width: width.value, height: height.value };

    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", stopResize);
    drawChart();
  }

  function onResizeMove(e) {
    const storeDrag = useDragStore();
    const { containerPosition } = storeToRefs(storeDrag);
    const mainStore = useChartMainStore();
    const { width, height } = storeToRefs(mainStore);
    const { drawChart } = mainStore;

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
        if (height.value > 200) {
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
        if (width.value > 300) {
          newX = e.clientX;
        }
        break;
      case "top-left":
        newWidth = Math.max(300, startSize.value.width - dx);
        newHeight = Math.max(200, startSize.value.height - dy);
        if (width.value > 300) {
          newX = e.clientX;
        }
        if (height.value > 200) {
          newY = e.clientY;
        }
        break;
      case "top-right":
        newWidth = Math.max(300, startSize.value.width + dx);
        newHeight = Math.max(200, startSize.value.height - dy);
        if (height.value != 200) {
          newY = e.clientY;
        }
        break;
      case "bottom-left":
        newWidth = Math.max(300, startSize.value.width - dx);
        newHeight = Math.max(200, startSize.value.height + dy);
        if (width.value > 300) {
          newX = e.clientX;
        }
        break;
      case "bottom-right":
        newWidth = Math.max(300, startSize.value.width + dx);
        newHeight = Math.max(200, startSize.value.height + dy);
        break;
    }

    width.value = newWidth;
    height.value = newHeight;
    containerPosition.value.x = newX;
    containerPosition.value.y = newY;

    drawChart();
  }

  function stopResize() {
    const mainStore = useChartMainStore();
    const { drawChart } = mainStore;

    isResizing.value = false;
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", stopResize);

    drawChart();
  }

  return {
    stopResize,
    onResizeMove,
    startResize,
  };
});
