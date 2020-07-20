<template>
  <vs-card>
    <div slot="header"><h4>DSR</h4></div>
    <ECharts autoresize :options="option"/>
  </vs-card>
</template>

<script>
import results from "./results"
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
import "echarts/lib/component/title";
import "echarts/lib/component/dataZoom";

export default {
  components: {
    ECharts
  },
  data() {
    return {
      option: {
        grid: {
          top: "8%",
          left: '8%',
          right: '10%',
          bottom: "5%",
          containLabel: true 
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          top: 8,
          right: '20%',
          data: ['Partitioning Scheduler', 'LLSF', 'Random Scheduler'],
          textStyle: {
            fontSize: 16,
          }
        },
        xAxis: {
          name: "Network Size",
          nameLocation: "center",
          nameGap: 30,
          type: 'category',
          data: [20,40,60,80,100,120,140,160],
          boundaryGap: [0, 0.01],
          nameTextStyle: {
            fontSize: 17,
            fontWeight: "bold"
          },
          axisLabel: {
            fontSize: 14
          }
        },
        yAxis: {
          name: "Deadline Satification Ratio (%)",
          nameLocation: "center",
          nameGap: 40,
          nameTextStyle: {
            fontSize: 17,
            fontWeight: "bold"
          },
          type: 'value',
          data: [],
          axisLabel: {
            fontSize: 14
          }
        },
        series: [
          {
            name: 'Partitioning Scheduler',
            type: 'line',
            // smooth: true,
            symbol: "rect",
            symbolSize: 12,
            lineStyle: {
              width: 3
            },
            data: []
          },
          {
            name: 'LLSF',
            type: 'line',
            // smooth: true,
            symbol: "diamond",
            symbolSize: 14,
            lineStyle: {
              width: 3
            },
            data: [],
          },
          {
            name: 'Random Scheduler',
            type: 'line',
            // smooth: true,
            symbol: "circle",
            symbolSize: 12,
            lineStyle: {
              width: 3
            },
            data: []
          },
        ]
      }
    }
  },
  methods: {
    drawDSR() {
      var avg_dsr_partition = []
      var avg_dsr_llsf = []
      var avg_dsr_random = []

      for(var i=0;i<8;i++) {
        var tmp_dsr_partition = 0
        var tmp_dsr_llsf = 0
        var tmp_dsr_random = 0
        for(var j=i*10;j<(i+1)*10;j++) {
          tmp_dsr_partition += (results.partition.dsr[j]*100)
          tmp_dsr_llsf += (results.llsf.dsr[j]*100)
          tmp_dsr_random += (results.random.dsr[j]*100)
        }
        avg_dsr_partition.push((tmp_dsr_partition/10).toFixed(3))
        avg_dsr_llsf.push((tmp_dsr_llsf/10).toFixed(3))
        avg_dsr_random.push((tmp_dsr_random/10).toFixed(3))
      }

      this.option.series[0].data = avg_dsr_partition
      this.option.series[1].data = avg_dsr_llsf
      this.option.series[2].data = avg_dsr_random
    },
  },
  mounted() {
    this.drawDSR()
  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 530px
</style>