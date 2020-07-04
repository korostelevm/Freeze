import Vue from 'vue'
import App from './App.vue'
import './components/_globals'
import { BootstrapVue } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
Vue.use(BootstrapVue)

import vueCustomElement from 'vue-custom-element'
Vue.use(vueCustomElement);

// Vue.prototype.$api = 'http://localhost:3000'
Vue.prototype.$api = '/api'

Vue.prototype.$dispatch = function(channel, o) {
  window.dispatchEvent(new CustomEvent(`express-lambda-ui:${channel}`, {
    detail: o, 
  }));
}

Vue.mixin({
  methods: {
    get_auth_header: function() {
      try{
        var user = JSON.parse(sessionStorage.getItem('user'))
        return user.id_token
      }catch(e){
        console.warn(e)
        return null
      }
    },
  }
})


Vue.config.productionTip = false
Vue.customElement('express-lambda-ui', App);
