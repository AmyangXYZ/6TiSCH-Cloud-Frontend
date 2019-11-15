<template>
    <vs-row vs-align="flex-start" vs-w="12">
      <vs-col  id="todo"  style="z-index:99" vs-offset="4" vs-w="4">  
        <vs-card>
            <div slot="header">
                Todo
            </div>
            <h2>- RSSi value</h2>
            <h2>- Icon match on map</h2>
            <h2>- Filter</h2>
            <h2>- Noise map</h2>
            <h2>- Battery usage</h2>
            <h2>- Analysis process</h2>
            <h2>- API redesign</h2>

        </vs-card>
      </vs-col>
    </vs-row> 
</template>

<script>
export default {
    
}
</script>

<style lang="stylus" scoped>
#todo
  font-size 2rem
  line-height 40px
</style>