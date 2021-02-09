<template>
  <vs-card>
    <span id="s">Total links: {{this.linksTotal}} </span>
    <ECharts id="pi" autoresize :options="option"/>
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/pie";
import "echarts/lib/component/legend";
import "echarts/lib/component/toolbox";
import "echarts/lib/component/tooltip";

export default {
  components: {
    ECharts
  },
  data() {
    return {
      links: {},
      linksTotal:0,
      option:{
        tooltip: {
          trigger: 'item'
        },
        legend: {
          top: '0%',
          left: 'left'
        },
        series: [
          {
            name: 'Links',
            type: 'pie',
            radius: ['30%', '90%'],
            // startAngle: 90,
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            itemStyle: {
              color:"orange"
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '30',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: []
          }
        ]
      }
    }
  },
  methods: {
    draw() {
      this.option.series[0].data = []
      this.linksTotal = 0
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
      for(var x in this.links) {
        this.linksTotal += this.links[x].used
        if(x=="Beacon") this.links[x].name="B"
        this.option.series[0].data.push(
          {
            name: this.links[x].name,
            value: this.links[x].used,
            itemStyle: {
              color: colorMap[x].rgb,
              opacity: 0.9
            }
          }
        )
      }
    }
  },
  mounted() {
    this.$EventBus.$on("links",(links)=>{
      this.links = links
      this.draw()
    })
  }
}
</script>

<style lang="stylus" scoped>
#s
  font-size 1.1rem
#pi
  margin-top 25px
  width 100%
  height 345px
</style>