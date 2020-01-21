<template>
  <!-- <div slot="header"> -->
    <ECharts id="t" autoresize :options="option" />
  <!-- </div> -->
</template>

<script>
import ECharts from "vue-echarts/components/ECharts"
import "echarts/lib/chart/graph"


export default {
    components: {
      ECharts
    },
    data() {
      return {
        gw: "UCONN_GW",
        range: "hour",
        option: {},
        nodes: [],
        edges: [],
      }
    },
    methods: {
      draw() {
        var colorList = ['red','orange','yellow','lime','green']
        this.$api.gateway.getTopology(this.gw, this.range)
        .then(res=>{

          var nodes = res.data.data
          for(var i=0;i<nodes.length;i++) {
            if(nodes[i].sensor_id!=1) {
              var hop = 1
              var parent = nodes[i].parent
              var MaxHop = 10
              while(parent!=1&&MaxHop>=0) {
                for(var nn=0;nn<nodes.length;nn++) {
                  if(nodes[nn].sensor_id == parent) {
                    parent = nodes[nn].parent
                    hop++
                  }
                }
                MaxHop--
              }
              nodes[i].hop = hop
            } else {
              nodes[i].hop=0
            }

            

            var node = {
              id: nodes[i].sensor_id.toString(),
              value: nodes[i].sensor_id,
              symbolSize: 30-nodes[i].hop*3,
              draggable: true,
              label: {
                normal: {
                    show: true,
                    fontSize:17-nodes[i].hop*1,
                    color: "black"
                }
              },
              itemStyle: {
                color: colorList[nodes[i].hop],
              }
            }

            if(nodes[i].sensor_id==1) {
              node.fixed = true
              node.x = 600,
              node.y = 400
            }



            this.nodes.push(node)
            for(var j=0;j<res.data.data.length;j++) {
              if(res.data.data[j].sensor_id == res.data.data[i].parent) {
                this.edges.push({
                  source: res.data.data[i].sensor_id.toString(),
                  target: res.data.data[j].sensor_id.toString(),
                })
                break
              }
            }
          }
          this.option = {
            series: [{
              type: 'graph',
              layout: 'force',
              roam: true,
              // animation: true,
              draggable: true,
              label: {
                formatter: '{c}'
              },
              itemStyle: {
                // color: "black"
              },
              data: this.nodes,
              edges: this.edges,
              force: {
                    repulsion: 180
                }
            }]
          }
        })
      }
    },
    mounted() {
      this.draw()
    }
}
</script>

<style scoped>
#t {
  height: 900px;
  width: 1200px;
}
</style>