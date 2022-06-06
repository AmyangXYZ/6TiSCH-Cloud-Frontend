<template>
  <vs-card style="margin-top:22px">
    <div slot="header">
      <vs-row  vs-align="center">
        <vs-col vs-w="8">
          <h4>
            Sensor Readings of Sensor {{ this.selectedSensor }}
          </h4>
        </vs-col>
        <vs-col vs-w=2.5>
          <p style="font-size:11pt">Sampling Rate (Hz)</p>
        </vs-col>
        <vs-col vs-w="1.2" vs-offset="-0.1">
          <vs-select v-model="selectedRate" width="100%" autocomplete @change="selectRate">
            <vs-select-item :text="item" :value="item" v-for="(item,index) in rates" :key="index"/>
          </vs-select>
        </vs-col>
      </vs-row>
    </div>

    <ECharts id="chart" autoresize :options="option"/>
  </vs-card>
</template>

<script>
import ECharts from "vue-echarts/components/ECharts";
import "echarts/lib/chart/line";
import "echarts/lib/component/tooltip";
import "echarts/lib/component/dataZoom";
export default {
  components: {
    ECharts,
  },
  data() {
    return {
      selectedSensor: 3,
      selectedGW: "UCONN_GW",
      selectedRange: "day",
      selectedRate: "0.1",
      rates: [0.02, 0.1, 0.2, 0.5, 1, 5],
      
      option: {
        tooltip:{
          trigger: 'axis'
        },
        toolbox: {
          feature: {
            dataView:{
              title: "Data View",
              lang: ["Data View", "Close", "Refresh"]
            }
          }
        },
        grid: [
          {
            top:"8%",
             height:"20%",
            left:"8%",
            right:"58%",
            // bottom:"20%",
          },
          {
            top:"8%",
             height:"20%",
            left:"58%",
            right:"6%",
          },
          {
            top:"41%",
             height:"20%",
            left:"8%",
            right:"58%",
            // bottom:"20%",
          },
          {
            top:"41%",
             height:"20%",
            left:"58%",
            right:"6%",
            bottom:"5%",
          },
          {
            top:"75%",
             height:"20%",
            left:"8%",
            right:"58%",
            bottom:"5%",
          },
        ],
        dataZoom: [
          {
            type: "inside",
            start: 0,
            end: 100,
            xAxisIndex: [0, 1,2,3,4]
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
            min:0,
            boundaryGap: ['40%', '40%'],
          },
          {
            name:"Humidity ",
            type:"value",
            gridIndex:1,
            min:0,
            boundaryGap: [0, '40%'],
          },
          {
            name:"Distance - Ultrasonic",
            type:"value",
            gridIndex:2,
            min:0,
            boundaryGap: ['40%', '40%'],
          },
          {
            name:"LVDT Voltage",
            type:"value",
            gridIndex:3,
            min:0,
            boundaryGap: ['40%', '40%'],
          },
          {
            name:"Distance - LVDT",
            type:"value",
            gridIndex:4,
            min:0,
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
            animation:false,
            symbol: "none",
            data:[1,1,2]
          },
          {
            name:"Humidity",
            type:"line",
            xAxisIndex:1,
            yAxisIndex:1,
            smooth: true,
            animation:false,
            symbol: "none",
            data:[]
          },
          {
            name:"Distance - Ultrasonic",
            type:"line",
            xAxisIndex:2,
            yAxisIndex:2,
            smooth: true,
            animation:false,
            symbol: "none",
            data:[]
          },

          {
            name:"Distance - LVDT",
            type:"line",
            xAxisIndex:3,
            yAxisIndex:3,
            smooth: true,
            animation:false,
            symbol: "none",
            data:[]
          },
          {
            name:"LVDT Voltage",
            type:"line",
            xAxisIndex:4,
            yAxisIndex:4 ,
            smooth: true,
            animation:false,
            symbol: "none",
            data:[]
          }
        ]
      }
    };
  },
  methods: {
    draw(id, range) {
      // for(var i=0;i<this.option.series.length;i++) 
      //   this.option.series[i].data = []
      // for(var a=0;a<this.option.xAxis.length;a++) {
      //   this.option.xAxis[a].data = []
      //   this.option.yAxis[a].data = []
      // }
      this.$api.gateway.getSensorsByID(id, range)
      .then((res) => {
        if (res.data.flag == 0) return;
        for(var i=this.option.series[0].data.length;i<res.data.data.length;i++) {
          var sr = res.data.data[i]
          // this.option.xAxis.data.push(sr.timestamp)
          var d = new Date(res.data.data[i].timestamp)
          // time zone diff
          var curD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
          for (var x=0;x<this.option.xAxis.length;x++)
            this.option.xAxis[x].data.push(curD.toJSON().substr(5, 14).replace('T', ' '))
          
          this.option.series[0].data.push(sr.temp)
          this.option.series[1].data.push(sr.humidity)
          this.option.series[2].data.push(sr.ultrasonic)
          this.option.series[3].data.push(sr.lvdt1)
          this.option.series[4].data.push(sr.lvdt2)
        }
      });
    },
    selectRate() {
      this.$api.gateway.putSamplingRate(this.selectedSensor,"all",this.selectedRate)
    }
  },
  mounted() {
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
  height:400px;
}
</style>