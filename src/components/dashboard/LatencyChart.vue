<template>
  <vs-card style="margin-top:22px">
    <div slot="header"><h4>Uplink Latency </h4></div>
    <ECharts autoresize :options="option" @click="handleClick"/>
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
            width: "35%",
            left: '3%',
            bottom: "5%",
            containLabel: true 
          },
          {
            right: "5%",
            top: "18%",
            bottom: "5%",
            left: "45%",
            containLabel: true 
          }
        ],
        xAxis: [
          {
            type: 'value',
            boundaryGap: [0, 0.15],
            gridIndex: 0,
            name: "(s)",
            nameTextStyle: {
              fontSize: 16,
              align: "center"
            },

          },
          {
            type: 'category',
            data: [],
            gridIndex: 1,

          }
        ],
        yAxis: [
          {
            name: "Uplink latency per layer",
            nameTextStyle: {
              fontSize: 18,
              fontWeight: "bold",
              align: "center"
            },
            type: 'category',
            data: [],
            gridIndex: 0,
            axisLabel: {
               fontSize: 15
            }
          },
          {
            name: "Uplink latency per node (s)",
            nameTextStyle: {
              fontSize: 18,
              fontWeight: "bold",
              align: "center"
            },
            type: 'value',
            gridIndex: 1,
            boundaryGap: [0, 0.05],
          },
          {
            // name: "Success Ratio",
            name: "",
            max:1,
            nameTextStyle: {
              fontSize: 18,
              fontWeight: "bold",
              align: "center"
            },
            type: 'value',
            gridIndex: 1,
            boundaryGap: [0.5, 0.2],
          }
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
                fontSize: 14
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
                  {xAxis:2.54},
                ]
              }
            },
            {
              name: "average latency",
              silent:true,
              data: [],
              type: 'bar',
              barMaxWidth: 90,
              xAxisIndex: 1,
              yAxisIndex: 1,
              markLine: {
                symbol: "none",
                lineStyle: {
                  width: 2.5
                },
                label: {
                  show:false,
                  fontSize: 15
                },
                data: [
                  {yAxis:1.28},
                ]
              }
            },
            {
              name: "success ratio",
              smooth:true,
              silent:true,
              data: [],
              type: 'line',
              xAxisIndex: 1,
              yAxisIndex: 2,
            }
        ]
      },
    }
  },
  methods: {
    draw() {
      var latencyPerLayer = {}
      this.option.yAxis[0].data = ['Average Latency']
      this.option.xAxis[1].data = []
      this.option.series[1].data = []
      this.option.series[2].data = []
      for(var l=0;l<this.layersNo;l++) {
        this.option.yAxis[0].data.unshift("Layer "+l)
        latencyPerLayer[l] = {latency:0, nodes:0}
      }

      var xData = []
      var values1 = []
      var values2 = []
      var total = 0
      for(var i=0;i<this.sensors.length;i++) {
        xData.push(this.sensors[i].sensor_id)
        this.successCnt+=this.sensors[i].uplink_latency_success
        this.totalCnt+=this.sensors[i].uplink_latency_cnt
        values1.push(this.sensors[i].uplink_latency_avg.toFixed(3))
        // values2.push(this.sensors[i].uplink_latency_sr.toFixed(3))
        total += this.sensors[i].uplink_latency_avg
        if(this.sensors[i].hop!=null) {
          if(latencyPerLayer[this.sensors[i].hop-1]==null) latencyPerLayer[this.sensors[i].hop-1] = {latency:0, nodes:0}
          latencyPerLayer[this.sensors[i].hop-1].latency += this.sensors[i].uplink_latency_avg
          latencyPerLayer[this.sensors[i].hop-1].nodes++
        }
      }
      this.option.xAxis[1].data = xData
      this.option.series[1].data = values1
      this.option.series[2].data = values2
      var values0 = []
      for(var j=this.layersNo-1;j>=0;j--) {
        values0.push((latencyPerLayer[j].latency/latencyPerLayer[j].nodes).toFixed(3))
      }
      values0.push((total/this.sensors.length).toFixed(3))
      this.option.series[0].data = values0
    },
    handleClick(item) {
      if(item.name=="Average Latency") {
        this.selectedLayer == -1
        this.option.yAxis[1].name = "Latency per node"
      }
      else {
        this.selectedLayer = item.name
        this.option.yAxis[1].name = "Latency per node | "+this.selectedLayer
      }
      this.drawNodesLatency()
    },
    drawNodesLatency() {
      var xData = []
      var values1 = []
      var cnt = 0
      for(var i=0;i<this.sensors.length;i++) {
        if(this.selectedLayer!=-1) 
          if((this.sensors[i].hop-1) != this.selectedLayer[6])
            continue
        xData.push(this.sensors[i].sensor_id)
        values1.push(this.sensors[i].uplink_latency_avg.toFixed(3))
        cnt++
      }
      this.option.xAxis[1].data = xData
      this.option.series[1].data = values1
      this.option.yAxis[1].name+=" ("+cnt+" nodes)"
      window.console.log(values1)
    }
  },
  mounted() {
    window.latencyChart = this
    // data from NWTable is ready
    this.$EventBus.$on("sensors", (sensors)=>{
      this.selectedSensor = sensors[0].sensor_id
      this.sensors = sensors.sort((a, b) => {
        if(a.hop == b.hop) return -b.sensor_id + a.sensor_id
        return a.hop > b.hop ? 1 : -1
      })
      // this.layersNo = this.sensors[this.sensors.length-1].hop
      this.layersNo = 5
      this.draw()
    })

  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 320px
</style>