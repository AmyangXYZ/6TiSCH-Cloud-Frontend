<template>
    <vs-card>
      <div slot="header" >
        <h4>Communication Schedule</h4>
      </div>
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

export default {
  components: {
    ECharts,
  },
  data() {
    return {
      i:0,
      partition_changes: {},
      selectedCell: {slot:[]},
      SlotFrameLength: 127,
      Channels: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
      slots: [],
      links: {},
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
          top: '12%',
          // height: '78%',
          left: '3%',
          right: '1%',
          bottom: "3%",
        },
        xAxis: {
          min:0,
          max:127,
          splitNumber: 127,
          minInterval: 1,
          axisLabel: {
            formatter: (item)=>{
              if(item%5==0) 
                return item
            }
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
          interval: 1,
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
      for(var k in this.links) {
        this.links[k] = {name:k, used:0, non_optimal:0}
      }
      this.option.yAxis.data = this.Channels
      this.$api.gateway.getPartition()
      .then(res=> {
        this.partitions = res.data.data
        var markAreaTmp = [
          [
            {
              name:"Shared",
              xAxis:0,
              yAxis: 1,
            },
            {
              xAxis:8, 
              yAxis: 17,
              itemStyle:{color:"gray", opacity:0.4,borderColor:"black",borderWidth:0.1},
              label:{color:"black",fontWeight:"bold",fontSize:14, position:"insideBottom"}
            },
          ]
        ]
        // var colors = ['#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        // var colors = {}
        var colorMap = {
          "Beacon":{'rgb':"orange", opacity:0.6},
          "U1":{'rgb':"#1d71f2", opacity:0.6},
          "D1":{'rgb':"#5F9C3F", opacity:0.6},
          "U2":{'rgb':"#4e92f5", opacity:0.5},
          "D2":{'rgb':"#7BB662", opacity:0.6},
          "U3":{'rgb':"#80b3f8", opacity:0.5},
          "D3":{'rgb':"#F5BD1E", opacity:0.5},
          "U4":{'rgb':"#b1d3fb", opacity:0.5},
          "D4":{'rgb':"#FFE134", opacity:0.5},
          "U5":{'rgb':"#e3f4fe", opacity:0.6},
          "D5":{'rgb':"#FFF347", opacity:0.6},
          "U6":{'rgb':"#e3f4fe", opacity:0.4},
          "D6":{'rgb':"#FFF347", opacity:0.4},
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
            else name="Beacon"
            // if(colorMap[name]==null) {
            //   colorMap[name] = colors[color_index%colors.length]
            //   color_index+=1
            // }
            var y1 = 1
            var y2 = 17
            var pos = "insideBottom"
            if(res.data.data[i].row==0 && res.data.data[i].type!="beacon") {
              y1 = 1
              y2 = 11
            } else if(res.data.data[i].row==1) {
              y1 = 11
              y2 = 15
            } else if(res.data.data[i].row==2) {
              y1 = 15
              y2 = 17
            }
            if(res.data.data[i].type=="uplink") {
              pos = "insideBottomLeft"
            } else if(res.data.data[i].type=="downlink") {
              pos = "insideBottomRight"
            }
            
            var showLabelFlag = false
            if(res.data.data[i].row==0)
              showLabelFlag = true
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
                itemStyle:{color:colorMap[name].rgb, opacity:0.6,borderColor:"black",borderWidth:0.1},
                label:{show:showLabelFlag,color:"black",fontWeight:"bold",fontSize:14, position:pos}
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
          var name = res.data.data[i].type[0].toUpperCase()
          if(res.data.data[i].type == "beacon") {
            res.data.data[i].layer = ""
            name = "Beacon"
          } else {
            name+=res.data.data[i].layer+=1
          }
          
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

        for(var k in this.links) {
          if(this.links[k].used==0)
            delete this.links[k]
        }

        this.$EventBus.$emit("links", this.links)
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
        if(this.slots[i].cell.sender == node && this.slots[i].cell.type=="uplink") {
          return this.slots[i]
        }
      }
      return 0
    },
  },

  mounted() {
    this.drawPartition()
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
  
.links
  text-align left 
  #name
    font-size 1rem
  #number
    font-size 1.2rem
#sch-table
  width 100%
  height 350px
</style>