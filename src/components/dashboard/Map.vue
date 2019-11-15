<template>
  <vs-card> 
    <GmapMap id="gmap" :center="center" v-model="zoom" :zoom="zoom">
      <GmapMarker :key="index" v-for="(m,index) in markers" :position="m.position" :icon="icon"
        :clickable="true" @click="center=m.position;zoom=30"/>
      <GmapPolyline :options="lineOpt" 
        v-for="(m,index) in markers" :key="'x'+index"
        :path="[m.position, markers[m.parent-2].position]">
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
      zoom: 20.6,
      center: {lat:41.806581, lng:-72.252763}, // ITEB
      markers: [],
    }
  },
  methods: {
    drawTopology() {
      this.$api.gateway.getTopology("UCONN_GW")
      .then(res=> {
        for(var i=0;i<res.data.data.length;i++) {
          // because there is no sensor 2...
          if(res.data.data[i].parent==1) {
            res.data.data[i].parent++
          }
          // gateway itself
          if(!res.data.data[i].parent) {
            res.data.data[i].parent=2
          }
        }
        this.markers = res.data.data
        // set global current gateway, default is gw[0]
        this.$EventBus.$emit('selectedGW', res.data.data[0])
        // todo...
        this.$EventBus.$emit('sensorCnt', res.data.data.length-1)
      })
    }
  },
  mounted() {
    this.drawTopology();
    this.$EventBus.$on('selectedSensor', (id) => {
      for(var i=0;i<this.markers.length;i++) {
        if(this.markers[i].sensor_id==id) {
          this.center = this.markers[i].position
        }
      }
      this.zoom = 30
    });
  }
}
</script>

<style lang="stylus" scoped>
#gmap
    width 100%
    height 638px
</style>