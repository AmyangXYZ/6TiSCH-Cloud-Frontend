<template lang="html">

  <div class="parentx">

    <vs-sidebar :reduce="reduce" :reduce-not-rebound="reduceNotRebound" :reduce-not-hover-expand="notExpand" 
      :hidden-background="hiddenBG" parent="body" 
      :default-index="cur_index"  color="danger" class="sidebarx" spacer v-model="active" >

      <div class="header-sidebar" slot="header">
        <vs-avatar size="small" src="https://upload.wikimedia.org/wikipedia/en/thumb/5/56/University_of_Connecticut_seal.svg/1200px-University_of_Connecticut_seal.svg.png"/>
      </div>
      <vs-sidebar-group open title="Application" align="left">
        <vs-sidebar-item to="/dashboard" index="1" icon="dashboard">
          Dashboard
        </vs-sidebar-item>
        <vs-sidebar-item to="/schedule" index="2" icon="schedule" >
          Schedule
        </vs-sidebar-item>
        <vs-sidebar-item to="/analysis" index="3" icon="bar_chart" >
          Analysis
        </vs-sidebar-item>
      </vs-sidebar-group>

      <vs-divider icon="person" position="left" >
        User
      </vs-divider>

      <vs-sidebar-item index="5" icon="account_box" >
        Profile
      </vs-sidebar-item>

    </vs-sidebar>
  </div>

</template>

<script>
export default {
  data() {
    return {
      cur_index: 1,
      active: true,
      paths: ["/dashboard", "/schedule", "/analysis"],
      notExpand: false,
      hiddenBG: true,
      reduce: true,
      reduceNotRebound: true,
    };
  },
  methods: {
    biu() {
      this.cur_index = this.paths.indexOf(this.$route.path)+1
    },
  },
  created() {
    this.biu();
  },
};
</script>

<style lang="stylus" scoped>
.header-sidebar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  width: 100%;

  h4 {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }
}
</style>