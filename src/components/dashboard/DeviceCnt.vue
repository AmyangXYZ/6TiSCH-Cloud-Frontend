<template>

<vs-row vs-align="flex-start" vs-w="12" height="200px"> 
  <vs-col style="z-index:99" vs-w="5.7">
    <vs-card class="dc-card">
      <div slot="header">
        <span class="dc-icon">
          <vs-icon size="60px" icon="router" color="#B4A3DB"></vs-icon>
        </span>
        <div class="dc-num">
          <h5>Gateways</h5>
          <h3>2</h3>
        </div>
      </div>
      <!-- <div v-for="(gw,index) in gateways" :key="index" class="r">
        <vs-radio @change="selectCurGW(gw)" v-model="curGW" :vs-value="gw">
            {{gw}}
        </vs-radio>
      </div> -->
    </vs-card>
  </vs-col>
  <vs-col style="z-index:99" vs-offset="0.6" vs-w="5.7">
   <vs-card class="dc-card">
      <div slot="header">
        <span class="dc-icon">
          <vs-icon size="60px" icon="memory" color="#58B2EC"></vs-icon>
        </span>
        <div class="dc-num">
          <h5>Sensors</h5>
          <h3>120</h3>
        </div>
      </div>
    </vs-card>
  </vs-col>
</vs-row> 
</template>

<script>

export default {
    data() {
        return {
            curGW: "",
            gateways: [],
        }
    },
    methods: {    
        getGateway() {
            this.$api.gateway.getGateway()
            .then(res=> {
                this.gateways = res.data.data
                this.curGW = res.data.data[0]
            })
        },
        selectCurGW(gw) {
            this.curGW = gw
            this.$vs.notify({
                title:'Gateway Change',
                text:`Current gateway changed to ${gw}`,
                color:"primary",
            })
        }
    },
    mounted: function () {
        this.getGateway();
    }
}
</script>

<style lang="stylus" scoped>
.dc-icon
  float left
.dc-card
  text-align right
.dc-num
  margin-right 5px
  >h3
    font-size 2rem
  >h5
    color #3B4F63
#gws
  height 191.03px
.r  
  >label
    display inline-flex

</style>