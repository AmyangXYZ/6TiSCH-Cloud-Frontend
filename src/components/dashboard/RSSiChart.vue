<template>
  <vs-card id="c-card">
    <ECharts class="rssi-chart" autoresize :options="option" />
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
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
      date: [],
      title: "RSSi",
      option: {
        tooltip: {
          trigger: "axis",
          position: function(pt) {
            return [pt[0], "10%"];
          }
        },
        title: {
          left: "left",
          text: this.title,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: this.date,
        },
        yAxis: {
          type: "value",
          boundaryGap: ['40%', '40%'],
          scale: true
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
        series: [
          {
            name: "RSSi",
            type: "line",
            smooth: true,
            symbol: "none",
            sampling: "average",
            itemStyle: {
              color: "rgb(255, 70, 131)"
            },
            data: this.data,
          }
        ]
      },
    };
  },
  methods: {
    drawRSSiChart(gw,id,range) {
      if (id!=0) {
        this.title = `RSSi of Sensor ${id}, ${gw}`;
      }

      this.$api.gateway.getNWStatByID(gw, id, range, 0)
      .then(res => {
        this.data = []
        this.date = []
        if(res.data.flag == 0) {
          return
        }
        for(var i=0; i<res.data.data.length; i++) {          
          this.data.push(res.data.data[i].avg_rssi)

          var d = new Date(res.data.data[i].timestamp)
          // time zone diff
          var curD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
          this.date.push(curD.toJSON().substr(5, 14).replace('T', ' '))
        }
        this.option.title.text = this.title
        this.option.xAxis.data = this.date
        this.option.series[0].data = this.data
      })
    }
  },
  mounted() {
    this.drawRSSiChart(this.selectedGW, this.selectedSensor, this.selectedRange);

    this.$EventBus.$on("selectedSensor", (sensor) => {
      this.selectedSensor = sensor.sensor_id
      this.selectedGW = sensor.gateway
      this.drawRSSiChart(this.selectedGW, this.selectedSensor, this.selectedRange);
    });
    this.$EventBus.$on("selectedRange", (range) => {
      this.selectedRange = range
      this.drawRSSiChart(this.selectedGW, this.selectedSensor, this.selectedRange);
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