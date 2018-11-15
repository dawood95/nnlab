<template>
    <cytoscape :config="config" :preConfig="preConfig" style="height: 550px;"/>
</template>

<script>
import { mapGetters } from 'vuex';
import dagre from 'cytoscape-dagre';

const page = {
  name: 'ModelGraph',
  data() {
    return {
      config: {
        elements: [],
        style: [
          {
            selector: 'node',
            style: {
              'label': 'data(name)',
              'shape': 'rectangle',
              'text-valign': 'center',
              'width': 'label',
              'height': 'label',
              'font-size': 26,
              'padding': 20,
            }
          }, {
            selector: 'edge',
            style: {
              'label': 'data(name)',
              'text-margin-y': 20,
              'text-background-color': 'whitesmoke',
              'text-background-opacity': 1,
              'width': 3,
              'curve-style': 'bezier',
              'font-size': 24,
              'mid-target-arrow-shape': 'triangle',
            }
          }
        ],
        layout: {
          name: 'dagre',
          nodeDimensionsIncludeLabels: true,
          //transform: function( node, pos ){ console.log(pos); return pos; },
          minLen: function( edge ){
            const source = edge.source().data().name;
            const target = edge.target().data().name;
            const minLen = 0.01;
            const maxLen = 1;
            var len = maxLen;
            if (target === "Relu" || target === "BatchNormalization" || target === "LRN")
                len = minLen;
            if (len < maxLen) {
              edge.data('name', '');
            }
            return len;
          },
          rankSep: 100,
          edgeSep: 500,
        },
        zoomingEnabled: true,
        minZoom: 1/8,
        maxZoom: 1,
        autoungrabify: true,
      }
    }
  },
  computed: {
    ...mapGetters([
      'nodes'
    ]),
  },
  watch: {
    nodes: function (newList, oldList) {
      let nodes = [];
      let output_source = {};
      for (let i in newList) {
        let node = newList[i];
        if (node.outputs === undefined) node.outputs = [];
        if (node.inputs === undefined) node.inputs = [];

        for (let out of node.outputs) {
          output_source[out] = i
        }
        nodes.push({
          data: {
            id: i,
            name: node.op,
          }
        })
        for (let inp in node.inputs) {
          if (inp in output_source) {
            nodes.push({
              data: {
                id: output_source[inp] + i + newList.length,
                name: String(node.inputs[inp]).replace(/,/g, "x"),
                source: output_source[inp],
                target: i,
              }
            })
          }
        }
      }
      this.$cytoscape.instance.then(cy => {
        cy.remove(cy.elements());
        for (let node of nodes)
          cy.add(node);
        const layout = cy.layout(this.config.layout);
        layout.run();
      })
    },
  },
  mounted () {
    this.$cytoscape.instance.then(cy => {
    });
  },
  methods: {
   preConfig (cytoscape) {
     // it can be used both ways
     cytoscape.use(dagre);
     // cytoscape.use(contextMenus, jquery)
   },
 }
};

export default page;
</script>
