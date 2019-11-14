<template>
  <vs-card> 
    <GmapMap id="gmap" :center="center" v-model="zoom" :zoom="zoom">
      <GmapMarker :key="index" v-for="(m,index) in markers" :position="m.position" :icon="icon"
        :clickable="true" @click="center=m.position;zoom=30"/>
      <GmapPolyline :options="lineOpt" 
        v-for="(m,index) in markers" :key="'x'+index"
        :path="[m.position,markers[0].position]">
      </GmapPolyline>
    </GmapMap>
  </vs-card>
</template>

<script>
export default {
  data() {
    return {
      icon: {
        url: "https://amyang.xyz/uploadsfolder/marker.png",
        scaledSize: {width: 18, height: 25, f: 'px', b: 'px'},
      },
      lineOpt: {
        strokeColor: 'grey',
      },
      zoom: 20.2,
      center: {lat:41.806581, lng:-72.252763}, // ITEB
      markers: [],
    }
  },
  methods: {
    drawTopology() {
      this.$api.gateway.getTopology("UCONN_GW")
      .then(res=> {
        this.markers = res.data.data
      })
    }
  },
  mounted: function () {
    this.drawTopology();
  }
}
</script>

<style lang="stylus" scoped>
#gmap
    width 100%
    height 620px
</style>