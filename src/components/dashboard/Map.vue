<template>
  <vs-card>
    <div slot="header">
      <vs-row vs-align="center" vs-justify="space-between">
        <vs-col vs-w="2.5" vs-type="flex" vs-align="center">
          <vs-button id="fBt" color="danger" @click="showFiltersPanel" icon="filter_list" size="small">
            Filters
          </vs-button>
          <vs-button id="lBt" color="#1F7BBB" @click="showLayersPanel" icon="layers" size="small">
            Layers
          </vs-button>
        </vs-col>
        <vs-col vs-w="3" vs-type="flex" vs-justify="flex-end" vs-align="center">
          <vs-button color="#860262" @click="clearMap" icon="clear_all" size="small">
            Clear All
          </vs-button>
        </vs-col>
      </vs-row>
      <GmapMap ref="mymap" id="gmap" :center="center" v-model="zoom" :zoom="zoom">
        <GmapMarker :key="i" v-for="(m,i) in markers" :position="m.position" :label="m.label" :icon="m.icon" :clickable="true" @click="handleClick(m)"/>
        <GmapPolyline v-for="(line,i) in lines" :key="'l'+i" :path="line.path" :options="line.option"/> 
      </GmapMap>
    </div>
  </vs-card>
</template>

<script>
export default {
  data() {
    return {
      selectedGW: "any",
      selectedRange: "day",
      selectedSensor: {},
      latencyRange: [],
      noiseLvRange: [],
      macPERRange: [],
      appPERRange: [],
      powerHeatmapData: [],
      label: {},
      zoom: 20,
      center: {lat:41.806581, lng:-72.252763}, // ITEB
      sensors : [],
      markers: [],
      lines:[],
    }
  },
  methods: {
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
          // sensors data backup
          this.sensors = res.data.data.sort(function(a,b) {
            return a.sensor_id - b.sensor_id
          });
          this.markers = this.sensors
          var icon = {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "#58B2EC",
            fillOpacity: 1,
            strokeColor: "#58B2EC",
          }
          
          for(var j=0;j<this.markers.length;j++) {
            this.$set(this.markers[j],'icon', icon)
            this.$set(this.markers[j],'label', {text:this.markers[j].sensor_id.toString(), color:'#2c3e50'})
          }
        })
      })
    },
    drawPowerLayer() {
      this.$api.gateway.getBattery(this.selectedGW, this.selectedRange)
      .then(res => {
        var min = res.data.data[0].avg_cc2650_active+res.data.data[0].avg_cc2650_sleep
                                +res.data.data[0].avg_rf_rx+res.data.data[0].avg_rf_tx
        var max = min
        for(var x=1;x<res.data.data.length;x++) {
          var avgPWR = (res.data.data[x].avg_cc2650_active+res.data.data[x].avg_cc2650_sleep
                                +res.data.data[x].avg_rf_rx+res.data.data[x].avg_rf_tx)
          min = avgPWR>min?min:avgPWR
          max = avgPWR>max?avgPWR:max
        }
        var mid = (max - min)/2
        
        var r; var g; var b=0;
        for(var i=0;i<res.data.data.length;i++) {
          avgPWR = (res.data.data[i].avg_cc2650_active+res.data.data[i].avg_cc2650_sleep
                                +res.data.data[i].avg_rf_rx+res.data.data[i].avg_rf_tx)
          
          if(avgPWR>=mid) {r=255;g=Math.round(255*((max-avgPWR)/(max-mid)))}
          else {g=255;r=Math.round(255*((avgPWR-min)/(mid-min)))}

          var colorStr = "#"+('0'+r.toString(16)).slice(-2)+('0'+g.toString(16)).slice(-2)+('0'+b.toString(16)).slice(-2)   

          for(var j=0;j<this.markers.length;j++) {
            if(this.markers[j].sensor_id == res.data.data[i].sensor_id) {
              this.markers[j].icon = {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: colorStr,
                fillOpacity: 1,
                strokeColor: colorStr,
              }
              this.markers[j].label = {
                color: '#2c3e50',
                text: this.markers[j].sensor_id.toString(),
              }
            }
          }
        }
      })
    },
    drawNoiseLayer() {
      this.$gmapApiPromiseLazy().then(() => {
        this.$api.gateway.getBattery(this.selectedGW, this.selectedRange)
          .then(res => {
            for(var i=0;i<res.data.data.length;i++) {
              var avgPWR = res.data.data[i].avg_cc2650_active+res.data.data[i].avg_cc2650_sleep                                    +res.data.data[i].avg_rf_rx+res.data.data[i].avg_rf_tx
              for(var j=0;j<this.markers.length;j++) {
                if(this.markers[j].sensor_id == res.data.data[i].sensor_id) {
                  this.powerHeatmapData.push({location: new window.google.maps.LatLng(parseFloat(this.markers[j].position.lat), parseFloat(this.markers[j].position.lng)), weight: avgPWR})
                }
              }
            }
            new window.google.maps.visualization.HeatmapLayer({
              data: this.powerHeatmapData,
              map: this.$refs.mymap.$mapObject,
              radius: 80,
            })
          })

      })
    },
    clearPowerLayer() {
      for(var i=0;i<this.markers.length;i++) {
        this.markers[i].icon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: "#58B2EC",
          fillOpacity: 1,
          strokeColor: "#58B2EC",
        }
        this.markers[i].label = {text:this.markers[i].sensor_id.toString(), color:'#2c3e50'}
      }
    },
    handleClick(m) {
      // not gateway
      if(m.sensor_id!=1) this.$EventBus.$emit('selectedSensor', m)
      // double click -> reset
      if(m==this.selectedSensor) {
        this.topoColorReset()
        this.selectedSensor = {}
        return
      }
      this.selectedSensor = m

      // high light
      for(var i=0;i<this.lines.length;i++) {
        // as child
        if (m.position == this.lines[i].path[0]) {
          this.lines[i].option = {strokeColor:"green",zIndex:2000}
          // as parent
        } else if (m.position == this.lines[i].path[1]) { 
          this.lines[i].option = {strokeColor:"lime",zIndex:2000}
        }
        else {
          this.lines[i].option = {strokeColor:"rgba(192,192,192,0.3)",zIndex:1}
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
    },
    showFiltersPanel() {
      this.$EventBus.$emit("showFiltersPanel", 1)
    },
    showLayersPanel() {
      this.$EventBus.$emit("showLayersPanel", 1)
    },
    clearMap() {
      this.$EventBus.$emit("showFiltersPanel", 0)
      this.$EventBus.$emit("showLayersPanel", 0)
      setTimeout(this.drawTopology(this.selectedGW, this.selectedRange), 5000)
    }
  },
  mounted() {
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
      this.drawTopology(this.selectedGW, this.selectedRange)
      this.panTo({lat:41.806581, lng:-72.252763})
      this.zoom = 20
    });
    this.$EventBus.$on("selectedRange", (range)=>{
      this.selectedRange = range
      this.drawTopology(this.selectedGW, this.selectedRange)
      this.panTo({lat:41.806581, lng:-72.252763})
      this.zoom = 20
    })

    this.$EventBus.$on("filterRes", (res)=>{
      // if result is returned after reset/clear, shall not be shown
      if(!res.show) return
      var tmp = []
      for(var i=0;i<this.sensors.length;i++) {
        for(var j=0;j<res.data.length;j++) {
          if(this.sensors[i].sensor_id == res.data[j]) {
            tmp.push(this.sensors[i])
          }
        }
      }
      this.markers = tmp
      this.lines = []
    })

    this.$EventBus.$on("showPowerLayer", (sig) => {
      if(sig) this.drawPowerLayer()
      else this.clearPowerLayer()
    })

    this.$EventBus.$on("showNoiseLayer", (sig) => {
      if(sig) this.drawNoiseLayer()
      // else this.clearPowerLayer()
    })
  }
}
</script>

<style lang="stylus" scoped>
#fBt
  border-radius 6px 0 0 6px
#lBt
  border-radius 0 6px 6px 0
#gmap
  margin-top 8px
  width 100%
  height 638px
</style>