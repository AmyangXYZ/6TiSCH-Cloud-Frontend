<template lang="html">
  <div>
    <vs-table max-items="10" pagination v-model="selected" @selected="handleSelected" :data="sensors">
      <template slot="header">
        <h4 id="title">Network Statistics</h4>
        <vs-select v-model="timeRange" width="80px" autocomplete @change="getNWStat()" id="time-selector">
          <vs-select-item :value="item.value" :text="item.text" v-for="(item,index) in timeRanges" :key="index"/>
        </vs-select>
      </template>

      <template slot="thead" >
        <vs-th sort-key="sensor_id">
          ID
        </vs-th>
        <vs-th sort-key="avg_rtt">
          LATENCY
        </vs-th>
        <vs-th sort-key="mac_per">
          MAC PER(%)
        </vs-th>
        <vs-th sort-key="app_per">
          APP PER(%)
        </vs-th>
      </template>

      <template slot-scope="{data}">
        <vs-tr :data="tr" :key="index" v-for="(tr, index) in data" >
          <vs-td :data="data[index].sensor_id">
            {{data[index].sensor_id}}
          </vs-td>
          <vs-td :data="data[index].avg_rtt">
            {{data[index].avg_rtt.toFixed(2)}}
          </vs-td>
          <vs-td :data="data[index].mac_per">
            {{data[index].mac_per.toFixed(2)}}
          </vs-td>
          <vs-td :data="data[index].app_per">
            {{data[index].app_per.toFixed(2)}}
          </vs-td> 
        </vs-tr>
      </template>
    </vs-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sensors: [],
      selected: [],
      timeRange: 1,
      timeRanges: [
        {text: 'hour', value:1},
        {text: 'day', value:2},
        {text: 'week', value:3},
        {text: 'month', value:4},
      ],
    }
  },
  methods: {
    getNWStat() {
      window.console.log(this.timeRange)
      this.$api.gateway.getNWStat("UCONN_GW")
      .then(res=> {
        for(var i=0;i<res.data.data.length;i++){
          // res.data.data[i].avg_rtt = res.data.data[i].avg_rtt
          res.data.data[i].mac_per = res.data.data[i].avg_mac_tx_noack_diff/(res.data.data[i].avg_mac_tx_total_diff+0.000001)*100.0
          res.data.data[i].app_per = res.data.data[i].avg_app_per_lost_diff/(res.data.data[i].avg_app_per_sent_diff+0.000001)*100.0
        }
        this.sensors = res.data.data
      })
    },
    getNWStatByID(id) {
      this.$api.gateway.getNWStatByID("UCONN_GW", id)
      .then(res=> {
        window.console.log(res)
      })
    },
    handleSelected(tr) {
      window.console.log(tr.sensor_id)
      this.$vs.notify({
        title: `Sensor ${tr.sensor_id} Selected`,
        text: '',
        color: "primary",
      })
    }
  },
  mounted: function () {
    this.getNWStat()
  }
}
</script>

<style lang="stylus" scoped>
#title
  margin 10px
#time-selector
  margin-right 20px
</style>