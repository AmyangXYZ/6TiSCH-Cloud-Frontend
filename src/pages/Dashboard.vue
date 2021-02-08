<template>
  <div>
    <vs-row>
      <vs-col  vs-offset="0.8" vs-w="5">
        <DeviceCnt/>
      </vs-col>
      <vs-col vs-offset="0.3" vs-w="2.6125">
        <Uptime/>
      </vs-col>
      <vs-col  vs-offset="0.25"  vs-w="2.6125">
        <TxTotal/>
      </vs-col>
    </vs-row>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col vs-offset="0.8" vs-w="5">
        <NWTable/>
        <RSSiChart/>
      </vs-col>
      <vs-col vs-offset="0.3" vs-w="5.5">
        <Slider/>
        <Layers/>
        <Map/>
      </vs-col>
    </vs-row> 
    <!-- <vs-row >
      <vs-col vs-offset="0.8" vs-w="10.8"> -->
        <!-- <LatencyChart/> -->
        <!-- <RTTChart/> -->
      <!-- </vs-col>
    </vs-row> -->
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col vs-offset="0.8" vs-w="8.5">
        <SchTable/>
      </vs-col>
      <vs-col vs-offset="0.3" vs-w="2">
        <SchPi/>
      </vs-col>
    </vs-row>
  </div>
</template>>

<script>
import DeviceCnt from '../components/dashboard/DeviceCnt'
import Uptime from '../components/dashboard/Uptime'
import NWTable from '../components/dashboard/NWTable'
import TxTotal from "../components/dashboard/TxTotal"
// import LatencyChart from '../components/dashboard/LatencyChart'
// import RTTChart from '../components/dashboard/RTTChart'
import RSSiChart from '../components/dashboard/RSSiChart'
import Map from '../components/dashboard/Map'
import Slider from '../components/dashboard/Slider'
import Layers from '../components/dashboard/Layers'
import SchTable from '../components/dashboard/SchTable'
import SchPi from '../components/dashboard/SchPi'
export default {
    components: {
      DeviceCnt,
      Uptime,
      TxTotal,
      NWTable,
      // LatencyChart,
      // RTTChart,
      RSSiChart,
      Map,
      Slider,
      Layers,
      SchTable,
      SchPi
    },
}
</script>