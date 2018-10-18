<template>
  <div class="container">
    <div class="tile is-ancestor">
      <div class="tile is-vertical">
        <div class="tile is-parent">
          <div class="tile is-parent has-background-white-ter">
            <div class="tile is-child columns">
              <div class="column is-narrow is-size-4">
                ONNX Model
              </div>
              <div class="column">
                <div class="control"  v-bind:class="{'is-loading': loading}">
                  <input class="input has-text-centered" type="text" :value="fileName" readonly>
                </div>
              </div>
              <div class="column is-narrow file">
              <label class="file-label">
                <input class="file-input" type="file" ref="onnx_path" @change="setOnnx">
                <span class="file-cta">
                  <span class="file-icon">
                    <i class="fas fa-upload"></i>
                  </span>
                  <span class="file-label">
                    Choose a model
                  </span>
                </span>
              </label>
            </div>
            </div>
          </div>
        </div>
        <div class="tile is-parent">
          <div class="tile is-child">
            <editor></editor>
          </div>
        </div>
        <div class="tile is-parent">
          <div class="tile is-parent has-background-white-ter">
            <div class="tile is-parent is-4">
              <div class="tile is-parent has-background-white-bis">
                <div class="tile is-child">
                  <div class="level-item is-size-5">
                    Meta Info
                  </div>
                  <div class="section h120 is-clipped scrollable">
                    <div v-for="item in metaInfo" :key="item.name" class="columns is-mobile">
                      <div class="column has-text-left"><p>{{ item.name }}</p></div>
                      <div class="column has-text-right"><p>{{ item.value }}</p></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="tile is-parent is-4">
              <div class="tile is-parent has-background-white-bis">
              <!-- <div class="tile is-parent has-background-white-bis"> -->
                <div class="tile is-child">
                    <div class="level-item is-size-5">
                      Inputs
                    </div>
                    <br>
                    <div class="section">
                      <div class="field control">
                        <div class="select has-text-centered is-fullwidth">
                          <select v-model="selectedInput">
                            <option v-for="item in inputs" :key="item.name" :value="item.shape">{{ item.name }}</option>
                          </select>
                        </div>
                      </div>
                      <div class="field has-addons">
                        <div class="control is-expanded">
                          <input class="input has-text-centered is-fullwidth" type="text" :placeholder="selectedInput" disabled>
                        </div>
                        <div class="control">
                          <a class="button" disabled>
                            <span class="fas fa-chevron-right"/>
                          </a>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
            <div class="tile is-parent is-4">
              <div class="tile is-parent has-background-white-bis">
              <!-- <div class="tile is-parent has-background-white-bis"> -->
                <div class="tile is-child">
                    <div class="level-item is-size-5">
                      Outputs
                    </div>
                    <br>
                    <div class="section h120 is-clipped scrollable">
                      <div v-for="item in outputs" :key="item.name" class="columns is-mobile">
                        <div class="column has-text-left"><p>{{ item.name }}</p></div>
                        <div class="column has-text-right"><p>{{ item.shape }}</p></div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="tile is-parent">
          <div class="tile is-parent has-background-white-ter">
            <div class="tile is-parent">
              <div class="tile is-parent has-background-white-bis">
                <div class="tile is-child">
                  <!-- <vue-frappe
                  id="opsandparams"
                  type="line"

                  :height="400"
                  :colors="['#008F68', '#FAE042']"
                  :lineOptions="{regionFill: 1}"

                  ></vue-frappe> -->
                  <op-area-chart
                  :height=250
                  :title="'Per Layer Analysis'"
                  :labels="indices"
                  :datasets="[
                    {name: 'Ops', data: totalOps},
                    {name: 'Params', data: totalParams}
                  ]"
                  > </op-area-chart>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import Editor from '@/components/Editor.vue';
import OPAreaChart from '@/components/OPAreaChart.vue';

import { mapGetters } from 'vuex';

const protobuf = require('protobufjs');

const page = {
  name: 'Overview',
  data: () => {
    return {
      loading: false,
      loaded: false,
      selectedInput: '',
      selectedOutput: '',
    };
  },
  components: {
    'op-area-chart': OPAreaChart,
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
      'distOpsParams',
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
