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
      option: {}
    };
  },
  methods: {
    drawRSSiChart(gw,id,range,adv) {
      var cTitle = "RSSi";
      if (id!=0) {
        cTitle = `RSSi of Sensor ${id}, ${gw}`;
      }
      var data = []
      var date = []
      this.$api.gateway.getNWStatByID(gw, id, range, adv)
      .then(res => {
        if(res.data.flag == 0) {
          
          return
        }
        for(var i=0; i<res.data.data.length; i++) {
          data.push(res.data.data[i].avg_rssi)

          var d = new Date(res.data.data[i].timestamp)
          date.push(d.toJSON().substr(5, 14).replace('T', ' '))
        }
      })

      this.option = {
        tooltip: {
          trigger: "axis",
          position: function(pt) {
            return [pt[0], "10%"];
          }
        },
        title: {
          left: "left",
          text: cTitle,
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: date,
        },
        yAxis: {
          type: "value",
          boundaryGap: ['20%', '20%'],
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
            data: data,
          }
        ]
      };
    }
  },
  mounted() {
    this.drawRSSiChart("UCONN_GW", 3, "month", 0);
    this.$EventBus.$on("selectedSensor", (sensor) => {
      this.drawRSSiChart(sensor.gateway, sensor.sensor_id,"month",0);
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