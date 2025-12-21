import { defineStore } from "pinia";
import { ref } from "vue";

export interface IWindow {
  window_id: number;
  height: number;
  charts: Array<IChart>;
}

export interface IChart {
  id: number;
  candels?: Array<ICandel>;
  volume?: Array<ICandel>;
}

export interface ICandel {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  date: string;
  volume: number;
}

export const useUserStore = defineStore("user", () => {
  const windiows = ref<Array<IWindow>>([
    {
      window_id: 0,
      height: 500,
      charts: [
        {
          id: 0,
          candels: [
            {
              time: 1,
              open: 150,
              high: 110,
              low: 95,
              close: 105,
              date: "2024-04-25",
              volume: 1000,
            },
            {
              time: 2,
              open: 105,
              high: 112,
              low: 102,
              close: 108,
              date: "2024-04-26",
              volume: 2000,
            },
            {
              time: 3,
              open: 108,
              high: 115,
              low: 107,
              close: 109,
              date: "2024-04-27",
              volume: 500,
            },
            {
              time: 4,
              open: 109,
              high: 200,
              low: 105,
              close: 106,
              date: "2024-04-28",
              volume: 4000,
            },
            {
              time: 5,
              open: 106,
              high: 109,
              low: 100,
              close: 101,
              date: "2024-04-29",
              volume: 6000,
            },
            {
              time: 6,
              open: 101,
              high: 103,
              low: 97,
              close: 100,
              date: "2024-04-30",
              volume: 2000,
            },
            {
              time: 7,
              open: 200,
              high: 200,
              low: 98,
              close: 104,
              date: "2024-05-01",
              volume: 1000,
            },
            {
              time: 3,
              open: 18,
              high: 18,
              low: 17,
              close: 19,
              date: "2024-05-02",
              volume: 500,
            },
            {
              time: 4,
              open: 55,
              high: 55,
              low: 23,
              close: 11,
              date: "2024-05-03",
              volume: 4000,
            },
            {
              time: 5,
              open: 106,
              high: 109,
              low: 100,
              close: 101,
              date: "2024-05-04",
              volume: 6000,
            },
            {
              time: 6,
              open: 101,
              high: 103,
              low: 97,
              close: 100,
              date: "2024-05-06",
              volume: 2000,
            },
            {
              time: 7,
              open: 200,
              high: 200,
              low: 98,
              close: 104,
              date: "2024-05-07",
              volume: 1000,
            },
            {
              time: 3,
              open: 18,
              high: 18,
              low: 17,
              close: 19,
              date: "2024-05-02",
              volume: 500,
            },
            {
              time: 4,
              open: 55,
              high: 55,
              low: 23,
              close: 11,
              date: "2024-05-03",
              volume: 4000,
            },
            {
              time: 5,
              open: 106,
              high: 109,
              low: 100,
              close: 101,
              date: "2024-05-04",
              volume: 6000,
            },
            {
              time: 6,
              open: 101,
              high: 103,
              low: 97,
              close: 100,
              date: "2024-05-06",
              volume: 20000,
            },
            {
              time: 7,
              open: 100,
              high: 200,
              low: 200,
              close: 150,
              date: "2024-05-07",
              volume: 2000,
            }
          ]
        },
                {
          id: 0,
          candels: [
            {
              time: 1,
              open: 150,
              high: 110,
              low: 95,
              close: 105,
              date: "2024-04-25",
              volume: 1000,
            },
            {
              time: 2,
              open: 105,
              high: 112,
              low: 102,
              close: 108,
              date: "2024-04-26",
              volume: 2000,
            },
            {
              time: 3,
              open: 108,
              high: 115,
              low: 107,
              close: 109,
              date: "2024-04-27",
              volume: 500,
            },
            {
              time: 4,
              open: 109,
              high: 200,
              low: 105,
              close: 106,
              date: "2024-04-28",
              volume: 4000,
            },
            {
              time: 5,
              open: 106,
              high: 109,
              low: 100,
              close: 101,
              date: "2024-04-29",
              volume: 6000,
            },
            {
              time: 6,
              open: 101,
              high: 103,
              low: 97,
              close: 100,
              date: "2024-04-30",
              volume: 2000,
            },
            {
              time: 7,
              open: 200,
              high: 200,
              low: 98,
              close: 104,
              date: "2024-05-01",
              volume: 1000,
            },
            {
              time: 3,
              open: 18,
              high: 18,
              low: 17,
              close: 19,
              date: "2024-05-02",
              volume: 500,
            },
            {
              time: 4,
              open: 55,
              high: 55,
              low: 23,
              close: 11,
              date: "2024-05-03",
              volume: 4000,
            },
            {
              time: 5,
              open: 106,
              high: 109,
              low: 100,
              close: 101,
              date: "2024-05-04",
              volume: 6000,
            },
            {
              time: 6,
              open: 101,
              high: 103,
              low: 97,
              close: 100,
              date: "2024-05-06",
              volume: 2000,
            },
            {
              time: 7,
              open: 200,
              high: 200,
              low: 98,
              close: 104,
              date: "2024-05-07",
              volume: 1000,
            },
            {
              time: 3,
              open: 18,
              high: 18,
              low: 17,
              close: 19,
              date: "2024-05-02",
              volume: 500,
            },
            {
              time: 4,
              open: 55,
              high: 55,
              low: 23,
              close: 11,
              date: "2024-05-03",
              volume: 4000,
            },
            {
              time: 5,
              open: 106,
              high: 109,
              low: 100,
              close: 101,
              date: "2024-05-04",
              volume: 6000,
            },
            {
              time: 6,
              open: 101,
              high: 103,
              low: 97,
              close: 100,
              date: "2024-05-06",
              volume: 20000,
            },
            {
              time: 7,
              open: 100,
              high: 200,
              low: 200,
              close: 150,
              date: "2024-05-07",
              volume: 2000,
            }
          ]
        }
      ]
    }
  ]);

  return { windiows };
});
