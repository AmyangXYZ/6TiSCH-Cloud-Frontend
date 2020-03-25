<template>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col style="z-index:99" vs-offset="2" vs-w="8">  
        <vs-card>
          <ECharts id="chart" autoresize :options="option" />
        </vs-card>
      </vs-col>
    </vs-row> 
</template>

<script>
import ECharts from "vue-echarts/components/ECharts"
import "echarts/lib/chart/scatter"
import "echarts/lib/component/markLine";

export default {
  components: {
    ECharts
  },
  data() {
    return {
      nodes: [],
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
        series: [{
          symbolSize: 15,
          label: {
            show: true,
            color: 'black',
            fontSize:30,
            formatter: (item) => {
              for(var i=0;i<Object.keys(this.nodes).length;i++) {
                if(this.nodes[i].position[0] == item.data[0] && this.nodes[i].position[1] == item.data[1])
                  return i
              }
            }
          },
          itemStyle: {
            color: 'deepskyblue',
          },
          data: [],

          markLine: {
            animation: false,
            symbolSize: 8,
            lineStyle:{
              type: 'solid',
              width: 2.5,
              opacity:0.5,
              color: 'grey',
            },
            data:[]
          },
          type: 'scatter'
        }]
      }
    }
  },
  methods: {
    draw() {    
      this.option.series[0].data = []
      this.option.series[0].markLine.data = []
      // gen nodes
      this.nodes = {0:{parent:-1,position:[1,1]}}
      for(var i=1;i<50;i++) {
        var x=Math.round((18)*Math.random()+1)
        var y=Math.round((18)*Math.random()+1)
        this.nodes[i]={parent:-1,position:[x,y]}
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
              this.option.series[0].markLine.data.push([{coord:this.nodes[j].position},{coord:this.nodes[nearest_parent.id].position}])
            }
          }
        
          // not found, increase threshold
          threshold+=25
        }
        cur_layer++
      }

   

      // find parents
      // for(var j=0;j<Object.keys(this.nodes).length;j++) {
      //   var min=400, parent=0
      //   for(var k=0;k<Object.keys(this.nodes).length;k++) {
      //     if(k==j||this.nodes[k].parent==j) continue
      //     var distance = Math.pow(this.nodes[k].position[0]-this.nodes[j].position[0], 2) + Math.pow(this.nodes[k].position[1]-this.nodes[j].position[1], 2)
      //     if(distance<=min) {            
      //       min = distance
      //       parent = k
      //     }
      //   }
      //   this.nodes[j].parent = parent
      //   window.console.log(j,'->',parent)
      //   this.option.series[0].markLine.data.push([{coord:this.nodes[j].position},{coord:this.nodes[parent].position}])
      // }
        

      var tmpNodes = []
      for(var nn=0;nn<Object.keys(this.nodes).length;nn++) {
        tmpNodes.push(this.nodes[nn].position)
      }
      this.option.series[0].data = tmpNodes
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