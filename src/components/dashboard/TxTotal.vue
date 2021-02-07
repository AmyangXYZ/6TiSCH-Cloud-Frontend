<template>

  <vs-row > 
  <vs-col style="z-index:99" vs-w="12">
    <vs-card id="txtotal">
      <vs-row id="r" vs-type="flex" vs-align="center">
        <vs-col style="" vs-w="2.4">
          <vs-icon size="65px" icon="import_export" color="#B4A3DB"></vs-icon>
        </vs-col>
        <vs-col vs-w="3.5">
          <h3 style="color:#3B4F63">Tx Total</h3>
        </vs-col>
        
        <vs-col vs-offset="3" vs-w="3">
          <h3>{{txTotal_disp}}</h3>
        </vs-col>
      </vs-row>
    </vs-card>
  </vs-col>
  </vs-row> 
</template>

<script>
// import gsap from 'gsap'

export default {
  data() {
    return {
      txTotal: 0,
      txTotal_disp: 0,
      interval:false,
    }
  },
  methods: {
    getTxTotal() {
      this.$api.gateway.getTxTotal("any", "year").
      then((res) => {
        if(res.data.flag != 1) return
        this.txTotal = res.data.data
        if(this.txTotal_disp==0) this.txTotal_disp = res.data.data
      })
    }
  },
  watch:{
    txTotal: function(){
      clearInterval(this.interval);
        if(this.txTotal == this.txTotal_disp){
          return;
        }
    
        this.interval = window.setInterval(function(){
          if(this.txTotal_disp != this.txTotal){
            var change = (this.txTotal - this.txTotal_disp) / 10;
            change = change >= 0 ? Math.ceil(change) : Math.floor(change);
            this.txTotal_disp = this.txTotal_disp + change;
          }
        }.bind(this), 50);
    }
  
  },
  mounted() {
    this.getTxTotal()
    setInterval(this.getTxTotal, 10*1000)
  }
}
</script>

<style lang="stylus" scoped>
#r
  // margin-top 3px
  font-size 1.12rem
  overflow hidden
</style>