<template lang="html">
  <div>
    <vs-table stripe max-items="6" pagination :data="sensors">
      <template slot="header">
        <h3 id="title">
          Sensors
        </h3>
      </template>

      <template slot="thead">
        <vs-th sort-key="sensor_id">
          ID
        </vs-th>
        <vs-th sort-key="avg_rtt">
          LATENCY
        </vs-th>
        <vs-th sort-key="mac_per">
          MAC PER(%)
        </vs-th>
        <vs-th sort-key="app_per">
          APP PER(%)
        </vs-th>
      </template>

      <template slot-scope="{data}">
        <vs-tr :key="indextr" v-for="(tr, indextr) in data" >
          <vs-td :data="data[indextr].sensor_id">
            {{data[indextr].sensor_id}}
          </vs-td>
          <vs-td :data="data[indextr].avg_rtt">
            {{data[indextr].avg_rtt}}
          </vs-td>
          <!-- <vs-td :data="data[indextr].id">
            {{data[indextr].id}}
          </vs-td>
          <vs-td :data="data[indextr].id">
            {{data[indextr].id}}
          </vs-td>  -->
        </vs-tr>
      </template>
    </vs-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      sensors: [],
    }
  },
  methods: {
    getNWStat() {
      this.$api.gateway.getNWStat("UCONN_GW")
      .then(res=> {
        for(var i=0;i<res.data.data.length;i++){
          res.data.data[i].avg_rtt = res.data.data[i].avg_rtt.toFixed(3)
        }
        this.sensors = res.data.data
      })
    },
    getNWStatByID(id) {
      this.$api.gateway.getNWStatByID("UCONN_GW", id)
      .then(res=> {
        window.console.log(res)
      })
    }
  },
  mounted: function () {
    this.getNWStat()
  }
}
</script>

<style lang="stylus" scoped>
#title
  margin 10px
</style>