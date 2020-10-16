/* exported networkHome */

/* global d3,debounce,jspath,jsppath */
var networkHome = function networkHome(_container, _data, _taxonomy) {
  var module = {};
  var data = _data;
  var taxonomy = _taxonomy;
  var width;
  var segmentHeight = 250;
  var nodes;
  var nodeMap = {};
  var svg = _container;
  var s = svg.append('g');
  var edges;
  var edge;

  module.updateSize = function () {
    var bb = svg.node().getBoundingClientRect();
    width = bb.width;
  };

  module.init = function () {
    d3.csv(jspath + '/cache/' + jsppath + 'entity-thematic-edges.csv', {
      headers: {
        'Authorization': 'Basic ' + btoa('iass:amama2017')
      }
    }).then(function (_data) {
      _data.forEach(function (d) {
        if (d.source != d.target) {
          if (!('edges' in data[d.source])) data[d.source]['edges'] = [];
          data[d.source]['edges'].push(d.target);
        }
      });

      module.construct();
    })["catch"](function (err) {
      throw err;
    });
  };

  module.construct = function () {
    module.updateSize();
    nodeMap = {};
    nodes = [];
    edges = [];
    var taxonomySort = [];
    var taxonomySortKey = {};

    for (var _tkey in taxonomy) {
      if (taxonomy[_tkey].taxonomy == 'journey_station') {
        taxonomySort.push({
          name: taxonomy[_tkey].name,
          key: _tkey
        });
      }
    }

    taxonomySort.sort(function (a, b) {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });
    taxonomySort.forEach(function (s, si) {
      taxonomySortKey[s.key] = si;
    }); // extract journey

    taxonomySort.forEach(function (ts) {
      tkey = ts.key;
      var tLength = taxonomySortKey[tkey];
      var tX = width / 2 + (!(tLength % 2) ? -width / 4 : width / 4);
      var tY = segmentHeight / 2 + tLength * segmentHeight;
      nodes.push({
        g: s.append('g').datum(nodes.length),
        tLength: tLength,
        id: nodes.length - 1,
        oid: tkey,
        node: false,
        origin: true,
        type: 'taxonomy',
        title: taxonomy[tkey].name,
        slug: taxonomy[tkey].slug,
        x: tX,
        y: tY,
        simulation: false,
        nodeMap: {},
        nodes: [],
        edges: []
      });

      var _loop = function _loop(nkey) {
        var hasJourney = false;

        if (data[nkey].taxonomy.indexOf(tkey) >= 0) {
          hasJourney = true;
        }

        if (hasJourney) {
          nodes[nodes.length - 1].nodes.push({
            id: nodes[nodes.length - 1].nodes.length - 1,
            oid: nkey,
            type: data[nkey].type,
            slug: data[nkey].slug,
            title: data[nkey].title,
            randX: Math.random() * 10 * (Math.random() > 0.5 ? -1 : 1),
            randY: Math.random() * 10 * (Math.random() > 0.5 ? -1 : 1),
            r: 5
          });

          if ('edges' in data[nkey]) {
            data[nkey].edges.forEach(function (e) {
              edges.push({
                source: nkey,
                target: e
              });
            });
          }

          nodeMap[nkey] = nodes.length - 1;
          nodes[nodes.length - 1].nodeMap[nkey] = nodes[nodes.length - 1].nodes.length - 1;
        }
      };

      for (var nkey in data) {
        _loop(nkey);
      } // console.log(taxonomy[tkey], nodes[nodes.length-1].nodes.length)


      nodes[nodes.length - 1].simulation = d3.forceSimulation(nodes[nodes.length - 1].nodes).velocityDecay(0.2).force('x', d3.forceX().strength(0.002)).force('y', d3.forceY().strength(0.002)).force('collide', d3.forceCollide().radius(12).iterations(2));
      nodes[nodes.length - 1].node = nodes[nodes.length - 1].g.selectAll('g').data(nodes[nodes.length - 1].nodes).enter().append('g').attr('transform', function (d) {
        "translate(".concat(d.x, ",").concat(d.y, ")");
      }).on('click', function (d) {
        window.location = "https://www.ama-project.org/".concat(d.type, "/").concat(d.slug); // alert(`Open ${d.title}:${d.id}`)
      }).on('mouseover', function (d) {
        // d3.selectAll(`.${d.type}-${d.oid}`).style('stroke-opacity', 1)
        module.updateTooltip(d, nodes[d3.select(d3.select(this).node().parentNode).datum()]);
      }).on('mouseout', function () {
        tooltip.style('display', 'none'); // d3.selectAll('.connection').style('stroke-opacity', 0.2)
      });
      nodes[nodes.length - 1].node.append('path').style('stroke', 'none').attr('d', d3.symbol().size(160).type(function (d) {
        if (d.type == 'institution') {
          return d3.symbolCross;
        } else if (d.type == 'person') {
          return d3.symbolDiamond;
        } else if (d.type == 'project') {
          return d3.symbolSquare;
        } else if (d.type == 'publication') {
          return d3.symbolTriangle;
        } else {
          return d3.symbolCircle;
        }
      })).style('fill', '#000').style('cursor', 'pointer');
    });
    edges = edges.filter(function (e) {
      return e.source in nodeMap && e.target in nodeMap;
    });
    edge = s.append('g').selectAll('path').data(edges).enter().append('path').style('stroke', 'rgba(0,0,0,0.05)').style('fill', 'transparent').style('pointer-events', 'none'); // add items to the node list and keep closest to their journey

    for (var i = 0; i < 5; ++i) {
      nodes.forEach(function (n) {
        n.simulation.tick();
      });
    }

    nodes.forEach(function (n) {
      n.node.attr('transform', function (d) {
        return "translate(".concat(d.x, ",").concat(d.y, ")");
      });
    });
    module.updateSize();
    module.responsive();
  };

  module.redrawEdges = function () {
    edge.transition().attr('d', function (d) {
      var sox = nodes[nodeMap[d.source]].x;
      var soy = nodes[nodeMap[d.source]].y;
      var sx = sox + nodes[nodeMap[d.source]].nodes[nodes[nodeMap[d.source]].nodeMap[d.source]].x;
      var sy = soy + nodes[nodeMap[d.source]].nodes[nodes[nodeMap[d.source]].nodeMap[d.source]].y;
      var si = Math.floor(sy / 250);
      var eox = nodes[nodeMap[d.target]].x;
      var eoy = nodes[nodeMap[d.target]].y;
      var ex = eox + nodes[nodeMap[d.target]].nodes[nodes[nodeMap[d.target]].nodeMap[d.target]].x;
      var ey = eoy + nodes[nodeMap[d.target]].nodes[nodes[nodeMap[d.target]].nodeMap[d.target]].y;
      var ei = Math.floor(ey / 250);
      var rx = nodes[nodeMap[d.source]].nodes[nodes[nodeMap[d.source]].nodeMap[d.source]].randX;
      var ry = nodes[nodeMap[d.source]].nodes[nodes[nodeMap[d.source]].nodeMap[d.source]].randY;

      if (si == ei || Math.abs(si - ei) == 1) {
        return "M".concat(sx, " ").concat(sy, "C").concat(sox, " ").concat(soy, ",").concat(eox, " ").concat(eoy, ",").concat(ex, " ").concat(ey);
      } else {
        if (ei < si) {
          var tx = sx;
          var ty = sy;
          var ti = si;
          var tox = sox;
          var toy = soy;
          sx = ex;
          sy = ey;
          si = ei;
          sox = eox;
          soy = eoy;
          ex = tx;
          ey = ty;
          ei = ti;
          eoy = toy;
          eox = tox;
        }

        var path = "M".concat(sx, " ").concat(sy, "C").concat(sox + rx, " ").concat(soy + ry, ",").concat(sox + rx, " ").concat(soy + ry, ",").concat(sox + rx + (nodes[si + 1].x - sox) * 0.5, " ").concat(soy + ry + (nodes[si + 1].y - soy) * 0.5);

        for (var i = si + 1; i < ei; i++) {
          path += "C".concat(nodes[i].x + rx, " ").concat(nodes[i].y + ry, ",").concat(nodes[i].x + rx, " ").concat(nodes[i].y + ry, ",").concat(nodes[i].x + rx + (nodes[i + 1].x - nodes[i].x) * 0.5, " ").concat(nodes[i].y + ry + (nodes[i + 1].y - nodes[i].y) * 0.5);
        }

        path += "C".concat(eox + rx, " ").concat(eoy + ry, ",").concat(eox + rx, " ").concat(eoy + ry, ",").concat(ex, " ").concat(ey);
        return path;
      }
    });
  };

  var tooltip = svg.append('g').style('display', 'none').style('pointer-events', 'none');
  var tooltipBg = tooltip.append('path').style('fill', '#000').style('stroke', '#000').style('stroke-width', 5).style('stroke-linejoin', 'round');
  var tooltipText = tooltip.append('text').style('fill', '#fff').attr('dy', 4);

  module.updateTooltip = function (d, parent) {
    tooltip.attr('transform', "translate(".concat(parent.x + d.x + (parent.x + d.x < width / 2 ? 15 : -15), ",").concat(parent.y + d.y, ")"));
    tooltipText.text(d.title.length < 30 ? d.title : d.title.substr(0, 27) + '...').attr('text-anchor', parent.x + d.x < width / 2 ? 'start' : 'end').attr('dx', parent.x + d.x < width / 2 ? '20' : '-20');
    var bb = tooltipText.node().getBoundingClientRect();
    var dir = parent.x + d.x < width / 2 ? 1 : -1;
    tooltipBg.attr('d', "M0,0L".concat(15 * dir, ",15L").concat((15 + bb.width + 15) * dir, ",15L").concat((15 + bb.width + 15) * dir, ",-15L").concat(15 * dir, ",-15Z"));
    tooltip.style('display', 'block');
  };

  module.responsive = function () {
    nodes.forEach(function (n) {
      n.x = !(n.tLength % 2) ? width * 0.75 : width * 0.25;
      n.g.attr('transform', "translate(".concat(n.x, ",").concat(n.y, ")"));
    });
    module.redrawEdges();
  };

  window.addEventListener('resize', debounce(function () {
    module.updateSize();
    module.responsive();
  }));
  return module;
};