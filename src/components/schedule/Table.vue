<template>
  <vs-row>
    <vs-col style="z-index:99" vs-offset="1" vs-w="10.4">  
      <vs-card>
        <div slot="header" style="text-align:center"><h4>Partition-based Scheduling</h4></div>
        <div class="partition-usage">
          <h3>{{this.slots.length}} links, {{nonOptimalCnt}} non-optimal</h3>
          <vs-row vs-type="flex" vs-justify="center">
            <vs-col id="part" vs-w="1" v-for="(l,i) in links" :key="i">
              {{l.name}}: {{l.used-l.non_optimal}}<span class="non-optimal" v-if="l.non_optimal>0">+{{l.non_optimal}}</span>
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
      links: {},
      bcnSubslots: {},
      nonOptimalCnt:0,
      nodes: [],
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
    draw() {
      this.option.yAxis.data = this.Channels
      
      
      this.$api.gateway.getPartition()
      .then(res=> {
        var colors = ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026','black','black','#a50026']
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

            this.links[name] = {name:name, used:0, non_optimal:0}

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
            var name = res.data.data[i].type[0].toUpperCase()
            if(res.data.data[i].type == "beacon") {
              res.data.data[i].layer = ""
            } 
            name+=res.data.data[i].layer

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

            this.option.series[0].data.push([res.data.data[i].slot[0]+0.5,Math.floor(res.data.data[i].slot[1]/2),tag])
          }
        })
      })
      
    },

  },
  mounted() {
    // setInterval(this.draw(),2000)
    this.draw()
  }
}
</script>

<style lang="stylus" scoped>
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
#sch-table-bcn
  margin-top -45px
  width 20%
  height 420px
</style>