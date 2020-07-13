<template>
    <div class="flex flex-col items-center justify-center h-screen">
    <div class="text-5xl font-light mb-12 text-white">{{modelName}}</div>
    <div class="text-5xl font-light mb-12 text-white">{{totalOps}}</div>
    </div>
</template>

<script>
export default {
    name: 'model-page',
    computed: {
        modelName() {
            return this.$store.getters.getModelName;
        },
        totalOps() {
            return this.$store.getters.getTotalOps;
        }
    },
    methods: {
    }
}
</script>