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
      topo: {1:0}, // {child: parent}
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
          if(res.data.data[i].sensor_id==1) {
            this.$EventBus.$emit('startTime', res.data.data[i].first_appear)
          } else {
            this.topo[res.data.data[i].sensor_id] = res.data.data[i].parent
          }
        }

        var maxHop = 0;

        for(var j=0;j<res.data.data.length;j++) {
          var node = res.data.data[j]
          if(node.sensor_id==1) {
            node.hop = 0
            continue
          }
          this.trees[node.sensor_id] = {name:node.sensor_id, children:[]}
          var parent = node.parent
          var hop = 1
          while(parent!=1) {
            parent = this.topo[parent]
            hop++
          }
          node.hop = hop
          maxHop = (maxHop>hop)?maxHop:hop
        }

        for(var cur_hop = maxHop;cur_hop>=1;cur_hop--) {
          for(var k=0;k<res.data.data.length;k++) {
            var n = res.data.data[k]
            if(n.hop == cur_hop) {
              this.trees[n.parent].children.push(
                this.trees[n.sensor_id]
              )
            }
          }
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