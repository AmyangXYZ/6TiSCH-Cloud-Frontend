<template>

      <vs-card>
        <div slot="header" >
          <h4>Scheduler: HP 
            <!-- | <span style="text-decoration:underline;cursor:pointer;" @click="handleSwitch">{{simOrReal}}</span> -->
          <!-- <h4>Partition Scheduler -->
            <!-- <div v-if="simOrReal=='Simulation'" class="bts"> -->
              <!-- <vs-button color="danger" type="filled" @click="handleShuffleBt">Shuffle</vs-button> -->
              <!-- <vs-button color="primary" type="filled"  @click="handleIntraPartitionAdjustmentBt">Intra-Partition Adjustment</vs-button> -->
              <!-- <vs-button color="danger" type="filled"  @click="handleInterPartitionAdjustmentBt">Inter-Partition Adjustment</vs-button> -->
            <!-- </div> -->
            <div class="bts">
              <vs-button color="danger" type="filled"  @click="handleHPBt">Hierarchical Partitioning</vs-button>
            </div>  
          </h4>
          
        </div>
        <!-- <div class="partition-usage">
          
          <vs-row vs-type="flex" vs-justify="space-around" vs-w="12">
            <vs-col vs-w="2">
              <h3>{{this.slots.length}} links, {{nonOptimalCnt}} non-aligned</h3>
            </vs-col>
            <vs-col id="part" vs-w="0.5" v-for="(l,i) in links" :key="i">
              {{l.name}}: {{l.used-l.non_optimal}}<span class="non-optimal" v-if="l.non_optimal>0">+{{l.non_optimal}}</span>
            </vs-col>
          </vs-row>
          {{this.res.n1}} slots used, {{this.res.n2}} slots use multiple channels
        </div> -->
        <!-- <vs-divider/> -->
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

import {create_scheduler} from './scheduler-hp.js'

const SLOTFRAME = 80
const CHANNELS = [1,2,3,4,5,6,7,8]

export default {
  components: {
    ECharts,
  },
  data() {
    return {
      i:0,
      layer:0,
      selectedCell: {slot:[]},
      sch: {},
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
            // saveAsImage:{}
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
          top: '20%',
          // height: '78%',
          left: '3%',
          right: '1%',
          bottom: "7.5%",
        },
        xAxis: {
          min:0,
          max:SLOTFRAME,
          splitNumber: SLOTFRAME,
          minInterval: 1,
          axisLabel: {
            formatter: (item)=>{
              if(item%1==0) 
                return item
            },
            fontSize:10,
          },
          name: "Slot Offset",
          type: 'value',
          position: "top",
          nameLocation: "middle",
          nameTextStyle: {
            fontWeight: "bold",
            padding: 15,
            fontSize: 12
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
          max: CHANNELS.length+1,
          interval: 1,
          inverse: true,
          nameLocation: "middle",
          nameTextStyle: {
            fontWeight: "bold",
            padding: 10,
            fontSize: 12
          },
          data: [],
          splitArea: {
            show: true,
          },
          axisLabel: {
            fontSize:10,
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
            fontSize:12,
          },
          position: 'top',
          orient: "horizontal",
          top: 0,
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
              color: "yellow",
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
        },
        {
          type: 'line',
          markLine: {
            data: [],
            symbol: "pin",
            symbolSize: 8,
            lineStyle: {
              color: "red",
              width: 3,
              type: "solid"
            },
            label: {
              formatter: (item)=>{
                return "Slot "+ (item.data.coord[0]-0.5).toString()
              },
              fontSize:13
            },
            animationDuration:300,
            animationDurationUpdate: 500,
          },
        },
        {
          type: 'heatmap',
          data: [],
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
      this.option.series[0].markArea.data = []
      var colors = ['#1d71f2', "#4e92f5","#80b3f8", "#b1d3fb","#e3f4fe"]
      for(var i=0;i<Object.keys(this.sch.partitions[0].uplink).length;i++) {
        var partition = this.sch.partitions[0].uplink[i]
        this.option.series[0].markArea.data.push([
          {
            name:"U"+i,
            xAxis:partition.start,
            yAxis: 1,
          },
          {
            xAxis:partition.end, 
            yAxis: 17,
            itemStyle:{color:colors[i], opacity:0.55,borderColor:"black",borderWidth:0.1},
            label:{color:"black",fontWeight:"bold",fontSize:14, position:"insideBottom"}
          },
        ])
      }
    },
    drawSubPartition(subtree_root) {
      // var colors = []
      if(subtree_root == 0)
        this.option.series[2].markArea.data = []
      for(var i in this.sch.subpartitions[subtree_root]) {
        var subpartition = this.sch.subpartitions[subtree_root][i]
        this.option.series[2].markArea.data.push([
          {
            name:subtree_root.toString(),
            xAxis:subpartition.slot_range[0],
            yAxis: subpartition.channel_range[0],
          },
          {
            xAxis:subpartition.slot_range[1],
            yAxis: subpartition.channel_range[1],
            itemStyle:{color:'red', opacity:1,borderColor:"black",borderWidth:1.5},
            label:{color:"white",fontWeight:"bold",fontSize:13, position:"inside"}
          },
        ])
      }
    },
    drawSchedule() {
      this.option.series[0].data = []
      for(var i=0;i<this.sch.cell_list.length; i++) {
        var x = this.sch.cell_list[i]
        this.option.series[0].data.push([x.slot+0.5, x.channel+0.5, 0])
      }
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

    findSlot(node) {
      for(var i=0;i<this.slots.length;i++) {
        if(this.slots[i].cell.sender == node && this.slots[i].cell.type=="uplink") {
          return this.slots[i]
        }
      }
      return 0
    },
    handleHPBt() {
      if(this.layer > this.sch.toop_max_layer) return
      for(var n in this.sch.topo) {
        if(this.sch.topo[n].layer==this.layer) {
          this.drawSubPartition(n)
        }
      }
      this.layer++
      
    }
  },

  mounted() {
    window.table = this
    this.$EventBus.$emit("init",1)
    
    this.$EventBus.$on("topo", (topo) => {
      this.sch = create_scheduler(SLOTFRAME, CHANNELS)
      this.sch.set_topo(topo.data)
      var x = this.sch.find_idle_cell([1,2], {type:"beacon", layer:1})
      this.sch.add_cell(x)
      this.drawPartition()
      this.drawSubPartition(0)
      this.layer = 0
      this.$EventBus.$emit("topo_tree",this.sch.topo_tree)
      // this.drawSchedule()
      // this.$EventBus.$emit("cells1",this.res.cells)
    });
    

    
    
    this.$EventBus.$on("simulation_cur_slot", (slot)=>{
      this.option.series[1].markLine.data = [{xAxis:slot+0.5}]
    })
    this.$EventBus.$on("simulation_finish", ()=>{
      this.option.series[1].markLine.data = []
    })
  },
}
</script>

<style lang="stylus" scoped>
.bts
  float right
  .vs-button
    margin-bottom 10px
    font-size 0.7rem
    font-weight 600
#topo
  height 480px
  width 100%
  
.non-optimal
  font-weight 600
  color red
.partition-usage
  font-size 0.9rem
  text-align center
  #part
    margin-top 4px
#sch-table

  width 100%
  height 250px
</style>