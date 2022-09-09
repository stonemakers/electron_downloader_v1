import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import Store from 'electron-store'

Vue.config.productionTip = false

Vue.prototype.$estore = new Store()

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
