<template>
  <vs-card style="margin-top:22px">
    <div slot="header"><h4>E2E - Dynamic Experiment </h4></div>
    <ECharts autoresize :options="option"/>
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/bar";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/title";
import "echarts/lib/component/dataZoom";
import "echarts/lib/component/markLine";

import latency from './lat_dynamic.json'

export default {
  components: {
    ECharts
  },
  data() {
    return {
      sensors: [],
      selectedLayer: -1,
      data: [],
      successCnt: 0,
      totalCnt:0,
      option:{
        grid:[{
          right: "5%",
            top: "18%",
            bottom: "5%",
            left: "56%",
            containLabel: true 
          }
        ],
        xAxis: {
          type: 'time',
          splitLine: {
              show: false
          }
        },
        yAxis: {
          type: 'value',
          boundaryGap: [0, 0.2],
          splitLine: {
              show: false
          }
        },
        series: [{
          name: '模拟数据',
          type: 'scatter',
          symbol: "circle",
          symbolSize: 8,

          itemStyle: {
            borderColor: "red",
            color: "white",
          },
          showSymbol: false,
          hoverAnimation: false,
          data: []
        }]
      }
    }
  },
  methods: {
    draw() {
      var data = latency.data
      for(var i=0;i<data.length;i++) {
        // this.option.xAxis.data.push(data[i].timestamp)
        this.option.series[0].data.push([data[i].timestamp, data[i].e2e_latency])
      }
    },
  },
  mounted() {
    
    this.draw()
  

  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 420px
</style>