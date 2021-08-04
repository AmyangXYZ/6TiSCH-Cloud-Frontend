<template>
  <vs-card id="console">
    <div slot="header">
      <h4>Simulation</h4>
    </div>
    <div>
      <vs-row vs-justify="flex-start" vs-w=12 vs-align="center">
        <vs-col vs-w=0.8 vs-offset=0.1>
          <!-- <vs-button size="small" color="red" :disabled="running" icon-pack="fas" type="relief" icon="fa-play" @click="run"></vs-button> -->
          <vs-button size="small" color="red" :disabled="running" icon-pack="fas" type="relief" icon="fa-play" @click="runV2"></vs-button>
        </vs-col>
        <vs-col vs-w=0.8>
          <vs-button size="small" color="primary" :disabled="!running" icon-pack="fas" type="relief" icon="fa-pause" @click="stopV2"></vs-button>
        </vs-col>
        <vs-col vs-w=0.8>
          <vs-button size="small" color="primary" :disabled="!started||running" icon-pack="fas" type="relief" icon="fa-step-backward" @click="stepBwd"></vs-button>
        </vs-col>
        <vs-col vs-w=0.8>
          <vs-button size="small" color="primary" :disabled="running" icon-pack="fas" type="relief" icon="fa-step-forward" @click="stepFwd"></vs-button>
        </vs-col>
        <vs-col vs-w=0.8>
          <vs-button size="small" color="primary" :disabled="!started" icon-pack="fas" type="relief" icon="fa-stop" @click="finishV2"></vs-button>
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
      interference_strength:0,
      sf_id:0,
      topo :{},
      sortedNodes:[],
      cells:[],
      sim_timer: {},
      started: false,
      running: false,
      simulation_log: "",
      activeTabIdx:1,
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
            top: "10%",
            height: "32%",
            left: '8%',
            right: '5%'
          },
          {
            top: "55%",
            // height: "32%",
            bottom: "8%",
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
          // name: 'time',
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
          name: 'time',
          type: 'category',
          data: [],
          nameLocation: "center",
          nameTextStyle: {
            fontSize:13
          },
          // nameGap: 25,
          axisLabel: {
            fontSize:12,
          },
          boundaryGap: true,
          gridIndex: 1,
        }
        ],
        yAxis: [
          {
            name: 'Success Ratio (%)',
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
            name: 'Noise Strength',
            gridIndex: 1,
            boundaryGap: [0, 0.2]
          }
        ],
        series: [
        {
          name: "sr",
          type: "line",
          // symbol: "rect",
          // symbolSize: 8,
          xAxisIndex:0,
          // itemStyle: {
          //   borderColor: "blue",
          //   color: "white",
          // },
          // animation: false,
          data: [],
        },
        {
          name: "noise lv",
          type: "line",
          xAxisIndex:1,
          yAxisIndex:1,
          data: [],
        },

        ]
      },
    }
  },
  methods: {  
    // simulation within 1 sf
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

    // simulate multiple slotframes, with packet loss
    runV2() {
      this.sim_timer = setInterval(()=>{
        this.computeRTTSR()
        // this.draw()
      },500)
      this.started = true
      this.running = true
    },
    stopV2() {
      clearInterval(this.sim_timer)
      this.running = false
    },
    finishV2() {
      clearInterval(this.sim_timer)
      this.running = false
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
  
    computeRTTSR() {
      var miss_ddl = 0
      for(var i in this.topo) {
        if(i==0) continue
        var p = JSON.parse(JSON.stringify(this.topo[i].path))
        for(var k=this.topo[i].path.length-2;k>=0;k--)
          p.push(p[k])
        
        for(var j in p) {
          var nn = p[j]
          if(Math.random()<=this.topo[nn].loss_rate) {
            miss_ddl++
            break
          }
        }
      }
      window.console.log(miss_ddl)
      this.option.xAxis[1].data.push(this.sf_id)
      this.option.series[0].data.push(1-miss_ddl/(Object.keys(this.topo).length-1))
      this.option.series[1].data.push(this.interference_strength)
      this.sf_id++
    },

    handleClick(item) {
      // window.console.log(item)
      this.$EventBus.$emit("schSelectNode", item.name)
    }
  },
  mounted() {
    this.$EventBus.$on("topo", (t) => {
      this.topo = t.data
      window.console.log(this.topo)
    });
    this.$EventBus.$on("changedTopo", (t) => {
      this.topo = t
    });

    this.$EventBus.$on("cells1", (cells)=>{
      this.cells = cells
      this.computeRTTSR()
      // this.draw()
    })

    this.$EventBus.$on("interference_strength", (strength)=>{
      this.interference_strength = strength
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
  height 465px
#buttons
  // position absolute
  // width 300px
  z-index 999
  
#logs
  margin-top 10px
  width 100%
  height 355px
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
  height 350px
.vs-tabs--li
  // span
  // z-index 999
    // font-size 0.7rem
</style>