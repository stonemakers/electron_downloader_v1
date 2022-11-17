import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Store from 'electron-store'
import XIcon from '@/components/XIcon/Index.vue'
const info = require("/package.json");

console.log('=======version',info.version);
Vue.config.productionTip = false
Vue.component('XIcon', XIcon)
Vue.prototype.$estore = new Store()
Vue.prototype.$version = info.version

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
