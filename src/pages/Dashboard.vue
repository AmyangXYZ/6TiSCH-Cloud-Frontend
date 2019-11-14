<template>
  <vs-row vs-align="flex-start" vs-w="12" height="600px">
    <vs-col style="z-index:99" vs-offset="0.8" vs-w="4.5">
      <DeviceCnt/>
      <NWTable/>
    </vs-col>
    <vs-col style="z-index:99" vs-offset="0.3" vs-w="6">
      <Map/>
    </vs-col>
  </vs-row> 
</template>>

<script>
import DeviceCnt from '../components/dashboard/DeviceCnt'
import NWTable from '../components/dashboard/NWTable'
import Map from '../components/dashboard/Map'

export default {
    components: {
      DeviceCnt,
      NWTable,
      Map,
    },
}
</script>