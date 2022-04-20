<template>
  <div>
    <vs-row>
      <vs-col vs-offset="0.8" vs-w="5">
        <DeviceCnt />
      </vs-col>
      <vs-col vs-offset="0.3" vs-w="2.6125">
        <Uptime />
      </vs-col>
      <vs-col vs-offset="0.25" vs-w="2.6125">
        <TxTotal />
      </vs-col>
    </vs-row>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col vs-offset="0.8" vs-w="5">
        <NWTable />
        
        <SensorsChart />
      </vs-col>
      <vs-col vs-offset="0.3" vs-w="5.5">
        <Topo />
        <!-- <RSSiChart /> -->
      </vs-col>
    </vs-row>
    <vs-row>
      <vs-col vs-offset="0.8" vs-w="10.8">
        <!-- <LatencyChart/> -->
        <!-- <latency-chart-2/> -->
        <!-- <adj-overhead/> -->
        <!-- <RTTChart/> -->
      </vs-col>
    </vs-row>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col vs-offset="0.8" vs-w="10.8">
        <SchTable />
      </vs-col>
      <!-- <vs-col vs-offset="0.3" vs-w="2">
        <SchPi/>
      </vs-col> -->
    </vs-row>
  </div>
</template>>

<script>
import DeviceCnt from "../components/dashboard/DeviceCnt";
import Uptime from "../components/dashboard/Uptime";
import NWTable from "../components/dashboard/NWTable";
import TxTotal from "../components/dashboard/TxTotal";
// import LatencyChart from '../components/dashboard/LatencyChart'
// import RTTChart from '../components/dashboard/RTTChart'
// import RSSiChart from "../components/dashboard/RSSiChart";
import Topo from "../components/dashboard/Topo";

import SchTable from "../components/dashboard/SchTable";
import SensorsChart from "../components/dashboard/SensorsChart.vue";
// import LatencyChart2 from '../components/dashboard/LatencyChart2.vue'
// import AdjOverhead from '../components/dashboard/AdjOverhead.vue'
// import SchPi from '../components/dashboard/SchPi'
export default {
  components: {
    DeviceCnt,
    Uptime,
    TxTotal,
    NWTable,
    // LatencyChart,
    // RTTChart,
    // RSSiChart,
    Topo,

    SchTable,
    SensorsChart,
    // LatencyChart2,
    // AdjOverhead,
    // SchPi
  },
  data() {
    return {
      autorefresh: false,
    };
  },
  mounted() {
    this.$EventBus.$on("autorefresh", (flag) => {
      this.autorefresh = flag;
    });
    setInterval(() => {
      if (this.autorefresh) this.$EventBus.$emit("selectedRange", "week");
      // window.console.log("biu")
    }, 1000);
  },
};
</script>