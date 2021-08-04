<template>
  <div>
    <vs-row vs-align="flex-start" vs-w="12">
      <br><br><br><br><br>
      <vs-col style="z-index:99" vs-offset="0.6" vs-w="5">  
        <Grid/>
      </vs-col>
      <vs-col style="z-index:99" vs-offset="0.2" vs-w="6">  
        <!-- <Latency/> -->
        <sim/>
        <!-- <Graph/> -->
      </vs-col>
       <!-- <vs-col style="z-index:99" vs-offset="0.1" vs-w="2.2  ">  
        <Latency/>
      </vs-col> -->
      <!-- <vs-col style="z-index:99" vs-offset="0.1" vs-w="2.2">
        <Latency3/>
      </vs-col> -->
      <!-- <vs-col style="z-index:99" vs-offset="0.1" vs-w="2.2">
        <Latency4/>
      </vs-col> -->
    </vs-row>
    <vs-row>
      <vs-col style="z-index:99" vs-offset="0.6" vs-w="11.2">  
        <SchTable/>
      </vs-col>
      <!-- <vs-col style="z-index:99" vs-offset="0.6" vs-w="11.1">  
        <SchTable2/>
      </vs-col> -->
      <!-- <vs-col style="z-index:99" vs-offset="0.6" vs-w="11.1">  
        <SchTable4/>
      </vs-col> -->
      
      <!-- <vs-col style="z-index:99" vs-offset="0.6" vs-w="11.1">  
        <SchTable3/>
      </vs-col> -->
    </vs-row>

  </div>
</template>

<script>
// import Console from '../components/schedule/Console.vue'
import Grid from '../components/schedule/Grid'
import Sim from '../components/schedule/Sim.vue'
import SchTable from '../components/schedule/Table'
// import Graph from '../components/schedule/Graph'
// import SchTable5 from '../components/schedule/Table5'
// import SchTable4 from '../components/schedule/Table4'
// import SchTable2 from '../components/schedule/Table2'
// import SchTable3 from '../components/schedule/Table3'
// import Latency from '../components/schedule/Latency'
// import Latency from '../components/schedule/Latency'
// import Latency3 from '../components/schedule/Latency3'
// import Latency4 from '../components/schedule/Latency4'


export default {
    components: {
      Grid,
      SchTable,
      // Graph,
        // Console,
        Sim,
      // SchTable4,
      // SchTable2,
      // SchTable3,
      // Latency,
      // Latency,
      // Latency3,
      // Latency4
    }
}
</script>