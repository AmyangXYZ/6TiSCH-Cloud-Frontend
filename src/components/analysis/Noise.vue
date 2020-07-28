<template>
  <vs-card>
    <div slot="header"><h4>Noise Impact</h4></div>
    <ECharts autoresize :options="option"/>
  </vs-card>
</template>

<script>
import results from "./results-noise-new"
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
import "echarts/lib/component/title";

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
        xAxis: {
          name: "Noise Event",
          nameLocation: "center",
          nameGap: 30,
          type: 'category',
          data: [],
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
          name: "Number of changed parent nodes",
          nameLocation: "center",
          boundaryGap: [0, '10%'],
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
            name: 'Change parent nodes',
            type: 'bar',
            // smooth: true,
            symbol: "rect",
            symbolSize: 12,
            lineStyle: {
              width: 3
            },
            data: [],
          },
        ]
      }
    }
  },
  methods: {
    drawNoise() {
      for(var x=0;x<51;x++) this.option.xAxis.data.push(x)
      this.option.series[0].data = results.change_parent
    },
  },
  mounted() {
    this.drawNoise()
  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 530px
</style>