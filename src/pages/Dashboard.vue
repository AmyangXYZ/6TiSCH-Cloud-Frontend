<template>
  <div>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col style="z-index:99;margin-top:50px" vs-offset="0.8" vs-w="4.2">
        <DeviceCnt/>
        <NWTable/>
        <RSSiChart/>
        
      </vs-col>
      <vs-col style="z-index:99;margin-top:50px" vs-offset="0.3" vs-w="6.2">
        <Uptime/>
        <Slider/>
        <Layers/>
        <Map/>
      </vs-col>
    </vs-row> 
    <!-- <vs-row vs-align="flex-start" vs-w="12">
      <vs-col vs-offset="0.8" vs-w="10.5">
        <LatencyChart/>
        <RTTChart/>
      </vs-col>
    </vs-row> -->
  </div>
</template>>

<script>
import DeviceCnt from '../components/dashboard/DeviceCnt'
import Uptime from '../components/dashboard/Uptime'
import NWTable from '../components/dashboard/NWTable'
// import LatencyChart from '../components/dashboard/LatencyChart'
// import RTTChart from '../components/dashboard/RTTChart'
import RSSiChart from '../components/dashboard/RSSiChart'
import Map from '../components/dashboard/Map'
import Slider from '../components/dashboard/Slider'
import Layers from '../components/dashboard/Layers'

export default {
    components: {
      DeviceCnt,
      Uptime,
      NWTable,
      // LatencyChart,
      // RTTChart,
      RSSiChart,
      Map,
      Slider,
      Layers,
    },
}
</script>