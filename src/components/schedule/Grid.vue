<template>
    
    <vs-card>
      <ECharts ref="chart" @click="addNoiseByClick" id="chart" autoresize :options="option" />
      <div slot="footer">
        <vs-row vs-justify="flex-end">
          <vs-button color="danger" type="filled" @click="addNoiseCircleRand">Add</vs-button>
          <vs-button color="primary" type="filled" @click="clearNoise">Clear</vs-button>
        </vs-row>
        
      </div>
      
    </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts"
import "echarts/lib/chart/scatter"
import "echarts/lib/chart/effectScatter"
import "echarts/lib/component/markLine";
import nodes from "./topo-sim/100nodes/100nodes-5.json"
import noiseList from "./noiseList.json"

export default {
  components: {
    ECharts
  },
  data() {
    return {
      gwPos: [],
      size: 20,
      kicked: [],
      nodesNumber:101, // include gateway
      nodes: [],
      distanceTable: {},
      nonOptimal: [],
      join_seq: [],
      noisePos: [],
      noisePosList: [],
      noiseID: 0,
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
          max:25,
          interval:1,
        },
        yAxis: {
          min:0,
          max:25,
          interval:1,
        },
        markLine: {
          z: -1
        },
        series: [
          {
            symbolSize: 23,
            itemStyle: {
              color: 'deepskyblue',
            },
            data: [],
            label: {
              show: true,
              color: "black",
              fontSize: 17,
              formatter: (item)=> {
                for(var i=0;i<Object.keys(this.nodes).length;i++) {
                  if(this.nodes[i].position[0]==item.data[0] && this.nodes[i].position[1]==item.data[1]) {
                    return i
                  }
                }
              }
            },
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
            label: {
              show: true,
              fontSize: 18,
              formatter: ()=> {
                return "0"
              }
            },
            itemStyle: {
              color: 'purple',
              opacity:0.85,
            },
            symbolSize: 24,
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
      for(var a=0;a<=this.size;a++) {
        for(var b=0;b<=this.size;b++) {
          this.option.series[1].data.push([a,b])
        }
      }
      // gen gateway and nodes
      var xx=Math.round((this.size-10)*Math.random()+5)
      var yy=Math.round((this.size-10)*Math.random()+5)
      this.gwPos = [xx,yy]
      this.gwPos = nodes[0]
      // this.gwPos = [10,10]
      this.nodes = {0:{parent:-1,position:this.gwPos,layer:-1,path:[0]}}
      this.option.series[3].data = [this.gwPos]
      var pos_list = {}
      pos_list[this.gwPos[0]+'-'+this.gwPos[1]] = 1
      for(var i=1;i<this.nodesNumber;i++) {
        var x=Math.round((this.size-2)*Math.random()+1)
        var y=Math.round((this.size-2)*Math.random()+1)
        while(pos_list[x+'-'+y]!=null) {
          x=Math.round((this.size-2)*Math.random()+1)
          y=Math.round((this.size-2)*Math.random()+1)
        }
        pos_list[x+'-'+y] = 1
        this.nodes[i]={parent:-1,position:[x,y],layer:-1, path:[i]}
      }
      window.console.log(nodes[0])
    
      this.nodes = nodes
    
      for(var nn=0;nn<Object.keys(this.nodes).length;nn++) {
        this.option.series[0].data.push(this.nodes[nn].position)
      }
      
      // find parents
      this.findParents()
      
      setTimeout(()=>{this.$EventBus.$emit('topo', {data:this.nodes,seq:this.join_seq})},100)
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
      this.join_seq = []
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
              this.nodes[j].path = this.nodes[j].path.concat(this.nodes[nearest_parent.id].path)
              
              layers[cur_layer].push(j)
              this.join_seq.push(j)
              cnt++
              this.drawLine(j,nearest_parent.id)
            }
          }
        
          // not found, increase threshold
          threshold+=20
        }
        cur_layer++
      }
    },
    changeParents(kicked) {
      var changed = []
      for(var i=0;i<kicked.length;i++) {
        var node = kicked[i]
        // find new parent, nearest and low layer
        var distance_list = []
        
        var nearest_parent = {id:this.nodes[node].parent,d:1}
        
        // parent in blacklist or parent's cell is not optimal now
        if(this.blacklist.findIndex(n=>n.id===node)!=-1 || this.blacklist.findIndex(n=>n.id===this.nodes[node].parent)!=-1 
          || this.nonOptimal.indexOf(this.nodes[node].parent)!=-1) {
          for(var j=0;j<Object.keys(this.nodes).length;j++) {
            // itself
            if(node==j) continue
            // in blacklist, pass
            if(this.blacklist.findIndex(n=>n.id===j)!=-1) continue
            // parent's cell are not optimal
            if(this.nonOptimal.indexOf(j)!=-1) continue
            // higher layer, pass
            if(this.nodes[j].layer>=this.nodes[node].layer) continue
            // old parent, pass
            if(this.nodes[node].parent==j) continue
            // too far
            if((this.nodes[j].position[0]-this.nodes[node].position[0])>10 ||
              (this.nodes[j].position[1]-this.nodes[node].position[1])>10) continue
            
            var distance = Math.pow(this.nodes[j].position[0]-this.nodes[node].position[0], 2) + Math.pow(this.nodes[j].position[1]-this.nodes[node].position[1], 2)
            distance_list.push({id:j,d:distance})
          }
          // cannot find, don't change
          // layer 0 nodes

          if(distance_list.length<1) {
            nearest_parent = {id:this.nodes[node].parent,d:1}
          } else {
            nearest_parent = distance_list.sort((a, b)=>(a.d>b.d)?1:-1)[0]
          }
        }
        
        this.nodes[node].parent = nearest_parent.id
        this.nodes[node].layer = this.nodes[nearest_parent.id].layer+1
        changed.push({id:node, parent:this.nodes[node].parent, layer:this.nodes[node].layer})
        this.drawLine(node,nearest_parent.id)        
      }
      this.last_nodes = JSON.parse(JSON.stringify(this.nodes))
      
      this.$EventBus.$emit('changed',changed.sort((a, b)=>(a.layer>b.layer)?1:-1))
      // window.console.log(changed.length)
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
        this.noisePosList.push(param.value)
        window.console.log(this.noisePosList)
        this.respondToNoise('circle')
      }
    },
    addNoiseCircleRand() {
      var x = Math.round((20)*Math.random())
      var y = Math.round((20)*Math.random())
      if(this.noiseID<100) {
        x = noiseList[this.noiseID][0]
        y = noiseList[this.noiseID][1]
      }
      this.noiseID++
      this.noisePos = [x, y]
      // this.noisePosList.push([x,y])
      // window.console.log(this.noiseID,this.noiseList)
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
      this.$EventBus.$emit('clear', 1)
      this.findParents()
      
    },
    respondToNoise(type) {
      this.option.series[4].data = []
      var affected = []
      this.kicked = []
      this.blacklist = []
      if(type=="circle") {
        for(var i=0;i<Object.keys(this.nodes).length;i++) {
          var distance = Math.pow(this.nodes[i].position[0]-this.noisePos[0], 2) + Math.pow(this.nodes[i].position[1]-this.noisePos[1], 2)
          if(distance<=5&&i!=0) {
            var lv = 3
            if(distance<=4) lv = 2
            if(distance<=1) lv = 1
            affected.push({id:i,lv:lv})
            this.option.series[4].data.push(this.nodes[i].position)
            this.kickChildren(i)
          }
        }
      }
    
      this.option.series[4].data = Array.from(new Set(this.option.series[4].data))
      this.blacklist = affected.sort((a, b)=>(a.lv>=b.lv)?1:-1)
      
      // Deduplicate and sort by layer
      this.kicked = Array.from(new Set(this.kicked))
      var tmp = []
      for(var k=0;k<this.kicked.length;k++) {
        tmp.push({id:this.kicked[k],layer:this.nodes[this.kicked[k]].layer})
      }
      tmp.sort((a, b)=>(a.layer>=b.layer)?1:-1)
      this.kicked = []
      for(var kk=0;kk<tmp.length;kk++) {
        this.kicked.push(tmp[kk].id)
      }

      this.$EventBus.$emit('kicked', this.kicked)
      this.changeParents(this.kicked)
      // for(var j=0;j<this.kicked.length;j++) {
      //   setTimeout(this.changeParents,1000*j,[ this.kicked[j] ])
      // }
    },
    // kick the whole branch
    kickChildren(node) {
      for(var i=0;i<Object.keys(this.nodes).length;i++) {
        if(this.nodes[i].parent==node) {
          // this.nodes[i].parent = -1
          this.kicked.push(i)
          this.eraseLine(i, node)
          // this.kickChildren(i)
        }
      }
    }
  },
  mounted() {
    window.grid = this
    this.$EventBus.$on("init", (flag)=>{
      if(flag) this.draw()
    })
    this.$EventBus.$on("nonOptimal", (nodeId) => {
      this.nonOptimal.push(nodeId)
    })
    
  }
}
</script>

<style lang="stylus" scoped>
#chart
  width: 100%
  height 553px
</style>