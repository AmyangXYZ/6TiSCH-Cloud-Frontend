<template>
  <vs-card id="c-card">
    <ECharts autoresize :options="option" />
    </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/heatmap";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/component/dataZoom";

export default {
  components: {
    ECharts
  },
  data() {
    return {
      selectedSensor: 3,
      selectedGW: "UCONN_GW",
      selectedRange: "day",
      data: [],
      xData: [],
      yData: [],
      title: "RSSi",
      option: {}
    };
  },
  methods: {
    draw(gw,id,range) {
      if (id!=0) {
        this.title = `Channel-Level RSSI of Sensor ${id}, ${gw}`;
      }
      this.data = []
      this.xData = []
      this.yData = []
      this.$api.gateway.getChInfoByID(gw, id, range)
      .then(res=> {
        if(res.data.flag == 0) {
          return
        }
        for(var c=12;c<27;c++) this.yData.push(c)

        var min = parseInt(res.data.data[0].rssi.split(",")[0])
        var max = min

        for(var i=0;i<res.data.data.length;i++) {
          var d = new Date(res.data.data[i].timestamp)
          // time zone diff
          var curD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
          var t = curD.toJSON().substr(5, 14).replace('T', ' ')
          this.xData.push(t)

          for(var j=0;j<res.data.data[i].channels.split(",").length-1;j++) {
            this.data.push([t, parseInt(res.data.data[i].channels.split(",")[j])-12, parseFloat(res.data.data[i].rssi.split(",")[j])])
            var val = parseInt(res.data.data[i].rssi.split(",")[j])
            min = val>min?min:val
            max = val>max?val:max
          }
        }

        this.option = {
          title: {
            left: "left",
            text: this.title,
          },
          xAxis: {
            type: 'category',
            data: this.xData
          },
          yAxis: {
            type: 'category',
            data: this.yData
          },
          visualMap: {
            type: 'piecewise',
            min: min,
            max: max,
            calculable: true,
            realtime: false,
            inRange: {
                color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
            }
          },
          dataZoom: [
            {
              type: "inside",
              start: 0,
              end: 100,
            },
            {
              start: 0,
              end: 100,
              handleIcon:
                "M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z",
              handleSize: "80%",
              handleStyle: {
                color: "#fff",
                shadowBlur: 3,
                shadowColor: "rgba(0, 0, 0, 0.6)",
                shadowOffsetX: 2,
                shadowOffsetY: 2
              }
            }
          ],
          series: [{
            name: 'Gaussian',
            type: 'heatmap',
            data: this.data,
            itemStyle: {
                emphasis: {
                    borderColor: '#333',
                    borderWidth: 1
                }
            },
            progressive: 1000,
            animation: false
          }]
        }
      })
    }
  },
  mounted() {
    this.draw(this.selectedGW, this.selectedSensor, this.selectedRange);

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
};
</script>

<style lang="stylus" scoped>
#c-card 
  margin-top 22px
.echarts 
  width 100%
  height 237px
</style>