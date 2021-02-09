<template>
  <ECharts id="graph" autoresize :options="option"/>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/tree";
import "echarts/lib/component/legend";
import "echarts/lib/component/toolbox";
import "echarts/lib/component/tooltip";

// import t from "./topology_121_part.json"

export default {
  components: {
    ECharts
  },
  data() {
    return {
      selectedGW: "any",
      selectedRange: "day",
      selectedSensor: {},
      trees: {1:
        {
          name:1, 
          children:[], 
          symbolSize: 12,
          label: {
            fontSize: 14
          }
        } 
      },
      option: {
        series: [
          {
            type: 'tree',
            data:[
              {name:"1",children:[]}
            ],
            top: '1%',
            left: '7%',
            bottom: '1%',
            right: '20%',
            roam: true,
            symbolSize: 8,

            label: {
              position: 'left',
              verticalAlign: 'middle',
              align: 'right',
              fontSize: 13
            },

            leaves: {
                label: {
                    position: 'right',
                    verticalAlign: 'middle',
                    align: 'left'
                }
            },
            initialTreeDepth: 5,
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
        // res.data = t
        if (res.data.flag==0||res.data.data.length==0) return
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
  height 804px
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