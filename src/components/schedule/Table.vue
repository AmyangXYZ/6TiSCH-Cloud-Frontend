<template>
  <vs-row>
    <vs-col style="z-index:99" vs-offset="0.6" vs-w="11.1">  
      <vs-card>
        <div slot="header" >
          <h4>Partition-based Scheduler | <span style="text-decoration:underline;cursor:pointer;" @click="handleSwitch">{{simOrReal}}</span>
            <div v-if="simOrReal=='Simulation'" class="bts">
              <!-- <vs-button color="danger" type="filled" @click="handleShuffleBt">Shuffle</vs-button> -->
              <vs-button color="primary" type="filled"  @click="handleDPABt">DPA</vs-button>
              <vs-button color="grey" type="filled"  @click="handleAutoBt">AUTO</vs-button>
            </div>
          </h4>
        </div>
        <div class="partition-usage">
          
          <vs-row vs-type="flex" vs-justify="space-around" vs-w="12">
            <vs-col vs-w="2">
              <h3>{{this.slots.length}} links, {{nonOptimalCnt}} non-aligned</h3>
            </vs-col>
            <vs-col id="part" vs-w="0.5" v-for="(l,i) in links" :key="i">
              {{l.name}}: {{l.used-l.non_optimal}}<span class="non-optimal" v-if="l.non_optimal>0">+{{l.non_optimal}}</span>
            </vs-col>
          </vs-row>
        </div>
        <vs-divider/>
        <!-- <div class="partition-usage">
          <hPartition Changes</h4>
          <vs-row vs-type="flex" vs-justify="center">
            <vs-col id="part" vs-w="1" v-for="(p,i) in partition_changes" :key="i">
              {{p.name}}: {{p.count}}
            </vs-col>
          </vs-row>
        </div>
        <vs-divider/> -->
        <ECharts id="sch-table" autoresize :options="option"/>        
      </vs-card>
    </vs-col>
  </vs-row> 
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/heatmap";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/legend";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/component/markArea";
import "echarts/lib/component/dataZoom";
import "echarts/lib/chart/graph"

import {init,dpa,change_topo,get_sch} from '@/assets/scheduler/schedule-dpa-sim.js'

export default {
  components: {
    ECharts,
  },
  data() {
    return {
      i:0,
      autoFlag: 0,
      simOrReal: "Simulation",
      partition_changes: {},
      auto: {},
      res: {},
      SlotFrameLength: 127,
      Channels: [1,3,5,7,9,11,13,15],
      slots: [],
      links: {},
      bcnSubslots: {},
      nonOptimalCnt:0,
      option: {
        title: {
          text: "Partition Usage",
          top:-5,
          textStyle: {
            fontSize: 20
          }
        },
        tooltip: {
          formatter: (item) => {
            for(var i=0;i<this.slots.length;i++) {
              if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]*2+1)) {
                if(this.slots[i].type == "beacon") {
                  var res = `[${item.data[0]-0.5}, ${item.data[1]*2+1}]<br/>
                            Beacon<br/>
                            Subslots<br/>`
                  for(var sub in this.bcnSubslots[this.slots[i].slot[0]]) {
                    var sub_text = sub.toString()
                    sub_text = (sub_text.length<2) ? ("\xa0\xa0"+sub_text):sub_text
                    res+=`${sub_text}\xa0\xa0-\xa0\xa0${this.bcnSubslots[this.slots[i].slot[0]][sub]}<br/>`
                  }
                  return res
                }
                return `[${item.data[0]-0.5}, ${item.data[1]*2+1}]<br/>
                        ${this.slots[i].type.replace(/^\S/, s => s.toUpperCase())}<br/>
                        Layer ${this.slots[i].layer}<br/>
                        ${this.slots[i].sender} -> ${this.slots[i].receiver}`
              }
            }
            return item.data
          }
        },
        grid: {
          top: '20%',
          // height: '78%',
          left: '4%',
          right: '3%',
          bottom: "8%",
        },
        xAxis: {
          min:0,
          max:127,
          splitNumber: 127,
          minInterval: 1,
          axisLabel: {
            formatter: (item)=>{
              if(item%2==1) 
                return item
            }
          },
          name: "Slot Offset",
          type: 'value',
          position: "top",
          nameLocation: "middle",
          nameTextStyle: {
            fontWeight: "bold",
            padding: 15,
            fontSize: 15
          },
          data: [],
          splitArea: {
            show: true,
          },
        },
        yAxis: {
          name: "Channel Offset",
          type: 'category',
          inverse: true,
          nameLocation: "middle",
          nameTextStyle: {
            fontWeight: "bold",
            padding: 10,
            fontSize: 15
          },
          data: [],
          splitArea: {
            show: true
          }
        },
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100,
          },
        ],
        visualMap: {
          min: 0,
          max: 1,
          show:true,
          type: 'piecewise',
          inRange: {
            color: ['#4575b4', '#d73027']
          },
          pieces:[{min:0,max:0,label:"Aligned"},{min:1,max:1,label:"Non-Aligned"}],
          textStyle: {
            fontSize:15,
          },
          position: 'top',
          orient: "horizontal",
          top: -3,
          right:"1%",
        },
        series: [{
          type: 'heatmap',
          data: [],
          label: {
            show: true,
            color: 'white',
            fontWeight: 'bold',
            fontSize: 9.5,
            formatter: (item) => {
              for(var i=0;i<this.slots.length;i++) {
                if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]*2+1)) {
                  if(!this.slots[i].is_optimal){
                    return `${this.slots[i].type[0].toUpperCase()}\n${this.slots[i].layer}`
                  }
                }
              }
              return ''
            }
          },
          itemStyle: {
            borderWidth: 0.3,
            borderType: "solid",
            borderColor: "#E2E2E2"
          },
          markArea: {
            silent:true,
            label: {
              position:"bottom"
            },
            data: []
          },
        }]
      },
    }
  },
  methods: {
    drawPartition() {
      this.option.yAxis.data = this.Channels
      this.$api.gateway.getPartition()
      .then(res=> {
        if(this.simOrReal=="Simulation") {
          res = {data:{data:this.res.partitions}}
        }

        this.partitions = res.data.data
        var markAreaTmp = []
        var colors = ['#313695', '#3C57A5', '#4778B6', '#6095C5', '#7AB2D4', '#97C9E0', '#B3DDEB', '#CFEBF3', '#E7F6EC', '#F7FCCE', '#FFF7B3','#FEE79A','#FED081','#FDB668','#FA9656','#F57446','#E85337','#D93328','#BF1927','#A50026']
        for(var i=0;i<res.data.data.length;i++) {
          // init beacon subslots
          if(res.data.data[i].type=="beacon") {
            for(var b=res.data.data[i].range[0];b<res.data.data[i].range[1];b++) {
              this.bcnSubslots[b] = {}
            }            
          }
          // partition size > 0
          if(res.data.data[i].range[0]<res.data.data[i].range[1]) {
            var name = res.data.data[i].type[0].toUpperCase()
            if(name!="B") name+=res.data.data[i].layer
            
            var y1=50, y2=230
            var pos = "insideBottom"
            if(name[0]=="U") {
              y1 = 50
              y2 = 140
              pos = "insideBottomRight"
            } else if(name[0]=="D") {
              y1 = 140
              y2 = 230
              pos = "insideBottomLeft"
            }
            this.links[name] = {name:name, used:0, non_optimal:0}
            markAreaTmp.push([
              {name:name,coord:[res.data.data[i].range[0],16],y:y1},
              {
                xAxis:res.data.data[i].range[1], 
                y:y2,
                yAxis:'9',
                itemStyle:{color:colors[Math.floor(i/res.data.data.length*colors.length)],opacity:0.5},
                label:{color:"black",fontWeight:"bold",fontSize:14, position:pos}
              }
            ])
          }
        }
        
        this.option.series[0].markArea.data = markAreaTmp
       
        // make sure partition is loaded
        this.drawSchedule()
      })
    },
    drawSchedule() {
      this.$api.gateway.getSchedule()
      .then(res => {
        if(this.simOrReal=="Simulation") {
          res = {data:{data:this.res.cells}}
          for(var x=0;x<res.data.data.length;x++) {
            res.data.data[x].type = res.data.data[x].cell.type
            res.data.data[x].layer = res.data.data[x].cell.layer
            res.data.data[x].sender = res.data.data[x].cell.sender
            res.data.data[x].receiver = res.data.data[x].cell.receiver
          }
        }
        

        this.nonOptimalCnt = 0
        var cellsTmp = []
        // if(!res.data.flag) return
        this.slots = res.data.data
        for(var i=0;i<res.data.data.length;i++) {
          var name = res.data.data[i].type[0].toUpperCase()
          if(res.data.data[i].type == "beacon") {
            res.data.data[i].layer = ""
          } 
          name+=res.data.data[i].layer

          if(this.links[name] == null) {
            this.links[name] = {name:name, used:0, non_optimal:0}
          }
          this.links[name].used+=1

          var tag = 0
          if(!res.data.data[i].is_optimal) {
            this.nonOptimalCnt++
            this.links[name].non_optimal+=1
            tag = 1
          }

          if(res.data.data[i].type=="beacon") {
            this.bcnSubslots[res.data.data[i].slot[0]][res.data.data[i].subslot[0]]=res.data.data[i].sender
          }

          cellsTmp.push([res.data.data[i].slot[0]+0.5,Math.floor(res.data.data[i].slot[1]/2),tag])
        }
        this.option.series[0].data = cellsTmp
      })
    },
    handleDPABt() {
      this.res = dpa()
      this.drawPartition()
    },
    handleAutoBt() {
      if(this.autoFlag==1) {
        this.autoFlag = 1-this.autoFlag
        clearInterval(this.auto)
        return
      } else {
        this.autoFlag = 1-this.autoFlag
      }
      
      this.auto = setInterval(()=>{
        this.res = dpa()
      },5000)
      
     
    },
    handleSwitch() {
      this.simOrReal = (this.simOrReal=="Simulation")?"Real":"Simulation"
      this.drawPartition()
    },
  },
  mounted() {
    this.$EventBus.$once("topo", (topo) => {
      this.res = init(topo)
      this.drawPartition()
    });
    
    this.$EventBus.$on("changed", (nodes) => {
      // window.console.log(nodes.length)
      change_topo(nodes)
      this.res = get_sch()
      this.drawPartition()
    });
    // setTimeout(()=>{
    //   this.res = get_sch()
    //   // this.partition_changes = get_partition_changes()
    //   this.drawPartition()
    // },1000)
  },
}
</script>

<style lang="stylus" scoped>
.bts
  float right
  .vs-button
    margin-left 10px
    font-size 0.8rem
    font-weight 600
#topo
  height 480px
  width 100%
  
.non-optimal
  font-weight 600
  color red
.partition-usage
  font-size 0.9rem
  #part
    margin-top 4px
#sch-table
  width 100%
  height 250px
</style>