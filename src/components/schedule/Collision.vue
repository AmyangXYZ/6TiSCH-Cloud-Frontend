<template>
  <vs-card> #{{topoCnt}} RAND: {{ randomCollision }}, {{randomCollision/topoCnt}}</vs-card>
</template>

<script>
export default {
  data() {
    return {
      topo: {},
      sf: 101,
      ch: 16,
      topoCnt:0,
      randomCells: [],
      randomCollision: 0,
    };
  },
  methods: {
    randomScheduling() {
      window.console.log(this.topo);
      for (var i = 1; i < Object.keys(this.topo).length; i++) {
        // window.console.log(i,this.topo[i].parent)
        var ts = Math.floor(Math.random() * this.sf);
        var ch = Math.floor(Math.random() * this.ch);
        if (this.checkCollisionRandom(ts, ch)) this.randomCollision++;
        this.randomCells.push({ ts: ts, ch: ch });

        ts = Math.floor(Math.random() * this.sf);
        ch = Math.floor(Math.random() * this.ch);
        if (this.checkCollisionRandom(ts, ch)) this.randomCollision++;
        this.randomCells.push({ ts: ts, ch: ch });
      }
    },
    checkCollisionRandom(ts, ch) {
      for (var i = 0; i < this.randomCells.length; i++)
        if (this.randomCells[i].ts == ts && this.randomCells[i].ch == ch) return true;

      return false;
    },
  },
  mounted() {
    this.$EventBus.$on("topo", (topo) => {
      this.topoCnt++
      this.randomCells = [];
      this.topo = topo.data;
      this.randomScheduling();
    });
  },
};
</script>