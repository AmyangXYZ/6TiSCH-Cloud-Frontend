<template>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col style="z-index:99" vs-offset="4" vs-w="4">  
        <vs-card>
          <ECharts ref="chart" @click="addNoiseByClick" id="chart" autoresize :options="option" />
          <div slot="footer">
            <vs-row vs-justify="flex-end">
              <vs-button color="danger" type="filled" @click="addNoiseCircleRand">Add</vs-button>
              <vs-button color="primary" type="filled" @click="clearNoise">Clear</vs-button>
            </vs-row>
            
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
      gwPos: [],
      nodesNumber:140,
      nodes: [],
      change_log: [],
      last_nodes:[],
      noisePos: [],
      blacklist: [],
      option: {
        grid: {
          top: '5%',
          left: '5%',
          right: '5%',
          bottom: '5%'
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
        markLine: {
          z: -1
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
              symbolSize:10,
              lineStyle:{
                type: 'solid',
                width: 2.5,
                opacity: 0.7,
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
            symbolSize: 11,
            rippleEffect: {
              scale: 12
            },
            data: []
          },
          {
            type: 'scatter',
            data: [],
            itemStyle: {
              color: 'purple',
              opacity:0.85,
            },
            symbolSize: 21,
            hoverAnimation: false
          },
          {
            type: 'scatter',
            data: [],
            itemStyle: {
              color: 'red',
              opacity:0.4,
            },
            symbolSize:25,
            hoverAnimation: false
          },
          {
            type: 'effectScatter',
            symbolSize: 10,
            rippleEffect: {
              color: "red",
              scale: 4,
            },
            itemStyle: {
              color: "red"
            },
            symbol: 'rect',
            animation: false,
            data: []
          },
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

      // gen gateway and nodes
      var xx=Math.round((18)*Math.random()+1)
      var yy=Math.round((18)*Math.random()+1)
      this.gwPos = [xx,yy]
      // this.gwPos = [1,1]
      this.nodes = {0:{parent:-1,position:this.gwPos,layer:-1}}
      this.option.series[3].data = [this.gwPos]

      var pos_list = {}
      pos_list[this.gwPos[0]+'-'+this.gwPos[1]] = 1
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
        var threshold = 20
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
          threshold+=20
        }
        cur_layer++
      }

      var changed = []
      if(this.last_nodes.length<1) {
        this.last_nodes = JSON.parse(JSON.stringify(this.nodes))
      } else {
        // find difference
        for(var nn=0;nn<Object.keys(this.nodes).length;nn++) {
          if(this.nodes[nn].parent!=this.last_nodes[nn].parent) {
            changed.push({id:nn,parent:this.nodes[nn].parent,layer:this.nodes[nn].layer})
          }
        }
        this.$EventBus.$emit("changed",changed)
        this.last_nodes = JSON.parse(JSON.stringify(this.nodes))
      }
    },
    changeParents() {
      var changed = []
      for(var i=0;i<this.blacklist.length;i++) {
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
        this.respondToNoise('circle')
      }
    },
    addNoiseCircleRand() {
      var x = Math.round((20)*Math.random())
      var y = Math.round((20)*Math.random())
      this.noisePos = [x, y]
      this.option.series[2].data = [[x, y]]
      this.respondToNoise('circle')
    },
    addNoiseRectRand() {
      this.option.series[5].data = []
      var x = Math.round((20)*Math.random())
      var y = Math.round((20)*Math.random())
      var length = Math.round((3)*Math.random()+2)
      var direction = Math.round(1*Math.random())
      if(direction) {
        for(var i=0;i<length;i++) {
          this.option.series[5].data.push([x+i+0.5,y+0.5])
        }
      } else {
        for(var j=0;j<length;j++) {
          this.option.series[5].data.push([x+0.5,y+j+0.5])
        }
      }
      this.respondToNoise('rect')
    },
    clearNoise() {
      this.noisePos = []
      this.option.series[2].data = []
      this.blacklist = []
      this.option.series[4].data = []
      this.option.series[5].data = []
      this.findParents()
      
    },
    // respondToNoise() {
    respondToNoise(type) {
      this.option.series[4].data = []
      var affected = []
      if(type=="circle") {
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
      }
      if(type=="rect") {
        for(var j=0;j<Object.keys(this.nodes).length;j++) {
          for(var k=0;k<this.option.series[5].data.length;k++) {
            if(Math.abs(this.nodes[j].position[0]-this.option.series[5].data[k][0])<1 &&
              Math.abs(this.nodes[j].position[1]-this.option.series[5].data[k][1])<1) {
              affected.push({id:j,lv:1})
              this.option.series[4].data.push(this.nodes[j].position)
              break
            }
          }
        }
      }
      this.option.series[4].data = Array.from(new Set(this.option.series[4].data))
      this.blacklist = affected.sort((a, b)=>(a.lv>=b.lv)?1:-1)
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
  width: 90%
  height 500px
</style>