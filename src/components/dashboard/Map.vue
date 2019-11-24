<template>
  <vs-card> 
    <GmapMap ref="mymap" id="gmap" :center="center" v-model="zoom" :zoom="zoom">
      <GmapMarker :key="i" v-for="(m,i) in markers" :position="m.position" :label="{text:m.sensor_id.toString(),color:'#2c3e50'}" :icon="icon"
        :clickable="true" @click="handleClick(m)"/>
      <!-- <GmapPolyline v-for="(m,index) in markers" :key="'x'+index"
        :path="[m.position, markers[m.parent-2].position]" :options="m.lineOpt">
      </GmapPolyline> -->
      <GmapPolyline v-for="(line,i) in lines" :key="'l'+i" :path="line.path" :options="line.option" /> 
    </GmapMap>
  </vs-card>
</template>

<script>
import result from './result2.json'

export default {
  data() {
    return {
      selectedGW: "any",
      selectedRange: "day",
      selelectedSensor: {},
      icon: {},
      label: {},
      zoom: 20,
      center: {lat:41.806581, lng:-72.252763}, // ITEB
      markers: [],
      lines:[],
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
          this.markers = []
          this.lines = []
          if (res.data.flag==0||res.data.data.length==0){
            return
          }
          this.$EventBus.$emit('sensorCnt', res.data.data.length-1)

          for(var i=0;i<res.data.data.length;i++) {
            // because there is no sensor 2.
            if(res.data.data[i].parent==1) {
              res.data.data[i].parent++
            }
            // gateway itself
            if(!res.data.data[i].parent) {
              res.data.data[i].parent=2
            }

            // generate lines
            this.lines.push({
              path: [res.data.data[i].position, res.data.data[res.data.data[i].parent-2].position],
              option: {
                strokeColor: 'rgba(102,102,102, 0.5)',
              },
            })
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
    handleClick(m) {
      this.$EventBus.$emit('selectedSensor', m)
      // double click -> reset
      if(m==this.selelectedSensor) {
        this.topoReset()
        this.selelectedSensor = {}
        return
      }
      this.selelectedSensor = m

      // high light
      for(var i=0;i<this.lines.length;i++) {
        if (m.position == this.lines[i].path[0] || m.position == this.lines[i].path[1]) {
          this.lines[i].option = {strokeColor:"rgba(102,102,102,0.9)"}
        } else {
          this.lines[i].option = {strokeColor:"rgba(192,192,192,0.3)"}
        }
      }
    },
    topoColorReset() {
      for(var i=0;i<this.lines.length;i++) {
        this.lines[i].option = {strokeColor:"rgba(102,102,102,0.5)"}
      }
    },
    panTo(position) {
      this.$refs.mymap.$mapPromise.then((map) => {
        map.panTo(position)
      })
    }
  },
  mounted() {
    // this.drawHeatMap() 
    this.drawTopology(this.selectedGW, this.selectedRange);

    this.$EventBus.$on('selectedSensor', (sensor) => {
      for(var i=0;i<this.markers.length;i++) {
        if(this.markers[i].sensor_id==sensor.sensor_id) {
          this.panTo(this.markers[i].position)
          this.zoom = 23
        }
      }
    });
    this.$EventBus.$on('selectedGW', (gw) => {
      this.selectedGW = gw
      this.drawTopology(this.selectedGW, this.range)
      this.panTo({lat:41.806581, lng:-72.252763})
      this.zoom = 20
    });
    this.$EventBus.$on("selectedRange", (range)=>{
      this.selectedRange = range
      this.drawTopology(this.selectedGW, this.selectedRange)
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