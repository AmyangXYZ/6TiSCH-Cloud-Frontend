<template>
<transition name="expand">
  <vs-card v-if="show">
    <div class="sliders">
      <vs-row vs-align="flex-start" vs-w="12">
        <vs-col v-for="(f,i) in filters" :key="i" vs-offset="0.5" vs-w="5.2">
          <span class="title">{{f.name}}: [{{f.value[0]}}, {{f.value[1]}}]</span>
          <vs-slider :color="f.color" :max="f.max" :step="f.step" :step-decimals="true" v-model="f.value"/>
        </vs-col>
      </vs-row>
    </div>
  </vs-card>
</transition>
</template>

<script>
import lodash from "lodash"
// [...new Set([...array1 ,...array2])];
export default {
  data() {
    return {
      show: false,
      filters: {
        latency: {name:"Latency", max: 3, step:0.001, value: [0,3], color:"dark"},
        macPER: {name:"MAC PER", max: 1, step:0.001, value: [0,1], color:"orange"},
        noiseLv: {name:"Noise Level", max: 3, step:0.1, value: [1,3], color:"green"},
        appPER: {name:"APP PER", max:1, step:0.001, value: [0,1], color:"red"},
      },
      // all sensors
      sensors: [],
      filterRes: {
        latency: [],
        macPER: [],
        noiseLv:[],
        appPER: [],
      },      
      finalRes: [],
      selectedGW: "any",
      timeRange: "day", 
    }
  },
  methods: {
    handleLatencyRange: lodash.debounce(function() {
      this.filterRes.latency = []
      for(var i=0;i<this.sensors.length;i++) {
        if(this.sensors[i].avg_rtt>=this.filters.latency.value[0] 
          && this.sensors[i].avg_rtt<=this.filters.latency.value[1]) {
          this.filterRes.latency.push(this.sensors[i].sensor_id)
        }
      }
      // intersection
      this.finalRes = this.filterRes.latency.filter(x => this.filterRes.macPER.includes(x))
        .filter(y => this.filterRes.appPER.includes(y)).filter(y => this.filterRes.noiseLv.includes(y))
    }, 300),

    handleMacPERRange: lodash.debounce(function() {
      this.filterRes.macPER = []
      for(var i=0;i<this.sensors.length;i++) {
        if(this.sensors[i].mac_per>=this.filters.macPER.value[0] 
          && this.sensors[i].mac_per<=this.filters.macPER.value[1]) {
          this.filterRes.macPER.push(this.sensors[i].sensor_id)
        }
      }
      // intersection
      this.finalRes = this.filterRes.latency.filter(x => this.filterRes.macPER.includes(x))
        .filter(y => this.filterRes.appPER.includes(y)).filter(y => this.filterRes.noiseLv.includes(y))
    }, 300),

    handleAppPERRange: lodash.debounce(function() {
      this.filterRes.appPER = []
      for(var i=0;i<this.sensors.length;i++) {
        if(this.sensors[i].app_per>=this.filters.appPER.value[0] 
          && this.sensors[i].app_per<=this.filters.appPER.value[1]) {
          this.filterRes.appPER.push(this.sensors[i].sensor_id)
        }
      }
      // intersection
      this.finalRes = this.filterRes.latency.filter(x => this.filterRes.macPER.includes(x))
        .filter(y => this.filterRes.appPER.includes(y)).filter(y => this.filterRes.noiseLv.includes(y))
    }, 300)
  },
  watch: {
    'filters.latency.value':function () {
      this.handleLatencyRange()
    },
    'filters.macPER.value':function () {
      this.handleMacPERRange()
    },
    // 'filters.noiseLv.value':function () {
    //   this.handleLatencyRange()
    // },
    'filters.appPER.value':function () {
      this.handleAppPERRange()
    },
    'finalRes': function() {
      this.$EventBus.$emit("filterRes", this.finalRes)
    }
  },
  mounted() {
    this.$EventBus.$on("sensors", (sensors)=>{
      this.sensors = sensors
      var sensorIDs = []
      for(var i=0;i<sensors.length;i++) {
        sensorIDs.push(sensors[i].sensor_id)
      }
      for(let k in this.filterRes) {
        this.filterRes[k] = sensorIDs
      }
    })
    this.$EventBus.$on("showFiltersPanel", (sig)=>{
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