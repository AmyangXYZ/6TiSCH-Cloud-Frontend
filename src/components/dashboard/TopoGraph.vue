<template>
  <ECharts id="graph" autoresize :options="option"/>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/tree";
import "echarts/lib/component/legend";
import "echarts/lib/component/toolbox";
import "echarts/lib/component/tooltip";

import t from "./topo.json"

export default {
  components: {
    ECharts
  },
  data() {
    return {
      selectedGW: "any",
      selectedRange: "week",
      selectedSensor: {},
      trees: {1:
        {
          name:"0", 
          children:[], 
          symbolSize: 22,
          label: {
            fontSize: 15
          }
        } 
      },
      option: {
        series: [
          {
            type: 'tree',
            data:[
              {name:"0",children:[]}
            ],
            top: '3%',
            left: '0%',
            bottom: '3%',
            right: '00%',
            roam: true,
            symbol:"circle",
            symbolSize: 22,
            orient: 'TB',
            itemStyle:{
              color: "lime"
            },
            label: {
              position: 'inside',
              verticalAlign: 'middle',
              // align: 'right',
              fontSize: 16,
              fontWeight: "bold",
              formatter: (item)=>{
                return ""+(item.data.name)
              },
            },
            lineStyle:{
              width:2,
            },
            leaves: {
                label: {
                    position: 'inside',
                    verticalAlign: 'middle',
                    // align: 'left'
                }
            },
            initialTreeDepth: 10,
            expandAndCollapse: true,
            animationDuration: 550,
            animationDurationUpdate: 750
          }
        ]
      }
    }
  },
  methods: {
    draw(gw, range) {
      this.$api.gateway.getTopology(gw, range)
      .then(res=> {
        
        // res.data.data = t
        window.console.log(t)
        // if (res.data.flag==0||res.data.data.length==0) return
        this.$EventBus.$emit('sensorCnt', res.data.data.length-1)
        
        for(var i=0;i<res.data.data.length;i++) {
          var node = res.data.data[i]
          if(node.sensor_id==1) {
            this.$EventBus.$emit('startTime', node.first_appear)
            continue
          }

          if(this.trees[node.sensor_id]==null) 
            this.trees[node.sensor_id] = {name: node.sensor_id, children:[]}
          if(this.trees[node.parent]==null)
            this.trees[node.parent] = { name: node.parent, children: [ this.trees[node.sensor_id] ] }
          else
            this.trees[node.parent].children.push(this.trees[node.sensor_id])
        }

        this.option.series[0].data = [this.trees[1]]
      })
    },

  },
  mounted() {
    this.draw(this.selectedGW, this.selectedRange)
  }
}
</script>

<style lang="stylus" scoped>
#graph
  width 100%
  height 526px
</style>

<!-- 
Edge to Tree, 1 loop

```go
package main

type node struct {
	name     int
	children []*node
}

func main() {
	var edges = [][2]int{{1, 0}, {2, 1}, {3, 1}, {4, 2}, {5, 4}, {6, 2}}
	trees := make(map[int]*node)

	for _, pair := range edges {
		c := pair[0]
		p := pair[1]
		if _, ok := trees[c]; !ok {
			trees[c] = &node{c, []*node{}}
		}
		if parent, ok := trees[p]; ok {
			parent.children = append(parent.children, trees[c])
		} else {
			trees[p] = &node{p, []*node{trees[c]}}
		}
	}
}
```
-->