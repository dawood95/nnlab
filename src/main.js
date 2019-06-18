import Vue from 'vue';
import VueApexCharts from 'vue-apexcharts';
import VueCytoscape from 'vue-cytoscape';
import 'vue-cytoscape/dist/vue-cytoscape.css';

import App from '@/App.vue';
import store from '@/store';

Vue.config.productionTip = false;
Vue.use(VueApexCharts)
Vue.use(VueCytoscape)

new Vue({
  store,
  render: h => h(App),
}).$mount('#app');
