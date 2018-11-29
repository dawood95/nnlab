<template>
  <div style="height: 100%; min-height: 100%;">
    <div class="field has-addons is-marginless">
      <div class="control">
        <div class="file is-small">
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
      <div class="control is-expanded has-text-centered is-small">
        <p>{{fileName}}</p>
      </div>
      <div class="control">
        <div>
          <span v-if='compiles === "done"' class="tag is-success">success</span>
          <span v-else-if='compiles === "processing"' class="tag is-warning">processing</span>
          <span v-else class="tag is-danger">failed</span>
        </div>
      </div>
  </div>
    <codemirror v-model="code" :options="cmOptions" class="is-size-6">
    </codemirror>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror';
import 'codemirror/mode/javascript/javascript.js';

import { mapGetters } from 'vuex';
const protobuf = require('protobufjs');

const initialCode = `\
{
  "layers" : [
    {
      "optype": "Input",
      "output": "input_0",
      "params": {
        "size": [1, 3, 224, 224]
      }
    }
  ]
}`;

export default {
  components: {
    'codemirror': codemirror,
  },
  data () {
    return {
      //code: initialCode,
      modifiedCode: '[]',
      compiles: 'done',
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
    ]),
  },
  methods: {
    process() {
      console.log("ADASDA");
      this.compiles = 'processing';
      let modelDef = null;
      try {
        modelDef = JSON.parse(this.modifiedCode);
        this.$store.commit('setCode', modelDef);
      }
      catch (error) {
        this.compiles = 'error';
        return;
      }
      this.compiles = 'done';
    },
    setOnnx(ev) {
      protobuf.load('onnx.proto', (err, root) => {
        if (err) {
          throw err;
        }

        const onnxRoot = root;
        const file = ev.target.files[0];

        const reader = new FileReader();

        this.compiles = "processing";
        // set filename
        this.$store.commit('setFileName', file.name);

        // set reader onload to commit setModel
        reader.onload = (event) => {
          const buffer = new Uint8Array(event.currentTarget.result);
          const ModelProto = onnxRoot.lookupType('onnx.ModelProto');
          const onnxModel = ModelProto.decode(buffer);
          this.$store.commit('setModel', onnxModel);
          this.compiles = "done";
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
  flex:1 1 auto;
  margin-top:0;
  height: calc(550px - 27px); //27 cause of buttons
  position:relative;
}

.CodeMirror {
  position:absolute;
  top:0;
  bottom:0;
  left:0;
  right:0;
  height: 100%;
}

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
		padding-bottom: 30px;
		margin-bottom: -32px;
		display: inline-block;
		/* Hack to make IE7 behave */
		*zoom:1;
		*display:inline;
	}
	.CodeMirror-gutter-elt {
		position: absolute;
		cursor: default;
		z-index: 4;
	}

</style>
