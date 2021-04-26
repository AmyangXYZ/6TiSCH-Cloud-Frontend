<template>
  <div>
    <vs-navbar class="nabarx" id="nbar" color="linear-gradient(to right, #0A1E38 , #2A5788)">
      <div slot="title">
        <vs-navbar-title id="ntitle">
          <div>6TiSCH</div><div id="subtitle">@UConn</div>
        </vs-navbar-title>
      </div>
      <vs-navbar-item>  
        <Events style="cursor:pointer;"/>
      </vs-navbar-item>
      <!-- <vs-navbar-item >
        <a href="#">foo2</a>
      </vs-navbar-item>
      <vs-navbar-item>
        <a href="#">foo3</a>
      </vs-navbar-item> -->
    </vs-navbar>
  </div>
</template>

<script>
import Events from './dashboard/Events'

export default {
  components: {
    Events
  }
}
</script>

<style lang="stylus" scope>
#ntitle
  text-align right
  font-weight 500
  font-size 1.35rem
  margin-left 90px
  margin-bottom 20px
  #subtitle  
    font-size 1.2rem
#nbar
  height 105px
  z-index 1
  position absolute
  margin-top -80px
  color white
  li
    margin-right 30px
    margin-bottom 20px
  a
    font-size 1rem
</style>