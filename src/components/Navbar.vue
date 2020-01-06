<template>
  <div>
    <vs-navbar class="nabarx" id="nbar" color="linear-gradient(to right, #0A1E38 , #2A5788)">
      <div slot="title">
        <vs-navbar-title id="ntitle">
          <div>6TiSCH</div><div id="subtitle">@UConn</div>
        </vs-navbar-title>
      </div>
      <vs-navbar-item>  
        <vs-dropdown id="events" vs-navbar-item vs-custom-content vs-trigger-click >
          <a class="a-icon" href.prevent>Events</a>
          <vs-dropdown-menu>
            <vs-table max-items="12" stripe pagination :data="topoHistory">
              <template slot="thead">
                <vs-th>
                  Date
                </vs-th>
                <vs-th>
                  Event
                </vs-th>
              </template>

              <template slot-scope="{data}">
                <vs-tr :key="indextr" v-for="(tr, indextr) in data" >
                  <vs-td>
                    {{data[indextr].datetime}}
                  </vs-td>
                  <vs-td>
                    Node {{data[indextr].sensor_id}} connected to Node {{data[indextr].parent}}
                  </vs-td>
                </vs-tr>
              </template>
            </vs-table>
          </vs-dropdown-menu>
        </vs-dropdown>
      </vs-navbar-item>
      <vs-navbar-item >
        <a href="#">foo2</a>
      </vs-navbar-item>
      <vs-navbar-item>
        <a href="#">foo3</a>
      </vs-navbar-item>
    </vs-navbar>
  </div>
</template>

<script>
export default {
  data() {
    return {
      topoHistory: []
    }
  },
  methods: {
    getTopoHistory() {
      this.$api.gateway.getTopoHistory()
      .then(res => {
        res.data.data = res.data.data.sort(function(a,b) {
          return b.timestamp - a.timestamp
        });
        for(var i=0;i<res.data.data.length;i++) {
          var d = new Date(res.data.data[i].timestamp)
          // time zone diff
          var curD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
          res.data.data[i].datetime = curD.toJSON().substr(5, 14).replace('T', ' ')

           
          this.topoHistory.push(res.data.data[i])
        }
      })
    }
  },
  mounted() {
    this.getTopoHistory()
  }
}
</script>

<style lang="stylus" scope>
#ntitle
  text-align right
  font-weight 500
  font-size 1.8rem
  margin-left 90px
  margin-bottom 20px
  #subtitle  
    font-size 1.4rem
#nbar
  height 135px
  z-index 1
  position absolute
  margin-top -105px
  color white
  li
    margin-right 30px
    margin-bottom 20px
  a
    font-size 1rem
#events
  text-align center
  color white
  font-size 1rem
  display block
  margin-top -4px
.vs-table-text
  text-align center
</style>