<template>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col style="z-index:99" vs-offset="2" vs-w="8">  
        <vs-card>
          <ECharts ref="chart" @click="addNoise" id="chart" autoresize :options="option" />
        </vs-card>
      </vs-col>
    </vs-row> 
</template>

<script>
import ECharts from "vue-echarts/components/ECharts"
import "echarts/lib/chart/scatter"
import "echarts/lib/chart/effectScatter"
import "echarts/lib/component/markLine";

export default {
  components: {
    ECharts
  },
  data() {
    return {
      nodes: [],
      noisePos: [],
      blacklist: [],
      option: {
        grid: {
          top: '5%',
          left: '8%',
          right: '8%',
        },
        xAxis: {
          min:0,
          max:20,
          interval:1,
        },
        yAxis: {
          min:0,
          max:20,
          interval:1,
        },
        series: [
        {
          symbolSize: 20,
          itemStyle: {
            color: 'deepskyblue',
          },
          data: [],

          markLine: {
            animation: false,
            silent:true,
            // symbolSize: 8,
            lineStyle:{
              type: 'solid',
              width: 2.5,
              opacity: 0.8,
              color: 'grey',
            },
            data:[]
          },
          type: 'scatter'
        },
        {
          type: 'scatter',
          data: [],
          itemStyle: {
            color: 'white',
            opacity:0,
          },
          symbolSize:20,
          // hoverAnimation: false
        },
        {
          type: 'effectScatter',
          symbolSize: 10,
          rippleEffect: {
            scale: 15
          },
          data: []
        },
        {
          type: 'scatter',
          data: [1,1],
          itemStyle: {
            color: 'blue',
            opacity:0.15,
          },
          symbolSize:30,
          hoverAnimation: false
        },
        {
          type: 'scatter',
          data: [],
          itemStyle: {
            color: 'red',
            opacity:0.4,
          },
          symbolSize:30,
          hoverAnimation: false
        }]
      }
    }
  },
  methods: {
    draw() {    
      this.option.series[0].data = []
      this.option.series[0].markLine.data = []
      // gen invisible node for click event
      for(var a=0;a<=20;a++) {
        for(var b=0;b<=20;b++) {
          this.option.series[1].data.push([a,b])
        }
      }

      // gen nodes
      this.nodes = {0:{parent:-1,position:[1,1]}}
      var pos_list = {'1-1':1}
      for(var i=1;i<100;i++) {
        var x=Math.round((18)*Math.random()+1)
        var y=Math.round((18)*Math.random()+1)
        while(pos_list[x+'-'+y]!=null) {
          x=Math.round((18)*Math.random()+1)
          y=Math.round((18)*Math.random()+1)
        }
        pos_list[x+'-'+y] = 1
        this.nodes[i]={parent:-1,position:[x,y]}
      }
      for(var nn=0;nn<Object.keys(this.nodes).length;nn++) {
        this.option.series[0].data.push(this.nodes[nn].position)
      }

      // find parents
      var layers = {0:[0]}
      var cur_layer = 1
      var cnt = 1
      while(cnt<Object.keys(this.nodes).length) {
        var threshold = 25
        layers[cur_layer] = []
        while(layers[cur_layer].length<1) {
          for(var j=1;j<Object.keys(this.nodes).length;j++) {
            // assigned
            if(this.nodes[j].parent!=-1) continue

            // distance to possible parents
            var distance_list = []
            for(var p=0;p<layers[cur_layer-1].length;p++) {
              var pp = layers[cur_layer-1][p]
              var distance = Math.pow(this.nodes[j].position[0]-this.nodes[pp].position[0], 2) + Math.pow(this.nodes[j].position[1]-this.nodes[pp].position[1], 2)
              distance_list.push({id:pp,d:distance})
            }
            var nearest_parent = distance_list.sort((a, b)=>(a.d>b.d)?1:-1)[0]

            if(nearest_parent.d<=threshold) {            
              this.nodes[j].parent = nearest_parent.id
              layers[cur_layer].push(j)
              cnt++

              this.drawLine([{coord:this.nodes[j].position},{coord:this.nodes[nearest_parent.id].position}])
            }
          }
        
          // not found, increase threshold
          threshold+=25
        }
        cur_layer++
      }
    },
    changeParent() {

    },
    drawLine(line) {
      this.option.series[0].markLine.data.push(line)
    },
    // eraseLine(link) {
    //   for(var i=0;i<this.option.series[0].markLine.data.length;i++) {
    //     var L = this.option.series[0].markLine.data[i]
    //     if(link[0].coord==L[0].coord && link[1].coord==L[1].coord) {
    //       this.option.series[0].markLine.data[i].splice(i,1)
    //       break
        
    //     }
    //   }
    // },
    addNoise(param) {
      if(this.noisePos[0]==param.value[0] && this.noisePos[1]==param.value[1]) {
        this.noisePos = []
        this.option.series[2].data = []
      } else {
        this.noisePos = param.value
        this.option.series[2].data = [param.value]
      }
      this.respondToNoise()
    },
    respondToNoise() {
      var affected = []
      this.option.series[4].data = []
      for(var i=0;i<Object.keys(this.nodes).length;i++) {
        var distance = Math.pow(this.nodes[i].position[0]-this.noisePos[0], 2) + Math.pow(this.nodes[i].position[1]-this.noisePos[1], 2)
        if(distance<=5&&i!=0) {
          var lv = 3
          if(distance<=4) lv = 2
          if(distance<=1) lv = 1
          affected.push({id:i,lv:lv})
          this.option.series[4].data.push(this.nodes[i].position)
        }
      }
      this.option.series[4].data = Array.from(new Set(this.option.series[4].data))
      this.blacklist = affected
    
      this.changeParents()
    }
  },
  mounted() {
    this.draw()
  }
}
</script>

<style lang="stylus" scoped>
#chart
  width: 100%
  height 800px
</style>