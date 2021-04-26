<template>
  <div id="app">
    <div id="content-wrap">
      <Navbar/>
      <Sidebar/>
      <keep-alive>
        <router-view/>
      </keep-alive>
    </div>
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
  max-height: 120%;
  
  width: 100%;
  margin: 0;
  padding: 0;
  background-color: #EBECF1;
  font-size: 1.15rem;
}

#app {
  position: relative;
  min-height: calc(100vh - 80px);
  font-family: "Noto Sans", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 80px;
  /* height: 100%; */
}

#content-wrap {
  padding-bottom: 50px;
  /* overflow: hidden; */
}
</style>
