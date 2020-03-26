<template>
  <div>
    <Grid/>
    <SchTable/>
    
  </div>
</template>

<script>
import Grid from '../components/schedule/Grid'
import SchTable from '../components/schedule/Table'


export default {
    components: {
      Grid,
      SchTable,
    }
}
</script>