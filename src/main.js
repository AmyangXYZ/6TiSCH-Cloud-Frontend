import Vue from 'vue'
import App from './App.vue'
import Vuesax from 'vuesax'
import router from './router'
import api from './api'
import * as VueGoogleMaps from 'vue2-google-maps'
import 'vuesax/dist/vuesax.css'
import 'material-icons/iconfont/material-icons.css';


Vue.prototype.$EventBus = new Vue()
Vue.prototype.$api = api
Vue.use(Vuesax)
Vue.use(VueGoogleMaps, {
  load: {
    key: 'AIzaSyCsrBs8pBphKLsiDQHTrSVLgnIp3oTE-S0',
    libraries: 'places, drawing', 
  },
  installComponents: true
})
Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')

