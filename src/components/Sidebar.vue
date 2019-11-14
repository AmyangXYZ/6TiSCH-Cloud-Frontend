<template lang="html">

  <div class="parentx">

    <vs-sidebar :reduce="reduce" :reduce-not-rebound="reduceNotRebound" :reduce-not-hover-expand="notExpand" :hidden-background="hiddenBG" parent="body" default-index="1"  color="danger" class="sidebarx" spacer v-model="active" >

      <div class="header-sidebar" slot="header">
        <vs-avatar size="70px" src="https://upload.wikimedia.org/wikipedia/commons/5/5a/MRT_Singapore_Destination_6.png"/>
      </div>
      <vs-sidebar-group open title="Application" align="left">
        <vs-sidebar-item to="/dashboard" index="1" icon="dashboard">
          Dashboard
        </vs-sidebar-item>
        <vs-sidebar-item to="/analysis" index="2" icon="bar_chart" >
          Analysis
        </vs-sidebar-item>
      </vs-sidebar-group>

      <vs-divider icon="person" position="left" >
        User
      </vs-divider>

      <vs-sidebar-item index="3" icon="account_box" >
        Profile
      </vs-sidebar-item>

    </vs-sidebar>
  </div>

</template>

<script>
export default {
  name:"Sidebar",
  data() {
    return {
      active: true,
      notExpand: false,
      hiddenBG: true,
      reduce: true,
      reduceNotRebound: true,
    }
  },
}
</script>

<style lang="stylus" scoped>
.header-sidebar
  display flex
  align-items center
  justify-content center
  flex-direction column
  width 100%
  h4
    display flex
    align-items center
    justify-content center
    width 100%
</style>