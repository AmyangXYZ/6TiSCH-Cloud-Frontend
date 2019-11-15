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
    // id=0, draw all sensors' avg
    drawRSSiChart(id) {
      var cTitle = "RSSi";
      if (id!=0) {
        cTitle = "RSSi of Sensor " + id;
      }
      var base = +new Date(1968, 9, 3);
      var oneDay = 24 * 3600 * 1000;
      var date = [];

      var data = [Math.random() * 300];

      for (var i = 1; i < 20000; i++) {
        var now = new Date((base += oneDay));
        date.push(
          [now.getFullYear(), now.getMonth() + 1, now.getDate()].join("/")
        );
        data.push(Math.round((Math.random() - 0.5) * 20 + data[i - 1]));
      }
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
          textStyle: {
            fontSize: "20"
          }
        },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: date
        },
        yAxis: {
          type: "value",
          boundaryGap: [0, "100%"]
        },
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 30
          },
          {
            start: 0,
            end: 30,
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
            data: data
          }
        ]
      };
    }
  },
  mounted() {
    this.drawRSSiChart(0);
    this.$EventBus.$on("selectedSensor", (id) => {
      this.drawRSSiChart(id);
    });
  }
};
</script>

<style lang="stylus" scoped>
#c-card {
  margin-top: 22px;
}

.echarts {
  width: 100%;
  height: 237px;
}
</style>