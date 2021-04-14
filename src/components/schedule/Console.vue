<template>
  <vs-card id="console">
    <div slot="header">
      <h4>Console</h4>
    </div>

    <vs-row>
      
      <vs-col vs-w=0.6 vs-offset=0>
        <vs-button size="small" color="red" :disabled="running" icon-pack="fas" type="relief" icon="fa-play" @click="run"></vs-button>
      </vs-col>
      <vs-col vs-w=0.6>
        <vs-button size="small" color="primary" :disabled="!running" icon-pack="fas" type="relief" icon="fa-pause" @click="stop"></vs-button>
      </vs-col>
      <vs-col vs-w=0.6>
        <vs-button size="small" color="primary" :disabled="running" icon-pack="fas" type="relief" icon="fa-step-backward" @click="stepBwd"></vs-button>
      </vs-col>
      <vs-col vs-w=0.6>
        <vs-button size="small" color="primary" :disabled="running" icon-pack="fas" type="relief" icon="fa-step-forward" @click="stepFwd"></vs-button>
      </vs-col>
      <vs-col vs-w=0.6>
        <vs-button size="small" color="primary" :disabled="!started" icon-pack="fas" type="relief" icon="fa-stop" @click="finish"></vs-button>
      </vs-col>
    </vs-row>
    <div>
      
    <textarea id="logs" ref="logs" v-model="simulation_log" disabled>
    </textarea>
    </div>
  </vs-card>
</template>

<script>
export default {
  data() {
    return {
      started: false,
      running: false,
      simulation_log: "",
    }
  },
  methods: {
    run() {
      this.$EventBus.$emit("simulation_run", true)
      this.started = true
      this.running = true
    },
    stop() {
      this.$EventBus.$emit("simulation_run", false)
      this.running = false
    },
    stepFwd() {
      this.$EventBus.$emit("simulation_step", "forward")
    },
    stepBwd() {
      this.$EventBus.$emit("simulation_step", "back")
    },
    finish() {
      this.$EventBus.$emit("simulation_finish", true)
      this.running = false
    },

  },
  mounted() {
    this.$EventBus.$on("simulation_log", (log) => {
      this.simulation_log += "[+] slot "+log.slot+"\n"
      for(var i=0;i<log.tx.length;i++) {
        this.simulation_log += "\t"+log.tx[i][0]+"->"+log.tx[i][1]+"\n"
      }
      this.$nextTick(() => {
      this.$refs.logs.scrollTop = this.$refs.logs.scrollHeight
      })
    });
    
    this.$EventBus.$on("simulation_finish", ()=>{
      this.simulation_log += "Finished! Collecting results...\n"
      this.running = false
      this.started = false
    })
  }
}
</script>

<style lang="stylus" scoped>
#console
  width 100%
  height 500px
#logs
  margin-top 50px
  width 100%
  height 200px
  font-size 0.95rem
  line-height 1.3
  border-radius: 6px;
  padding-left 9px
  box-sizing: border-box;
  resize none
  outline: none;
  text-transform: none;
  text-decoration: none;
textarea:disabled {
  background: white;
}
</style>