<template>
  <div>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col style="z-index:99" vs-offset="1" vs-w="4">
        <DeviceCnt/>
        <NWTable/>
        <RSSChart/>
      </vs-col>
      <vs-col style="z-index:99" vs-offset="0.2" vs-w="6.1">
        <Map/>
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