<template>
  <vs-card id="console">
    <div slot="header">
      <h4>Console</h4>
    </div>
    <div>
      <vs-row vs-justify="flex-start" vs-w=12 vs-align="center">
        <vs-col vs-w=0.8 vs-offset=0.1>
          <vs-button size="small" color="red" :disabled="running" icon-pack="fas" type="relief" icon="fa-play" @click="run"></vs-button>
        </vs-col>
        <vs-col vs-w=0.8>
          <vs-button size="small" color="primary" :disabled="!running" icon-pack="fas" type="relief" icon="fa-pause" @click="stop"></vs-button>
        </vs-col>
        <vs-col vs-w=0.8>
          <vs-button size="small" color="primary" :disabled="!started||running" icon-pack="fas" type="relief" icon="fa-step-backward" @click="stepBwd"></vs-button>
        </vs-col>
        <vs-col vs-w=0.8>
          <vs-button size="small" color="primary" :disabled="running" icon-pack="fas" type="relief" icon="fa-step-forward" @click="stepFwd"></vs-button>
        </vs-col>
        <vs-col vs-w=0.8>
          <vs-button size="small" color="primary" :disabled="!started" icon-pack="fas" type="relief" icon="fa-stop" @click="finish"></vs-button>
        </vs-col>

        <vs-col vs-offset=5.5 vs-w=1>
          <vs-button style="font-size:0.7rem" size="small" :color="(activeTabIdx==0)?'blue':'white'" :text-color="(activeTabIdx==0)?'blue':'skyblue'" type="line"  @click="activeTabIdx=0">Log</vs-button>
        </vs-col>
        <vs-col vs-w=1>
          <vs-button style="font-size:0.7rem"  :color="(activeTabIdx==1)?'blue':'white'" :text-color="(activeTabIdx==1)?'blue':'skyblue'" type="line" @click="activeTabIdx=1">Results</vs-button>
        </vs-col>
      </vs-row>
    </div>

    <div>
      <!-- <vs-row vs-w=12>
        <vs-col vs-offset=0.1 vs-w="4">
          <textarea autofocus id="logs" ref="logs" v-model="simulation_log" disabled />
        </vs-col>
        <vs-col vs-offset=0.5 vs-w="7.3">
          <ECharts id="chart" :options="option" autoresize v-show="activeTabIdx==1" />
        </vs-col>
      </vs-row> -->
      <textarea id="logs" ref="logs" v-model="simulation_log" v-show="activeTabIdx==0" disabled />
      <div v-show="activeTabIdx==1">
        <ECharts @click="handleClick" id="chart" :options="option" autoresize/>
      </div>
    </div>
      
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
import "echarts/lib/chart/bar";
import "echarts/lib/component/tooltip";


export default {
  components: {
    ECharts,
  },
  data() {
    return {
      topo :{},
      sortedNodes:[],
      cells:[],
      started: false,
      running: false,
      simulation_log: "",
      activeTabIdx:0,
      rttPerLayer: {},
      dsr:0,
      history: {
        latency:[],
        rtt: [],
        dsr: [],
      },
      result: {
        avg_latency:[],
        avg_rtt: [],
        dsr: [],
      },
      option: {
        grid: [
          {
            top: "240",
            height: "38%",
            left: '8%',
            right: '5%'
          },
          {
            top: "8%",
            height: "30%",
            left: '8%',
            right: '5%'
          }
        ],
          // top: '10%',
          // // bottom: '8%',
          
        tooltip: {
            trigger: 'axis',
            // formatter: (item)=> {
            //   return "Node "
            // }
        },
        xAxis: [
        {
          name: 'Node ID',
          type: 'category',
          data: [],
          nameLocation: "center",
          nameTextStyle: {
            fontSize:13
          },
          nameGap: 25,
          axisLabel: {
            fontSize:10,
          },
          splitNumber: 1,
          boundaryGap: true,
      
        },
        {
          name: 'Layer',
          type: 'category',
          data: ["Average"],
          nameLocation: "center",
          nameTextStyle: {
            fontSize:13
          },
          nameGap: 25,
          axisLabel: {
            fontSize:12,
          },
          boundaryGap: true,
          gridIndex: 1,
        }
        ],
        yAxis: [
          {
            name: 'RTT (s)',
            nameTextStyle: {
              fontSize:13
            },
            type: 'value',
            axisLabel: {
              fontSize:12,
            },
            gridIndex: 0,
            boundaryGap: [0, 0.2]
          },
          {
            name: 'Layer',
            nameTextStyle: {
              fontSize:13
            },
            type: 'value',
            interval:1,
            // min: 0,
            // max:6,
            axisLabel: {
              fontSize:12,
            },
            gridIndex: 0,
            
          },
          {
            name: 'RTT (s)',
            gridIndex: 1,
            boundaryGap: [0, 0.2]
          }
        ],
        series: [
        {
          name: "RTT (s)",
          type: "scatter",
          symbol: "rect",
          symbolSize: 8,
          xAxisIndex:0,
          itemStyle: {
            borderColor: "blue",
            color: "white",
          },
          // animation: false,
          data: [],
          markLine: {
            symbol: "none",
            lineStyle: {
              width: 2.5,
              // type: "solid",
              color: "red"
            },
            label: {
              show: true,
              position: "middle"
            },
            data: [
              {yAxis:1270},
            ],
            animation: false
          }
        },
        {
          name: "Layer",
          type: "line",
          symbol: "none",
          lineStyle:{
            width: 3,
            color: "rgba(87,150,157,1)"
          },
          // color: "rgba(87,150,157,1)",
          step: 'middle',
          itemStyle: {},
          yAxisIndex:1,
          xAxisIndex:0,
          animation: false,
          data: []
        },
        {
          type: "bar",
          data: [],
          xAxisIndex:1,
          yAxisIndex:2,
          label: {
            show: true,
            position: "top",
            // formatter: (item)=>{
            //   return item.data.toFixed(0)
              
            // }
          },
          markLine: {
            symbol: "none",
            lineStyle: {
              width: 2.5,
              // type: "solid",
              color: "red"
            },
            label: {
              position: "middle"
            },
            data: [
              {yAxis:1270},
            ],
            animation: false
          }
        }
        ]
      },
    }
  },
  methods: {  
    run() {
      this.activeTabIdx = 0
      if(!this.started) {
        this.simulation_log += "Simulation started\n"
        this.$nextTick(() => {
          this.$refs.logs.scrollTop = this.$refs.logs.scrollHeight
        })
        
        setTimeout(()=>{
          this.$EventBus.$emit("simulation_run", true)    
        },500)
      }
      else 
        this.$EventBus.$emit("simulation_run", true)

      
      this.started = true
      this.running = true
      
    },
    stop() {
      this.activeTabIdx = 0
      this.$EventBus.$emit("simulation_run", false)
      this.running = false
    },
    stepFwd() {
      this.activeTabIdx = 0
      this.started = true
      this.$EventBus.$emit("simulation_step", "forward")
    },
    stepBwd() {
      this.activeTabIdx = 0
      this.$EventBus.$emit("simulation_step", "back")
    },
    finish() {
      this.activeTabIdx = 0
      this.$EventBus.$emit("simulation_finish", true)
      this.running = false
    },


    draw() {
      var latencyPerLayer = {}
      for(var i=0;i<this.cells.length;i++) {
        if(this.cells[i].cell.type!="uplink") continue
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
        yData.push("Layer "+(j+1))
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
      // this.option.series[0].data = tmp_latency.reverse()
      this.option.series[2].data = tmp_rtt
      this.option.xAxis[1].data = yData

      this.history.latency.push(avg_latency/100)
      this.history.rtt.push(avg_rtt/100)
      this.history.dsr.push(this.dsr)
      const average = list => list.reduce((prev, curr) => prev + curr) / list.length;
      window.console.log("partition scheduler:", "n",this.history.dsr.length, "avg_latency",average(this.history.latency).toFixed(3),"avg_rtt", average(this.history.rtt).toFixed(3), "dsr", average(this.history.dsr).toFixed(3) )
      // window.console.log("partition scheduler:", "n",this.history.dsr.length, "rtt", this.history.rtt, "dsr", this.history.dsr)

      var topo = this.topo
      var sorted = Object.keys(topo).sort(function(a,b){return topo[a].layer-topo[b].layer})
      this.sortedNodes = sorted.slice(1)
      this.option.xAxis[0].data = sorted.slice(1)

      this.option.series[0].data = []
      this.option.series[1].data = []
      // compute rtt for APaS (1 link 1 cell)
      for(var n=0;n<this.option.xAxis[0].data.length;n++) {
        var node = this.option.xAxis[0].data[n]
        var x = this.findCell(node, "uplink")
        
        this.option.series[0].data.push(x.rtt/100)
        this.option.series[1].data.push(this.topo[node].layer+1)
      }
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
    // e2e latency
    computeRTT() {
      var over_deadline = 0
      // window.console.log(this.cells)
      for(var i=0;i<this.cells.length;i++) {
        if(this.cells[i].cell.type!="uplink") continue
        var rtt = this.cells[i].latency
        var cell_d_0 = this.findCell(this.cells[0].cell.sender, "downlink")
        var cell_u_0 = this.findCell(this.cells[0].cell.sender, "uplink")

        if(cell_u_0.slot[0] > cell_d_0.slot[0]) rtt += 127 - cell_u_0.slot[0] + cell_d_0.slot[0]
        else rtt += cell_d_0.slot[0] - cell_u_0.slot[0]


        var last_cell = this.findCell(this.cells[i].path[0], "downlink")
        for(var j=0;j<this.cells[i].path.length;j++) {
          var cell = this.findCell(this.cells[i].path[j], "downlink")
          
          if(cell.slot[0] >= last_cell.slot[0]) rtt += cell.slot[0] - last_cell.slot[0]
          else rtt += 127 - last_cell.slot[0] + cell.slot[0]
          last_cell = cell
        }
        
 
        if(rtt>=127) over_deadline++
        this.cells[i].rtt = rtt
      }
      this.dsr = 1-over_deadline/this.cells.length*2
      this.result.dsr.push(this.dsr)
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
    },
    handleClick(item) {
      window.console.log(item)
      this.$EventBus.$emit("schSelectNode", item.name)
    }
  },
  mounted() {
    this.$EventBus.$on("topo", (t) => {
      this.topo = t.data
    });
    this.$EventBus.$on("changedTopo", (t) => {
      this.topo = t
    });

    this.$EventBus.$on("cells1", (cells)=>{
      this.cells = cells
      this.computeUplinkLatency()
      this.computeRTT()
      this.draw()
    })



    this.$EventBus.$on("simulation_log", (log) => {
      this.simulation_log += "# Slot "+log.slot+"\n"
      for(var i=0;i<log.tx.length;i++) {
        this.simulation_log += "\tChannel "+log.tx[i][2]+": "+log.tx[i][0]+"->"+log.tx[i][1] + "\n"
      }
      this.$nextTick(() => {
        this.$refs.logs.scrollTop = this.$refs.logs.scrollHeight
      })
    });
    
    this.$EventBus.$on("simulation_finish", ()=>{
      this.simulation_log += "Finished! Collecting results...\n"
      this.$nextTick(() => {
        this.$refs.logs.scrollTop = this.$refs.logs.scrollHeight
      })
      this.draw()
      setTimeout(()=>{
        this.activeTabIdx = 1
      },1000)
      this.running = false
      this.started = false
    })
  },
}
</script>

<style lang="stylus" >
#console
  width 100%
  height 562px
#buttons
  // position absolute
  // width 300px
  z-index 999
  
#logs
  margin-top 10px
  width 100%
  height 450px
  font-size 0.7rem
  line-height 1.3
  border-radius: 6px;
  padding 9px
  box-sizing: border-box;
  resize none
  outline: none;
  text-transform: none;
  text-decoration: none;
textarea:disabled {
  background: white;
}
#chart
  width 100%
  height 450px
.vs-tabs--li
  // span
  // z-index 999
    // font-size 0.7rem
</style>