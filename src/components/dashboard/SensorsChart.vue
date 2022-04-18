<template>
  <vs-card style="margin-top:22px">
    <div slot="header">
      <h5>
        Sensors Reading of Sensor {{ this.selectedSensor }},
        {{ this.selectedGW }}
      </h5>
    </div>

    <ECharts id="chart" autoresize :options="option" />
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
import "echarts/lib/component/tooltip";

export default {
  components: {
    ECharts,
  },
  data() {
    return {
      selectedSensor: 3,
      selectedGW: "UCONN_GW",
      selectedRange: "day",
      option: {
        tooltip:{
          trigger: 'axis'
        },
        grid: [
          {
            top:"8%",
            height:"24%",
            left:"8%",
            right:"58%",
            // bottom:"20%",
          },
          {
            top:"8%",
            height:"24%",
            left:"58%",
            right:"6%",
          },
          {
            top:"43%",
            height:"24%",
            left:"8%",
            right:"58%",
            // bottom:"20%",
          },
          {
            top:"43%",
            height:"24%",
            left:"58%",
            right:"6%",
            bottom:"5%",
          },
          {
            top:"77%",
            height:"20%",
            left:"8 %",
            right:"58%",
            bottom:"5%",
          },
        ],
        xAxis:[
          {
            name: "time",
            type: "category",
            data:[],
            gridIndex:0,
          },
          {
            name: "time",
            type: "category",
            data:[],
            gridIndex:1,
          },
          {
            name: "time",
            type: "category",
            data:[],
            gridIndex:2,
          },
          {
            name: "time",
            type: "category",
            data:[],
            gridIndex:3,
          },
          {
            name: "time",
            type: "category",
            data:[],
            gridIndex:4,
          }
        ],
        yAxis:[
          {
            name:"Temperature (C)",
            type:"value",
            gridIndex:0,
            boundaryGap: ['40%', '40%'],
          },
          {
            name:"Humidity ",
            type:"value",
            gridIndex:1,
            boundaryGap: [0, '40%'],
          },
          {
            name:"Distance - Ultrasonic",
            type:"value",
            gridIndex:2,
            boundaryGap: ['40%', '40%'],
          },
          {
            name:"LVDT Voltage",
            type:"value",
            gridIndex:3,
            boundaryGap: ['40%', '40%'],
          },
          {
            name:"Distance - LVDT",
            type:"value",
            gridIndex:4,
            boundaryGap: ['40%', '40%'],
          },
        ],
        series: [
          {
            name:"Temperature",
            type:"line",
            xAxisIndex:0,
            yAxisIndex:0,
            smooth: true,
            symbol: "none",
            data:[]
          },
          {
            name:"Humidity",
            type:"line",
            xAxisIndex:1,
            yAxisIndex:1,
             smooth: true,
            symbol: "none",
            data:[]
          },
          {
            name:"Distance - Ultrasonic",
            type:"line",
            xAxisIndex:2,
            yAxisIndex:2,
             smooth: true,
            symbol: "none",
            data:[]
          },

          {
            name:"Distance - LVDT",
            type:"line",
            xAxisIndex:3,
            yAxisIndex:3,
             smooth: true,
            symbol: "none",
            data:[]
          },
          {
            name:"LVDT Voltage",
            type:"line",
            xAxisIndex:4,
            yAxisIndex:4 ,
             smooth: true,
            symbol: "none",
            data:[]
          }
        ]
      }
    };
  },
  methods: {
    draw(id, range) {
      for(var i=0;i<this.option.series.length;i++) 
        this.option.series[0].data = []
      for(var a=0;a<this.option.xAxis.length;a++) {
        this.option.xAxis[a].data = []
        this.option.yAxis[a].data = []
      }
      this.$api.gateway.getSensorsByID(id, range)
      .then((res) => {
        if (res.data.flag == 0) return;
        for(var i=0;i<res.data.data.length;i++) {
          var sr = res.data.data[i]
          // this.option.xAxis.data.push(sr.timestamp)
          var d = new Date(res.data.data[i].timestamp)
          // time zone diff
          var curD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
          for (var x=0;x<4;x++)
            this.option.xAxis[x].data.push(curD.toJSON().substr(5, 14).replace('T', ' '))
          
          this.option.series[0].data.push(sr.temp)
          this.option.series[1].data.push(sr.lux)
          this.option.series[2].data.push(sr.press)
          this.option.series[3].data.push(sr.acc_x)
          this.option.series[4].data.push(sr.acc_y)
          this.option.series[5].data.push(sr.acc_z)
        }
      });
    },
  },
  mounted() {
    // this.draw(this.selectedSensor,this.selectedRange);
    this.$EventBus.$on("sensors", (sensors)=>{
      this.selectedSensor = sensors[0].sensor_id
      this.draw(this.selectedSensor, this.selectedRange);
    })
    
    this.$EventBus.$on("selectedSensor", (sensor) => {
      if(sensor.sensor_id!=1) {
        this.selectedSensor = sensor.sensor_id
        this.selectedGW = sensor.gateway
        this.draw(this.selectedSensor, this.selectedRange);
      }
    });
    this.$EventBus.$on("selectedRange", (range) => {
        this.selectedRange = range
        this.draw(this.selectedSensor, this.selectedRange);
    });
  },
};
</script>

<style scoped>
#chart {
  width: 100%;
  height:350px;
}
</style>