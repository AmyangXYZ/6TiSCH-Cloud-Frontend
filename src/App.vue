<template>
  <div id="app">
    <Navbar/>
    <Sidebar/>
    <keep-alive>
      <router-view/>
    </keep-alive>
  </div>
</template>

<script>
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'

export default {
  name: 'app',
  components: {
    Navbar,
    Sidebar,
  },
}

</script>

<style>
html, body {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #EBECF1;
  font-size: 1.2rem;
}

/* vertical align issue */
.material-icons {
    display: inline-block;
    font-size: inherit;
    line-height: inherit;
    vertical-align: middle;
    transform: translateY(-.1em);
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 105px;
}
</style>
