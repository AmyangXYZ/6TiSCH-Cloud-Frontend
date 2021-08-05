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


        <vs-col vs-offset=5.5 vs-w=2>
          <vs-button style="font-size:0.7rem" type="line" @click="popup_active=true">view data</vs-button>
        </vs-col>
        
      </vs-row>
    </div>
    
    <vs-popup class="a"  title="data.csv" :active.sync="popup_active">
      <vs-button style="font-size:0.7rem" type="line" @click="copy_res">copy</vs-button>
      <textarea id="logs" ref="res" v-model="res"  />
    </vs-popup>
    <div>
      <!-- <vs-row vs-w=12>
        <vs-col vs-offset=0.1 vs-w="4">
          <textarea autofocus id="logs" ref="logs" v-model="simulation_log" disabled />
        </vs-col>
        <vs-col vs-offset=0.5 vs-w="7.3">
          <ECharts id="chart" :options="option" autoresize v-show="activeTabIdx==1" />
        </vs-col>
      </vs-row> -->
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
import "echarts/lib/component/toolbox";


export default {
  components: {
    ECharts,
  },
  data() {
    return {
      popup_active:false,
      res:"TIME, SUCCESS_RATIO, NOISE_STRENGTH\n",
      interference_strength: 0,
      itf_start_sf:0,
      sf_id:0,
      topo:{},
      shift_flag: false,
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
            height: "40%",
            left: '7%',
            right: '8%'
          },
          {
            top: "62%",
            // height: "32%",
            bottom: "15%",
            left: '7%',
            right: '8%'
          }
        ],
        xAxis: [
        {
          name: 'time (s)',
          type: 'category',
          data: [],
          // nameLocation: "center",
          nameTextStyle: {
            fontSize:13
          },
          nameGap: 10,
          axisLabel: {
            fontSize:10,
          },
          splitNumber: 1,
          boundaryGap: true,
          animation: false
        },
        {
          name: 'time (s)',
          type: 'category',
          data: [],
          // nameLocation: "center",
          nameTextStyle: {
            fontSize:13
          },
          nameGap: 10,
          axisLabel: {
            fontSize:10,
          },
          boundaryGap: true,
          gridIndex: 1,
          animation: false
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
            boundaryGap: [0, 0]
          },
          {
            name: 'Noise Strength',
            gridIndex: 1,
            boundaryGap: [0, 0]
          }
        ],
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100,
            xAxisIndex: [0, 1]
          },
          {
            start: 0,
            end: 100,
            xAxisIndex: [0, 1],
            handleIcon:
              "M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z",
            handleSize: "80%",
            handleStyle: {
              color: "#fff",
              shadowBlur: 3,
              shadowColor: "rgba(0, 0, 0, 0.6)",
              shadowOffsetX: 2,
              shadowOffsetY: 2
            }
          }
        ],
        series: [
        {
          name: "sr",
          type: "line",
          symbol: "none",
          // symbolSize: 8,
          xAxisIndex:0,
          // itemStyle: {
          //   borderColor: "blue",
          //   color: "white",
          // },
          animation: false,
          data: [],
        },
        {
          name: "noise lv",
          type: "line",
          symbol: "none",
          xAxisIndex:1,
          yAxisIndex:1,
          animation: false,
          data: [],
        },

        ]
      },
    }
  },
  methods: {  
    copy_res() {
      this.$refs.res.select()
      document.execCommand("copy")

    },
    
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
      },40)
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
          var loss_rate = 0
          if(this.topo[nn].distance2interference!=-1) 
            loss_rate = this.interference_strength/this.topo[nn].distance2interference
  
          if(Math.random()<=loss_rate) {
            miss_ddl++
            break
          }
        }
      }
      var sr = 100*(1-miss_ddl/(Object.keys(this.topo).length-1))
      this.option.xAxis[0].data.push(this.sf_id)
      this.option.xAxis[1].data.push(this.sf_id)
      this.option.series[0].data.push(sr)
      this.option.series[1].data.push(this.interference_strength)
      this.res+=this.sf_id + ", " + sr + ", " + this.interference_strength + "\n"
      // if(!this.shift_flag)
      //   if(this.option.series[0].data.length>300)
      //     this.shift_flag = true
      // if(this.shift_flag) {
      //   this.option.xAxis[1].data.shift()
      //   this.option.series[0].data.shift()
      //   this.option.series[1].data.shift()
      // }
      this.sf_id++
      if((this.sf_id-this.itf_start_sf)%120==0) {
        this.interference_strength-=0.2
        if(this.interference_strength<0)
          this.interference_strength = 0
        this.$EventBus.$emit("interference_strength", this.interference_strength)

      }
    },

    handleClick(item) {
      // window.console.log(item)
      this.$EventBus.$emit("schSelectNode", item.name)
    }
  },
  mounted() {
    window.sim = this
    this.$EventBus.$on("topo", (t) => {
      this.topo = t.data
      window.console.log(this.topo)
    });
    this.$EventBus.$on("changedTopo", (t) => {
      this.topo = t
    });

    this.$EventBus.$on("new_itf", ()=>{
      this.interference_strength = 0.9
      this.itf_start_sf = this.sf_id;
    });

    this.$EventBus.$on("affected", (t) => {
      this.topo = t.data
    });

    this.$EventBus.$on("cells1", (cells)=>{
      this.cells = cells
      this.computeRTTSR()
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
  height 380px
.vs-tabs--li
  // span
  // z-index 999
    // font-size 0.7rem
</style>