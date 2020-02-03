<template>
  <div>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col style="z-index:99" vs-offset="1" vs-w="4">
        <DeviceCnt/>
        <NWTable/>
        <RSSiChart/>
      </vs-col>
      <vs-col style="z-index:99" vs-offset="0.2" vs-w="6.1">
        <Uptime/>
        <Slider/>
        <Layers/>
        <Map/>
      </vs-col>
    </vs-row> 
  </div>
</template>>

<script>
import DeviceCnt from '../components/dashboard/DeviceCnt'
import Uptime from '../components/dashboard/Uptime'
import NWTable from '../components/dashboard/NWTable'
import RSSiChart from '../components/dashboard/RSSiChart'
import Map from '../components/dashboard/Map'
import Slider from '../components/dashboard/Slider'
import Layers from '../components/dashboard/Layers'

export default {
    components: {
      DeviceCnt,
      Uptime,
      NWTable,
      RSSiChart,
      Map,
      Slider,
      Layers,
    },
}
</script>