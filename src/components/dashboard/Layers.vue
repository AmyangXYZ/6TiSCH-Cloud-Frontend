<template>
<transition name="expand">
  <vs-card v-if="show">
    <div class="layers">
      <vs-row vs-type="flex" vs-align="center" vs-justify="space-around">
        <vs-col vs-w="2" vs-type="flex" vs-justify="center" vs-align="center">
          <vs-button color="success" :type="buttonTypes[currentBtType.powerMap]" @click="showPowerLayer" 
            icon-pack="fa" icon="fa-car-battery" size="small">
            Power Layer
          </vs-button>
        </vs-col>
        <vs-col vs-w="2"  vs-type="flex" vs-justify="center" vs-align="center" >
          <vs-button color="#f26522" :type="buttonTypes[currentBtType.noiseLv]" @click="showNoiseLayer" icon-pack="fa" icon="fa-rss" size="small">
            Noise Layer
          </vs-button>
        </vs-col>
        <vs-col vs-w="2"  vs-type="flex" vs-justify="center" vs-align="center" >
          <vs-button color="#860262" :type="buttonTypes[currentBtType.layer3]" @click="clearMap" icon="clear_all" size="small">
            Layer 3
          </vs-button>
        </vs-col>
        <vs-col vs-w="2"  vs-type="flex" vs-justify="center" vs-align="center" >
          <vs-button color="primary" :type="buttonTypes[currentBtType.layer4]" @click="clearMap" icon="clear_all" size="small">
            Layer 4
          </vs-button>
        </vs-col>
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
      currentBtType: {
        powerMap: 0,
        noiseLv:0,
        layer3:0,
        layer4:0,
      },
      showNoiseMap: false,
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
      this.currentBtType.powerMap = 1-this.currentBtType.powerMap
    },
    showNoiseLayer() {
      this.currentBtType.noiseLv = 1-this.currentBtType.noiseLv
    }
  },
  mounted() {
    this.$EventBus.$on("showLayers", (sig)=>{
      if(sig)this.show = !this.show
      // force clear
      else this.show = false
    })
  },
}
</script>

<style lang="stylus" scoped>
.layers
  font-size 1.1rem

.expand-enter-active, .expand-leave-active 
  transition all .3s
  height 52px
  overflow: hidden;
.expand-enter, .expand-leave-to
  height 0px
</style>