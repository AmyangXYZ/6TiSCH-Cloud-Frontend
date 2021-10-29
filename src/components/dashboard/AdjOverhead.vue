
<template>
  <vs-card style="margin-top: 22px">
    <div slot="header"><h4>E2E - Dynamic Experiment</h4></div>
    <ECharts autoresize :options="option" />
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/legend";
import "echarts/lib/component/dataZoom";
import "echarts/lib/component/markLine";

export default {
  components: {
    ECharts,
  },
  data() {
    return {
      // R-a-b-c-d-e-f-g-h-i
      res: {
        c: [2, 5, 8, 11, 14, 17, 20, 23, 26,29], // 2*layer+layer-1
        // h: [2, 3.6,  5.5, 6.1, 7,    7.1, 8.0, 9.5, 9.3, 9.5], // topo 1
        // h: [2, 3.25, 5.5, 4.4, 6.16, 5.1, 7.2, 9.2, 9.3, 8.7], // topo2
        h: [2, 3.425, 5.5, 5.25, 6.58, 6.1, 7.6, 9.35, 9.3, 9.1],
      },
      option: {
        grid: [
          {
            right: "5%",
            top: "18%",
            bottom: "2%",
            left: "45%",
            containLabel: true,
          },
        ],
        legend: {
          data: ["Centralized Scheduler", "HARP"],
        },
        xAxis: {
          type: "category",
          splitLine: {
            show: true,
          },
          maxInterval: 6000,
          name: "Layer",
          nameTextStyle: {
            fontSize: 18,
            align: "center",
          },
          nameLocation: "center",
          data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          nameGap: 45,
          axisLabel: {
            fontSize: 16,
            // rotate: 30,
            // fontWeight:"bold"
          },
        },
        yAxis: [
          {
            name: "Packets",
            nameTextStyle: {
              fontSize: 18,
              // fontWeight: "bold",
              align: "center",
            },
            axisLabel: {
              fontSize: 16,
              // fontWeight:"bold"
            },
            type: "value",
            boundaryGap: [0, 0.2],
            splitLine: {
              show: true,
            },
          },
        ],
        series: [
          {
            name: "Centralized Scheduler",
            type: "line",
            symbol: "circle",
            symbolSize: 12,
            // itemStyle: {
            //   borderWidth: 1.5,
            //   borderColor: "red",
            //   color: "white",
            // },
            hoverAnimation: false,
            data: [],
          },
          {
            name: "HARP",
            type: "line",
            symbol: "circle",
            symbolSize: 12,
            // itemStyle: {
            //   borderWidth: 1.5,
            //   borderColor: "red",
            //   color: "white",
            // },
            hoverAnimation: false,
            data: [],
          },
        ],
      },
    };
  },
  methods: {
    draw() {
      this.option.series[0].data = this.res.c;
      this.option.series[1].data = this.res.h;
    },
  },
  mounted() {
    this.draw();
  },
};
</script>

<style lang="stylus" scoped>
.echarts {
  width: 100%;
  height: 420px;
}
</style>