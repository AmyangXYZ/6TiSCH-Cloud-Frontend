<template>

      <vs-card>
        <div slot="header" >
          <h4>Block</h4>
        </div>
        <ECharts id="sch-table" autoresize :options="option" @click="handleClickSch" />        
      </vs-card>

</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/heatmap";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/toolbox";
import "echarts/lib/component/legend";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/component/markArea";
import "echarts/lib/component/markLine";
import "echarts/lib/component/dataZoom";
import "echarts/lib/chart/graph"

import {init,get_sch,kick,get_scheduler} from './scheduler-sim.js'

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
          top: '18%',
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
            show: true,
            color: 'white',
            fontWeight: 'bold',
            fontSize: 12.5,
            formatter: (item) => {
              for(var i=0;i<this.slots.length;i++) {
                // if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]*2+1)) {
                if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]-0.5)) {
                  if(this.slots[i].type!="beacon"){
                    
                    return `${this.slots[i].sender}\n${this.slots[i].receiver}`
                    // return `${this.slots[i].layer}`
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
            symbolSize: 12,
            lineStyle: {
              color: "red",
              width: 5,
              type: "solid"
            },
            animationDuration: 300,
          },
          markArea: {
            silent:true,
            label: {
              position:"bottom"
            },
            data: [[
              {yAxis:1},{yAxis:17,itemStyle:{color:'#4575b4',opacity:0.2},}
            ]]
          },
        }]
      },
    }
  },
  methods: {
    drawPartition() {
      this.slots = []
      this.option.yAxis.data = this.Channels
      var colors = ['#4e92f5', '#b1d3fb']
      var markAreaTmp = []
      for(var b=0;b<25;b++) {
        markAreaTmp.push([
          {
            name:`${b}`,
            xAxis:b*5,
            yAxis: 1,
          },
          {
            xAxis:(b+1)*5, 
            yAxis: 17,
            itemStyle:{color:colors[b%2],opacity:0.5},
            label:{color:"black",fontWeight:"bold",fontSize:16, position:"insideBottom"}
          },
        ])
      }
      this.option.series[0].markArea.data = markAreaTmp
      this.drawSchedule()
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
          var name = res.data.data[i].type[0].toUpperCase()
          if(res.data.data[i].type == "beacon") {
            res.data.data[i].layer = ""
          } 
          name+=res.data.data[i].layer

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

          // if(res.data.data[i].type=="beacon") {
          //   this.bcnSubslots[res.data.data[i].slot[0]][res.data.data[i].subslot[0]]=res.data.data[i].sender
          // }

          cellsTmp.push([res.data.data[i].slot[0]+0.5,res.data.data[i].slot[1]+0.5,tag])
          // cellsTmp.push([res.data.data[i].slot[0]+0.5,Math.floor(res.data.data[i].slot[1]/2),tag])
        }
        this.option.series[0].data = cellsTmp
      })
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
        if(this.slots[i].sender == node && this.slots[i].type=="uplink") {
          return this.slots[i]
        }
      }
      return 0
    },
    update_sch() {
      this.res = get_sch()
    }
  },

  mounted() {
    window.table = this
    this.$EventBus.$emit("init",1)
    this.$EventBus.$on("topo", (topo) => {
      this.topo = topo.data
      this.seq = topo.seq
      this.res = init(topo.data, topo.seq)
      this.$EventBus.$emit("cells1",this.res.cells)
      // setTimeout(this.getCrossRowLinks,1000)
      this.drawSchedule()
      window.sch = get_scheduler()
    });
    
    this.$EventBus.$on("selectedNode", (node) => {
      this.option.series[0].markLine.data = []
      if(node==this.selectedCell.sender) {
        this.selectedCell = {slot:[]}
        return
      }
      for(var i=0;i<this.slots.length;i++) {
        if(this.slots[i].cell.sender==node) {
          var cell = this.slots[i]
          this.selectedCell = cell
          this.findPath(cell)
        }
      }
    })
    this.$EventBus.$on("kicked", (kicked) => {
      kick(kicked)
      
      this.res = get_sch()
      this.drawSchedule()
    })
    this.$EventBus.$on("clear", (clear) => {
      if(clear) {
        this.res = init(this.topo, this.seq)
        this.drawSchedule()
      }
    })
    this.$EventBus.$on("changed", () => {
      this.res = get_sch()
      this.$EventBus.$emit("cells1",this.res.cells)
      this.drawSchedule()
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
  font-size 0.9rem
  #part
    margin-top 4px
#sch-table
  width 100%
  height 550px
</style>