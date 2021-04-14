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
      <textarea autofocus id="logs" ref="logs" v-model="simulation_log" v-show="activeTabIdx==0" disabled />
      <ECharts id="chart" :options="option" autoresize v-show="activeTabIdx==1"/>
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
      topo:{},
      cells:[],
      started: false,
      running: false,
      simulation_log: "",
      activeTabIdx:0,
      option: {
        grid: {
          top: '10%',
          bottom: '8%',
          left: '8%',
          right: '5%'
        },
        tooltip: {
            trigger: 'axis',
            // formatter: (item)=> {
            //   return "Node "
            // }
        },
        xAxis: 
        {
          name: 'Node',
          type: 'category',
          data: [],
          nameLocation: "center",
          nameTextStyle: {
            fontSize:13
          },
          nameGap: 20,
          axisLabel: {
            fontSize:12,
          },
          boundaryGap: true,
        },
        yAxis: [
          {
            name: 'RTT (ms)',
            nameTextStyle: {
              fontSize:13
            },
            type: 'value',
            axisLabel: {
              fontSize:12,
            },
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
            // boundaryGap: [10, 10]
          }
        ],
        series: [
        {
          name: "RTT (ms)",
          type: "scatter",
          symbol: "rect",
          symbolSize: 8,
          itemStyle: {
            borderColor: "blue",
            color: "white",
          },
          data: []
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
          data: []
        }
        ]
      },
    }
  },
  methods: {
    draw() {
      var topo = this.topo
      var sorted = Object.keys(topo).sort(function(a,b){return topo[a].layer-topo[b].layer})
      for(var i=1;i<Object.keys(this.topo).length;i++) {
        this.option.xAxis.data = sorted.slice(1)
      }

      // compute rtt for APaS (1 link 1 cell)
      for(var n=0;n<this.option.xAxis.data.length;n++) {
        var node = this.option.xAxis.data[n]
        const tmp = [...this.topo[node].path].reverse().slice(1)
        var path = [...this.topo[node].path]
        path.push(...tmp)
        
        var rtt = 0
        // var c1 = {}
        for(var j=0;j<path.length-2;j++) {
          var c1 = this.findCell(path[j], path[j+1])
          var c2 = this.findCell(path[j+1], path[j+2])
          rtt += c2.slot[0]-c1.slot[0]
          
        }
        this.option.series[0].data.push(rtt*10)
        this.option.series[1].data.push(this.topo[node].layer+1)
      }
      
    },
    findCell(sender, receiver) {
      for(var i=0;i<this.cells.length;i++) {
        if(this.cells[i].cell.sender == sender && this.cells[i].cell.receiver==receiver)
          return this.cells[i]
      }
    },
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

  },
  mounted() {
    
    this.$EventBus.$on("topo", (topo) => {
      this.topo = topo.data
    });
    this.$EventBus.$on("cells1", (cells) => {
      this.cells = cells
      // this.draw()
    });

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
  height 512px
#buttons
  // position absolute
  // width 300px
  z-index 999
  
#logs
  margin-top 10px
  width 100%
  height 405px
  font-size 0.85rem
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
  height 420px
.vs-tabs--li
  // span
  // z-index 999
    // font-size 0.7rem
</style>