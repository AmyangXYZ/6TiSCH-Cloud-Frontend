<template>
<transition name="expand">
  <vs-card v-if="show">
    <div class="sliders">
      <vs-row vs-align="flex-start" vs-w="12">
        <vs-col v-for="(f,i) in filters" :key="i" vs-offset="0.5" vs-w="5.2">
          <span class="title">{{f.name}}: [{{f.value[0]}}, {{f.value[1]}}]</span>
          <vs-slider :color="f.color" :max="f.max" step=0.01 :step-decimals="true" v-model="f.value"/>
        </vs-col>
      </vs-row>
    </div>
  </vs-card>
</transition>
</template>

<script>
import lodash from "lodash"

export default {
  data() {
    return {
      show: false,
      // all sensors
      sensors: [],
      // sensors shown on map
      shownSensors: [],
      selectedGW: "any",
      timeRange: "day",
     
      filters: {
        latency: {name:"Latency", max: 3, value: [0,3], color:"dark"},
        macPER: {name:"MAC PER", max: 3, value: [0,2], color:"orange"},
        noiseLv: {name:"Noise Level", max: 3, value: [1,3], color:"green"},
        appPER: {name:"APP PER", max:3, value: [1,3], color:"red"},
      },
    }
  },
  methods: {
    // get network stat data and sensor array from api.
    // do this cheap Topologyrequest again is much better than retreiving data from other 
    // component (NWTable) that makes the code unclean and obfuscated.
    getNWStat() {
      this.$api.gateway.getNWStat(this.selectedGW, this.timeRange)
      .then(res=> {
        this.sensors = res.data.data.sort(function(a,b) {
          return a.sensor_id - b.sensor_id
        });
      })
    },
    handleLatencyRange: lodash.debounce(function() {
      this.shownSensors = []
      for(var i=0;i<this.sensors.length;i++) {
        if(this.sensors[i].avg_rtt>=this.filters.latency.value[0] 
          && this.sensors[i].avg_rtt<=this.filters.latency.value[1]) {
          this.shownSensors.push(this.sensors[i].sensor_id)
        }
      }
      this.$EventBus.$emit('shownSensors', this.shownSensors)
      window.console.log(this.shownSensors)
    }, 300)
  },
  watch: {
    'filters.latency.value':function () {
      this.handleLatencyRange()
    },
    'filters.macPER.value':function () {
      this.handleLatencyRange()
    },
    'filters.noiseLv.value':function () {
      this.handleLatencyRange()
    },
    'filters.appPER.value':function () {
      this.handleLatencyRange()
    } 
  },
  mounted() {
    this.getNWStat()
    this.$EventBus.$on("showFilters", (sig)=>{
      if(sig)this.show = !this.show
      // force clear
      else this.show = false
    })
  },
}
</script>

<style lang="stylus" scoped>
.sliders
  font-size 1rem

.expand-enter-active, .expand-leave-active 
  transition all .3s
  height 140px
  overflow: hidden;
.expand-enter, .expand-leave-to
  height 0px
</style>