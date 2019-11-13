<template>
  <vs-row vs-align="flex-start" vs-w="12" height="600px">
    <vs-col style="z-index:99" vs-offset="0.8" vs-w="4.2">
      <Gateways/>
      <SensorTable/>
    </vs-col>
    <vs-col style="z-index:99" vs-offset="0.25" vs-w="6.3">
      <Map/>
    </vs-col>
  </vs-row> 
</template>>

<script>
import Gateways from '../components/dashboard/Gateways'
import SensorTable from '../components/dashboard/SensorTable'
import Map from '../components/dashboard/Map'

export default {
    components: {
      Gateways,
      SensorTable,
      Map,
    },
}
</script>