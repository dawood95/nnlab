import Vue from 'vue';
import Router from 'vue-router';

import Overview from '@/components/Overview.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/overview',
      name: 'overview',
      component: Overview,
    },
    {
      path: '/',
      name: 'root',
      component: Overview,
    },
    {
      path: '*',
      redirect: '/',
    },
  ],
});
