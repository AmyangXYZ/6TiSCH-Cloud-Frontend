<template>
  <vs-card>
    <div slot="header">
      <h4>Filter</h4>
    </div>
    <div class="sliders">
      <div v-for="(f,i) in fs" :key="i">
        <span class="title">{{f.name}}:</span>
        <span class="value">[{{f.value[0]}}, {{f.value[1]}}]</span>
        <vs-slider :color="f.color" step=1 v-model="f.value"/>
      </div>
    </div>
  </vs-card>
</template>

<script>
export default {
  data() {
    return {
      fs: [
        {name:"Latency",value: [10,70], color:"green"},
        {name:"MAC PER",value: [15,45], color:"orange"},
        {name:"APP PER",value: [0,20], color:"red"},
        {name:"Noise Level",value: [30,90], color:"blue"},
      ],
    }
  }
}
</script>

<style lang="stylus" scoped>
.sliders
  font-size 1.1rem
  .value
    float right
    margin-right 220px

</style>