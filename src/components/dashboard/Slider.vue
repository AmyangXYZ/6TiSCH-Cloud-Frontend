<template>
  <vs-card>
    <div class="sliders">
      <vs-row vs-align="flex-start" vs-w="12">
        <vs-col v-for="(f,i) in fs" :key="i" vs-offset="0.5" vs-w="5.2">
          <span class="title">{{f.name}}:</span>
        <span class="value">[{{f.value[0]}}, {{f.value[1]}}]</span>
        <vs-slider :color="f.color" step=1 v-model="f.value"/>
        </vs-col>
      </vs-row>
    </div>
  </vs-card>
</template>

<script>
export default {
  data() {
    return {
      fs: [
        {name:"Latency",value: [10,70], color:"dark"},
        {name:"MAC PER",value: [30,87], color:"orange"},
        {name:"Noise Level",value: [15,45], color:"green"},
        {name:"APP PER",value: [0,20], color:"red"},
      ],
    }
  }
}
</script>

<style lang="stylus" scoped>
.sliders
  font-size 1rem
</style>