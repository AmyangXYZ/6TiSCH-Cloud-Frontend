<template lang="html" >
  <div>
    <vs-table :max-items="maxItems" pagination :currentPage="currentPage" v-model="selectedSensor" @selected="selectSensor" :data="sensors">
      <vs-row slot="header" vs-align="center" style="margin:6px">
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
      maxItems: 8,
      currentPage: 0,
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
        this.sensors = res.data.data.sort(function(a,b) {
          return a.sensor_id - b.sensor_id
        });
        
        // index for pagination
        for(var j=0;j<this.sensors.length;j++) {
          this.sensors[j].index = j
        }

        this.$EventBus.$emit("sensors",this.sensors)
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
    },
  },
  mounted() {
    this.drawNWTable(this.selectedGW, this.selectedRange)

    this.$EventBus.$on("gateways", (gws)=>{
      this.gateways=gws
      this.gateways.unshift("any")
    }) 
    // handle sensor selection from Map
    this.$EventBus.$on("selectedSensor", (s)=>{
      for(var i=0;i<this.sensors.length;i++) {
        if(this.sensors[i].sensor_id == s.sensor_id) {
          this.currentPage = parseInt((this.sensors[i].index+this.maxItems)/this.maxItems)
          this.selectedSensor = this.sensors[i]
        }
      }
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