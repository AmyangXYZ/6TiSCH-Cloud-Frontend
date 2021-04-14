<template>
  <div>
    <vs-row vs-align="flex-start" vs-w="12">
      <br><br><br><br><br>
      <vs-col style="z-index:99" vs-offset="0.6" vs-w="5.5">  
        <Grid/>
      </vs-col>
      <vs-col style="z-index:99" vs-offset="0.4" vs-w="5.2">  
        <!-- <Latency/> -->
        <Console/>
      </vs-col>
       <!-- <vs-col style="z-index:99" vs-offset="0.1" vs-w="2.2  ">  
        <Latency2/>
      </vs-col> -->
      <!-- <vs-col style="z-index:99" vs-offset="0.1" vs-w="2.2">
        <Latency3/>
      </vs-col> -->
      <!-- <vs-col style="z-index:99" vs-offset="0.1" vs-w="2.2">
        <Latency4/>
      </vs-col> -->
    </vs-row>
    <vs-row>
      <vs-col style="z-index:99" vs-offset="0.6" vs-w="11.1">  
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
import Console from '../components/schedule/Console.vue'
import Grid from '../components/schedule/Grid'
import SchTable from '../components/schedule/Table'
// import SchTable5 from '../components/schedule/Table5'
// import SchTable4 from '../components/schedule/Table4'
// import SchTable2 from '../components/schedule/Table2'
// import SchTable3 from '../components/schedule/Table3'
// import Latency from '../components/schedule/Latency'
// import Latency2 from '../components/schedule/Latency2'
// import Latency3 from '../components/schedule/Latency3'
// import Latency4 from '../components/schedule/Latency4'


export default {
    components: {
      Grid,
      SchTable,
        Console,
      // SchTable4,
      // SchTable2,
      // SchTable3,
      // Latency,
      // Latency2,
      // Latency3,
      // Latency4
    }
}
</script>