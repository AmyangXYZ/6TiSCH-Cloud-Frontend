<template lang="html" >
  <div>
    <vs-table max-items="8" pagination v-model="selectedSensor" @selected="selectSensor" :data="sensors">
      <vs-row slot="header" vs-align="center"  style="margin:6px">
        <vs-col  vs-w="6">
          <h4>Network Statistics</h4>
        </vs-col>
        <vs-col vs-offset="1.5" vs-w="2.4">
          <vs-select v-model="selectedGW" width="100%" autocomplete @change="selectGW">
            <vs-select-item :text="item" :value="item" v-for="(item,index) in gateways" :key="index"/>
          </vs-select>
        </vs-col>
        <vs-col vs-offset="0.3" vs-w="1.6">
          <vs-select v-model="selectedRange" width="100%" autocomplete @change="selectRange">
            <vs-select-item :value="item" :text="item" v-for="(item,index) in ranges" :key="index"/>
          </vs-select>
        </vs-col>
      </vs-row>

      <template slot="thead">
        <vs-th sort-key="sensor_id">
          ID
        </vs-th>
        <vs-th sort-key="gateway">
          Gateway
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
        <vs-tr :data="tr" :key="index" v-for="(tr, index) in data">
          <vs-td :data="data[index].sensor_id">
            {{data[index].sensor_id}}
          </vs-td>
          <vs-td :data="data[index].gateway">
            {{data[index].gateway}}
          </vs-td>
          <vs-td :data="data[index].avg_rtt">
            {{data[index].avg_rtt.toFixed(3)}}
          </vs-td>
          <vs-td :data="data[index].mac_per">
            {{data[index].mac_per.toFixed(3)}}
          </vs-td>
          <vs-td :data="data[index].app_per">
            {{data[index].app_per.toFixed(3)}}
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
      gateways: [],
      sensors: [],
      selectedGW: 'any',
      selectedSensor: {},
      selectedRange: 'day',
      ranges: ['hour','day','week','month']
    }
  },
  methods: {
    drawNWTable(gw, range) {
      this.$api.gateway.getNWStat(gw, range)
      .then(res=> {
        if (res.data.flag==0||res.data.data.length==0){
          this.sensors = []
          return
        }
        for(var i=0;i<res.data.data.length;i++){
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
    selectGW() {
      this.$EventBus.$emit('selectedGW', this.selectedGW)
    },
    selectSensor(tr) {
      this.$EventBus.$emit('selectedSensor', tr)
    },
    selectRange() {
      this.$EventBus.$emit('selectedRange', this.selectedRange)
    }
  },
  mounted() {
    this.drawNWTable(this.selectedGW, this.selectedRange)

    this.$EventBus.$on("gateways", (gws)=>{
      this.gateways=gws
      this.gateways.unshift("any")
    }) 
    this.$EventBus.$on("selectedGW", (gw)=>{
      this.selectedGW = gw
      this.drawNWTable(this.selectedGW, this.selectedRange)
    })
    this.$EventBus.$on("selectedRange", (r)=>{
      this.selectedRange = r
      this.drawNWTable(this.selectedGW, this.selectedRange)
    })
  }
}
</script>

<style lang="stylus" scoped>

</style>