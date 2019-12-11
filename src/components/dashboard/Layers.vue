<template>
<transition name="expand">
  <vs-card v-if="show" class="layers">
    <div slot="header">
      <vs-row vs-type="flex" vs-align="flex-start" vs-justify="space-around">
        <vs-col vs-w="3" vs-type="flex" vs-justify="center" vs-align="center">
          <vs-button color="success" :type="buttonTypes[currentBtType.power]" @click="showPowerLayer" 
            icon-pack="fa" icon="fa-car-battery" size="small">
            Power Usage
          </vs-button>
        </vs-col>
        <vs-col vs-w="3"  vs-type="flex" vs-justify="center" vs-align="center" >
          <vs-button color="#EAB835" :type="buttonTypes[currentBtType.noiseLv]" @click="showNoiseLayer" 
            icon-pack="fa" icon="fa-rss" size="small">
            Noise Level
          </vs-button>
        </vs-col>
        <vs-col vs-w="3"  vs-type="flex" vs-justify="center">
          <vs-button color="primary" :type="buttonTypes[currentBtType.layer3]" @click="showLayer3" 
            icon-pack="fa" icon="fa-cookie" size="small">
            Layer 3
          </vs-button>
        </vs-col>
        <!-- <vs-col vs-w="2"  vs-type="flex" vs-justify="center" vs-align="center" >
          <vs-button color="primary" :type="buttonTypes[currentBtType.layer4]" @click="clearMap" icon="clear_all" size="small">
            Layer 4
          </vs-button>
        </vs-col> -->
      </vs-row>
    </div>
  </vs-card>
</transition>
</template>

<script>
export default {
  data() {
    return {
      show: false,
      buttonTypes: ["line","filled"],
      // 0 inactive, 1 active
      currentBtType: {
        power: 0,
        noiseLv: 0,
        layer3: 0,
        layer4: 0,
      },
      // all sensors
      sensors: [],
      // sensors shown on map
      shownSensors: [],
      selectedGW: "any",
      timeRange: "day",
    }
  },
  methods: {
    showPowerLayer() {
      this.currentBtType.power = 1-this.currentBtType.power
      this.$EventBus.$emit("showPowerLayer", this.currentBtType.power)
    },
    showNoiseLayer() {
      this.currentBtType.noiseLv = 1-this.currentBtType.noiseLv
      this.$EventBus.$emit("showNoiseLayer", this.currentBtType.noiseLv)
    },
    showLayer3() {
      this.currentBtType.layer3 = 1-this.currentBtType.layer3
    }
  },
  mounted() {
    this.$EventBus.$on("showLayersPanel", (sig)=>{
      if(sig)this.show = !this.show
      // force clear
      else {
        this.show = false
        for(var key in this.currentBtType) this.currentBtType[key] = 0
      }
    })
  },
}
</script>

<style lang="stylus" scoped>
.layers
  height 55px

.expand-enter-active, .expand-leave-active 
  transition all .3s
  height 60px
  overflow: hidden;
.expand-enter, .expand-leave-to
  height 0px
</style>