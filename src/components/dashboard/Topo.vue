<template>
<div>
  <vs-card class="topo">
    <div id="title">Topology</div>
    <vs-tabs alignment="center">
      <vs-tab label="Graph">
        <TopoGraph/>
      </vs-tab>
      <vs-tab label="Map">
        <TopoMap/>
      </vs-tab>
      
      
    </vs-tabs>
  </vs-card>
  <vs-card>
    <topo-graph/>
  </vs-card>
</div>
</template>

<script>
import TopoMap from './TopoMap'
import TopoGraph from './TopoGraph'

export default {
  components: {
    TopoMap,
    TopoGraph
  }
}
</script>

<style lang="stylus">
#title
  position: absolute;
  font-weight 600
  font-size 1.15rem
  margin 10px

.topo
  .vs-card--content
    padding 0
  .vs-tabs--btn
    span
      font-size 0.9rem

  
</style>