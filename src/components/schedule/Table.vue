<template>
  <vs-row>
    <vs-col style="z-index:99" vs-offset="1" vs-w="10.4">  
    <vs-card>
      <div slot="header"><h4>Partition-based Scheduling</h4></div>
      <h3>{{this.slots.length}} links, {{nonOptimalCnt}} non-optimal</h3>
      <ECharts id="sch-table" autoresize :options="option"/>
      <!-- <ECharts id="sch-table-bcn" autoresize :options="optionBcn"/> -->
    </vs-card>
    </vs-col>
  </vs-row> 
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/heatmap";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/component/markArea";
import "echarts/lib/component/dataZoom";

export default {
  components: {
    ECharts
  },
  data() {
    return {
      SlotFrameLength: 127,
      Channels: [1,3,5,7,9,11,13,15],
      slots: [],
      bcnSubslots: {},
      nonOptimalCnt:0,
      nodes: [],
      option: {
        tooltip: {
          formatter: (item) => {
            var layer = ""
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
                if(this.slots[i].sender==1 || this.slots[i].type == "beacon") {
                  layer = 0
                }
                else {
                  for(var j=0;j<this.nodes.length;j++) {
                    if(this.nodes[j].sensor_id==this.slots[i].sender) {
                      if(this.slots[i].type=="uplink") layer = this.nodes[j].hop-1
                      else layer = this.nodes[j].hop
                    }
                  }
                }
                return `[${item.data[0]-0.5}, ${item.data[1]*2+1}]<br/>
                        ${this.slots[i].type.replace(/^\S/, s => s.toUpperCase())}<br/>
                        Layer ${layer}<br/>
                        ${this.slots[i].sender} -> ${this.slots[i].receiver}`
              }
            }
            return item.data
          }
        },
        grid: {
          top: '12%',
          height: '70%',
          left: '4%',
          right: '3%',
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
          pieces:[{min:0,max:0,label:"optimal"},{min:1,max:1,label:"non-optimal"}],
          textStyle: {
            fontSize:15,
          },
          position: 'top',
          orient: "horizontal",
          top: -2,
          left: 'right',
        },
        series: [{
          type: 'heatmap',
          data: [],
          label: {
            show: true,
            color: 'white',
            fontWeight: 'bold',
            formatter: (item) => {
              var layer = ""
              for(var i=0;i<this.slots.length;i++) {
                if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]*2+1)) {
                  if(!this.slots[i].is_optimal){
                    if(this.slots[i].sender==1 || this.slots[i].type == "beacon") {
                      layer = 0
                    }
                    else {
                      for(var j=0;j<this.nodes.length;j++) {
                        if(this.nodes[j].sensor_id==this.slots[i].sender) {
                          if(this.slots[i].type=="uplink") layer = this.nodes[j].hop-1
                          else layer = this.nodes[j].hop
                        }
                      }
                    }
                    return `${this.slots[i].type[0].toUpperCase()}\n${layer}`
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
      optionBcn: {
        grid: {
          top: "18%",
          left: "19%"
        },
        title: {
          text: "Beacon partition (with subslot)",
          left: "3%",
        },
        tooltip: {
          formatter: (item) => {
            for(var i=0;i<this.slots.length;i++) {
              if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].slot[1]==(item.data[1]*2+1)) {
                return `[${item.data[0]-0.5}, ${item.data[1]*2+1}]<br/>
                        ${this.slots[i].type.replace(/^\S/, s => s.toUpperCase())}<br/>
                        ${this.slots[i].sender} -> ${this.slots[i].receiver}`
              }
            }
            return item.data
          }
        },
        xAxis: {
          min:5,
          max:14,
          splitNumber: 9,
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
          name: "Period Offset",
          type: 'category',
          inverse: true,
          nameLocation: "middle",
          nameTextStyle: {
            fontWeight: "bold",
            padding: 10,
            fontSize: 15
          },
          data: [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
          splitArea: {
            show: true
          }
        },
        visualMap: {
          min: 0,
          max: 1,
          show:false,
          // type: 'piecewise',
          inRange: {
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          },
        },
        series: [{
          type: 'heatmap',
          data: [],
          label: {
            show: true,
            color: 'white',
            fontWeight: 'bold',
            formatter: (item) => {
              for(var i=0;i<this.slots.length;i++) {
                if(this.slots[i].slot[0]==(item.data[0]-0.5) && this.slots[i].subslot[0]==(item.data[1])) {
                  return `${this.slots[i].sender}`
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
        }]
      },
    }
  },
  methods: {
    draw() {
      this.option.yAxis.data = this.Channels
      
      for(var i=5;i<14;i++) {
        this.bcnSubslots[i] = {}
      }

      this.$api.gateway.getPartition()
      .then(res=> {
        var colors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026','black','black','#a50026']

        for(var i=0;i<res.data.data.length;i++) {
          // partition size > 0
          if(res.data.data[i].range[0]<res.data.data[i].range[1]) {
            var name = res.data.data[i].type[0].toUpperCase()
            if(name!="B") name+=res.data.data[i].layer
            this.option.series[0].markArea.data.push([
              {name:name,xAxis:res.data.data[i].range[0]},
              {
                xAxis:res.data.data[i].range[1], 
                itemStyle:{color:colors[i+1],opacity:0.5},
                label:{color:"black",fontWeight:"bold",fontSize:14}
              }
            ])
          }
        }
      })

      this.$api.gateway.getSchedule()
      .then(res => {
        this.slots = res.data.data
        for(var i=0;i<res.data.data.length;i++) {
          var tag = 0
          if(!res.data.data[i].is_optimal) {
            this.nonOptimalCnt++
            tag = 1
          }

          if(res.data.data[i].type=="beacon") {
            this.bcnSubslots[res.data.data[i].slot[0]][res.data.data[i].subslot[0]]=res.data.data[i].sender
            this.optionBcn.series[0].data.push([res.data.data[i].slot[0]+0.5,res.data.data[i].subslot[0],0.15])
          }

          this.option.series[0].data.push([res.data.data[i].slot[0]+0.5,Math.floor(res.data.data[i].slot[1]/2),tag])
        }
      })
    },
    getLayer() {
      this.$api.gateway.getTopology('any', 'hour')
      .then(res=>{
        if(res.data.flag>0) {
          var nodes = res.data.data
          for(var n=0;n<nodes.length;n++) {
            if(nodes[n].sensor_id!=1) {
              var hop = 1
              var parent = nodes[n].parent
              var MaxHop = 10
              while(parent!=1&&MaxHop>=0) {
                for(var nn=0;nn<nodes.length;nn++) {
                  if(nodes[nn].sensor_id == parent) {
                    parent = nodes[nn].parent
                    hop++
                  }
                }
                MaxHop--
              }
              nodes[n].hop = hop
            }
          }
          this.nodes = nodes
        }
        this.draw()
      })
      
    }
  },
  mounted() {
    // draw() is called in getLayer, to make sure layers info is ready
    this.getLayer()
  }
}
</script>

<style lang="stylus" scoped>
#sch-table
  width 100%
  height 550px
#sch-table-bcn
  margin-top -45px
  width 20%
  height 420px
</style>