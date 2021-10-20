<template>
  <vs-card style="margin-top: 22px">
    <div slot="header"><h4>E2E - Dynamic Experiment</h4></div>
    <ECharts autoresize :options="option" />
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/bar";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/title";
import "echarts/lib/component/dataZoom";
import "echarts/lib/component/markLine";

import latency from "./lat_dynamic.json";

export default {
  components: {
    ECharts,
  },
  data() {
    return {
      sensors: [],
      selectedLayer: -1,
      data: [],
      successCnt: 0,
      totalCnt: 0,
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
        xAxis: {
          type: "time",
          splitLine: {
            show: true,
          },
          maxInterval: 6000,
          name: "time",
          nameTextStyle: {
            fontSize: 18,
            align: "center",
          },
          nameLocation: "center",
          nameGap: 45,
          axisLabel: {
            fontSize: 16,
            rotate: 30,
            // fontWeight:"bold"
          },
        },
        yAxis: [
          {
            name: "E2E Latency (s)",
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
          {
            name: "Task Rate",
            nameTextStyle: {
              fontSize: 18,
              // fontWeight: "bold",
              align: "center",
            },
            interval: 1,
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
            name: "latency",
            type: "scatter",
            symbol: "circle",
            symbolSize: 12,
            yAxisIndex:0,
            itemStyle: {
              borderWidth: 1.5,
              borderColor: "red",
              color: "white",
            },
            hoverAnimation: false,
            data: [],
          },
          {
            name: "rate",
            type: "line",
            lineStyle: {
              color:"black",
              width: 2.5
            },
            showSymbol: false,
            hoverAnimation: false,
            data: [],
            yAxisIndex: 1,
          },
        ],
      },
    };
  },
  methods: {
    draw() {
      var data = latency.data;
      for (var i = 0; i < data.length; i++) {
        // this.option.xAxis.data.push(data[i].timestamp)
        this.option.series[0].data.push([
          data[i].timestamp,
          data[i].e2e_latency,
        ]);
        var rate = 1  
        if(i>9&&i<35) rate = 1.5
        if(i>=35) rate = 3
        this.option.series[1].data.push([
          data[i].timestamp,
          rate,
        ]);
      }
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