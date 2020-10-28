<template>
  <vs-card style="margin-top:22px">
    <div slot="header"><h4>RTT </h4></div>
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
      successCnt: 0,
      totalCnt:0,
      selectedLayer: -1,
      layersNo: 0,
      data: [],
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
            name: "RTT per layer",
            nameTextStyle: {
              fontSize: 18,
              fontWeight: "bold",
              align: "center"
            },
            type: 'category',
            data: ['Average RTT'],
            gridIndex: 0,
            axisLabel: {
               fontSize: 15
            }
          },
          {
            name: "RTT per node",
            nameTextStyle: {
              fontSize: 18,
              fontWeight: "bold",
              align: "center"
            },
            type: 'value',
            gridIndex: 1,
            boundaryGap: [0, 1.2],
          },
          {
            name: "Success Ratio",
            max:1,
            nameTextStyle: {
              fontSize: 18,
              fontWeight: "bold",
              align: "center"
            },
            type: 'value',
            gridIndex: 1,
            // boundaryGap: [0, 0.2],
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
                  {xAxis:1.27*3},
                ]
              }
            },
            {
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
                  {yAxis:1.27*3},
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
      var RTTPerLayer = {}
      this.option.yAxis[0].data = ["Average RTT"]
      this.option.xAxis[1].data = []
      this.option.series[1].data = []
      this.option.series[2].data = []
      for(var l=0;l<this.layersNo;l++) {
        this.option.yAxis[0].data.unshift("Layer "+l)
        RTTPerLayer[l] = {rtt:0, nodes:0}
      }

      var xData = []
      var values1 = []
      var values2 = []
      var total = 0
      for(var i=0;i<this.sensors.length;i++) {
        xData.push(this.sensors[i].sensor_id)
        this.successCnt+=this.sensors[i].e2e_latency_success
        this.totalCnt+=this.sensors[i].e2e_latency_cnt
        values1.push(this.sensors[i].e2e_latency_avg.toFixed(3))
        // values2.push(this.sensors[i].e2e_latency_sr.toFixed(3))
        total += this.sensors[i].e2e_latency_avg
        if(this.sensors[i].hop!=null) {
          if(RTTPerLayer[this.sensors[i].hop-1]==null) RTTPerLayer[this.sensors[i].hop-1] = {rtt:0, nodes:0}
          RTTPerLayer[this.sensors[i].hop-1].rtt += this.sensors[i].e2e_latency_avg
          RTTPerLayer[this.sensors[i].hop-1].nodes++
        }
      }
      this.option.xAxis[1].data = xData
      this.option.series[1].data = values1
      window.console.log(values2)
      this.option.series[2].data = values2
      var values0 = []
      for(var j=this.layersNo-1;j>=0;j--) {
        values0.push((RTTPerLayer[j].rtt/RTTPerLayer[j].nodes).toFixed(3))
      }
      values0.push((total/this.sensors.length).toFixed(3))
      this.option.series[0].data = values0
    },
    handleClick(item) {
      if(item.name=="Average RTT") {
        this.selectedLayer == -1
        this.option.yAxis[1].name = "RTT per node"
      }
      else {
        this.selectedLayer = item.name
        this.option.yAxis[1].name = "RTT per node | "+this.selectedLayer
      }
      this.drawNodesRTT()
    },
    drawNodesRTT() {
      var xData = []
      var values1 = []
      var cnt = 0
      for(var i=0;i<this.sensors.length;i++) {
        if(this.selectedLayer!=-1) 
          if((this.sensors[i].hop-1) != this.selectedLayer[6])
            continue
        cnt++
        xData.push(this.sensors[i].sensor_id)
        values1.push(this.sensors[i].e2e_latency_avg.toFixed(3))
      }
      this.option.xAxis[1].data = xData
      this.option.series[1].data = values1
      this.option.yAxis[1].name+=" ("+cnt+" nodes)"
    }
  },
  mounted() {
    // data from NWTable is ready
    window.rttChart = this
    this.$EventBus.$on("sensors", (sensors)=>{
      this.selectedSensor = sensors[0].sensor_id
      this.sensors = sensors.sort((a, b) => {
        if(a.hop == b.hop) return -b.sensor_id + a.sensor_id
        return a.hop > b.hop ? 1 : -1
      })
      // this.layersNo = this.sensors[this.sensors.length-1].hop
      this.layersNo = 5
      window.console.log(this.layersNo)
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