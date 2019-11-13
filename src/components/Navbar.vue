<template>
  <div>
    <vs-navbar class="nabarx" id="nbar" color="linear-gradient(to right, #0A1E38 , #2A5788)">
      <div slot="title">
        <vs-navbar-title id="ntitle">
          <div>6TiSCH</div><div id="subtitle">@UConn</div>
        </vs-navbar-title>
      </div>
      <vs-navbar-item>
        <a href="#">foo1</a>
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
  
}
</script>

<style lang="stylus" scope>
#ntitle
  text-align right
  font-weight 500
  font-size 1.6rem
  margin-left 90px
  margin-bottom 35px
  #subtitle  
    font-size 1.2rem
#nbar
  height 130px
  z-index 1
  position absolute
  margin-top -90px
  color white
  a
    font-size 0.9rem
    margin-right 20px
    margin-bottom 35px
</style>