<template>
  <vs-card>
    <div slot="header"><h4>Latency affected by Noise</h4></div>
    <ECharts autoresize :options="option"/>
  </vs-card>
</template>

<script>
import results from "./results-noise"
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
          data: ['Partitioning Scheduler', 'LLSF'],
          textStyle: {
            fontSize: 16,
          }
        },
        xAxis: {
          name: "Noise Event",
          nameLocation: "center",
          nameGap: 30,
          type: 'category',
          data: [],
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
          name: "Latency (s)",
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
            smooth: true,
            symbol: "rect",
            symbolSize: 8,
            lineStyle: {
              width: 3
            },
            data: []
          },
          {
            name: 'LLSF',
            type: 'line',
            smooth: true,
            symbol: "diamond",
            symbolSize: 10,
            lineStyle: {
              width: 3
            },
            data: [],
          }
        ]
      }
    }
  },
  methods: {
    drawDSR() {
      for(var x=0;x<32;x++) this.option.xAxis.data.push(x)
      this.option.series[0].data = results.llsf.avg_latency
      this.option.series[1].data = results.partition.avg_latency
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