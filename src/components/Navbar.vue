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
  font-size 1.6rem
  margin-left 90px
  margin-bottom 15px
  #subtitle  
    font-size 1.4rem
#nbar
  height 135px
  z-index 1
  position absolute
  margin-top -10vh
  color white
  li
    margin-right 30px
    margin-bottom 20px
  a
    font-size 1rem
</style>