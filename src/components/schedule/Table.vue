<template>
  <vs-row>
    <vs-col style="z-index:99" vs-offset="1" vs-w="10.4">  
      <vs-card>
        <div slot="header"><h4>Partition-based Scheduling</h4></div>
        <div class="partition-usage">
          <h3>{{this.slots.length}} links, {{nonOptimalCnt}} non-optimal</h3>
          <h3>Partition usage:</h3>
          <vs-row vs-type="flex" vs-justify="space-around">
            <vs-col id="part" vs-w="1" v-for="(p,i) in partitions" :key="i">
              <span :class="{overflow:p.used>=p.size}">{{p.name}}:
              <span v-if="p.misaligned>0">({{p.used-p.misaligned}}+<span class="overflow">{{p.misaligned}}</span>)/{{p.size}}</span>
              <span v-else>{{p.used}}/{{p.size}}</span></span>
            </vs-col>
          </vs-row>
        </div>
        <vs-divider/>
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
      partitions: {},
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
          top: '10%',
          height: '78%',
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
          {
            start: 0,
            end: 100,
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
        visualMap: {
          min: 0,
          max: 1,
          show:true,
          type: 'piecewise',
          inRange: {
            color: ['#4575b4', '#d73027']
          },
          pieces:[{min:0,max:0,label:"Optimal"},{min:1,max:1,label:"Non-Optimal"}],
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
            formatter: (item) => {
              var layer = ""
              for(var i=0;i<this.slots.length;i++) {
                // axis ticks offset
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
            // 8 channels
            var times = 8
            var range = res.data.data[i].range[1]-res.data.data[i].range[0]
            var name = res.data.data[i].type[0].toUpperCase()
            if(name!="B") name+=res.data.data[i].layer
          
            // root(layer 0) cannot send/recv with multi devices at the same time
            if(res.data.data[i].layer==0) times = 1

            // beacon has 16 subslots
            if(name=="B") times=16

            this.partitions[name] = {name:name, start:res.data.data[i].range[0], end:res.data.data[i].range[1], size:range*times, used:0, misaligned:0}

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

        // make sure partition is loaded
        this.$api.gateway.getSchedule()
        .then(res => {
          this.slots = res.data.data

          for(var i=0;i<res.data.data.length;i++) {
            var name = ""
              for(let p in this.partitions) {
                if(this.partitions[p].start<=res.data.data[i].slot[0] &&
                  this.partitions[p].end>res.data.data[i].slot[0]) {
                  name = p
                }
              }
            this.partitions[name].used++

            var tag = 0
            if(!res.data.data[i].is_optimal) {
              this.nonOptimalCnt++
              tag = 1           
              this.partitions[name].misaligned++
            }

            if(res.data.data[i].type=="beacon") {
              this.bcnSubslots[res.data.data[i].slot[0]][res.data.data[i].subslot[0]]=res.data.data[i].sender
              this.optionBcn.series[0].data.push([res.data.data[i].slot[0]+0.5,res.data.data[i].subslot[0],0.15])
            }

            this.option.series[0].data.push([res.data.data[i].slot[0]+0.5,Math.floor(res.data.data[i].slot[1]/2),tag])
          }
        })
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
.overflow
  font-weight 600
  color red
.partition-usage
  font-size 0.9rem
  #part
    margin-top 4px
#sch-table
  width 100%
  height 550px
#sch-table-bcn
  margin-top -45px
  width 20%
  height 420px
</style>