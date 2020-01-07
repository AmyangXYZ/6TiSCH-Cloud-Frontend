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
            <vs-table id="t" max-items="13" stripe pagination :data="events">
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
                    {{data[indextr].event}}
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
      events: []
    }
  },
  methods: {
    getTopoHistory() {
      this.$api.gateway.getTopoHistory()
      .then(res => {
        
        var tmp = []
        var now = Date.now()
        var nodeList = {}
        for(var i=0;i<res.data.data.length;i++) {
          var d = new Date(res.data.data[i].first_appear)
          // time zone diff
          var curD = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))

          tmp.push({
            timestamp: res.data.data[i].first_appear, // for sort
            datetime: curD.toJSON().substr(5, 14).replace('T', ' '),
            event: `Node ${res.data.data[i].sensor_id} connected to Node ${res.data.data[i].parent}`
          })

          nodeList[res.data.data[i].sensor_id] = res.data.data[i].last_seen
        }
        window.console.log(nodeList,now)
        for(let id in nodeList) {
          if((now - nodeList[id])>1000*60*10) {
            var d2 = new Date(nodeList[id])
            // time zone diff
            var curD2 = new Date(d2.getTime() - (d2.getTimezoneOffset() * 60000))
            tmp.push({
              timestamp: nodeList[id], // for sort
              datetime: curD2.toJSON().substr(5, 14).replace('T', ' '),
              event: `Node ${id} lost`
            })
          }
        }
          
        this.events = tmp.sort(function(a,b) {
          return b.timestamp - a.timestamp
        });
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
</style>