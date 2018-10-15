<template>
  <div id="app" class="hero is-fullheight">
    <div class="hero-head">
      <nav
        class="navbar column is-paddingless is-fixed-top has-background-white-ter"
        role="navigation"
        aria-label="main navigation">
        <div class="navbar-brand level">
          <router-link :to="{ name: 'root', params: {} }" class="navbar-item level-item level-left is-size-3">
            NN Lab
          </router-link>
          <a class="navbar-item level-item level-right">
            <i class="fab fa-github is-size-4"/>
          </a>
        </div>
      </nav>
    </div>
    <br><br>
    <div class="hero-body v-start">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'onnx-explorer',
    components: {
      tabs: () => import('@/components/Tabs'),
    },
  };
</script>

<style lang="sass">
  @import './assets/theme.sass'
</style>
