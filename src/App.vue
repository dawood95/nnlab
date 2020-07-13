<template>
  <div class="bg-gray-900">
    <model-view v-if="isModelSet"></model-view>
    <upload-page v-else></upload-page>>
  </div>
</template>

<script>
import UploadPage from '@/components/UploadPage.vue';
import Model from '@/components/Model.vue';

export default {
  name: 'App',
  components: {
    'model-view' : Model,
    'upload-page': UploadPage
  },
  computed: {
    isModelSet () {
      return this.$store.getters.getModel !== null;
    }
  }

}
</script>

<style>

</style>
