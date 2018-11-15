<template>
  <div id="app" class="hero is-fullheight">
    <div class="hero-head">
      <nav
        class="navbar column is-paddingless is-fixed-top has-background-white-ter"
        role="navigation"
        aria-label="main navigation">
        <div class="navbar-brand">
          <router-link :to="{ name: 'root', params: {} }" class="navbar-item is-size-4">
            NNLab
            <!-- <span class="icon is-small"><i class="fas fa-flask"></i></span> -->
          </router-link>
          <a class="navbar-end navbar-item">
            <i class="fab fa-github is-size-5"/>
          </a>
        </div>
      </nav>
    </div>
    <br>
    <div class="hero-body v-start">
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'onnx-explorer',
  };
</script>

<style lang="sass">
  @import './assets/theme.sass'
</style>
