<template>
  <div class="tabs is-medium">
    <ul>
    <li v-for="i in tabs" v-bind:key="i.name" v-bind:class="{'is-active' : (route == i.route)}">
      <router-link :to="{name: i.route, params: i.params}">{{i.name}}</router-link>
    </li>
  </ul>
  </div>
</template>

<script>
const page = {
  name: 'Tabs',
  computed: {
    route() {
      return this.$router.currentRoute.name;
    },
    tabs() {
      return this.$store.getters.getTabs;
    },
  },
};
export default page;
</script>
