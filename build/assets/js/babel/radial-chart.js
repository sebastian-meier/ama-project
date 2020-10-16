/* exported rings */

/* global d3,debounce,jspath */
var rings = function rings(_container, _data, _taxonomy, _id) {
  var module = {};
  var data = _data;
  var id = _id;
  var container = _container;
  var taxonomy = _taxonomy;
  var width;
  var height;

  module.polarX = function (d) {
    return d[1] * Math.cos(d[0]);
  };

  module.polarY = function (d) {
    return d[1] * Math.sin(d[0]);
  };

  var line = d3.line().curve(d3.curveCatmullRom).x(module.polarX).y(module.polarY);

  var curvyConnector = function curvyConnector(d, r) {
    var x1 = module.polarX([d[3], 40]);
    var y1 = module.polarY([d[3], 40]);
    var x2 = module.polarX([d[3], r]);
    var y2 = module.polarY([d[3], r]);
    var dir = Math.random();
    var o1 = Math.random();
    var cx1 = module.polarX([d[3] + (dir < 0.5 ? -1 : 1) * (o1 * Math.PI / 180 * 20), 40 + (r - 40) * 0.1]);
    var cy1 = module.polarY([d[3] + (dir < 0.5 ? -1 : 1) * (o1 * Math.PI / 180 * 20), 40 + (r - 40) * 0.1]);
    var o2 = Math.random();
    var cx2 = module.polarX([d[3] + (dir < 0.5 ? 1 : -1) * (o2 * Math.PI / 180 * 20), 40 + (r - 40) * 0.9]);
    var cy2 = module.polarY([d[3] + (dir < 0.5 ? 1 : -1) * (o2 * Math.PI / 180 * 20), 40 + (r - 40) * 0.9]);
    return "M".concat(x1, ",").concat(y1, "C").concat(cx1, ",").concat(cy1, " ").concat(cx2, ",").concat(cy2, " ").concat(x2, ",").concat(y2);
  };

  module.updateSize = function () {
    var bb = container.node().getBoundingClientRect();
    width = bb.width;
    height = bb.height;
  };

  module.updateSize();
  var svg = container.append('svg').attr('width', width).attr('height', height);
  var defs = svg.append('defs');
  defs.append('filter').attr('id', 'shadow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%').html('<feGaussianBlur in="SourceAlpha" stdDeviation="3" />' + '<feOffset dx="0" dy="0" />' + '<feComponentTransfer>' + '<feFuncA type="linear" slope="0.2" />' + '</feComponentTransfer>' + '<feMerge>' + '<feMergeNode />' + '<feMergeNode in="SourceGraphic"/>' + '</feMerge>');
  var simScale = d3.scaleLinear().domain([1, data.taxonomy.length]).range([32, 256]);
  var hitScale = d3.scaleLinear().domain([1, data.taxonomy.length]).range([4, 8]);
  var s = svg.append('g');
  var rings = {
    'sustainability_keywords': [],
    'inner_change_keywords': []
  };
  var ringKeys = {
    'sustainability_keywords': {},
    'inner_change_keywords': {}
  };
  var ringCount = 0;
  data.taxonomy.forEach(function (t) {
    if (taxonomy[t].taxonomy in rings) {
      rings[taxonomy[t].taxonomy].push([t, 0, []]);
      ringKeys[taxonomy[t].taxonomy][t] = rings[taxonomy[t].taxonomy].length - 1;
      ringCount++;
    }
  });
  data['thematic-direct-direct'].forEach(function (t) {
    if (t[3] in rings && t[2] == 0 && t[0] != id) {
      rings[t[3]][ringKeys[t[3]][t[1]]][2].push(t[0]);
      rings[t[3]][ringKeys[t[3]][t[1]]][1]++;
    }
  });
  var configs = {
    'sustainability_keywords': {
      'r': 300,
      'g': null,
      'p': [],
      'pI': [],
      'c': '#761B41',
      // 'rgb(173, 36, 92)',
      'ac': 0,
      'o': 175
    },
    'inner_change_keywords': {
      'r': 150,
      'g': null,
      'p': [],
      'pI': [],
      'c': '#0D6B6F',
      // 'rgb(10, 158, 163)',
      'ac': 0,
      'o': 100
    }
  };
  var extraW = 50;
  var minW = 5;

  module.rotate = function (a, angle) {
    a.forEach(function (d, i) {
      a[i][0] = module.rotateA(d[0], angle);
    });
    return a;
  };

  module.rotateA = function (item, angle) {
    item += angle;
    if (angle > Math.PI * 2) angle -= Math.PI * 2;
    if (angle < 0) angle += Math.PI * 2;
    return item;
  };

  var maxs = [];

  for (var key in rings) {
    maxs.push(d3.max(rings[key], function (d) {
      return d[1];
    }));
  }

  var ringScale = d3.scaleLinear().domain([0, d3.max(maxs)]).range([minW, extraW]);
  var ringStep = Math.PI * 2 / ringCount;
  var ir = 0;

  for (var r = 0; r < ringCount; r++) {
    for (var _key in rings) {
      var n = Math.round(r / ringCount * rings[_key].length);

      if (n >= configs[_key].ac && n < rings[_key].length) {
        rings[_key][configs[_key].ac].push(ir * ringStep);

        ir++;
        configs[_key].ac++;
      }
    }
  }

  var simNodes = [];
  var simNodeKeys = {};

  function jigger(a, d) {
    a.forEach(function (el, i) {
      a[i][1] += d * Math.random();
    });
    return a;
  }

  var _loop = function _loop(_key2) {
    configs[_key2].g = s.append('g');

    if (rings[_key2].length == 0) {
      configs[_key2].g.append('circle').attr('r', configs[_key2].r);
    } else if (rings[_key2].length == 1) {
      rings[_key2][0].push(0);

      configs[_key2].p.push([rings[_key2][0][3], configs[_key2].r + extraW]);

      configs[_key2].p.push([Math.PI, configs[_key2].r + 2]);

      configs[_key2].pI.push([rings[_key2][0][3], configs[_key2].r - extraW]);

      configs[_key2].pI.push([Math.PI, configs[_key2].r - 2]);
    } else {
      rings[_key2].forEach(function (r, ri) {
        rings[_key2][ri].push(r[3]);

        configs[_key2].p.push([r[3], configs[_key2].r + ringScale(r[1])]);

        configs[_key2].pI.push([r[3], configs[_key2].r - ringScale(r[1])]);
      });
    }

    if (rings[_key2].length > 0) {
      configs[_key2].p.push([configs[_key2].p[0][0] + Math.PI * 2, configs[_key2].p[0][1]]);

      configs[_key2].pI.push([configs[_key2].pI[0][0] + Math.PI * 2, configs[_key2].pI[0][1]]);

      var dPath = [configs[_key2].p[0]];
      var dPathI = [configs[_key2].pI[0]];

      configs[_key2].p.forEach(function (p, pi) {
        if (pi > 0) {
          var last = dPath[dPath.length - 1];
          var diff = p[0] - last[0];
          var rDiff = p[1] - last[1];
          var extra = Math.ceil(diff * (configs[_key2].r / 10 * 2 / Math.PI));

          for (var _i = 0; _i < extra; _i++) {
            var m1 = Math.pow(_i / extra, 2) * (1 - _i / extra);

            var m2 = Math.pow(_i / extra, 0.5) * (_i / extra);

            dPath.push([last[0] + diff * _i / extra, last[1] + rDiff * (m1 + m2)]);
          }

          dPath.push(p);
        }
      });

      configs[_key2].pI.forEach(function (p, pi) {
        if (pi > 0) {
          var last = dPathI[dPathI.length - 1];
          var diff = p[0] - last[0];
          var rDiff = p[1] - last[1];
          var extra = Math.ceil(diff * (configs[_key2].r / 10 * 2 / Math.PI));

          for (var _i2 = 0; _i2 < extra; _i2++) {
            var m1 = Math.pow(_i2 / extra, 2) * (1 - _i2 / extra);

            var m2 = Math.pow(_i2 / extra, 0.5) * (_i2 / extra);

            dPathI.push([last[0] + diff * _i2 / extra, last[1] + rDiff * (m1 + m2)]);
          }

          dPathI.push(p);
        }
      });

      dPathI.reverse();

      for (var _i3 = 0; _i3 < 20; _i3++) {
        var outer = jigger(JSON.parse(JSON.stringify(dPath)), 5);
        var inner = jigger(JSON.parse(JSON.stringify(dPathI)), -5);
        s.append('path') // .style('mix-blend-mode','multiply')
        .style('fill', configs[_key2].c) // .attr('d', line(module.rotate(dPath, (key == 'sustainability_keywords')?-Math.PI*0.25:+Math.PI*0.75))+line(module.rotate(dPathI.reverse(), (key == 'sustainability_keywords')?-Math.PI*0.25:+Math.PI*0.75)))
        .attr('d', line(outer) + line(inner)).style('opacity', 0.025);
      }
    }
  };

  for (var _key2 in rings) {
    _loop(_key2);
  }

  var _loop2 = function _loop2(_key3) {
    s.append('g').selectAll('line').data(rings[_key3]).enter().append('path').attr('class', 'central-links').attr('d', function (d) {
      return curvyConnector(d, configs[_key3].r);
    }).attr('fill', 'transparent').style('stroke', 'rgba(0,0,0,1)').style('opacity', '0.3').style('stroke-width', 2).style('stroke-dashArray', '4,4');

    rings[_key3].forEach(function (r) {
      var shiftI = 0;
      simNodes.push({
        0: r[3],
        1: configs[_key3].r,
        fx: module.polarX([r[3], configs[_key3].r]),
        fy: module.polarY([r[3], configs[_key3].r]),
        fixed: true,
        dist: 8,
        id: r[0]
      });
      r[2].forEach(function (ri) {
        if (!(ri in simNodeKeys)) {
          var similar = 0;
          var simTargets = {
            // TODO change to s (sustainability) & ic (inner change)
            'sustainability_keywords': [],
            'inner_change_keywords': []
          };
          data.relatives[ri].taxonomy.forEach(function (t) {
            if (taxonomy[t].taxonomy in configs) {
              if (data.taxonomy.indexOf(t) >= 0) {
                simTargets[taxonomy[t].taxonomy].push(t);
                similar++;
              }
            }
          });

          if (similar > 0) {
            (function () {
              var sumAngle = 0;
              var sumItems = 0;

              var _loop4 = function _loop4(sKey) {
                simTargets[sKey].forEach(function (s) {
                  sumAngle += rings[sKey][ringKeys[sKey][s]][3];
                  sumItems++;
                });
              };

              for (var sKey in simTargets) {
                _loop4(sKey);
              }

              if (simTargets.sustainability_keywords.length > 0 && simTargets.inner_change_keywords.length > 0) {
                simNodes.push({
                  0: sumAngle / sumItems + shiftI * (shiftI % 2 == 0 ? 0.3 / r[2].length : -0.3 / r[2].length),
                  1: (configs['sustainability_keywords'].r - configs['inner_change_keywords'].r) / 2 + configs['inner_change_keywords'].r,
                  dist: similar,
                  id: ri
                });
              } else {
                simNodes.push({
                  0: sumAngle / sumItems + shiftI * (shiftI % 2 == 0 ? 0.3 / r[2].length : -0.3 / r[2].length),
                  1: configs[_key3].r,
                  dist: similar,
                  id: ri
                });
              }
            })();
          } else {
            simNodes.push({
              0: r[3] + shiftI * (shiftI % 2 == 0 ? 0.3 / r[2].length : -0.3 / r[2].length),
              // +(shiftI%2)?-0.01:0.01
              1: configs[_key3].r,
              dist: similar,
              id: ri
            });
          }

          shiftI++;
          simNodeKeys[ri] = simNodes.length - 1;
        }
      });
    });
  };

  for (var _key3 in rings) {
    _loop2(_key3);
  } // TODO: d3.forceRadial(radius[, x][, y])


  var simulation = d3.forceSimulation(simNodes).force('x', d3.forceX(module.polarX).strength(1)).force('y', d3.forceY(module.polarY)).force('collide', d3.forceCollide(function (d) {
    return hitScale(d.dist) + 2;
  })).stop();

  for (var i = 0; i < 120; ++i) {
    simulation.tick();
  }

  s.append('g').selectAll('g.symbol').data(simNodes).enter().append('g').attr('class', 'symbol').attr('id', function (d) {
    return 'fixed' in d && d.fixed ? 'sym-' + d.id : '';
  }).style('opacity', 1).attr('transform', function (d) {
    return "translate(".concat('fixed' in d && d.fixed ? d.fx : d.x, ",").concat('fixed' in d && d.fixed ? d.fy : d.y, ")");
  }).append('path').style('stroke', 'none').style('fill', function (d) {
    return 'fixed' in d ? 'transparent' : '#000';
  }).attr('d', d3.symbol().size(function (d) {
    return simScale(d.dist);
  }).type(function (d) {
    if ('fixed' in d) {
      return d3.symbolCircle;
    }

    if (data.relatives[d.id].type == 'institution') {
      return d3.symbolCross;
    } else if (data.relatives[d.id].type == 'person') {
      return d3.symbolDiamond;
    } else if (data.relatives[d.id].type == 'project') {
      return d3.symbolSquare;
    } else if (data.relatives[d.id].type == 'publication') {
      return d3.symbolTriangle;
    } else {
      return d3.symbolCircle;
    }
  })).style('cursor', 'pointer').on('mouseover', function (d) {
    if (!('fixed' in d)) {
      module.updateTooltip([d[0], 300, data.relatives[d.id].title, d.x, d.y]);
      d3.selectAll('.item-tax-' + d.id).style('stroke', 'rgba(0,0,0,0.4)');
      d3.selectAll('.symbol').filter(function (dd) {
        return dd.id == d.id ? false : true;
      }).style('opacity', 0.2);
      d3.selectAll('.central-links').style('opacity', 0.1);
      d3.selectAll('.tax-has-' + d.id).style('opacity', 1);
    }
  }).on('mouseout', function () {
    d3.selectAll('.item-tax').style('stroke', 'transparent');
    tooltip.style('display', 'none');
    d3.selectAll('.symbol').style('opacity', 1);
    d3.selectAll('.central-links').style('opacity', 0.3);
    d3.selectAll('.tax').style('opacity', 0);
  }).on('click', function (d) {
    window.location = "https://www.ama-project.org/".concat(data.relatives[d.id].type, "/").concat(data.relatives[d.id].slug); // alert('Open '+data.relatives[d.id].title+','+d.id)
  });
  var connections = s.append('g');
  simNodes.forEach(function (s) {
    if (!s.fixed || !('fixed' in s)) {
      data.relatives[s.id].taxonomy.forEach(function (t) {
        if (taxonomy[t].taxonomy in configs && data.taxonomy.indexOf(t) >= 0) {
          var a1 = s[0] + (rings[taxonomy[t].taxonomy][ringKeys[taxonomy[t].taxonomy][t]][3] - s[0]) * 0.25;
          var a2 = s[0] + (rings[taxonomy[t].taxonomy][ringKeys[taxonomy[t].taxonomy][t]][3] - s[0]) * 0.75;
          var tr = d3.max([s[1], configs[taxonomy[t].taxonomy].r]);
          var cx1 = module.polarX([a1, tr]);
          var cx2 = module.polarX([a2, tr]);
          var cy1 = module.polarY([a1, tr]);
          var cy2 = module.polarY([a2, tr]);
          var tx = module.polarX([rings[taxonomy[t].taxonomy][ringKeys[taxonomy[t].taxonomy][t]][3], configs[taxonomy[t].taxonomy].r]);
          var ty = module.polarY([rings[taxonomy[t].taxonomy][ringKeys[taxonomy[t].taxonomy][t]][3], configs[taxonomy[t].taxonomy].r]);
          connections.append('path').attr('class', "item-tax item-tax-".concat(s.id, " item-taxo-").concat(t)).style('stroke', 'transparent').style('pointer-events', 'none').style('fill', 'transparent').attr('d', "M".concat(s.x, ",").concat(s.y, "C").concat(cx1, ",").concat(cy1, " ").concat(cx2, ",").concat(cy2, " ").concat(tx, ",").concat(ty));
        }
      });
    }
  });

  var _loop3 = function _loop3(_key4) {
    s.append('g').selectAll('circle').data(rings[_key4]).enter().append('circle').attr('cx', function (d) {
      return module.polarX([d[3], configs[_key4].r]);
    }).attr('cy', function (d) {
      return module.polarY([d[3], configs[_key4].r]);
    }).attr('r', 5).style('fill', configs[_key4].c).style('stroke', '#fff').style('stroke-width', 2).style('cursor', 'pointer').on('mouseover', function (d) {
      d3.selectAll('.item-taxo-' + d[0]).style('stroke', 'rgba(0,0,0,0.4)');
      d3.selectAll('#tax-' + d[0]).style('opacity', 1);
    }).on('mouseout', function () {
      d3.selectAll('.tax').style('opacity', 0);
      d3.selectAll('.item-tax').style('stroke', 'transparent');
    }).on('click', function (d) {
      alert("Show related ".concat(d[0], " to ").concat(id));
    });
    var taxTooltips = s.append('g').selectAll('g.tax-tooltip').data(rings[_key4]).enter().append('g').attr('class', function (d) {
      return 'tax tax-has-' + taxonomy[d[0]].direct.join(' tax-has-');
    }).attr('id', function (d) {
      return 'tax-' + d[0];
    }).style('opacity', 0).style('pointer-events', 'none').attr('transform', function (d) {
      return "translate(".concat(module.polarX([d[3], configs[_key4].r]), ",").concat(module.polarY([d[3], configs[_key4].r]), ")");
    });
    var taxTooltipRects = taxTooltips.append('rect');
    taxTooltips.append('text').attr('id', function (d) {
      return 'tax-title-' + d[0];
    }).text(function (d) {
      return taxonomy[d[0]].name;
    }).attr('text-anchor', function (d) {
      return module.polarX([d[3], configs[_key4].r]) > 0 ? 'start' : 'end';
    }).attr('dy', 4).attr('dx', function (d) {
      return module.polarX([d[3], configs[_key4].r]) > 0 ? 15 : -15;
    }).style('fill', '#fff').style('font-size', 12).style('text-transform', 'capitalize');
    taxTooltipRects.attr('style', 'opacity:0.7; fill:#000; stroke:#000; stroke-width:5; stroke-linejoin:round;').attr('x', function (d) {
      var bb = d3.select('#tax-title-' + d[0]).node().getBoundingClientRect();
      return module.polarX([d[3], configs[_key4].r]) > 0 ? 10 : -10 - bb.width - 10;
    }).attr('y', -8).attr('width', function (d) {
      var bb = d3.select('#tax-title-' + d[0]).node().getBoundingClientRect();
      return bb.width + 10;
    }).attr('height', 16);
  };

  for (var _key4 in rings) {
    _loop3(_key4);
  }

  var tooltip = s.append('g').style('display', 'none').style('pointer-events', 'none');
  var tooltipLine = tooltip.append('line').style('stroke', 'rgba(0,0,0,0.4)');
  var tooltipBg = tooltip.append('path').style('fill', '#000').style('stroke', '#000').style('stroke-width', 5).style('stroke-linejoin', 'round');
  var tooltipText = tooltip.append('text').style('fill', '#fff').attr('dy', 4);

  module.updateTooltip = function (d) {
    var ox = d[3];
    var oy = d[4];
    var tx = module.polarX([d[0], d[1] + extraW + 20]);
    var ty = module.polarY([d[0], d[1] + extraW + 20]); // tooltip.attr('transform',`translate(${ox},${oy})`)

    tooltipText.attr('transform', "translate(".concat(tx + (ox > 0 ? 23 : -23), ",").concat(ty, ")")).text(d[2].length < 30 ? d[2] : d[2].substr(0, 27) + '...').attr('text-anchor', ox > 0 ? 'start' : 'end');
    var bb = tooltipText.node().getBoundingClientRect();
    tooltipLine.attr('x1', ox).attr('y1', oy).attr('x2', tx + (ox > 0 ? -2.5 : 2.5)).attr('y2', ty);
    var dir = ox > 0 ? 1 : -1;
    tooltipBg.attr('d', "M".concat(tx, ",").concat(ty, "L").concat(tx + 15 * dir, ",").concat(ty + 15, "L").concat(tx + (15 + bb.width + 20) * dir, ",").concat(ty + 15, "L").concat(tx + (15 + bb.width + 20) * dir, ",").concat(ty - 15, "L").concat(tx + 15 * dir, ",").concat(ty - 15, "Z"));
    tooltip.style('display', 'block');
  }; // Draw Icon and label in the center


  var item = s.append('g');
  item.append('image').attr('width', 80).attr('height', 80).attr('x', -40).attr('y', -40).attr('xlink:href', jspath + '/assets/images/icon_' + data.type + 's@2x.png');
  item.append('circle').attr('r', 40).attr('class', 'item-circle');
  var itembg = s.append('g');
  var itemtext = s.append('g').attr('transform', 'translate(0,50)').append('text').attr('style', 'fill:#fff; font-size:20px; font-style:italic;').text(data.title.length < 30 ? data.title : data.title.substr(0, 27) + '...').attr('text-anchor', 'middle');
  var itemTextSize = itemtext.node().getBoundingClientRect();
  itembg.append('rect').attr('x', itemTextSize.width / -2 - 8).attr('y', 30).attr('width', itemTextSize.width + 16).attr('height', 30).attr('fill', '#000');

  module.responsive = function () {
    s.attr('transform', "translate(".concat(width / 2, ",").concat(height / 2, ")"));
  };

  module.responsive();
  window.addEventListener('resize', debounce(function () {
    module.updateSize();
    module.responsive();
  }));
  return module;
};