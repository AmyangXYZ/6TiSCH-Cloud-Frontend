<template>
  <vs-dropdown id="events" vs-navbar-item vs-custom-content vs-trigger-click >  
    <a class="a-icon" href.prevent>Events</a>
    <vs-dropdown-menu>
      <div><ECharts autoresize :options="option"/></div>

      <vs-table id="t" max-items="13" stripe pagination :data="events">
        <template slot="thead">
          <vs-th>
            Date
          </vs-th>
          <vs-th>
            Event
          </vs-th>
        </template>
        <template slot-scope="{data}">
          <vs-tr :key="indextr" v-for="(tr, indextr) in data" >
            <vs-td>
              {{data[indextr].datetime}}
            </vs-td>
            <vs-td>
              {{data[indextr].event}}
            </vs-td>
          </vs-tr>
        </template>
      </vs-table>
    </vs-dropdown-menu>
  </vs-dropdown>
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
      events: [],
      option: {
        xAxis: {
            // show: false,
            type: 'category',
            data: [],
          },
        yAxis: {
          show: false,
          type: "value",
          scale: true
        },
        
        series: [{
          data: [],
          smooth: true,
          type: 'line',
        }]
      }
    }
  },
  methods: {
    getTopoHistory() {
      this.$api.gateway.getTopoHistory()
      .then(res => {
        var tmp = []
        var now = Date.now()
        var nodeList = {}
        for(var i=0;i<res.data.data.length;i++) {
          var d = new Date(res.data.data[i].first_appear)
          // time zone diff
          var curD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))

          tmp.push({
            timestamp: res.data.data[i].first_appear, // for sort
            datetime: curD.toJSON().substr(5, 14).replace('T', ' '),
            event: `Node ${res.data.data[i].sensor_id} connected to Node ${res.data.data[i].parent}`
          })

          nodeList[res.data.data[i].sensor_id] = res.data.data[i].last_seen
        }
        
        for(let id in nodeList) {
          if((now - nodeList[id])>1000*60*10) {
            var d2 = new Date(nodeList[id])
            // time zone diff
            var curD2 = new Date(d2.getTime() - (d2.getTimezoneOffset() * 60000))
            tmp.push({
              timestamp: nodeList[id], // for sort
              datetime: curD2.toJSON().substr(5, 14).replace('T', ' '),
              event: `Node ${id} lost`
            })
          }
        }
          
        this.events = tmp.sort(function(a,b) {
          return b.timestamp - a.timestamp
        });

        // draw chart
        var st = this.events[this.events.length-1].datetime
        var start_timestamp = new Date(2020,parseInt(st.slice(0,2))-1,st.slice(3,5), st.slice(6,8)).getTime()

        var time_series = {}
        for(var k=start_timestamp;k<now;k+=1000*60*60) {
          var dd = new Date(k)
          // time zone diff
          var ddd = new Date(dd.getTime() - (dd.getTimezoneOffset() * 60000))
          time_series[ddd.toJSON().substr(5, 8).replace('T', ' ')] = 0
        }
        
        for(var l=0;l<this.events.length;l++) {
          if(this.events[l].datetime.substr(0,8) in time_series) 
            time_series[this.events[l].datetime.substr(0,8)]+=1
        }
        
        for(let t in time_series) {
          this.option.xAxis.data.push(t)
          this.option.series[0].data.push(time_series[t])
          window.console.log(t,time_series[t])
        }
      })
    }
  },
  mounted() {
    this.getTopoHistory()
  }
}
</script>

<style lang="stylus" scope>
#events
  text-align center
  color white
  font-size 1rem
  display block
.echarts 
  width 400px
  height 90px
</style>