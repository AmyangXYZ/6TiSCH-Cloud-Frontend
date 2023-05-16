<template>
  <!-- <vs-card> -->
  <!-- <div slot="header"> -->

  <div id="map">
    <Slider />
    <Layers />
    <!-- <vs-row vs-align="center" vs-justify="space-between">
        <vs-col vs-w="3" vs-type="flex" vs-align="center">
          <vs-button id="fBt" color="danger" @click="showFiltersPanel" icon="filter_list" size="small">
            Filters
          </vs-button>
          <vs-button id="lBt" color="#1F7BBB" @click="showLayersPanel" icon="layers" size="small">
            Layers
          </vs-button>
        </vs-col>
        <vs-col vs-w="3.5" vs-type="flex" vs-justify="flex-end" vs-align="center">
          <vs-button color="#860262" @click="clearMap" icon="clear_all" size="small">
            Reset All
          </vs-button>
        </vs-col>
      </vs-row> -->
    <GmapMap
      ref="mymap"
      id="gmap"
      :center="center"
      v-model="zoom"
      :zoom="zoom"
      :options="opt"
    >
      <GmapMarker
        :key="i"
        v-for="(m, i) in markers"
        :position="m.position"
        :label="m.label"
        :icon="m.icon"
        :clickable="true"
        @click="handleClick(m)"
      /><GmapInfoWindow
        :opened="infoWindowActive"
        :options="infoWindowOpt"
        :position="infoWindowPos"
        @closeclick="infoWindowActive = false"
        ><PowerChart
      /></GmapInfoWindow>
      <GmapPolyline
        v-for="(line, i) in lines"
        :key="'l' + i"
        :path="line.path"
        :options="line.option"
      />
    </GmapMap>
  </div>
  <!-- </vs-card> -->
</template>

<script>
import PowerChart from "@/components/dashboard/PowerChart";
import topoRes from "./topology_49.json";
import Slider from "@/components/dashboard/Slider";
import Layers from "@/components/dashboard/Layers";

export default {
  components: {
    PowerChart,
    Slider,
    Layers,
  },
  data() {
    return {
      selectedGW: "any",
      selectedRange: "day",
      selectedSensor: {},
      latencyRange: [],
      noiseLvRange: [],
      macPERRange: [],
      appPERRange: [],
      noiseLayer: {},
      trafficLayerFlag: 0,
      noiseLayerFlag: 0,
      powerLayerFlag: 0,
      label: {},
      infoWindowActive: false,
      infoWindowPos: { lat: 0, lng: 0 },
      infoWindowOpt: {},
      zoom: 20.5,
      center: { lat: 41.806617, lng: -72.252749 }, // ITEB
      sensors: [],
      markers: [],
      lines: [],
      opt: {
        styles: [
          {
            stylers: [
              { visibility: "simplified" },
              // { "saturation": -100 }
            ],
          },
          {
            featureType: "poi",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
          {
            featureType: "transit",
            stylers: [
              {
                visibility: "off",
              },
            ],
          },
        ],
      },
    };
  },
  methods: {
    drawTopology(gw, range) {
      this.$gmapApiPromiseLazy().then(() => {
        this.$api.gateway.getTopology(gw, range).then((res) => {
          this.markers = [];
          this.lines = [];

          res.data = topoRes;
          window.console.log(res.data)
          // window.console.log(res,topoRes)
          if (res.data.flag == 0 || res.data.data.length == 0) {
            return;
          }

          this.$EventBus.$emit("sensorCnt", res.data.data.length - 1);

          for (var i = 0; i < res.data.data.length; i++) {
            if (res.data.data[i].sensor_id == 1) {
              this.$EventBus.$emit("startTime", res.data.data[i].first_appear);
            }

            // generate lines
            // window.console.log(i,res.data.data[i].position)
            var parentPos = [];
            if (res.data.data[i].parent == 0) {
              parentPos = res.data.data[i].position;
            } else {
              for (var j = 0; j < res.data.data.length; j++) {
                if (res.data.data[j].sensor_id == res.data.data[i].parent) {
                  parentPos = res.data.data[j].position;
                }
              }
            }
            this.lines.push({
              path: [res.data.data[i].position, parentPos],
              option: {
                strokeColor: "rgba(102,102,102, 0.5)",
                strokeWeight: 1.2,
              },
            });
          }
          // sensors data backup
          this.sensors = res.data.data.sort(function(a, b) {
            return a.sensor_id - b.sensor_id;
          });
          this.markers = this.sensors;

          for (var k = 0; k < this.markers.length; k++) {
            var icon = {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6.5,
              // fillColor: "none",
              fillOpacity: 1,
              strokeColor: "#000E2F",
              // fillColor: "#58B2EC",
              // fillOpacity: 1,
              // strokeColor: "#58B2EC",
            };
            var text = "";
            if (this.markers[k].sensor_id == 1) {
              text = "GW";
              icon.scale = 7;
            } else {
              // text = this.markers[k].sensor_id.toString();
              text = this.markers[k].sensor_id.toString() //+":"+this.markers[k].eui64.substr(18).toUpperCase();
            }
            this.$set(this.markers[k], "icon", icon);
            this.$set(this.markers[k], "label", {
              text: text,
              fontWeight:"bold",
              color: "white",
              fontSize: "8.5pt",
            });
          }
        });
      });
    },
    drawPowerLayer() {
      this.powerLayerFlag = 1;
      this.$api.gateway
        .getBattery(this.selectedGW, this.selectedRange)
        .then((res) => {
          var min =
            res.data.data[0].avg_cc2650_active +
            res.data.data[0].avg_cc2650_sleep +
            res.data.data[0].avg_rf_rx +
            res.data.data[0].avg_rf_tx;
          var max = min;
          for (var x = 1; x < res.data.data.length; x++) {
            var avgPWR =
              res.data.data[x].avg_cc2650_active +
              res.data.data[x].avg_cc2650_sleep +
              res.data.data[x].avg_rf_rx +
              res.data.data[x].avg_rf_tx;
            min = avgPWR > min ? min : avgPWR;
            max = avgPWR > max ? avgPWR : max;
          }
          var mid = (max - min) / 2;

          var r;
          var g;
          var b = 0;
          for (var i = 0; i < res.data.data.length; i++) {
            avgPWR =
              res.data.data[i].avg_cc2650_active +
              res.data.data[i].avg_cc2650_sleep +
              res.data.data[i].avg_rf_rx +
              res.data.data[i].avg_rf_tx;

            if (avgPWR >= mid) {
              r = 255;
              g = Math.round(255 * ((max - avgPWR) / (max - mid)));
            } else {
              g = 255;
              r = Math.round(255 * ((avgPWR - min) / (mid - min)));
            }

            var colorStr =
              "#" +
              ("0" + r.toString(16)).slice(-2) +
              ("0" + g.toString(16)).slice(-2) +
              ("0" + b.toString(16)).slice(-2);

            for (var j = 0; j < this.markers.length; j++) {
              if (this.markers[j].sensor_id == res.data.data[i].sensor_id) {
                this.markers[j].icon = {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: colorStr,
                  fillOpacity: 1,
                  strokeColor: colorStr,
                };
                this.markers[j].label = {
                  text: this.markers[j].sensor_id.toString(),
                  color: "#2c3e50",
                  fontSize: "10pt",
                };
              }
            }
          }
        });
    },
    drawNoiseLayer() {
      this.$gmapApiPromiseLazy().then(() => {
        var noiseData = [];
        this.$api.gateway
          .getNoiseLevel(this.selectedGW, this.selectedRange)
          .then((res) => {
            for (var i = 0; i < res.data.data.length; i++) {
              noiseData.push({
                location: new window.google.maps.LatLng(
                  parseFloat(res.data.data[i].position.lat),
                  parseFloat(res.data.data[i].position.lng)
                ),
                weight: res.data.data[i].noise_level * -1,
              });
            }
            this.noiseLayer = new window.google.maps.visualization.HeatmapLayer(
              {
                data: noiseData,
                map: this.$refs.mymap.$mapObject,
                radius: 60,
              }
            );
          });
      });
    },
    drawTrafficLayer() {},
    clearTrafficLayer() {
      if (this.trafficLayerFlag) return;
    },
    clearPowerLayer() {
      this.powerLayerFlag = 0;
      for (var i = 0; i < this.markers.length; i++) {
        this.markers[i].icon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#58B2EC",
          fillOpacity: 1,
          strokeColor: "#58B2EC",
        };
        this.markers[i].label = {
          text: this.markers[i].sensor_id.toString(),
          color: "#2c3e50",
          fontSize: "10pt",
        };
      }
    },
    clearNoiseLayer() {
      if (this.noiseLayerFlag) this.noiseLayer.setMap(null);
    },
    handleClick(m) {
      // not gateway
      this.$EventBus.$emit("selectedSensor", m);
      // double click -> reset
      if (m == this.selectedSensor) {
        this.topoColorReset();
        this.infoWindowActive = false;
        this.selectedSensor = {};
        return;
      }
      this.selectedSensor = m;
    },
    showInfoWindow(m) {
      this.infoWindowActive = true;
      this.infoWindowPos = m.position;
      this.infoWindowOpt = {
        closeBoxURL: "",
        pixelOffset: {
          width: 0,
          height: -15,
        },
      };
    },
    topoHighLight(m) {
      // high light
      for (var i = 0; i < this.lines.length; i++) {
        // as child
        if (m.position == this.lines[i].path[0]) {
          this.lines[i].option = { strokeColor: "green", zIndex: 2000 };
          // as parent
        } else if (m.position == this.lines[i].path[1]) {
          this.lines[i].option = { strokeColor: "lime", zIndex: 2000 };
        } else {
          this.lines[i].option = {
            strokeColor: "rgba(192,192,192,0.3)",
            zIndex: 1,
          };
        }
      }
    },
    topoColorReset() {
      for (var i = 0; i < this.lines.length; i++) {
        this.lines[i].option = { strokeColor: "rgba(102,102,102,0.5)" };
      }
    },
    panTo(position) {
      if (this.$refs.mymap != null) {
        this.$refs.mymap.$mapPromise.then((map) => {
          map.panTo(position);
        });
      }
    },
    showFiltersPanel() {
      this.$EventBus.$emit("showFiltersPanel", 1);
    },
    showLayersPanel() {
      this.$EventBus.$emit("showLayersPanel", 1);
    },
    clearMap() {
      this.$EventBus.$emit("showFiltersPanel", 0);
      this.$EventBus.$emit("showLayersPanel", 0);
      this.clearNoiseLayer();
      this.drawTopology(this.selectedGW, this.selectedRange);
      this.zoom = 21;
      this.panTo(this.center);
    },
  },
  mounted() {
    this.drawTopology(this.selectedGW, this.selectedRange);

    this.$EventBus.$on("selectedSensor", (sensor) => {
      for (var i = 0; i < this.markers.length; i++) {
        if (this.markers[i].sensor_id == sensor.sensor_id) {
          this.panTo(this.markers[i].position);
          this.zoom = 23;
          this.topoHighLight(this.markers[i]);
          if (sensor.sensor_id != 1 && this.powerLayerFlag) {
            this.showInfoWindow(this.markers[i]);
          }
        }
      }
    });
    this.$EventBus.$on("selectedGW", (gw) => {
      this.selectedGW = gw;
      this.drawTopology(this.selectedGW, this.selectedRange);
      this.infoWindowActive = false;
      this.panTo(this.center);
      this.zoom = 21;
    });
    this.$EventBus.$on("selectedRange", (range) => {
      this.selectedRange = range;
      this.drawTopology(this.selectedGW, this.selectedRange);
      if (this.powerLayerFlag) this.drawPowerLayer();
      if (this.noiseLayerFlag) {
        this.clearNoiseLayer();
        this.drawNoiseLayer();
      }
      this.infoWindowActive = false;
      this.panTo(this.center);
      this.zoom = 21;
    });

    this.$EventBus.$on("filterRes", (res) => {
      // if result is returned after reset/clear, shall not be shown
      if (!res.show) return;
      var tmp = [];
      for (var i = 0; i < this.sensors.length; i++) {
        for (var j = 0; j < res.data.length; j++) {
          if (this.sensors[i].sensor_id == res.data[j]) {
            tmp.push(this.sensors[i]);
          }
        }
      }
      this.markers = tmp;
      this.lines = [];
    });

    this.$EventBus.$on("showTrafficLayer", (sig) => {
      if (sig) this.drawPowerLayer();
      else this.clearPowerLayer();
    });

    this.$EventBus.$on("showPowerLayer", (sig) => {
      if (sig) this.drawPowerLayer();
      else this.clearPowerLayer();
    });

    this.$EventBus.$on("showNoiseLayer", (sig) => {
      if (sig) {
        this.drawNoiseLayer();
        this.noiseLayerFlag = !this.noiseLayerFlag;
      } else {
        this.clearNoiseLayer();
        this.noiseLayerFlag = 0;
      }
    });
  },
};
</script>

<style lang="stylus">
#map
  font-size 1rem

#fBt
  border-radius 6px 0 0 6px
#lBt
  border-radius 0 6px 6px 0
#gmap
  margin-top 8px
  width 100%
  height 970px
.gm-style-iw + button {display: none;}
</style>
