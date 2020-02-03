<template>
  <div id="app">
    <Navbar/>
    <Sidebar/>
    <keep-alive>
      <router-view style="min-height:80vh"/>
    </keep-alive>
    <Footer/>
  </div>
  
</template>

<script>
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'

export default {
  name: 'app',
  components: {
    Navbar,
    Sidebar,
    Footer
  }
}
</script>

<style>
html, body {
  max-height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #EBECF1;
  font-size: 1.2rem;
}

#app {
  font-family: "Noto Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 10vh;
  height: 100%;
}
</style>
