<template>
    <vs-card>
      <!-- <div slot="header" >
        <h4>Communication Schedule</h4>
      </div> -->
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

// import sub_partitions from "./sub-partitions.json"
// import schedule from "./schedule.json"
// import partitions_harp from "./partitions_harp.json"
const SlotFrameLength = 127

export default {
  components: {
    ECharts,
  },
  data() {
    return {
      autorefresh:false,
      i:0,
      selectedCell: {slot:[]},
      Channels: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
      slots: [],
      subPartitions:[],
      partition_center: 0,
      bcnSubslots: {},
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
                // if(this.slots[i].type == "beacon") {
                //   var res = `[${item.data[0]-0.5}, ${item.data[1]-0.5}]<br/>
                //             Beacon<br/>
                //             Subslots<br/>`
                //   for(var sub in this.bcnSubslots[this.slots[i].slot[0]]) {
                //     var sub_text = sub.toString()
                //     sub_text = (sub_text.length<2) ? ("\xa0\xa0"+sub_text):sub_text
                //     res+=`${sub_text}\xa0\xa0-\xa0\xa0${this.bcnSubslots[this.slots[i].slot[0]][sub]}<br/>`
                //   }
                //   return res
                // }
                
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
          top: '18.5%',
          // height: '78%',
          left: '2.5%',
          right: '0.3%',
          bottom: "9%",
        },
        xAxis: {
          min:0,
          max:SlotFrameLength,
          splitNumber: SlotFrameLength,
          minInterval: 1,
          axisLabel: {
            formatter: (item)=>{
              if(item%5==0) 
                return item
            },
            fontSize: 11
          },
          name: "Slot Offset",
          type: 'value',
          position: "top",
          nameLocation: "middle",
          nameTextStyle: {
            fontWeight: "bold",
            padding: 10,
            fontSize: 14
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
          interval: 2,
          axisLabel: {
            // formatter: (item)=>{
            //   if(item%5==0) 
            //     return item
            // },
            fontSize: 11
          },
          inverse: true,
          nameLocation: "middle",
          nameTextStyle: {
            fontWeight: "bold",
            padding: 8,
            fontSize: 14
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
            color: ["red",'#4575b4', 'green']
          },
          pieces:[{min:-1,max:-1,label:"Beacon"},{min:0,max:0,label:"Uplink"},{min:1,max:1,label:"Downlink"},],
          textStyle: {
            fontSize:13,
          },
          position: 'top',
          orient: "horizontal",
          top: -5,
          right:"1%",
        },
        series: [
          {
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
            borderWidth: 0.1,
            borderType: "solid",
            borderColor: "black"
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
          
          },
          {
            type: "line",
            z: 999,
            zIndex: 999,
            markArea: {
              silent:true,
              label: {
                position:"bottom"
              },
              data: []
            }
          }
        ]
      },
    }
  },
  methods: {
    drawPartition() {
       this.slots = []
        this.option.yAxis.data = this.Channels
        this.$api.gateway.getPartitionHARP()
        .then(res=> {
          if(res.data.flag==0) return
          // res.data = partitions_harp
          // this.partitions = res.data.data
          var markAreaTmp = []
          // var colors = ['#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          // var colors = {}
          var colorMap = {
            "SHARED": {'rgb':'grey', opacity: 0.5},
            "BEACON":{'rgb':"orange", opacity:0.7},
            "MANAGEMENT":{'rgb':"lightseagreen", opacity:0.5},
            "DATA-UPLINK": {'rgb':"lightskyblue", opacity:0.5},
            "DATA-DOWNLINK": {'rgb':"#A1CD73", opacity:0.5},
          }
          // var color_index = 0
          for(var i=0;i<res.data.data.length;i++) {
            // init beacon subslots
            if(res.data.data[i].type=="beacon") {
              for(var b=res.data.data[i].range[0];b<res.data.data[i].range[1];b++) {
                this.bcnSubslots[b] = {}
              }            
            }
            if(res.data.data[i].type == "management")
              this.partition_center = (res.data.data[i].range[0]+res.data.data[i].range[1])/2

            if(res.data.data[i].range[0]<res.data.data[i].range[1]) {
              
              var name = res.data.data[i].type.toUpperCase()
              if(name=="UPLINK"||name=="DOWNLINK") name="DATA-"+name
              var y1 = 1
              var y2 = 17
              var pos = "bottom"
              
              markAreaTmp.push([
                {
                  name:name,
                  xAxis:res.data.data[i].range[0],
                  yAxis: y1,
                },
                {
                  xAxis:res.data.data[i].range[1], 
                  yAxis: y2,
                  itemStyle:{color:colorMap[name].rgb, opacity:colorMap[name].opacity,borderColor:"black",borderWidth:2},
                  label:{color:"black",fontWeight:"bold",fontSize:14.5, position:pos}
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
        // res.data = schedule
        if(res.data.flag==0) return
        
        // this.nonOptimalCnt = Object.keys(this.unAligned).length
        this.nonOptimalCnt = 0
        var cellsTmp = []
        // if(!res.data.flag) return
        this.slots = res.data.data
        for(var i=0;i<res.data.data.length;i++) {
          // res.data.data[i].layer++
          if(res.data.data[i].sender=="1" && res.data.data[i].receiver==2) {
            res.data.data.splice(i,1)
            i--
            continue
          }
          
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
          // if(this.bcnSubslots[res.data.data[i].slot[0]]!=null) {
          //   if(res.data.data[i].type=="beacon") {
          //     this.bcnSubslots[res.data.data[i].slot[0]][res.data.data[i].subslot[0]]=res.data.data[i].sender
          //   }
          // }

          cellsTmp.push([res.data.data[i].slot[0]+0.5,res.data.data[i].slot[1]+0.5,tag])
          // cellsTmp.push([res.data.data[i].slot[0]+0.5,Math.floor(res.data.data[i].slot[1]/2),tag])
        }
        this.option.series[0].data = cellsTmp

        for(var k in this.links) {
          if(this.links[k].used==0)
            delete this.links[k]
        }

        this.$EventBus.$emit("links", this.links)
      })
    },
    drawSubPartition() {
      this.$api.gateway.getSubPartitionHARP()
      .then(res => {
        // res.data = sub_partitions
        if(res.data.flag==0) return
        
        // window.console.log(sub_partitions)
        this.subPartitions = []
        this.option.series[1].markArea.data = []
        var up_colors = [ "#7DD5F7", "deepskyblue","cornflowerblue","royalblue","#0d3379"]
        var down_colors = ["#D9FF5B","#B9D40B", "#70AF1A", "#097609","#075807"]
        for(var i in res.data.data) {
          this.subPartitions.push(res.data.data[i])
          var sp = res.data.data[i].subpartition
          // var n = res.data.data[i]
          for(var l in sp) {
            // uplink
            var ts = sp[l][0]+6
            var te = sp[l][1]+6
            var cs = sp[l][2]
            var ce = sp[l][3]
              // if(l==1) {
              //   ts+=25
              // } else {
              //   ce+=6-l
              //   // te+=
              // }
            this.option.series[1].markArea.data.push([
              {
                // name:"U"+n.id+"-"+n.layer,
                xAxis:ts,
                yAxis: cs,
              },
              {
                xAxis:te, 
                yAxis: ce,
                itemStyle:{color:up_colors[l-1], opacity:1,borderColor:"black",borderWidth:1.5},
                label:{color:"black",fontWeight:"bold",fontSize:12, position:"inside"}
              },
            ])
            // downlink
            this.option.series[1].markArea.data.push([
              {
                // name:"D"+n.id+"-"+n.layer,
                xAxis:2*this.partition_center-sp[l][1]-6, 
                yAxis:sp[l][2],
              },
              {
                xAxis:2*this.partition_center-sp[l][0]-6,

                yAxis: sp[l][3],
                itemStyle:{color:down_colors[l-1], opacity:1,borderColor:"black",borderWidth:1.5},
                label:{color:"black",fontWeight:"bold",fontSize:12, position:"inside"}
              },
            ])
          }
        }
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
        if(parent==0) break
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
  },

  mounted() {
    this.drawPartition()
    setTimeout(this.drawSubPartition, 100)
    // setInterval(this.drawPartition, 10000)
    this.$EventBus.$on("autorefresh", (flag)=>{
      this.autorefresh = flag
    })
    setInterval(()=>{
      if(this.autorefresh) {
        this.drawPartition()
      }
    },5000)
  },
}
</script>

<style lang="stylus" scoped>
.bts
  float right
  .vs-button
    margin-left 10px
    font-size 0.7rem
    font-weight 600
  
.links
  text-align left 
  #name
    font-size 1rem
  #number
    font-size 1.2rem
#sch-table
  width 100%
  height 205px
</style>