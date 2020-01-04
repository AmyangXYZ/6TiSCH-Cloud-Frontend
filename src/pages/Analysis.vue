<template>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col   style="z-index:99" vs-offset="3" vs-w="6">  
        <vs-card id="todo">
          <Topology/>
        </vs-card>
      </vs-col>
    </vs-row> 
</template>

<script>
import Topology from '../components/analysis/Topology'

export default {
  components: {
    Topology
  },
}
</script>

<style lang="stylus" scoped>
#todo
  font-size 2rem
  line-height 40px
  height: 600px;
</style>