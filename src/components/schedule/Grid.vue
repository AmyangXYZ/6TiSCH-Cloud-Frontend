<template>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col style="z-index:99" vs-offset="3.5" vs-w="5">  
        <vs-card>
          <ECharts ref="chart" @click="addNoiseByClick" id="chart" autoresize :options="option" />
          <div style="float:right">
            <vs-button color="danger" type="filled" @click="addNoiseRand">Add</vs-button>
            <vs-button color="primary" type="filled" @click="clearNoise">Clear</vs-button>
          </div>
          
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
      nodesNumber:100,
      nodes: [],
      last_nodes:[],
      noisePos: [],
      blacklist: [],
      option: {
        grid: {
          top: '5%',
          left: '5%',
          right: '0%',
          bottom: '6%'
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
            symbolSize: 18,
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
          }
        ]
      }
    }
  },
  methods: {
    draw() {    
      this.option.series[0].data = []
      
      // gen invisible node for click event
      for(var a=0;a<=20;a++) {
        for(var b=0;b<=20;b++) {
          this.option.series[1].data.push([a,b])
        }
      }

      // gen nodes
      this.nodes = {0:{parent:-1,position:[1,1],layer:-1}}
      var pos_list = {'1-1':1}
      for(var i=1;i<this.nodesNumber;i++) {
        var x=Math.round((18)*Math.random()+1)
        var y=Math.round((18)*Math.random()+1)
        while(pos_list[x+'-'+y]!=null) {
          x=Math.round((18)*Math.random()+1)
          y=Math.round((18)*Math.random()+1)
        }
        pos_list[x+'-'+y] = 1
        this.nodes[i]={parent:-1,position:[x,y],layer:-1}
      }
      
      setTimeout(()=>{this.$EventBus.$emit('topo', this.nodes)},100)
      
      for(var nn=0;nn<Object.keys(this.nodes).length;nn++) {
        this.option.series[0].data.push(this.nodes[nn].position)
      }
      
      // find parents
      this.findParents()
    },
    findParents() {
      // reset
      this.option.series[0].markLine.data = []
      for(var ii=0;ii<Object.keys(this.nodes).length;ii++) {
        this.nodes[ii].parent = -1
      }
      // find parents
      var layers = {'-1':[0]}
      var cur_layer = 0
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
              this.nodes[j].layer = cur_layer
              layers[cur_layer].push(j)
              cnt++

              this.drawLine(j,nearest_parent.id)
            }
          }
        
          // not found, increase threshold
          threshold+=25
        }
        cur_layer++
      }

      var changed = []
      if(this.last_nodes.length<1) {
        this.last_nodes = JSON.parse(JSON.stringify(this.nodes))
      } else {
        // find different
        for(var nn=0;nn<Object.keys(this.nodes).length;nn++) {
          if(this.nodes[nn].parent!=this.last_nodes[nn].parent) {
            changed.push({id:nn,parent:this.nodes[nn].parent,layer:this.nodes[nn].layer})
          }
        }
        this.$EventBus.$emit("changed",changed)
      }
    },
    changeParents() {
      var changed = []
      for(var i=0;i<Object.keys(this.blacklist).length;i++) {
        for(var k=0;k<Object.keys(this.nodes).length;k++) {
          if(k==this.blacklist[i].id || this.nodes[k].parent==this.blacklist[i].id) {
            // find new parent, nearest and low layer
            var distance_list = []
            for(var j=0;j<Object.keys(this.nodes).length;j++) {
              // in blacklist, pass
              if(this.blacklist.findIndex(node=>node.id===j)!=-1||k==j) continue
              // higher layer, pass
              if(this.nodes[j].layer>=this.nodes[k].layer) continue
              // old parent, pass
              if(this.nodes[k].parent==j) continue

              var distance = Math.pow(this.nodes[j].position[0]-this.nodes[k].position[0], 2) + Math.pow(this.nodes[j].position[1]-this.nodes[k].position[1], 2)
              distance_list.push({id:j,d:distance})
            }
            // cannot find, don't change
            var nearest_parent = 0
            if(distance_list.length<1) {
              nearest_parent = {id:this.nodes[k].parent,d:1}
            } else {
              nearest_parent = distance_list.sort((a, b)=>(a.d>b.d)?1:-1)[0]
            }
            
            this.eraseLine(k,this.nodes[k].parent)
            this.nodes[k].parent = nearest_parent.id
            this.nodes[k].layer = this.nodes[nearest_parent.id].layer+1
            
            changed.push({id:k, parent:this.nodes[k].parent, layer:this.nodes[k].layer})
            this.drawLine(k,nearest_parent.id)        
          }
        }
      }
      this.last_nodes = JSON.parse(JSON.stringify(this.nodes))

      this.$EventBus.$emit('changed',changed)
    },
    drawLine(start,end) {
      this.option.series[0].markLine.data.push([{coord:this.nodes[start].position},{coord:this.nodes[end].position}])
    },
    eraseLine(start,end) {
      for(var i=0;i<this.option.series[0].markLine.data.length;i++) {
        var L = this.option.series[0].markLine.data[i]
        if(this.nodes[start].position==L[0].coord && this.nodes[end].position==L[1].coord) {
          this.option.series[0].markLine.data.splice(i,1)
          return
        }
      }
    },
    addNoiseByClick(param) {
      this.$EventBus.$emit('topo', this.nodes)
      if(this.noisePos[0]==param.value[0] && this.noisePos[1]==param.value[1]) {
        
        this.clearNoise()
      } else {
        this.noisePos = param.value
        this.option.series[2].data = [param.value]
        this.respondToNoise()
      }
    },
    addNoiseRand() {
      var x = Math.round((20)*Math.random())
      var y = Math.round((20)*Math.random())
      this.noisePos = [x, y]
      this.option.series[2].data = [[x, y]]
      this.respondToNoise()
    },
    clearNoise() {
      this.noisePos = []
      this.option.series[2].data = []
      this.blacklist = []
      this.option.series[4].data = []
      this.findParents()
      
    },
    respondToNoise() {
      this.option.series[4].data = []
      // distance between node/link to noise center  < sqrt(5)
      var affected = []

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
  width: 80%
  height 500px
</style>