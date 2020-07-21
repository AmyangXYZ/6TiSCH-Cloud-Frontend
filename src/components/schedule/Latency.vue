<template>
  <vs-card>
    <div slot="header"><h4>Latency </h4></div>
    Deadline Satisfication Ratio: {{dsr}}
    <ECharts autoresize :options="option"/>
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
      cells: [],
      dsr:0,
      result: {
        avg_latency:[],
        avg_rtt: [],
        dsr: [],
      },
      option: {
        grid: {
          top: "10%",
          left: '12%',
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
          data: ['Average Latency', 'Average RTT'],
          textStyle: {
            fontSize: 16,
          }
        },
        xAxis: {
          name: "s",
          type: 'value',
          boundaryGap: [0, 0.01]
        },
        yAxis: {
          type: 'category',
          data: [],
          axisLabel: {
            fontSize: 16
          }
        },
        series: [
          {
            name: 'Average Latency',
            type: 'bar',
            data: [],
            label: {
              show: true,
              position: 'right',
              fontSize: 14
            },
          },
          {
            name: 'Average RTT',
            type: 'bar',
            label: {
              show: true,
              position: 'insideRight',
              fontSize: 14
            },
            data: []
        }
        ]
      }
    }
  },
  methods: {
    draw() {
      var latencyPerLayer = {}
      for(var i=0;i<this.cells.length;i++) {
        if(this.cells[i].cell.type=="downlink") continue
        if(latencyPerLayer[this.cells[i].cell.layer] == null) 
          latencyPerLayer[this.cells[i].cell.layer] = {latency: this.cells[i].latency, rtt: this.cells[i].rtt, nodes: 1}
        else {
          latencyPerLayer[this.cells[i].cell.layer].latency += this.cells[i].latency
          latencyPerLayer[this.cells[i].cell.layer].rtt += this.cells[i].rtt
          latencyPerLayer[this.cells[i].cell.layer].nodes ++
        }
      }
      var tmp_latency = []
      var tmp_rtt = []
      var yData = []
      var total_latency = 0
      var total_rtt = 0
      var total_nodes = 0
      for(var j=0;j<Object.keys(latencyPerLayer).length;j++) {
        latencyPerLayer[j].avg_latency = latencyPerLayer[j].latency/latencyPerLayer[j].nodes
        latencyPerLayer[j].avg_rtt = latencyPerLayer[j].rtt/latencyPerLayer[j].nodes
        total_latency += latencyPerLayer[j].latency
        total_rtt += latencyPerLayer[j].rtt
        total_nodes += latencyPerLayer[j].nodes
        tmp_latency.push(latencyPerLayer[j].avg_latency)
        tmp_rtt.push(latencyPerLayer[j].avg_rtt)
        yData.push("Layer "+j)
      }
      var avg_latency = total_latency/total_nodes
      var avg_rtt = total_rtt/total_nodes
      this.result.avg_latency.push(avg_latency/100)
      this.result.avg_rtt.push(avg_rtt/100)
      tmp_latency.unshift(avg_latency)
      tmp_rtt.unshift(avg_rtt)
      for(var k=0;k<tmp_latency.length;k++) {
        tmp_latency[k] *= 0.01
        tmp_latency[k] = tmp_latency[k].toFixed(3)
        tmp_rtt[k] *= 0.01
        tmp_rtt[k] = tmp_rtt[k].toFixed(3)
      }

      yData.unshift("Average")
      this.option.series[0].data = tmp_latency.reverse()
      this.option.series[1].data = tmp_rtt.reverse()
      this.option.yAxis.data = yData.reverse()
    },
    computeUplinkLatency() {
      var maxLayer = 0
      for(var x=0;x<this.cells.length;x++) 
        if(maxLayer<this.cells[x].cell.layer)
          maxLayer = this.cells[x].cell.layer
      
      // uplink
      for(var l=0;l<=maxLayer;l++) {
        for(var i=0;i<this.cells.length;i++) {
          if(this.cells[i].cell.layer == l && this.cells[i].cell.type=="uplink") {
            if(l == 0) {
              this.cells[i].path = [this.cells[i].cell.sender]
              this.cells[i].latency = 0
            }
            else {
              var nextHopCell = this.findCell(this.cells[i].cell.receiver, this.cells[i].cell.type)
              var latency = 0
              if(nextHopCell.slot[0] > this.cells[i].slot[0]) latency = nextHopCell.slot[0] - this.cells[i].slot[0]
              else latency = 127 - this.cells[i].slot[0] + nextHopCell.slot[0]

              this.cells[i].latency = latency + nextHopCell.latency
              this.cells[i].path = nextHopCell.path.concat([this.cells[i].cell.sender])
            }
          }
        }
      }
    },
    computeRTT() {
      var over_deadline = 0
      for(var i=0;i<this.cells.length;i++) {
        if(this.cells[i].cell.type=="downlink") continue
        var rtt = 0
        var last_cell = this.findCell(this.cells[i].path[0], "downlink")
        for(var j=0;j<this.cells[i].path.length;j++) {
          var cell = this.findCell(this.cells[i].path[j], "downlink")
          if(cell.slot[0] >= last_cell.slot[0]) rtt += cell.slot[0] - last_cell.slot[0]
          else rtt += 127 - last_cell.slot[0] + cell.slot[0]
          last_cell = cell
        }
        var cell_d = this.findCell(this.cells[i].cell.sender, "downlink")
        if(this.cells[i].slot[0] > cell_d.slot[0]) rtt += this.cells[i].slot[0] - cell_d.slot[0]
        else rtt += 127 - cell_d.slot[0] + this.cells[i].slot[0]
        
        rtt += this.cells[i].latency
        if(rtt>=127) over_deadline++
        this.cells[i].rtt = rtt
      }
      this.dsr = 1-over_deadline/this.cells.length*2
      this.result.dsr.push(this.dsr)
      window.console.log(this.result)
    },
    findCell(node, type) {
      for(var i=0;i<this.cells.length;i++) {
        if(type == "uplink")
          if(this.cells[i].cell.sender == node && this.cells[i].cell.type==type)
            return this.cells[i]
        if(type == "downlink")
          if(this.cells[i].cell.receiver == node && this.cells[i].cell.type==type)
            return this.cells[i]
      }
    }
  },
  mounted() {
    window.lat = this
    // cells data ready
    this.$EventBus.$on("cells", (cells)=>{
      this.cells = cells
      this.computeUplinkLatency()
      this.computeRTT()
      this.draw()
    })

  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 530px
</style>