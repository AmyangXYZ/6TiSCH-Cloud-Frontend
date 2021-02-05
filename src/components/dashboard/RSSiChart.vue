<template>
  <vs-card style="margin-top:22px">
    <div slot="header"><h5> RSSI of Sensor {{this.selectedSensor}}, {{this.selectedGW}}</h5></div>
    <ECharts autoresize :options="option" />
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
import "echarts/lib/chart/heatmap";
import "echarts/lib/component/visualMap";
import "echarts/lib/component/title";
import "echarts/lib/component/toolbox";
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
      dataAvg: [],
      date: [],
      xData: [],
      yData: [],
      dataCh: [],
      min: 0,
      max: 0,
      option: {
        toolbox:{
          feature:{
            // saveAsImage:{
            //   name: "rssi_sensor_"
            // }
          }
        },
        grid: [{
          top: '30',
          height: '28%'
        }, {
          top: '210',
          height: '28%'
        }],
        xAxis: [
          {
            type: "category",
            boundaryGap: false,
            data: this.date,
          },
          {
            gridIndex: 1,
            type: 'category',
            data: this.xData
          }
        ],
        yAxis: [
          {
            name: "Average",
            nameTextStyle: {
              fontWeight: 800,
              fontSize: 16,
            },
            type: "value",
            boundaryGap: ['40%', '40%'],
            scale: true
          },
          {
            name: "Channel-Level",
            nameGap: 20,
            nameTextStyle: {
              fontWeight: 800,
              fontSize: 16,
              padding: [0,0,0,20]
            },
            gridIndex: 1,
            type: 'category',
            data: this.yData
          }
        ],
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100,
            xAxisIndex: [0, 1]
          },
          {
            start: 0,
            end: 100,
            xAxisIndex: [0, 1],
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
        visualMap: {
          seriesIndex: 1,
          type: 'piecewise',
          top: "185",
          right: "20",
          orient: "horizontal",
          precision: 1,
          min: this.min,
          max: this.max,
          calculable: true,
          realtime: false,
          inRange: {
              color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          },
        },
        series: [
          {
            name: "Average RSSi",
            type: "line",
            smooth: true,
            symbol: "none",
            // sampling leads to merge issue
            // sampling: "average",
            itemStyle: {
              color: "rgb(255, 70, 131)"
            },
            data: this.dataAvg,
          },
          {
            type: 'heatmap',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: this.dataCh,
            itemStyle: {
              emphasis: {
                  borderColor: '#333',
                  borderWidth: 1
              }
            },
            progressive: 1000,
            animation: false
          }
        ]
      }
    }
  },
  methods: {
    draw(gw,id,range) {
      // draw average rssi
      this.$api.gateway.getNWStatByID(gw, id, range, 0)
      .then(res => {
        this.dataAvg = []
        this.date = []
        if(res.data.flag == 0) {
          return
        }
        for(var i=0; i<res.data.data.length; i++) {          
          this.dataAvg.push(res.data.data[i].avg_rssi)

          var d = new Date(res.data.data[i].timestamp)
          // time zone diff
          var curD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
          this.date.push(curD.toJSON().substr(5, 14).replace('T', ' '))
        }
        this.option.xAxis[0].data = this.date
        this.option.series[0].data = this.dataAvg
      })

      // draw Channel-level rssi
      this.dataCh = []
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
            this.dataCh.push([t, parseInt(res.data.data[i].channels.split(",")[j])-12, parseFloat(res.data.data[i].rssi.split(",")[j])])
            var val = parseInt(res.data.data[i].rssi.split(",")[j])
            min = val>min?min:val
            max = val>max?val:max
          }
        }
        this.option.visualMap.max = max
        this.option.visualMap.min = min
        this.option.xAxis[1].data = this.xData
        this.option.yAxis[1].data = this.yData
        this.option.series[1].data = this.dataCh
        // this.option.toolbox.feature.saveAsImage.name = "rssi_sensor_"+id
      })
    }
  },
  mounted() {
    // this.draw(this.selectedGW, this.selectedSensor, this.selectedRange);
    this.$EventBus.$on("sensors", (sensors)=>{
      this.selectedSensor = sensors[0].sensor_id
      this.draw(this.selectedGW, this.selectedSensor, this.selectedRange);
    })
    this.$EventBus.$on("selectedSensor", (sensor) => {
      if(sensor.sensor_id!=1) {
        this.selectedSensor = sensor.sensor_id
        this.selectedGW = sensor.gateway
        this.draw(this.selectedGW, this.selectedSensor, this.selectedRange);
      }
    });
    this.$EventBus.$on("selectedRange", (range) => {
      this.selectedRange = range
      this.draw(this.selectedGW, this.selectedSensor, this.selectedRange);
    });
  }
};
</script>

<style lang="stylus" scoped>
.echarts 
  width 100%
  height 388px
</style>