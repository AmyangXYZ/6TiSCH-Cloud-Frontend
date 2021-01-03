<template>

      <vs-card>
        <div slot="header" >
          <h4>2D Partition Scheduler | <span style="text-decoration:underline;cursor:pointer;" @click="handleSwitch">{{simOrReal}}</span>
          <!-- <h4>Partition Scheduler -->
            <div v-if="simOrReal=='Simulation'" class="bts">
              <!-- <vs-button color="danger" type="filled" @click="handleShuffleBt">Shuffle</vs-button> -->
              <vs-button color="primary" type="filled"  @click="handleIntraPartitionAdjustmentBt">Intra-Partition Adjustment</vs-button>
              <!-- <vs-button color="danger" type="filled"  @click="handleInterPartitionAdjustmentBt">Inter-Partition Adjustment</vs-button> -->
            </div>
          </h4>
        </div>
        <div class="partition-usage">
          
          <!-- <vs-row vs-type="flex" vs-justify="space-around" vs-w="12">
            <vs-col vs-w="2">
              <h3>{{this.slots.length}} links, {{nonOptimalCnt}} non-aligned</h3>
              <h3>{{this.slots.length}} links</h3>
            </vs-col>
            <vs-col id="part" vs-w="0.5" v-for="(l,i) in links" :key="i">
              {{l.name}}: {{l.used-l.non_optimal}}<span class="non-optimal" v-if="l.non_optimal>0">+{{l.non_optimal}}</span>
            </vs-col>
          </vs-row> -->
          {{this.res.n1}} slots used, {{this.res.n2}} slots use multiple channels
        </div>
        <vs-divider/>
        <ECharts id="sch-table" autoresize :options="option" @click="handleClickSch" />        
      </vs-card>

</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/heatmap";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/legend";
import "echarts/lib/component/toolbox";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/component/markArea";
import "echarts/lib/component/markLine";
import "echarts/lib/component/dataZoom";
import "echarts/lib/chart/graph"

import {init1,inter_partition_adjustment, intra_partition_adjustment,dynamic_schedule,kick,get_sch,get_scheduler} from './schedule-dpa-sim.js'

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
      selectedCell: {slot:[]},
      auto: {},
      res: {},
      SlotFrameLength: 127,
      Channels: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
      slots: [],
      links: {},
      topo: [],
      seq:[],
      bcnSubslots: {},
      nonOptimalCnt:0,
      nonOptimalList: [],
      unAligned: {},
      option: {
        toolbox:{
          feature:{
            saveAsImage:{}
          }
        },
        tooltip: {
          formatter: (item) => {
            for(var i=0;i<this.slots.length;i++) {
              // if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]*2+1)) {
              if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]-0.5)) {
                if(this.slots[i].type == "beacon") {
                  var res = `[${item.data[0]-0.5}, ${item.data[1]-0.5}]<br/>
                            Beacon<br/>
                            Subslots<br/>`
                  for(var sub in this.bcnSubslots[this.slots[i].slot[0]]) {
                    var sub_text = sub.toString()
                    sub_text = (sub_text.length<2) ? ("\xa0\xa0"+sub_text):sub_text
                    res+=`${sub_text}\xa0\xa0-\xa0\xa0${this.bcnSubslots[this.slots[i].slot[0]][sub]}<br/>`
                  }
                  return res
                }
                // return `[${item.data[0]-0.5}, ${item.data[1]*2+1}]<br/>
                return `[${item.data[0]-0.5}, ${item.data[1]-0.5}]<br/>
                        ${this.slots[i].type.replace(/^\S/, s => s.toUpperCase())}<br/>
                        Layer ${this.slots[i].layer}<br/>
                        ${this.slots[i].sender} -> ${this.slots[i].receiver}`
              }
            }
            return item.data
          }
        },
        grid: {
          top: '15%',
          // height: '78%',
          left: '2.5%',
          right: '1%',
          bottom: "5%",
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
          type: 'value',
          min: 1,
          max: 17,
          interval: 1,
          inverse: true,
          nameLocation: "middle",
          nameTextStyle: {
            fontWeight: "bold",
            padding: 10,
            fontSize: 15
          },
          data: [],
          splitArea: {
            show: true,
          }
        },
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100  ,
          },
        ],
        visualMap: {
          min: 0,
          max: 1,
          show:true,
          type: 'piecewise',
          inRange: {
            color: ["green",'#4575b4', '#d73027']
          },
          pieces:[{min:-1,max:-1,label:"Beacon"},{min:0,max:0,label:"Uplink"},{min:1,max:1,label:"Downlink"},],
          textStyle: {
            fontSize:15,
          },
          position: 'top',
          orient: "horizontal",
          top: 6,
          right:"1%",
        },
        series: [{
          type: 'heatmap',
          data: [],
          label: {
            show: false,
            color: 'white',
            fontWeight: 'bold',
            fontSize: 14.5,
            formatter: (item) => {
              for(var i=0;i<this.slots.length;i++) {
                // if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]*2+1)) {
                if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]-0.5)) {
                  if(this.slots[i].type!="beacon"){
                    
                    return `${this.slots[i].sender}\n${this.slots[i].receiver}`
                  }
                }
              }
              return ''
            }
          },
          itemStyle: {
            borderWidth: 1.1,
            borderType: "solid",
            borderColor: "white"
          },
          markLine: {
            data: [],
            symbolSize: 8,
            lineStyle: {
              color: "red",
              width: 3,
              type: "solid"
            },
            animationDuration: 300,
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
      this.slots = []
      this.option.yAxis.data = this.Channels
      this.$api.gateway.getPartition()
      .then(res=> {
        if(this.simOrReal=="Simulation") {
          res = {data:{data:this.res.partitions}}
        }

        this.partitions = res.data.data
        var markAreaTmp = []
        // var colors = ['#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        // var colors = {}
        var colorMap = {
          "B":{'rgb':"#ffa000", opacity:0.5},
          "U1":{'rgb':"#1d71f2", opacity:0.6},
          "D1":{'rgb':"#ffff00", opacity:0.6},
          "U2":{'rgb':"#4e92f5", opacity:0.5},
          "D2":{'rgb':"#ffff60", opacity:0.6},
          "U3":{'rgb':"#80b3f8", opacity:0.5},
          "D3":{'rgb':"#ffff80", opacity:0.5},
          "U4":{'rgb':"#b1d3fb", opacity:0.5},
          "D4":{'rgb':"#ffffc0", opacity:0.5},
          "U5":{'rgb':"#e3f4fe", opacity:0.5},
          "D5":{'rgb':"#ffffee", opacity:0.5},
        }
        // var color_index = 0
        for(var i=0;i<res.data.data.length;i++) {
          // init beacon subslots
          if(res.data.data[i].type=="beacon") {
            for(var b=res.data.data[i].range[0];b<res.data.data[i].range[1];b++) {
              this.bcnSubslots[b] = {}
            }            
          }
          // partition size > 0
          res.data.data[i].layer++
          if(res.data.data[i].range[0]<res.data.data[i].range[1]) {
            var name = res.data.data[i].type[0].toUpperCase()
            if(name!="B") name+=res.data.data[i].layer
            // if(colorMap[name]==null) {
            //   colorMap[name] = colors[color_index%colors.length]
            //   color_index+=1
            // }
            var y1 = 1
            var y2 = 17
            var pos = "insideBottom"
            if(res.data.data[i].row==0 && res.data.data[i].type!="beacon") {
              y1 = 1
              y2 = 7
            } else if(res.data.data[i].row==1) {
              y1 = 7
              y2 = 13
            } else if(res.data.data[i].row==2) {
              y1 = 13
              y2 = 17
            }
            if(res.data.data[i].type=="uplink") {
              pos = "insideBottomLeft"
            } else {
              pos = "insideBottomRight"
            }
            this.links[name] = {name:name, used:0, non_optimal:0}
            markAreaTmp.push([
              {
                name:name,
                xAxis:res.data.data[i].range[0],
                yAxis: y1,
              },
              {
                xAxis:res.data.data[i].range[1], 
                yAxis: y2,
                itemStyle:{color:colorMap[name].rgb, opacity:colorMap[name].opacity,borderColor:"black",borderWidth:0.1},
                label:{color:"black",fontWeight:"bold",fontSize:16, position:pos}
              },
            ])
          }
        }
        markAreaTmp.push()
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
            res.data.data[x].row = res.data.data[x].cell.row
            res.data.data[x].type = res.data.data[x].cell.type
            res.data.data[x].layer = res.data.data[x].cell.layer
            res.data.data[x].sender = res.data.data[x].cell.sender
            res.data.data[x].receiver = res.data.data[x].cell.receiver
          }
        }

        // this.nonOptimalCnt = Object.keys(this.unAligned).length
        this.nonOptimalCnt = 0
        var cellsTmp = []
        // if(!res.data.flag) return
        this.slots = res.data.data
        for(var i=0;i<res.data.data.length;i++) {
          // res.data.data[i].layer++
          var name = res.data.data[i].type[0].toUpperCase()
          if(res.data.data[i].type == "beacon") {
            res.data.data[i].layer = ""
          } 
          name+=res.data.data[i].layer
          // if(res.data.data[i].layer>2) continue
          if(this.links[name] == null) {
            this.links[name] = {name:name, used:0, non_optimal:0}
          }
          this.links[name].used+=1

          var tag = 1
          if(res.data.data[i].type=="uplink") {
            // this.nonOptimalCnt++
            // this.unAligned[res.data.data[i].sender+'-'+res.data.data[i].receiver] = 1
            // this.links[name].non_optimal+=1
            tag = 0
          }
          if(res.data.data[i].type=="beacon") {
            tag = -1
          }
          if(this.bcnSubslots[res.data.data[i].slot[0]]!=null) {
            if(res.data.data[i].type=="beacon") {
              this.bcnSubslots[res.data.data[i].slot[0]][res.data.data[i].subslot[0]]=res.data.data[i].sender
            }
          }

          cellsTmp.push([res.data.data[i].slot[0]+0.5,res.data.data[i].slot[1]+0.5,tag])
          // cellsTmp.push([res.data.data[i].slot[0]+0.5,Math.floor(res.data.data[i].slot[1]/2),tag])
        }
        this.option.series[0].data = cellsTmp
      })
    },
    handleIntraPartitionAdjustmentBt() {
      this.res = intra_partition_adjustment(window.grid.nodes)
      this.drawPartition()
      if(this.selectedCell.slot.length>0) setTimeout(()=>{this.findPath(this.selectedCell)},800)
    },
    handleInterPartitionAdjustmentBt() {
      this.res = inter_partition_adjustment()
      this.drawPartition()
      if(this.selectedCell.slot.length>0) setTimeout(()=>{this.findPath(this.selectedCell)},300)
    },
    findPath(cell) {
      this.option.series[0].markLine.data = []
      // update cell
      for(var i=0;i<this.slots.length;i++) {
        if(this.slots[i].sender==cell.sender && this.slots[i].type=="uplink") {
          cell = this.slots[i] 
        }
      }
      // find children
      for(var j=0;j<this.slots.length;j++) {
        if(this.slots[j].receiver==cell.sender&&this.slots[j].type==cell.type) {
          this.option.series[0].markLine.data.push([{xAxis:this.slots[j].slot[0]+1, yAxis:this.slots[j].slot[1]+0.5}, {xAxis:cell.slot[0], yAxis:cell.slot[1]+0.5, lineStyle:{color:"lime", width:4}}])
        }
      }
      // find parent
      var parent = {}
      while(cell.receiver!=0) {
        parent = this.findSlot(cell.receiver)
        this.option.series[0].markLine.data.push([{xAxis:cell.slot[0]+1, yAxis:cell.slot[1]+0.5}, {xAxis:parent.slot[0], yAxis:parent.slot[1]+0.5}])
        cell = parent
      }  
    },
    handleClickSch(item) {
      this.option.series[0].markLine.data = []
      if((item.data[0]-0.5)==this.selectedCell.slot[0] && (item.data[1]-0.5)==this.selectedCell.slot[1]) {
        this.selectedCell = {slot:[]}
        return
      }
      var cell = {}
      for(var i=0;i<this.slots.length;i++) {
        if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]-0.5)) {
          cell = this.slots[i]
          this.selectedCell = cell
          this.findPath(cell)
        }
      }
    },
    handleSwitch() {
      this.simOrReal = (this.simOrReal=="Simulation")?"Real":"Simulation"
      this.drawPartition()
    },
    // getCrossRowLinks() {
    //   for(var i=0;i<this.slots.length;i++) {
    //     if(this.slots[i].type=="uplink" && this.slots[i].layer>0) {
    //       var parent = this.findSlot(this.slots[i].receiver)
    //       if(parent.row!=this.slots[i].row) {
    //         this.option.series[0].data.push([this.slots[i].slot[0]+0.5, this.slots[i].slot[1]+0.5,1])
    //       }
    //     }
    //   }
    // },
    findSlot(node) {
      for(var i=0;i<this.slots.length;i++) {
        if(this.slots[i].cell.sender == node && this.slots[i].cell.type=="uplink") {
          return this.slots[i]
        }
      }
      return 0
    },
    update_sch() {
      this.res = get_sch()
      this.drawPartition()
    }
  },

  mounted() {
    window.table = this
    this.$EventBus.$emit("init",1)
    if(this.simOrReal=="Simulation") {
      
      this.$EventBus.$on("topo", (topo) => {
        this.topo = topo.data
        this.seq = topo.seq
        this.res = init1(topo.data, topo.seq)
        this.$EventBus.$emit("cells1",this.res.cells)
        this.drawPartition()
        // setTimeout(this.getCrossRowLinks,1000)
        window.sch = get_scheduler()
      });
    } else {
      this.drawPartition()
    }
    
    this.$EventBus.$on("kicked", (kicked) => {
      kick(kicked)
      
      this.res = get_sch()
      // this.drawPartition()
    })
    this.$EventBus.$on("clear", (clear) => {
      if(clear) {
        window.console.log(1)
        this.res = init1(this.topo, this.seq)
        this.drawPartition()
      }
    })
    this.$EventBus.$on("changed", (nodes) => {
      // var node = nodes[0]
      for(var i=0;i<nodes.length;i++) dynamic_schedule(nodes[i])
      // if(!is_optimal) {
      //   this.$EventBus.$emit("nonOptimal", node.id)
      // }
      this.$EventBus.$emit("cells1",this.res.cells)
      this.res = get_sch()
      this.drawPartition()
      if(this.selectedCell.slot.length>0) setTimeout(()=>{this.findPath(this.selectedCell)},500)
    });
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
  font-size 1.2rem
  text-align center
  #part
    margin-top 4px
#sch-table
  width 100%
  height 450px
</style>