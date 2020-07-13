<template>
    <div class="flex flex-col items-center justify-center h-screen">
    <div class="text-5xl font-light mb-12 text-white">ONNX Explorer</div>
    <div>
        <label class="rounded bg-transparent hover:bg-gray-300 hover:text-gray-900 border-2 py-2 px-4 text-xl text-white">
            <span>Upload</span>
            <input type="file" class="hidden"  ref="onnx_path" @change="setOnnx" accept=".onnx"/>
        </label>
    </div>
    </div>
</template>

<script>
export default {
    name: 'upload-page',

    methods: {

        setOnnx(upload_event) {
            const reader = new FileReader();
            reader.onload = (read_event) => {
                this.$store.dispatch('setONNXFromBuffer', read_event.currentTarget.result);
            };
            reader.readAsArrayBuffer(upload_event.target.files[0]);
        }
    }
}
</script>