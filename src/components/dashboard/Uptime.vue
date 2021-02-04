<template>
  <vs-row > 
  <vs-col style="z-index:99" vs-w="12">
    <vs-card id="uptime">
      <vs-row id="r" vs-type="flex" vs-align="center">
        <vs-col style="" vs-w="1.2">
          <vs-icon size="65px" icon="power_settings_new" color="#B4A3DB"></vs-icon>
        </vs-col>
        <vs-col vs-w="2">
          <h3 style="color:#3B4F63">Uptime</h3>
        </vs-col>
        
        <vs-col vs-offset="4.8" vs-w="4">
          <h3> {{d}} day<span v-if="d>1">s</span>, {{h.toString().padStart(2,'0')}}:{{m.toString().padStart(2,'0')}}:{{s.toString().padStart(2,'0')}}</h3>
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
      s: 0,
      m: 0,
      h: 0,
      d: 0,
    }
  },
  methods: {
    computeTime(startTime) {
        setInterval(()=>{
          var now = Date.now()
          this.s = Math.floor((now-startTime)/1000%60)
          this.m = Math.floor((now-startTime)/(1000*60)%60)
          this.h = Math.floor((now-startTime)/(1000*60*60)%24)
          this.d = Math.floor((now-startTime)/(1000*60*60*24))
        },1000)
        
    }
  },
  mounted() {
    this.$EventBus.$on("startTime", (st) => {
      this.computeTime(st)
    });
  }
}
</script>

<style lang="stylus" scoped>
#r
  // margin-top 3px
  font-size 1.12rem
  overflow hidden
</style>