<template>
  <div class="tile is-child card has-background-white-ter">
    <div class="field has-addons is-marginless">
      <div class="control">
        <div class="file is-light">
          <label class="file-label">
            <input class="file-input" type="file" ref="onnx_path" @change="setOnnx">
            <span class="file-cta">
              <span class="file-icon">
                <i class="fas fa-upload"></i>
              </span>
              <span class="file-label">
                Upload ONNX
              </span>
            </span>
          </label>
        </div>
      </div>
      <div class="control is-expanded has-text-centered">
        <label class="label is-large">{{fileName}}</label>
      </div>
      <div class="control">
          <span v-if='compileStatus === "done"' class="icon has-text-success is-medium"><i class="fas fa-circle"></i></span>
          <span v-else-if='compileStatus === "processing"' class="icon has-text-warning is-medium"><i class="fas fa-circle"></i></span>
          <span v-else class="icon has-text-danger is-medium"><i class="fas fa-circle"></i></span>
      </div>
    </div>
    <codemirror v-model="code" :options="cmOptions" class="is-size-6.5">
    </codemirror>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror';
import 'codemirror/mode/javascript/javascript.js';

import { mapGetters } from 'vuex';
const protobuf = require('protobufjs');

const initialCode = `[
  {
    "op": "Input",
    "params": {
      "size": [1, 3, 224, 224]
    },
    "outputs": ["data"]
  },
  {
    "op": "Conv",
    "inputs": ["data"],
    "params": {
      "out_channels": 64,
      "kernel_size": [7, 7],
      "stride": [2, 2],
      "padding": [6, 6],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_conv0_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_conv0_fwd"
    ],
    "params": {
      "num_features": 64,
      "spatial": false
    },
    "outputs": [
      "resnetv15_batchnorm0_fwd"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_batchnorm0_fwd"
    ],
    "outputs": [
      "resnetv15_relu0_fwd"
    ]
  },
  {
    "op": "MaxPool",
    "inputs": [
      "resnetv15_relu0_fwd"
    ],
    "params": {
      "kernel_size": [3, 3],
      "stride": [2, 2],
      "padding": [2, 2]
    },
    "outputs": [
      "resnetv15_pool0_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_pool0_fwd"
    ],
    "params": {
      "out_channels": 64,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage1_conv0_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage1_conv0_fwd"
    ],
    "params": {
      "num_features": 64,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage1_batchnorm0_fwd"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage1_batchnorm0_fwd"
    ],
    "outputs": [
      "resnetv15_stage1_relu0_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage1_relu0_fwd"
    ],
    "params": {
      "out_channels": 64,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage1_conv1_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage1_conv1_fwd"
    ],
    "params": {
      "num_features": 64,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage1_batchnorm1_fwd"
    ]
  },
  {
    "op": "Add",
    "inputs": [
      "resnetv15_pool0_fwd",
      "resnetv15_stage1_batchnorm1_fwd"
    ],
    "outputs": [
      "resnetv15_stage1__plus0"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage1__plus0"
    ],
    "outputs": [
      "resnetv15_stage1_activation0"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage1_activation0"
    ],
    "params": {
      "out_channels": 64,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage1_conv2_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage1_conv2_fwd"
    ],
    "params": {
      "num_features": 64,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage1_batchnorm2_fwd"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage1_batchnorm2_fwd"
    ],
    "outputs": [
      "resnetv15_stage1_relu1_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage1_relu1_fwd"
    ],
    "params": {
      "out_channels": 64,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage1_conv3_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage1_conv3_fwd"
    ],
    "params": {
      "num_features": 64,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage1_batchnorm3_fwd"
    ]
  },
  {
    "op": "Add",
    "inputs": [
      "resnetv15_stage1_activation0",
      "resnetv15_stage1_batchnorm3_fwd"
    ],
    "outputs": [
      "resnetv15_stage1__plus1"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage1__plus1"
    ],
    "outputs": [
      "resnetv15_stage1_activation1"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage1_activation1"
    ],
    "params": {
      "out_channels": 128,
      "kernel_size": [1, 1],
      "stride": [2, 2],
      "padding": [0, 0],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage2_conv2_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage2_conv2_fwd"
    ],
    "params": {
      "num_features": 128,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage2_batchnorm2_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage1_activation1"
    ],
    "params": {
      "out_channels": 128,
      "kernel_size": [3, 3],
      "stride": [2, 2],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage2_conv0_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage2_conv0_fwd"
    ],
    "params": {
      "num_features": 128,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage2_batchnorm0_fwd"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage2_batchnorm0_fwd"
    ],
    "outputs": [
      "resnetv15_stage2_relu0_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage2_relu0_fwd"
    ],
    "params": {
      "out_channels": 128,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage2_conv1_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage2_conv1_fwd"
    ],
    "params": {
      "num_features": 128,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage2_batchnorm1_fwd"
    ]
  },
  {
    "op": "Add",
    "inputs": [
      "resnetv15_stage2_batchnorm2_fwd",
      "resnetv15_stage2_batchnorm1_fwd"
    ],
    "outputs": [
      "resnetv15_stage2__plus0"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage2__plus0"
    ],
    "outputs": [
      "resnetv15_stage2_activation0"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage2_activation0"
    ],
    "params": {
      "out_channels": 128,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage2_conv3_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage2_conv3_fwd"
    ],
    "params": {
      "num_features": 128,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage2_batchnorm3_fwd"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage2_batchnorm3_fwd"
    ],
    "outputs": [
      "resnetv15_stage2_relu1_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage2_relu1_fwd"
    ],
    "params": {
      "out_channels": 128,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage2_conv4_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage2_conv4_fwd"
    ],
    "params": {
      "num_features": 128,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage2_batchnorm4_fwd"
    ]
  },
  {
    "op": "Add",
    "inputs": [
      "resnetv15_stage2_activation0",
      "resnetv15_stage2_batchnorm4_fwd"
    ],
    "outputs": [
      "resnetv15_stage2__plus1"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage2__plus1"
    ],
    "outputs": [
      "resnetv15_stage2_activation1"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage2_activation1"
    ],
    "params": {
      "out_channels": 256,
      "kernel_size": [1, 1],
      "stride": [2, 2],
      "padding": [0, 0],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage3_conv2_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage3_conv2_fwd"
    ],
    "params": {
      "num_features": 256,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage3_batchnorm2_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage2_activation1"
    ],
    "params": {
      "out_channels": 256,
      "kernel_size": [3, 3],
      "stride": [2, 2],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage3_conv0_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage3_conv0_fwd"
    ],
    "params": {
      "num_features": 256,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage3_batchnorm0_fwd"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage3_batchnorm0_fwd"
    ],
    "outputs": [
      "resnetv15_stage3_relu0_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage3_relu0_fwd"
    ],
    "params": {
      "out_channels": 256,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage3_conv1_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage3_conv1_fwd"
    ],
    "params": {
      "num_features": 256,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage3_batchnorm1_fwd"
    ]
  },
  {
    "op": "Add",
    "inputs": [
      "resnetv15_stage3_batchnorm2_fwd",
      "resnetv15_stage3_batchnorm1_fwd"
    ],
    "outputs": [
      "resnetv15_stage3__plus0"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage3__plus0"
    ],
    "outputs": [
      "resnetv15_stage3_activation0"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage3_activation0"
    ],
    "params": {
      "out_channels": 256,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage3_conv3_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage3_conv3_fwd"
    ],
    "params": {
      "num_features": 256,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage3_batchnorm3_fwd"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage3_batchnorm3_fwd"
    ],
    "outputs": [
      "resnetv15_stage3_relu1_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage3_relu1_fwd"
    ],
    "params": {
      "out_channels": 256,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage3_conv4_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage3_conv4_fwd"
    ],
    "params": {
      "num_features": 256,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage3_batchnorm4_fwd"
    ]
  },
  {
    "op": "Add",
    "inputs": [
      "resnetv15_stage3_activation0",
      "resnetv15_stage3_batchnorm4_fwd"
    ],
    "outputs": [
      "resnetv15_stage3__plus1"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage3__plus1"
    ],
    "outputs": [
      "resnetv15_stage3_activation1"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage3_activation1"
    ],
    "params": {
      "out_channels": 512,
      "kernel_size": [1, 1],
      "stride": [2, 2],
      "padding": [0, 0],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage4_conv2_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage4_conv2_fwd"
    ],
    "params": {
      "num_features": 512,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage4_batchnorm2_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage3_activation1"
    ],
    "params": {
      "out_channels": 512,
      "kernel_size": [3, 3],
      "stride": [2, 2],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage4_conv0_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage4_conv0_fwd"
    ],
    "params": {
      "num_features": 512,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage4_batchnorm0_fwd"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage4_batchnorm0_fwd"
    ],
    "outputs": [
      "resnetv15_stage4_relu0_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage4_relu0_fwd"
    ],
    "params": {
      "out_channels": 512,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage4_conv1_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage4_conv1_fwd"
    ],
    "params": {
      "num_features": 512,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage4_batchnorm1_fwd"
    ]
  },
  {
    "op": "Add",
    "inputs": [
      "resnetv15_stage4_batchnorm2_fwd",
      "resnetv15_stage4_batchnorm1_fwd"
    ],
    "outputs": [
      "resnetv15_stage4__plus0"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage4__plus0"
    ],
    "outputs": [
      "resnetv15_stage4_activation0"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage4_activation0"
    ],
    "params": {
      "out_channels": 512,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage4_conv3_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage4_conv3_fwd"
    ],
    "params": {
      "num_features": 512,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage4_batchnorm3_fwd"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage4_batchnorm3_fwd"
    ],
    "outputs": [
      "resnetv15_stage4_relu1_fwd"
    ]
  },
  {
    "op": "Conv",
    "inputs": [
      "resnetv15_stage4_relu1_fwd"
    ],
    "params": {
      "out_channels": 512,
      "kernel_size": [3, 3],
      "stride": [1, 1],
      "padding": [2, 2],
      "dilation": [1, 1],
      "groups": 1,
      "bias": false
    },
    "outputs": [
      "resnetv15_stage4_conv4_fwd"
    ]
  },
  {
    "op": "BatchNormalization",
    "inputs": [
      "resnetv15_stage4_conv4_fwd"
    ],
    "params": {
      "num_features": 512,
      "spatial": false
    },
    "outputs": [
      "resnetv15_stage4_batchnorm4_fwd"
    ]
  },
  {
    "op": "Add",
    "inputs": [
      "resnetv15_stage4_activation0",
      "resnetv15_stage4_batchnorm4_fwd"
    ],
    "outputs": [
      "resnetv15_stage4__plus1"
    ]
  },
  {
    "op": "Relu",
    "inputs": [
      "resnetv15_stage4__plus1"
    ],
    "outputs": [
      "resnetv15_stage4_activation1"
    ]
  },
  {
    "op": "GlobalAveragePool",
    "inputs": [
      "resnetv15_stage4_activation1"
    ],
    "outputs": [
      "resnetv15_pool1_fwd"
    ]
  },
  {
    "op": "Flatten",
    "inputs": [
      "resnetv15_pool1_fwd"
    ],
    "params": {"axis": 1},
    "outputs": ["flatten_170"]
  },
  {
    "op": "Linear",
    "inputs": ["flatten_170"],
    "params": {
      "out_features": 1000,
      "bias": true
    },
    "outputs": [
      "resnetv15_dense0_fwd"
    ]
  },
  {
    "op": "Output",
    "inputs": [
      "resnetv15_dense0_fwd"
    ]
  }
]`;

export default {
  components: {
    'codemirror': codemirror,
  },
  data () {
    return {
      //code: initialCode,
      modifiedCode: initialCode,
      cmOptions: {
        // codemirror options
        tabSize: 4,
        mode: {name: "application/json", json: true},
        theme: 'solarized',//base16-dark',
        lineNumbers: true,
        line: true,
        extraKeys: {
          'Shift-Enter': this.process,
        }
        // more codemirror options, 更多 codemirror 的高级配置...
      }
    }
  },
  mounted () {
    this.$store.commit('setFileName', 'resnet18.onnx');
    this.process();
  },
  computed: {
    codemirror() { return this.$refs.myCm.codemirror; },
    code: {
      get: function () {
        return this.$store.getters.code;
      },
      set: function (newValue) {
        this.modifiedCode = newValue;
      }
    },
    ...mapGetters([
      'fileName',
      'compileStatus'
    ]),
  },
  methods: {
    process() {
      this.$store.commit('setCompileStatus', 'processing');
      let modelDef = null;
      try {
        modelDef = JSON.parse(this.modifiedCode);
        this.$store.commit('setCode', modelDef);
      }
      catch (error) {
        this.$store.commit('setCompileStatus', 'error');
        return;
      }
    },
    setOnnx(ev) {
      protobuf.load('onnx.proto', (err, root) => {
        if (err) {
          throw err;
        }

        const onnxRoot = root;
        const file = ev.target.files[0];

        const reader = new FileReader();

        this.$store.commit('setCompileStatus', 'processing');
        // set filename
        this.$store.commit('setFileName', file.name);

        // set reader onload to commit setModel
        reader.onload = (event) => {
          const buffer = new Uint8Array(event.currentTarget.result);
          const ModelProto = onnxRoot.lookupType('onnx.ModelProto');
          const onnxModel = ModelProto.decode(buffer);
          this.$store.commit('setModel', onnxModel);
        };
        reader.readAsArrayBuffer(file);
      });
    },
  }
}
</script>

<style lang="scss">
@import '../../node_modules/codemirror/theme/solarized.css';
@import '../../node_modules/codemirror/lib/codemirror.css';

.vue-codemirror {
  height: calc(100vh - 136px);
  width: inherit;
}

.CodeMirror {
  height: calc(100vh - 130px);
  width: inherit;
}

.CodeMirror-scroll {
  padding-bottom: 0;
}
/*
.CodeMirror-vscrollbar, .CodeMirror-hscrollbar, .CodeMirror-scrollbar-filler, .CodeMirror-gutter-filler {
  position: absolute;
  z-index: 6;
  display: none;
}
.CodeMirror-vscrollbar {
		right: 0; top: 0;
		overflow-x: hidden;
		overflow-y: scroll;
	}
	.CodeMirror-hscrollbar {
		bottom: 0; left: 0;
		overflow-y: hidden;
		overflow-x: scroll;
	}
	.CodeMirror-scrollbar-filler {
		right: 0; bottom: 0;
	}
	.CodeMirror-gutter-filler {
		left: 0; bottom: 0;
	}

	.CodeMirror-gutters {
		position: absolute; left: 0; top: 0;
		padding-bottom: 1px;
		z-index: 3;
    //background-color: hsl(0, 0%, 29%);
	}
	.CodeMirror-gutter {
		white-space: normal;
		height: 100%;
		-moz-box-sizing: content-box;
		box-sizing: content-box;
		//padding-bottom: 30px;
		//margin-bottom: -32px;
		display: inline-block;
		// Hack to make IE7 behave
		*zoom:1;
		*display:inline;
	}
	.CodeMirror-gutter-elt {
		position: absolute;
		cursor: default;
		z-index: 4;
	}
*/
</style>
