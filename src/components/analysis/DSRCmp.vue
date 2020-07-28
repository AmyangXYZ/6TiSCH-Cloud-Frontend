<template>
  <vs-card>
    <div slot="header"><h4>DSR</h4></div>
    <ECharts autoresize :options="option"/>
  </vs-card>
</template>

<script>
import results from "./results-25*8"
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
import "echarts/lib/component/title";
import "echarts/lib/component/dataZoom";

export default {
  components: {
    ECharts
  },
  data() {
    return {
      option: {
        grid: {
          top: "8%",
          left: '8%',
          right: '10%',
          bottom: "5%",
          containLabel: true 
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          top: 8,
          right: '20%',
          data: ['Partitioning Scheduler', 'LLSF', 'Random Scheduler'],
          textStyle: {
            fontSize: 16,
          }
        },
        xAxis: {
          name: "Network Size",
          nameLocation: "center",
          nameGap: 30,
          type: 'category',
          data: [20,40,60,80,100,120,140,160],
          boundaryGap: [0, 0.01],
          nameTextStyle: {
            fontSize: 17,
            fontWeight: "bold"
          },
          axisLabel: {
            fontSize: 14
          }
        },
        yAxis: {
          name: "Deadline Satification Ratio (%)",
          nameLocation: "center",
          nameGap: 40,
          nameTextStyle: {
            fontSize: 17,
            fontWeight: "bold"
          },
          type: 'value',
          data: [],
          axisLabel: {
            fontSize: 14
          }
        },
        series: [
          {
            name: 'Partitioning Scheduler',
            type: 'line',
            // smooth: true,
            symbol: "rect",
            symbolSize: 12,
            lineStyle: {
              width: 3
            },
            data: []
          },
          {
            name: 'LLSF',
            type: 'line',
            // smooth: true,
            symbol: "diamond",
            symbolSize: 14,
            lineStyle: {
              width: 3
            },
            data: [],
          },
          {
            name: 'Random Scheduler',
            type: 'line',
            // smooth: true,
            symbol: "circle",
            symbolSize: 12,
            lineStyle: {
              width: 3
            },
            data: []
          },
        ]
      }
    }
  },
  methods: {
    drawDSR() {
      this.option.series[0].data = results.partition.dsr
      this.option.series[1].data = results.llsf.dsr
      this.option.series[2].data = results.random.dsr
    },
  },
  mounted() {
    this.drawDSR()
  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 530px
</style>