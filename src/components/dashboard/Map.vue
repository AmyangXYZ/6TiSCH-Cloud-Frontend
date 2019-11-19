<template>
  <vs-card> 
    <GmapMap ref="mymap" id="gmap" :center="center" v-model="zoom" :zoom="zoom">
      <GmapMarker :key="index" v-for="(m,index) in markers" :position="m.position" :label="{text:m.sensor_id.toString(),color:'#2c3e50'}" :icon="icon"
        :clickable="true" @click="handleSelect(m)"/>
      <GmapPolyline :options="lineOpt" 
        v-for="(m,index) in markers" :key="'x'+index"
        :path="[m.position, markers[m.parent-2].position]">
      </GmapPolyline>
    </GmapMap>
  </vs-card>
</template>

<script>
import result from './result2.json'

export default {
  data() {
    return {
      range: "month",
      gateway: "any",
      icon: {},
      label: {},
      lineOpt: {
        strokeColor: 'grey',
      },
      zoom: 20,
      center: {lat:41.806581, lng:-72.252763}, // ITEB
      markers: [],
    }
  },
  methods: {
    drawHeatMap() {
      this.$gmapApiPromiseLazy().then(() => {
        var heatmapData = [];
        for(var i=0;i<result.length;i++) {
          heatmapData.push({ location: new window.google.maps.LatLng(result[i].lat, result[i].lng), weight: result[i].weight/1000})
        }
        var gradient = [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 223, 1)',
            'rgba(0, 0, 191, 1)',
            'rgba(0, 0, 159, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(63, 0, 91, 1)',
            'rgba(127, 0, 63, 1)',
            'rgba(191, 0, 31, 1)',
            'rgba(255, 0, 0, 1)'
          ]
        var heatmap = new window.google.maps.visualization.HeatmapLayer({
          data: heatmapData,
          map: this.$refs.mymap.$mapObject,
        })
        heatmap.set('gradient', heatmap.get('gradient') ? null : gradient);
      })
    },
    drawTopology(gw, range) {
      this.$gmapApiPromiseLazy().then(() => {
        this.$api.gateway.getTopology(gw, range)
        .then(res=> {
          if (res.data.flag==0||res.data.data.length==0){
            this.markers = []
            return
          }
          for(var i=0;i<res.data.data.length;i++) {
            // because there is no sensor 2.
            if(res.data.data[i].parent==1) {
              res.data.data[i].parent++
            }
            // gateway itself
            if(!res.data.data[i].parent) {
              res.data.data[i].parent=2
            }
          }
          this.markers = res.data.data
          this.icon = {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#58B2EC",
            fillOpacity: 1,
            strokeColor: "#58B2EC",
          }
        })
      })
    },
    handleSelect(m) {
      this.panTo(m.position);
      this.zoom = 23
      this.$EventBus.$emit('selectedSensor', m)
    },
    panTo(position) {
      this.$refs.mymap.$mapPromise.then((map) => {
        map.panTo(position)
      })
    }
  },
  mounted() {
    // this.drawHeatMap() 
    
    this.drawTopology(this.gateway, this.range);
    this.$EventBus.$on('selectedSensor', (sensor) => {
      for(var i=0;i<this.markers.length;i++) {
        if(this.markers[i].sensor_id==sensor.sensor_id) {
          this.panTo(this.markers[i].position)
          this.zoom = 23
        }
      }
      this.zoom = 23
    });
    // reset view
    this.$EventBus.$on('selectedGW', (gw) => {
      this.drawTopology(gw, this.range)
      this.gateway = gw
      this.panTo({lat:41.806581, lng:-72.252763})
      this.zoom = 20
    });
    this.$EventBus.$on("selectedRange", (r)=>{
      this.drawTopology(this.gateway, r)
      this.range = r
      this.panTo({lat:41.806581, lng:-72.252763})
      this.zoom = 20
    })
  }
}
</script>

<style lang="stylus" scoped>
#gmap
    width 100%
    height 638px
</style>