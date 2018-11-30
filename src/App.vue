<template>
  <div id="app">
    <nav class="navbar has-background-white-ter" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <a href="/#" class="navbar-item is-size-4">
          NNLab
          <!-- <span class="icon is-small"><i class="fas fa-flask"></i></span> -->
        </a>
      </div>
    </nav>
    <div class="container is-fluid">
      <div class="tile is-ancestor is-block-tablet is-flex-desktop">
        <div class="tile is-vertical is-4">
            <div class="tile is-parent has-background-white-ter">
              <div class="tile is-parent">
              <div class="tile is-child">
                <editor/>
              </div>
              </div>
            </div>
        </div>
        <div class="tile is-vertical is-auto">
          <div class="tile is-parent has-background-white-ter">
            <div class="tile is-child has-background-white-bis">
              <model-graph/>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import OPAreaChart from '@/components/OPAreaChart.vue';
import ModelGraph from '@/components/ModelGraph.vue';
import Editor from '@/components/Editor.vue';

import { mapGetters } from 'vuex';

const protobuf = require('protobufjs');

const page = {
  name: 'Overview',
  data: () => {
    return {
      loading: false,
      loaded: false,
    };
  },
  components: {
    'op-area-chart': OPAreaChart,
    'model-graph': ModelGraph,
    'editor': Editor,
  },
  computed: {
    indices: function () {
      let x = [];
      for (let i in this.totalOps) x.push(Number(i) + 1);
      return x;
    },
    ...mapGetters([
      'inputs',
      'outputs',
      'metaInfo',
      'totalOps',
      'fileName',
      'totalOps',
      'totalParams',
    ]),
  },
  methods: {
    setOnnx(ev) {
      protobuf.load('onnx.proto', (err, root) => {
        if (err) {
          throw err;
        }

        const onnxRoot = root;
        const file = ev.target.files[0];

        const reader = new FileReader();

        this.loading = true;
        // set filename
        this.$store.commit('setFileName', file.name);

        // set reader onload to commit setModel
        reader.onload = (event) => {
          const buffer = new Uint8Array(event.currentTarget.result);
          const ModelProto = onnxRoot.lookupType('onnx.ModelProto');
          const onnxModel = ModelProto.decode(buffer);
          this.$store.commit('setModel', onnxModel);
          this.loading = false;
          this.loaded = true;
        };
        reader.readAsArrayBuffer(file);
      });
    },
  },
};
export default page;
</script>

<style lang="sass">
  @import './assets/theme.sass'
</style>
