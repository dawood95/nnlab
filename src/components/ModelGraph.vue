<template>
  <div class="tile is-child card has-background-white-bis">
    <a class="button" style="position:absolute" v-on:click="exportSvg">Export</a>
    <svg style="min-height: 50vh;" id='svg-canvas'><g/></svg>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import * as dagreD3 from 'dagre-d3';
import * as d3 from 'd3';
import util from '@/utils/util.js';

//import FileSaver from 'file-saver';
//import Blob from 'blueimp-canvas-to-blob';
import saveSvg from 'save-svg-as-png';

const mergeable_nodes = [
  "Relu",
  "BatchNormalization", "LRN",
];

const name_map = {
  "BatchNormalization": "BN",
  "AveragePool": "AvgPool",
  "GlobalAveragePool": "GlobalAvgPool"
};

const page = {
  name: 'ModelGraph',
  computed: {
    ...mapGetters([
      'nodes'
    ]),
  },
  methods: {
    exportSvg: function () {
      saveSvg.saveSvgAsPng(d3.select("svg").node(), 'nnlab.png', {backgroundColor: '#fafafa'});
    },
  },
  watch: {
    nodes: function (newList, oldList) {  
      let t = this;
      function activBlock(parent, bbox, node) {
        let  w, h, points;
        w = bbox.width;
        h = bbox.height;

        let shapeSvg = parent.insert("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", w)
        .attr("height", h)
        .attr("transform", "translate(" + (-w/2) + "," + (-h * 1/2 + 3) + ")");

        let textSvg = parent.insert ("text")
        .text(node.name)
        .attr("x", 0)
        .attr("y", h/10)
        .attr('dominant-baseline',"middle")
        .attr('text-anchor', "middle")
        //.attr("transform", "translate(0,"+h/10+")")
        .style('cursor', 'pointer');

        node.intersect = function(point) {
          return dagreD3.intersect.rect(node, point);
        };

        function nodeClick () {
          t.$store.commit('setNodeInfo', node.param_list);
        }

        shapeSvg.on("click", nodeClick);
        textSvg.on("click", nodeClick);

        return shapeSvg;
      };

      let nodes = [];
      let edges = [];
      let output_source = {};

      let maxOps = 0;
      let maxParams = 0;

      for (let node of newList) {
        // If no input / output set empty list
        if (node.outputs === undefined) node.outputs = [];
        if (node.inputs === undefined)  node.inputs = [];

        if (node.numOps > maxOps) maxOps = node.numOps;
        if (node.numParams > maxParams) maxParams = node.numParams;

        // Generate unique id for this node
        const uid  = util.genUID();
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

          for (let n of nodes) {
            if (n.data.id === parent_id) {
              n.data.name += ' + '+name;
              n.data.numOps += node.numOps;
              n.data.numParams += node.numParams;
              n.data.params.push({
                name: name,
                params: node.params,
                numOps: util.formatter(node.numOps),
                numParams: util.formatter(node.numParams)
              });
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
            numOps: node.numOps,
            numParams: node.numParams,
            shape: 'activBlock',
            params: [{
              name: name,
              params: node.params,
              numOps: util.formatter(node.numOps),
              numParams: util.formatter(node.numParams)
            }],
          }
        });

        // Push edges from parents
        for (let parent_id in parent_nodes) {
          edges.push({
            data: {
              id: util.genUID(),
              name: parent_nodes[parent_id],
              source: parent_id,
              target: uid
            }
          });
        }
      }

      var g = new dagreD3.graphlib.Graph().setGraph({
        ranker: 'tight-tree',
      });

      for (let node of nodes) {
        g.setNode(
          node.data.id,
          {
            label: ' '.repeat(node.data.name.length),
            name: node.data.name,
            shape: node.data.shape,
            ops  : node.data.numOps,
            params: node.data.numParams,
            param_list: node.data.params,
          }
        );
      }
      for (let edge of edges)
        g.setEdge(
          edge.data.source,
          edge.data.target,
          {
            arrowhead: 'normal',
            label: edge.data.name,
            curve: d3.curveBasis,
            labelpos: 'c',
          }
        );

      var svg = d3.select("svg");
      svg.attr("height", svg.node().parentNode.scrollHeight);
      svg.attr("width", svg.node().parentNode.scrollWidth);

      var inner = svg.select("g");

      // Create the renderer
      var render = new dagreD3.render();
      render.shapes().activBlock = activBlock;
      render(inner, g);

      var padding = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      };

      // when rendering complete, select all labels
      svg.selectAll('g.edgeLabel').each(function() {
        var labelGroup = d3.select(this);
        var bbox = labelGroup.node().getBBox();
        labelGroup.insert('rect', ':first-child')
          .attr('x', bbox.x - padding.left)
          .attr('y', bbox.y - padding.top)
          .attr('width', bbox.width + padding.left + padding.right)
          .attr('height', bbox.height + padding.top + padding.bottom)
          .attr('rx', 2);
      });

      let opsData = {};
      let paramsData = {};
      let nodeHeight = 0;
      for (let node_id of g.nodes()) {
        let node = g.node(node_id);
        if (!(node.y in opsData)) opsData[node.y] = 0;
        if (!(node.y in paramsData)) paramsData[node.y] = 0;
        opsData[node.y] += node.ops;
        paramsData[node.y] += node.params;
        nodeHeight = node.elem.getBBox().height;
      }      
      for (let k in opsData)
        console.log(opsData[k]/maxOps);
      opsData = Object.entries(opsData).map(([key, value]) => ({key,value}));
      paramsData = Object.entries(paramsData).map(([key, value]) => ({key,value}));

      let sort = (a, b) => {
        a = parseFloat(a.key);
        b = parseFloat(b.key);
        console.log(a, b);
        return a < b ? -1 : (a > b ? 1 : 0);
      };

      opsData.sort(sort);
      paramsData.sort(sort);

      if (opsData.length === 0) return;
      let width = g._label.width;

      let tooltip = inner.insert('g');

      tooltip.append('line')
        .attr('x1', -width/0.75)
        .attr('y1', 0)
        .attr('x2', -width*0.10)
        .attr('y2', 0)
        .style('stroke', '#2ecc71')
        .style('stroke-width', 6)
      tooltip.append('text')
        .attr('x', -width*0.10 - 140)
        .attr('y', -4)
        .text("PARAMS")
        .style('font-size', '32px')
        .style('font-weight', '500')
        .style('fill', '#2ecc71')
        .style('stroke', '#2ecc71')
        .attr('dominant-baseline',"baseline")
      tooltip.append('line')
        .attr('x1', width + width*0.10)
        .attr('y1', 0)
        .attr('x2', width + width/0.75)
        .attr('y2', 0)
        .style('stroke', '#3498db')
       .style('stroke-width', 6)
      tooltip.append('text')
        .attr('x', width + width*0.10 + 4)
        .attr('y', -4)
        .text("OPS")
        .style('font-weight', '500')
        .style('font-size', '32px')
        .style('fill', '#3498db')
        .style('stroke', '#3498db')
        .attr('dominant-baseline',"baseline")

      let opsText = inner.insert('text')
        .attr('x', width + width/0.75)
        .attr('y', 0)
        .text("")
        .style('opacity', 0)
        .style('font-size', '32px')
        .style('fill', '#3498db')
        .attr('dominant-baseline',"baseline")

      let paramsText = inner.insert('text')
        .attr('x', -width/0.75)
        .attr('y', 0)
        .text("")
        .style('opacity', 0)
        .style('font-size', '32px')
        .style('fill', '#2ecc71')
        .attr('dominant-baseline',"baseline")

      let paramsTextOffset = paramsText.node().getBBox().width + 5;

      let area, line;
      let curve = d3.curveBasis;

      area = d3.area()
      .y1(d => d.key)
      .x0(d => 0)
      .y0(d => 0)
      .x(d => width*d.value/(maxOps*0.75))
      .curve(curve);

      line = d3.line()
      .y(d => d.key)
      .x(d => width*d.value/(maxOps*0.75))
      .curve(curve);

      inner.insert("path")
      .datum(opsData)
      .attr("d", area)
      .attr("fill", "#3498db")
      .attr("opacity", 0.50)
      .attr("transform", "translate(" + width * 1.10 + ",0)");

      inner.insert("path")
      .datum(opsData)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#3498db")
      .attr("stroke-width", "4px")
      .attr("transform", "translate(" + width * 1.10 + ",0)");

      area = d3.area()
      .y1(d => d.key)
      .x0(d=>0)
      .y0(d=>0)
      .x(d => width*d.value/(maxParams*0.75))
      .curve(curve);

      line = d3.line()
      .y(d => d.key)
      .x(d => width*d.value/(maxParams*0.75))
      .curve(curve);

      inner.insert("path")
      .datum(paramsData)
      .attr("d", area)
      .attr("fill", "#2ecc71")
      .attr("opacity", 0.50)
      .attr("transform", "translate(" + -width * 0.10 + ",0)"+"scale(-1, 1)");

      inner.insert("path")
      .datum(paramsData)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "#2ecc71")
      .attr("stroke-width", "4px")
      .attr("transform", "translate(" + -width * 0.10 + ",0)"+"scale(-1, 1)");

      svg
      .on("mouseout", function() {
        tooltip.style("opacity", null).style("opacity", 0);
        opsText.style("opacity", null).style("opacity", 0);
        paramsText.style("opacity", null).style("opacity", 0);
      })
      .on("mousemove", function() {
        tooltip.style("opacity", null).style("opacity", 0.8);
        opsText.style("opacity", null).style("opacity", 1);
        paramsText.style("opacity", null).style("opacity", 1);

        const mouse = d3.mouse(d3.select("svg g").node());
        const y = mouse[1];
        let minDist = Infinity;
        let matchingY = opsData[0].key;
        let opsVal = opsData[0].value;
        let paramVal = paramsData[0].value;
        for (let d of opsData) {
          let dist = Math.abs(y - d.key);
          if (dist < minDist) {
            minDist = dist;
            matchingY = d.key;
            opsVal = d.value;
          }
        }
        minDist = Infinity;
        for (let d of paramsData) {
          let dist = Math.abs(y - d.key);
          if (dist < minDist) {
            minDist = dist;
            matchingY = d.key;
            paramVal = d.value;
          }
        }

        tooltip.attr("transform", null)
        .attr("transform", "translate(0,"+matchingY+")");

        opsText.text(util.formatter(opsVal));
        paramsText.text(util.formatter(paramVal));
        
        paramsTextOffset = paramsText.node().getBBox().width + 5
        opsText.attr("transform", null)
        .attr("transform", "translate(5,"+matchingY+")");
        paramsText.attr("transform", null)
        .attr("transform", "translate("+-paramsTextOffset+","+matchingY+")");
      })
      .on("mouseenter", function() {
        tooltip.style("opacity", null).style("opacity", 0.8);
        opsText.style("opacity", null).style("opacity", 1);
        paramsText.style("opacity", null).style("opacity", 1);

      });
      
      // Center the graph
      if (g.graph().width !== -Infinity) {
        // Set up zoom support
        var initialScale = svg.node().getBoundingClientRect().height / (inner.node().getBBox().height + nodeHeight);
        var zoom = d3.zoom().on("zoom", function() {
          inner.attr("transform", d3.event.transform);
        });
        svg.call(zoom);
        console.log("Setting zoom");
        svg.call(zoom.transform,
          d3.zoomIdentity
          .translate((svg.node().parentNode.scrollWidth - g.graph().width * initialScale) / 2, nodeHeight/2)
          .scale(initialScale)
        );
      }
    },
  },
}

export default page;
</script>

<style>

g.type-TK > rect {
  fill: #00ffd0;
}

.label {
  z-index: 1;
  font-family: "Ubuntu Mono", monospace;
}

.node rect,
.node circle,
.node ellipse,
.node polygon {
  stroke: #333;
  fill: #fff;
  stroke-width: 1.5px;
  z-index: -1;
}

.edgePath path {
  stroke: #333;
  fill: #333;
  stroke-width: 2.5px;
  cursor: pointer;
}

.edgeLabel rect {
  fill: #fafafa;
}

</style>
