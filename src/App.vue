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
      <div class="tile is-parent is-block-tablet is-flex-desktop has-background-white-ter">
        <div class="tile is-vertical is-parent is-4 has-background-white-ter">
          <editor/>
        </div>
        <div class="tile is-vertical is-parent is-2 has-background-white-ter">
          <div class="tile is-child">
            <div class="card">
              <div class="card-content">
                <p class="subtitle" style="color: #2980b9">
                  OPS
                </p>
                <p class="title" style="color: #2980b9">
                  {{opTotal}}
                </p>
              </div>
            </div>
            <br>
            <div class="card">
              <div class="card-content">
                <p class="subtitle" style="color: #27ae60">
                  Params
                </p>
                <p class="title" style="color: #27ae60">
                  {{paramTotal}}
                </p>
              </div>
            </div>
            <br>
            <div v-if="nodeInfo.length > 0" class="panel card" style="max-height: 60vh; overflow-y:auto;">
              <!-- <p class="panel-heading has-background-white-ter">Layer Info</p> -->
              <div v-for="(layer, index) in nodeInfo" class="card" :key="index">
                <div class="card-content">
                  <p class="is-3 title">
                    {{ layer.name }}
                  </p>
                  <div v-for="(k, v) in layer.params" :key="v" class="level is-marginless subtitle"> 
                    <p class="level-left">{{v}}</p>
                    <p class="level-right">{{k}}</p>
                  </div>
                </div>
              </div>
              <!--
              <div class="card">
                <div class="card-content">
                  <p class="subtitle" style="color: #27ae60">
                    Params
                  </p>
                  <p class="title" style="color: #27ae60">
                    {{paramTotal}}
                  </p>
                </div>
              </div>
              <div class="card">
                <div class="card-content">
                  <p class="subtitle" style="color: #27ae60">
                    Params
                  </p>
                  <p class="title" style="color: #27ae60">
                    {{paramTotal}}
                  </p>
                </div>
              </div>
              <div class="card">
                <div class="card-content">
                  <p class="subtitle" style="color: #27ae60">
                    Params
                  </p>
                  <p class="title" style="color: #27ae60">
                    {{paramTotal}}
                  </p>
                </div>
              </div>
              <div class="card">
                <div class="card-content">
                  <p class="subtitle" style="color: #27ae60">
                    Params
                  </p>
                  <p class="title" style="color: #27ae60">
                    {{paramTotal}}
                  </p>
                </div>
              </div>
              -->
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
import ModelGraph from '@/components/ModelGraph.vue';
import Editor from '@/components/Editor.vue';
import util from '@/utils/util.js';

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
    'model-graph': ModelGraph,
    'editor': Editor,
  },
  computed: {
    opTotal: function () {
      let x = 0;
      for (let i of this.totalOps) x += i;
      return util.formatter(x);
    },
    paramTotal: function () {
      let x = 0;
      for (let i of this.totalParams) x += i;
      return util.formatter(x);
    },
    ...mapGetters([
      'inputs',
      'outputs',
      'metaInfo',
      'fileName',
      'totalOps',
      'totalParams',
      'nodeInfo'
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
