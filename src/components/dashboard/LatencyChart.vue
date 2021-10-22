<template>
  <vs-card style="margin-top:22px">
    <div slot="header"><h4>Uplink Latency </h4></div>
    <ECharts autoresize :options="option"/>
    <h3>Total Success Ratio: {{(successCnt/totalCnt).toFixed(3)}}</h3> 
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/bar";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/title";
import "echarts/lib/component/dataZoom";
import "echarts/lib/component/markLine";

import latency from './lat.json'

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
      option: {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
              type: 'shadow'
          }
        },
        grid: [
          {
            top: "18%",
            // width: "15%",
            left: '10%',
            right:"80%",
            bottom: "5%",
            containLabel: true 
          },
          {
            right: "5%",
            top: "18%",
            bottom: "7%",
            left: "45%",
            containLabel: true 
          }
        ],
        xAxis: [
          {
            type: 'value',
            boundaryGap: [0, 0.5],
            gridIndex: 0,
            name: "(s)",
            nameTextStyle: {
              fontSize: 18,
              align: "center"
            },

          },
          {
            name:"Node ID",
            type: 'category',
            data: [],
            gridIndex: 1,
            nameLocation:"center",
            nameGap:30,
            nameTextStyle: {
              fontSize: 18,
              align: "center"
            },
          splitLine: {
            show: true,
          },
            axisLabel:{
              fontSize:11,
              // rotate:0,
              // interval:0,
              // fontWeight:"bold"
            },
          }
        ],
        yAxis: [
          {
            name: "E2E Latency per Layer",
            nameTextStyle: {
              fontSize: 14,
              fontWeight: "bold",
              align: "center"
            },
            data:["Average", "Layer 1","Layer 2","Layer 3","Layer 4","Layer 5"].reverse(),
            type: 'category',
            gridIndex: 0,
            boundaryGap: [0,0.1],
          },
          {
            name: "E2E Latency (s)",
            nameTextStyle: {
              fontSize: 18,
              // fontWeight: "bold",
              align: "center"
            },
            min:1.2,
            type: 'value',
            gridIndex: 1,
            boundaryGap: [0.1,0.4],
            axisLabel:{
              fontSize:16,
              // fontWeight:"bold"
            },
          },
          { 
            name: "Layer",
            nameTextStyle: {
              fontSize: 18,
              // fontWeight: "bold",
              align: "center"
            },
            data:[0,1,2,3,4,5],
            type: 'category',
            gridIndex: 1,
            boundaryGap: [0,0],
            axisLabel:{
              fontSize:16,
              // fontWeight:"bold"
            },
          },
        ],
        series: [
            {
              type: 'bar',
              data: [],
              barMaxWidth: 50,
              xAxisIndex: 0,
              yAxisIndex: 0,
              label: {
                show: true,
                position: 'inside',
                fontSize: 12
              },
              markLine: {
                symbol: "none",
                lineStyle: {
                  width: 2.5
                },
                label: {
                  fontSize: 15
                },
                data: [
                  {xAxis:1.99},
                ]
              }
            },
            {
              name: "average latency",
              silent:true,
              data: [],
              type: 'scatter',
              xAxisIndex: 1,
              yAxisIndex: 1,
              symbol: "circle",
              symbolSize: 12,

              itemStyle: {
                borderWidth:1.5,
                borderColor: "blue",
                color: "white",
              },
              markLine: {
                symbol: "none",
              
                lineStyle: {
                  color:"red",
                  width: 2.5
                },
                label: {
                  show:true,
                  fontSize: 15
                },
                data: [
                  {yAxis:1.99},
                ]
              }
            },
            {
              name:"layer",
              data:[],
              type: 'line',
              xAxisIndex: 1,
              yAxisIndex: 2,
              symbol: "none",
            }
        ]
      },
    }
  },
  methods: {
    draw() {
      var avg = 0
      var perLayer = [{val:0,cnt:0},{val:0,cnt:0},{val:0,cnt:0},{val:0,cnt:0},{val:0,cnt:0}]
      for(var i=0;i<latency.length;i++) {
        this.option.xAxis[1].data.push(latency[i].id)
        this.option.series[1].data.push(latency[i].latency)
        this.option.series[2].data.push(latency[i].layer)
        perLayer[latency[i].layer-1].val += latency[i].latency
        perLayer[latency[i].layer-1].cnt++
        avg += latency[i].latency
      }
      
      for(var j=4;j>=0;j--) {
        this.option.series[0].data.push((perLayer[j].val/perLayer[j].cnt).toFixed(2))
      }
      this.option.series[0].data.push((avg/49).toFixed(2))
      window.console.log(perLayer)
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