<template>
  <vs-card>
    <div slot="header"><h4>Latency</h4></div>
    <ECharts autoresize :options="option"/>
  </vs-card>
</template>

<script>
import results from "./testbed-results"
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/scatter";
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
          // bottom: "5%",
          containLabel: true 
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          top: 10,
          right: '20%',
          data: ['Partitioning Scheduler', 'LLSF', 'Random Scheduler'],
          textStyle: {
            fontSize: 16,
          }
        },
        xAxis: {
          name: "Devices",
          nameLocation: "center",
          nameGap: 30,
          interval: 20,
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
          name: "Uplink Latency (s)",
          nameLocation: "center",
          nameGap: 40,
          nameTextStyle: {
            fontSize: 17,
            fontWeight: "bold"
          },
          type: 'value',
          data: [],
          boundaryGap: [0,0.2],
          axisLabel: {
            fontSize: 14
          }
        },
        series: [
          {
            name: 'Partitioning Scheduler',
            type: 'scatter',
            symbol: 'roundRect',
            symbolSize: 14,
            // borderColor: "black",
            // color:"white",
            itemstyle: {
              // normal: {
              borderWidth: 1,
              // }
            },
            data: []
          },
          {
            name: 'LLSF',
            type: 'scatter',
            symbol: "triangle",
            symbolSize: 15,
            
            data: [],
          },
          {
            name: 'Random Scheduler',
            type: 'scatter',
            symbol: "circle",
            symbolSize: 14,
            data: []
          }
        ]
      }
    }
  },
  methods: {
    drawLatency() {
      for(var i=1;i<110;i++) this.option.xAxis.data.push(i)
      this.option.series[0].data = results.partition.latency
      this.option.series[1].data = results.llsf.latency
      this.option.series[2].data = results.random.latency
    },
  },
  mounted() {

    this.drawLatency()

  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 630px
</style>