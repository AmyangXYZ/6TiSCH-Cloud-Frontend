<template lang="html" >
  <div>
    <vs-table id="table" :max-items="maxItems" pagination :currentPage="currentPage" v-model="selectedSensor" @selected="selectSensor" :data="sensors">
      <vs-row slot="header" vs-align="center" style="margin:6px">
        <vs-col  vs-w="6">
          <h4>Network Statistics</h4>
        </vs-col>
        <vs-col vs-offset="1.5" vs-w="2.4">
          <vs-select v-model="selectedGW" width="100%" autocomplete @change="selectGW">
            <vs-select-item :text="item" :value="item" v-for="(item,index) in gateways" :key="index"/>
          </vs-select>
        </vs-col>
        <vs-col vs-offset="0.3" vs-w="1.6">
          <vs-select v-model="selectedRange" width="100%" autocomplete @change="selectRange">
            <vs-select-item :value="item" :text="item" v-for="(item,index) in ranges" :key="index"/>
          </vs-select>
        </vs-col>
      </vs-row>

      <template slot="thead">
        <vs-th sort-key="sensor_id">
          ID
        </vs-th>
        <!-- <vs-th sort-key="gateway">
          GATEWAY
        </vs-th> -->
        <vs-th sort-key="eui">
          EUI
        </vs-th>
        <vs-th sort-key="hop">
          HOP
        </vs-th>
        
        <vs-th sort-key="avg_mac_tx_total_diff">
          TX RATE(pps)
        </vs-th>
        <!-- <vs-th sort-key="tx_cells">
          TX CELLS
        </vs-th> -->
        <!-- <vs-th sort-key="parent">
          PARENT
        </vs-th> -->
        <!-- <vs-th sort-key="children">
          CHILDREN
        </vs-th> -->
        <vs-th sort-key="uplink_latency_avg">
          LATENCY(s)
        </vs-th>
        <!-- <vs-th sort-key="uplink_latency_sr">
          UPLINK LAT SR(%)
        </vs-th> -->
        <vs-th sort-key="e2e_latency_avg">
          RTT(s)
        </vs-th>
        <!-- <vs-th sort-key="sr">
          DSR(%)
        </vs-th> -->
        <!-- <vs-th sort-key="e2e_latency_sr">
          LAT SR(%)
        </vs-th> -->
        
        <vs-th sort-key="per">  
          PER(%)
        </vs-th>
        <!-- <vs-th sort-key="per_app">
          APP PER(%)
        </vs-th> -->
      </template>

      <template slot-scope="{data}">
        <vs-tr :data="tr" :key="index" v-for="(tr, index) in data">
          <vs-td :data="data[index].sensor_id">
            {{data[index].sensor_id}}
          </vs-td>
          <vs-td :data="data[index].eui64">
            {{data[index].eui64.substr(18,24).toUpperCase()}}
          </vs-td>
          <!-- <vs-td :data="data[index].gateway">
            {{data[index].gateway}}
          </vs-td> -->
          <vs-td :data="data[index].hop">
            {{data[index].hop}}
          </vs-td>
          <vs-td :data="data[index].avg_mac_tx_total_diff">
            {{(data[index].avg_mac_tx_total_diff/120).toFixed(3)}}
          </vs-td>
          
          <!-- <vs-td :data="data[index].parent">
            {{data[index].parent}}
          </vs-td> -->
          <!-- <vs-td :data="data[index].children">
            {{data[index].children}}
          </vs-td> -->
          <!-- <vs-td :data="data[index].tx_cells">
            {{data[index].tx_cells}}
          </vs-td> -->
          
          <vs-td :data="data[index].uplink_latency_avg">
            {{data[index].uplink_latency_avg.toFixed(2)}}
          </vs-td>
          <!-- <vs-td :data="data[index].uplink_latency_sr">
            {{(data[index].uplink_latency_sr*100).toFixed(2)}}
          </vs-td> -->
          <vs-td :data="data[index].e2e_latency_avg">
            {{(data[index].e2e_latency_avg).toFixed(2)}}
          </vs-td>
          <!-- <vs-td :data="data[index].sr">
            {{(data[index].sr*100).toFixed(2)}}
          </vs-td> -->
          <!-- <vs-td :data="data[index].e2e_latency_sr">
            {{(data[index].e2e_latency_sr*100).toFixed(2)}}
          </vs-td> -->
           
          <vs-td :data="data[index].per">
            {{(data[index].per).toFixed(3)}}
          </vs-td>
          <!-- <vs-td :data="data[index].per_app">
            {{data[index].app_per.toFixed(3)}}
          </vs-td>  -->
        </vs-tr>
      </template>
    </vs-table>
  </div>
</template>



<script>
// import topoRes from './topology_121_part.json'
export default {
  data() {
    return {
      gateways: [],
      sensors: [],
      selectedGW: 'any',
      selectedSensor: {},
      maxItems: 8,
      currentPage: 1,
      selectedRange: 'day',
      ranges: ['15min','30min','1hr',"4hr",'day','week','month']
    }
  },
  methods: {
    drawNWTable(gw, range) {
      this.$api.gateway.getNWStat(gw, range)
      .then(res=> {
        if (res.data.flag==0||res.data.data.length==0){
          this.sensors = []
          return
        }
        for(var i=0;i<res.data.data.length;i++){
          res.data.data[i].sr = (res.data.data[i].uplink_latency_success+res.data.data[i].e2e_latency_success) / (res.data.data[i].uplink_latency_cnt+res.data.data[i].e2e_latency_cnt)
          res.data.data[i].mac_per = res.data.data[i].avg_mac_tx_noack_diff/(res.data.data[i].avg_mac_tx_total_diff+0.000001)*100.0
          res.data.data[i].app_per = res.data.data[i].avg_app_per_lost_diff/(res.data.data[i].avg_app_per_sent_diff+0.000001)*100.0
          res.data.data[i].per = res.data.data[i].mac_per + res.data.data[i].app_per
          // res.data.data[i].tx_cells = 0
        }

        var sensors = res.data.data.sort(function(a,b) {
          return a.sensor_id - b.sensor_id
        });
        
        // get hop and children
        var links = []
        this.$api.gateway.getTopology(gw, range)
        .then(res=>{
          var nodes = res.data.data
          // nodes = topoRes.data
          for(var n=0;n<nodes.length;n++) {
            


            // links: [[child, parent]]
            links.push([nodes[n].sensor_id,nodes[n].parent])

            if(nodes[n].sensor_id!=1) {
              var hop = 1
              var parent = nodes[n].parent
              var MaxHop = 10
              while(parent!=1&&MaxHop>=0) {
                for(var nn=0;nn<nodes.length;nn++) {
                  if(nodes[nn].sensor_id == parent) {
                    parent = nodes[nn].parent
                    hop++
                  }
                }
                MaxHop--
              }
              nodes[n].hop = hop
            }
          }
          
          // for(var nnn=0;nnn<nodes.length;nnn++) {
          //   var children = 0
          //   for(var l=0;l<links.length;l++) {
          //     // is someone's parent
          //     if(nodes[nnn].sensor_id==links[l][1])
          //       children++
          //   }
          //   nodes[nnn].children=children
          // }
          
          for(var x=0;x<sensors.length;x++) {
            for(var y=0;y<nodes.length;y++) {
              if(sensors[x].sensor_id==nodes[y].sensor_id) {
                sensors[x].eui64 = nodes[y].eui64
                sensors[x].hop = nodes[y].hop
                sensors[x].parent = nodes[y].parent
                // sensors[x].children = nodes[y].children
              }
            }
          }
          
          // index for pagination
          for(var j=0;j<sensors.length;j++) {
            sensors[j].index = j
          }
          
          this.sensors = sensors
          this.$EventBus.$emit("sensors",this.sensors)

          // count bandwidth (tx cell)   
          // this.$api.gateway.getSchedule().
          // then((res)=>{ 
          //   if(res.data.flag == 0) return

          //   for(var j=0;j<this.sensors.length;j++) {
          //     var tx_cell_num = 0
          //     for(var i=0;i<res.data.data.length;i++) {
          //       if(res.data.data[i].type!="beacon") {
          //         if(res.data.data[i].sender == this.sensors[j].sensor_id) {
          //           tx_cell_num++
          //         }  
          //       }
          //     }
          //     this.sensors[j].tx_cells = tx_cell_num
          //   }            
          // })
        })
      })
    },
    selectGW() {
      this.$EventBus.$emit('selectedGW', this.selectedGW)
    },
    selectSensor(tr) {
      this.$EventBus.$emit('selectedSensor', tr)
    },
    selectRange() {
      this.$EventBus.$emit('selectedRange', this.selectedRange)
    },
  },
  mounted() {
    this.drawNWTable(this.selectedGW, this.selectedRange)

    this.$EventBus.$on("gateways", (gws)=>{
      this.gateways=gws
      this.gateways.unshift("any")
    }) 
    // handle sensor selection from Map
    this.$EventBus.$on("selectedSensor", (s)=>{
      for(var i=0;i<this.sensors.length;i++) {
        if(this.sensors[i].sensor_id == s.sensor_id) {
          this.currentPage = parseInt((this.sensors[i].index+this.maxItems)/this.maxItems)
          this.selectedSensor = this.sensors[i]
        }
      }
    })
    this.$EventBus.$on("selectedGW", (gw)=>{
      this.selectedGW = gw
      this.drawNWTable(this.selectedGW, this.selectedRange)
    })
    this.$EventBus.$on("selectedRange", (r)=>{
      this.selectedRange = r
      this.drawNWTable(this.selectedGW, this.selectedRange)
    })
  }
}
</script>

<style lang="stylus" scoped>
#table
  min-height 405px
th
  font-size 0.8rem
td
  font-size 0.75rem
</style>