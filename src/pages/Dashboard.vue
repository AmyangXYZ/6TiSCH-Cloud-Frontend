<template>
  <div>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col style="z-index:99" vs-offset="1" vs-w="4">
        <DeviceCnt/>
        <NWTable/>
      </vs-col>
      <vs-col style="z-index:99" vs-offset="0.3" vs-w="6">
        <RSSChart/>
      </vs-col>
    </vs-row>
    <vs-row class="row-2" vs-align="flex-start" vs-w="12">
      <vs-col vs-offset="1" vs-w="7">
        <Map/>
      </vs-col>
      <vs-col vs-offset="0.3" vs-w="3">
        <Slider/>
      </vs-col>
    </vs-row> 
  </div>
</template>>

<script>
import DeviceCnt from '../components/dashboard/DeviceCnt'
import NWTable from '../components/dashboard/NWTable'
import RSSChart from '../components/dashboard/RSSChart'
import Map from '../components/dashboard/Map'
import Slider from '../components/dashboard/Slider'

export default {
    components: {
      DeviceCnt,
      NWTable,
      RSSChart,
      Map,
      Slider,
    },
}
</script>

<style lang="stylus" scoped>
.row-2
  margin-top 25px
  margin-bottom  25px
</style>