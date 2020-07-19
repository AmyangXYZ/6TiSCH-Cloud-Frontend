<template>
  <vs-card style="margin-top:22px">
    <div slot="header"><h4>Latency </h4></div>
    <ECharts autoresize :options="option" @click="handleClick"/>
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/bar";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/title";
import "echarts/lib/component/dataZoom";

export default {
  components: {
    ECharts
  },
  data() {
    return {
      sensors: [],
      selectedLayer: -1,
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
            width: "55%",
            left: '3%',
            bottom: "5%",
            containLabel: true 
          },
          {
            // width: "45%",
            top: "18%",
            bottom: "5%",
            left: "65%",
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
            name: "Latency per layer",
            nameTextStyle: {
              fontSize: 18,
              fontWeight: "bold",
              align: "center"
            },
            type: 'category',
            data: ['Average Latency'],
            gridIndex: 0,
            axisLabel: {
               fontSize: 15
            }
          },
          {
            name: "Latency per node",
            nameTextStyle: {
              fontSize: 18,
              fontWeight: "bold",
              align: "center"
            },
            type: 'value',
            gridIndex: 1,
            boundaryGap: [0, 0.2],
          }
        ],
        series: [
            {
              type: 'bar',
              data: [],
              xAxisIndex: 0,
              yAxisIndex: 0,
            },
            {
              data: [],
              type: 'bar',
              xAxisIndex: 1,
              yAxisIndex: 1,
            }
        ]
      },
    }
  },
  methods: {
    draw() {
      var latencyPerLayer = {}
      for(var l=0;l<this.layersNo;l++) {
        this.option.yAxis[0].data.unshift("Layer "+l)
        latencyPerLayer[l] = {latency:0, nodes:0}
      }

      var xData = []
      var values1 = []
      var total = 0
      for(var i=0;i<this.sensors.length;i++) {
        xData.push(this.sensors[i].sensor_id)
        values1.push(this.sensors[i].avg_latency.toFixed(3))
        total += this.sensors[i].avg_latency
        latencyPerLayer[this.sensors[i].hop-1].latency += this.sensors[i].avg_latency
        latencyPerLayer[this.sensors[i].hop-1].nodes++
      }
      this.option.xAxis[1].data = xData
      this.option.series[1].data = values1
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
      for(var i=0;i<this.sensors.length;i++) {
        if(this.selectedLayer!=-1) 
          if((this.sensors[i].hop-1) != this.selectedLayer[6])
            continue
        xData.push(this.sensors[i].sensor_id)
        values1.push(this.sensors[i].avg_latency.toFixed(3))
      }
      this.option.xAxis[1].data = xData
      this.option.series[1].data = values1
    }
  },
  mounted() {
    // data from NWTable is ready
    this.$EventBus.$on("sensors", (sensors)=>{
      this.selectedSensor = sensors[0].sensor_id
      this.sensors = sensors.sort((a, b) => {
        if(a.hop == b.hop) return -b.sensor_id + a.sensor_id
        return a.hop > b.hop ? 1 : -1
      })
      this.layersNo = this.sensors[this.sensors.length-1].hop
      this.draw()
    })

  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 240px
</style>