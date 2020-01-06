<template>
    <div ref="powChart"><ECharts  autoresize :options="option"/></div>
</template>

<script>
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
      selectedGW: 'any',
      selectedRange: 'day',
      selectedSensor: 3,
      date: [],
      data: [],
      option: {}
    }
  },
  methods: {
    draw(gw,id,range) {
      this.$vs.loading({
        container: this.$refs.powChart,
      })
      this.$api.gateway.getBatteryByID(gw,id,range)
      .then(res => {
        this.date = []
        this.data = []
        if(res.data.flag == 0) {
          return
        }
        for(var i=0;i<res.data.data.length;i++) {
          this.data.push(res.data.data[i].power_usage)

          var d = new Date(res.data.data[i].timestamp)
          // time zone diff
          var curD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
          this.date.push(curD.toJSON().substr(5, 14).replace('T', ' '))
        }
        this.option = {
          title: {
            text: "Power Usage",
            textStyle: {
              fontSize: 14,
            }
          },
          grid: {
            top: '-15',
            left:'-9',
            width: "170px",
            height: '100px'
          },
          xAxis: {
            show: false,
            type: 'category',
            data: this.date,
          },
          yAxis: {
            show: false,
            type: "value",
            boundaryGap: ['0%', '60%'],
            scale: true
          },
          series: [{
            data: this.data,
            smooth: true,
            type: 'line',
            areaStyle: {}
          }]
        }
        this.$vs.loading.close(this.$refs.powChart)
      })
    }
  },
  mounted() {
    this.$EventBus.$on("showPowerLayer", (sig) => {
      if(sig) {
        // this.draw(this.selectedGW, this.selectedSensor, this.selectedRange)
        this.$EventBus.$on("selectedSensor", (sensor) => {
          this.selectedSensor = sensor.sensor_id
          this.selectedGW = sensor.gateway
          this.draw(this.selectedGW, this.selectedSensor, this.selectedRange);
        });
        this.$EventBus.$on("selectedRange", (range) => {
          this.selectedRange = range
          this.draw(this.selectedGW, this.selectedSensor, this.selectedRange);
        });
      }
    })
    
  }
}

</script>

<style lang="stylus" scoped>
.echarts 
  width 140px
  height 90px
</style>