<template>
  <vs-card>
    <div slot="header"><h4>Latency</h4></div>
    <ECharts autoresize :options="option"/>
  </vs-card>
</template>

<script>
import results from "./testbed-results"
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
import "echarts/lib/component/title";
import "echarts/lib/component/dataZoom";
import "echarts/lib/component/markArea";

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
          name: "Round Trip Time(s)",
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
            type: 'scatter',
            symbol: "roundRect",
            symbolSize: 12  ,
            data: []
          },
          {
            name: 'LLSF',
            type: 'scatter',
            symbol: "triangle",
            symbolSize: 12,
            data: [],
          },
          {
            name: 'Random Scheduler',
            type: 'scatter',
            symbol: "circle",
            symbolSize: 12,
            data: [],
            markArea: {
              label:{color:"black",fontWeight:"bold",fontSize:16,position:"insideTop"},
              data: [
                [{name:"layer 1",xAxis:0},{xAxis:25,itemStyle:{color:'#4575b4',opacity:0.5}}],
                [{name:"layer 2",xAxis:25},{xAxis:67,itemStyle:{color:'#4575b4',opacity:0.2}}],
              ]
            }
          },
        ]
      }
    }
  },
  methods: {
    drawLatency() {
      for(var i=1;i<110;i++) this.option.xAxis.data.push(i)
      this.option.series[0].data = results.partition.rtt
      this.option.series[1].data = results.llsf.rtt
      this.option.series[2].data = results.random.rtt
    },
  },
  mounted() {
    window.console.log(results)
    this.drawLatency()

  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 630px
</style>