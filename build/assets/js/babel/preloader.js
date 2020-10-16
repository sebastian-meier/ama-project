/* exported preloader */

/* global d3,debounce */
var preloader = function preloader(_container) {
  var module = {};
  var container = _container;
  var width;
  var height;
  var svg = d3.select('#container').append('svg');

  module.resize = function () {
    var bb = container.node().getBoundingClientRect();
    width = bb.width;
    height = bb.height;
  };

  module.responsive = function () {
    svg.attr('width', width).attr('height', height);
  };

  module.resize();
  module.responsive();
  window.addEventListener('resize', debounce(function () {
    module.resize();
    module.responsive();
  }));
  var onodes = [{
    x: 0,
    y: 0,
    id: 1,
    fx: 0,
    fy: 0,
    fixed: true
  }];
  var nodes = onodes;
  var links = [];
  var olinks = [];
  var simulation = d3.forceSimulation(nodes).force('charge', d3.forceManyBody()).force('link', d3.forceLink().id(function (d) {
    return d.id;
  })).force('center', d3.forceCenter(0, 0)).force('collide', d3.forceCollide(10)).on('tick', ticked);
  var g = svg.append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
  var link = g.append('g').attr('stroke', 'rgba(0,0,0,0.2)').attr('stroke-width', 1).selectAll('.link');
  var node = g.append('g').attr('stroke', 'rgba(255,255,255,0.5)').attr('stroke-width', 0.5).selectAll('.node');
  var label = g.append('g').attr('transform', 'translate(0,40)');
  var labelBg = label.append('rect').attr('height', 19).attr('fill', '#000').style('opacity', 0.6).attr('stroke', '#000').attr('stroke-width', 8).style('stroke-linejoin', 'round');
  var labelText = label.append('text').attr('fill', '#fff').attr('dy', 14).text('Loading Network').style('font-style', 'italic').attr('text-anchor', 'middle'); // Center

  g.append('g').append('circle').attr('r', 5).attr('stroke-width', 1).attr('stroke', 'rgba(255,255,255,1)').attr('fill', '#000');

  module.updateLabel = function (txt) {
    var b = labelText.text(txt).node().getBoundingClientRect();
    labelBg.attr('width', b.width + 10).attr('x', b.width / -2 - 5);
  };

  module.updateLabel('Loading Network');
  var interval = d3.interval(function () {
    nodes.forEach(function (n, ni) {
      onodes[ni].x = n.x;
      onodes[ni].y = n.y;
      onodes[ni].fx = n.fx;
      onodes[ni].fy = n.fy;
    });
    onodes.push({
      x: 0,
      y: 0,
      id: onodes.length + 1
    });
    nodes = JSON.parse(JSON.stringify(onodes));
    var cons = Math.ceil(Math.random() * Math.min(nodes.length - 1, 3));
    var cIDs = [];

    while (cIDs.length < cons) {
      var cID = 1 + Math.round(Math.random() * (nodes.length - 1));
      if (cIDs.indexOf(cID) == -1 && cID != nodes.length) cIDs.push(cID);
    }

    cIDs.forEach(function (c) {
      olinks.push({
        source: onodes.length,
        target: c
      });
    });
    links = JSON.parse(JSON.stringify(olinks)); // Update ForceSimulation

    simulation.nodes(nodes).force('link', d3.forceLink(links).id(function (d) {
      return d.id;
    })).alpha(1).restart(); // Update nodes and links

    node = node.data(nodes, function (d) {
      return d.id;
    });
    node.exit().remove();
    node = node.enter().append('circle').attr('fill', function (d) {
      return 'fixed' in d ? '#000' : '#555';
    }).attr('r', function (d) {
      return 'fixed' in d ? 5 : 3;
    }).merge(node);
    link = link.data(links);
    link.exit().remove();
    link = link.enter().append('line').merge(link);
  }, 1000, d3.now());

  module.stop = function () {
    interval.stop();
  };

  module.restart = function () {
    interval.restart();
  };

  function ticked() {
    node.attr('cx', function (d) {
      return d.x;
    }).attr('cy', function (d) {
      return d.y;
    });
    link.attr('x1', function (d) {
      return d.source.x;
    }).attr('y1', function (d) {
      return d.source.y;
    }).attr('x2', function (d) {
      return d.target.x;
    }).attr('y2', function (d) {
      return d.target.y;
    });
  }

  return module;
};