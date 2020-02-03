<template>
  <vs-row>
    <vs-col style="z-index:99" vs-offset="1" vs-w="10.4">  
    <vs-card>
      <div slot="header"><h4>Partition-based Scheduling</h4></div>
      <ECharts id="sch-table" autoresize :options="option"/>
    </vs-card>
    </vs-col>
  </vs-row> 
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/heatmap";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/tooltip";
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
      option: {
        tooltip: {
          formatter: (item) => {
            for(var i=0;i<this.slots.length;++i) {
              if(this.slots[i].slot[0]==item.data[0] && this.slots[i].slot[1]==(item.data[1]*2+1)) {
                return `${this.slots[i].sender}->${this.slots[i].receiver}`
              }
            }
            return item.data
          }
        },
        grid: {
          height: '60%',
          top: 'middle',
          left: '5%',
          right: '5%',
          
        },
        xAxis: {
          max:127,
          name: "Slot Offset",
          type: 'category',
          position: "top",
          nameLocation: "middle",
          nameTextStyle: {
            fontWeight: "bold",
            padding: 10,
            fontSize: 15
          },
          data: [],
          splitArea: {
            show: true,
            interval: 0
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
          max: 10,
          // splitNumber: 11,
          type: 'piecewise',
          inRange: {
            color: [ '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027']
          },
          position: 'top',
          orient: "horizontal",
          top: 20,
          left: 'center',
        },
        series: [{
          name: 'Punch Card',
          type: 'heatmap',
          data: [],
          markArea: {
            silent:true,
            data: []
          },
          label: {
            show: true,
            color:"black",
            formatter: (item) => {
              // for(var i=0;i<this.slots.length;i++) {
              //   if(this.slots[i].slot[0]==item.data[0] && this.slots[i].slot[1]==(item.data[1]*2+1)) {
              //     return this.slots[i].type[0].toUpperCase()
              //   }
              // }
              // return item.data
              window.console.log(item)
              // return `${this.partition[item.data[2]].type[0].toUpperCase()}${this.partition[item.data[2]].layer}`
              return ''
            }
          },
        }]
      }
    }
  },
  methods: {
    draw() {
      for(var x=0;x<this.SlotFrameLength;x++) {
        this.option.xAxis.data.push(x)
      }
      this.option.yAxis.data = this.Channels
      
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
                itemStyle:{color:colors[i],opacity:0.5},
                label:{position:"bottom",color:"black",fontWeight:"bold",fontSize:14}
              }
            ])
          }
        }
      })

      // this.$api.gateway.getSchedule()
      // .then(res => {
      //   for(var x=0;x<this.SlotFrameLength;x++) {
      //     this.option.xAxis.data.push(x)
      //   }
      //   this.option.yAxis.data = this.Channels
      //   this.slots = res.data.data
      //   for(var i=0;i<res.data.data.length;i++) {
      //     var tag = 8
      //     if(res.data.data[i].type=="beacon") {
      //       tag = 1
      //     }
      //     if(!res.data.data[i].is_optimal) {
      //       tag = 10
      //     }

      //     this.option.series[0].data.push([res.data.data[i].slot[0],Math.floor(res.data.data[i].slot[1]/2),tag])
      //   }
         
      // })
    }
  },
  mounted() {
    this.draw()
  }
}
</script>

<style lang="stylus" scoped>
#sch-table
  width 100%
  height 500px
</style>