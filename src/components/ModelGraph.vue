<template>
    <cytoscape :config="config" :preConfig="preConfig" style="height: 550px;"/>
</template>

<script>
import { mapGetters } from 'vuex';
import dagre from 'cytoscape-dagre';
import jquery from 'jquery';

function genUID() {
  let uid;
  uid  = Math.random().toString(36).substring(2, 15);
  uid += Math.random().toString(36).substring(2, 15);
  return uid;
}

const mergeable_nodes = [
  "Relu",
  "BatchNormalization", "LRN",
];

const name_map = {
  "BatchNormalization": "BN",
  "AveragePool": "AvgPool",
};

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
              'text-background-color': 'whitesmoke',
              'text-background-opacity': 1,
              'width': 3,
              'curve-style': 'bezier',
              'font-size': 24,
              'target-arrow-shape': 'triangle',
              'arrow-scale': 2,
            }
          }, {
            selector: '$node > node',
            css: {
              'padding-top': '10px',
              'padding-left': '10px',
              'padding-bottom': '40px',
              'padding-right': '40px',
              'text-valign': 'top',
              'text-halign': 'center',
            }
          },
        ],
        layout: {
          name: 'dagre',
          nodeDimensionsIncludeLabels: true,
          rankDir: 'TB',
          ranker: 'longest-path',//'tight-tree',
          rankSep: 100,
          edgeSep: 500,
        },
        zoomingEnabled: true,
        minZoom: 1/8,
        maxZoom: 1,
        autoungrabify: true,
      },
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
      let edges = [];

      let output_source = {};

      for (let node of newList) {
        // If no input / output set empty list
        if (node.outputs === undefined) node.outputs = [];
        if (node.inputs === undefined)  node.inputs = [];

        // Generate unique id for this node
        const uid  = genUID();
        const name = node.op;

        // Parse inputs and find parent nodes
        let parent_nodes = {};
        for (let inp_name in node.inputs) {
          let parent_id = output_source[inp_name];
          parent_nodes[parent_id] = String(node.inputs[inp_name]).replace(/,/g, "x");
        }

        // Set the source for outputs produced by this node
        for (let out_name of node.outputs)
          output_source[out_name] = uid;

        // If this node is a mergeable node, then find the source node
        // and change name.
        // Assuming mergeable nodes only have one input.
        if (mergeable_nodes.includes(name)) {
          if (name in name_map) name = name_map[name];

          let parent_id = Object.keys(parent_nodes)[0];

          // Change the source of outputs
          for (let out_name of node.outputs)
            output_source[out_name] = parent_id;

          for (let node of nodes) {
            if (node.data.id === parent_id) {
              node.data.name += ' + '+name;
              break;
            }
          }
          continue;
        }

        // Push nodes
        if (name in name_map) name = name_map[name];
        nodes.push({
          data: {
            id: uid,
            name: name,
          }
        });

        // Push edges from parents
        for (let parent_id in parent_nodes) {
          edges.push({
            data: {
              id: genUID(),
              name: parent_nodes[parent_id],
              source: parent_id,
              target: uid
            }
          });
        }
      }

      this.$cytoscape.instance.then(cy => {
        cy.remove(cy.elements());
        cy.add({
          nodes: nodes,
          edges: edges,
        });
        const layout = cy.layout(this.config.layout);
        layout.run();
      })
    },
  },
  mounted () {
    this.$cytoscape.instance.then(cy => {
      const layout = cy.layout(this.config.layout);
    });
  },
  methods: {
   preConfig (cytoscape) {
     cytoscape.use(dagre);
     // cytoscape.use(contextMenus, jquery)
   },
 }
};

export default page;
</script>
