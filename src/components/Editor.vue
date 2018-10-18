<template>
  <div>
    <codemirror v-model="code" :options="cmOptions" class="is-size-6">
    </codemirror>
  </div>
</template>

<script>
import { codemirror } from 'vue-codemirror'

import 'codemirror/mode/javascript/javascript.js'

export default {
  components: {
    'codemirror': codemirror,
  },
  data () {
    return {
      code: 'const a = 10',
      cmOptions: {
        // codemirror options
        tabSize: 4,
        mode: {name: "text/javascript", json: true},
        theme: 'solarized',//base16-dark',
        lineNumbers: true,
        line: true,
        // more codemirror options, 更多 codemirror 的高级配置...
      }
    }
  },
}
</script>

<style lang="scss">
@import '../../node_modules/codemirror/theme/solarized.css';
@import '../../node_modules/codemirror/lib/codemirror.css';

</style>
