<template>
  <vs-row vs-align="flex-start"> 
    <vs-col style="z-index:99" vs-w="5.7">
      <vs-card>
          <vs-row vs-align="center">
            <vs-col vs-w="3">
              <vs-icon size="65px" icon="router" color="#B4A3DB"></vs-icon>
            </vs-col>

            <vs-col class="cnt" vs-offset="4.5" vs-w="4.5">
              <h5>Gateways</h5>
              <h3>{{gateways.length}}</h3>
            </vs-col>
          </vs-row>
      </vs-card>
    </vs-col>

    <vs-col style="z-index:99" vs-offset="0.6" vs-w="5.7">
      <vs-card>
          <vs-row vs-align="center">
            <vs-col vs-w="3">
              <vs-icon size="65px" icon="memory" color="#58B2EC"></vs-icon>
            </vs-col>

            <vs-col class="cnt" vs-offset="4.5" vs-w="4.5">
              <h5>Sensors</h5>
              <h3>{{sensorCnt}}</h3>
            </vs-col>
          </vs-row>
      </vs-card>
    </vs-col>
  </vs-row> 
</template>

<script>

export default {
    data() {
        return {
            gateways: [],
            sensorCnt: 0,
        }
    },
    methods: {    
        getGateway() {
            this.$api.gateway.getGateway()
            .then(res=> {
                // this.gateways = res.data.data
                this.gateways = ['UCONN_GW']
                this.$EventBus.$emit('gateways',res.data.data)
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
    mounted() {
        this.getGateway();
        this.$EventBus.$on("sensorCnt", (n) => {
          this.sensorCnt = n;
        });
    }
}
</script>

<style lang="stylus" scoped>
.cnt
  font-size 1.32rem
  
  >h3
    font-size 1.9rem
  >h5
    color #3B4F63
</style>