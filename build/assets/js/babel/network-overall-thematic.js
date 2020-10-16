/* exported networkOverallThematic */

/* global d3,debounce, Shepherd, jspath */
var networkOverallThematic = function networkOverallThematic(_container, _data, _taxonomy, _id, _callback, _taxLimit, _individual) {
  var module = {
    set filterType(_filter) {
      module.applyFilter('type', _filter, true);
    },

    get filterType() {
      return filters['type'];
    },

    set selection(_selection) {
      selection = _selection;
    },

    get selection() {
      return selection;
    }

  };
  var taxLimit = _taxLimit || false;
  var id = _id;
  var individual = _individual || false;
  var data = _data;
  var taxonomy = _taxonomy; // id = _id,

  var callback = _callback;
  var container = _container;
  var width;
  var height;
  var rScale;
  var simulation = d3.forceSimulation().force('charge', d3.forceManyBody()).force('link', d3.forceLink().id(function (d) {
    return d.id;
  })).force('center', d3.forceCenter(0, 0)).force('collide', d3.forceCollide(function (d) {
    return d.r + 20;
  }));
  var taxSelects = {
    'sustainability_keywords': [],
    'inner_change_keywords': [],
    'journey_station': [],
    'perspective_keywords': [],
    'ama_role': []
  };
  var taxSelectKeys = {
    'sustainability_keywords': {},
    'inner_change_keywords': {},
    'journey_station': {},
    'perspective_keywords': {},
    'ama_role': {}
  };
  var taxSelectsNodes = {
    'sustainability_keywords': null,
    'inner_change_keywords': null,
    'journey_station': null,
    'perspective_keywords': null,
    'ama_role': null
  };
  var taxSelectsOptions = {
    'sustainability_keywords': null,
    'inner_change_keywords': null,
    'journey_station': null,
    'perspective_keywords': null,
    'ama_role': null
  };

  module.updateSize = function () {
    var bb = container.node().getBoundingClientRect();
    width = bb.width;
    height = bb.height;
  };

  module.updateSize();
  var svg = container.append('svg').attr('width', width).attr('height', height);

  module.scrollTop = function () {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  };

  module.tour = new Shepherd.Tour({
    defaultStepOptions: {
      showCancelLink: true
    }
  });
  module.tour.on('show', module.scrollTop);
  module.tour.addStep('step-1', {
    title: 'The Network-View',
    text: 'The visualisation shows which items are connected to which categories.',
    buttons: [{
      action: module.tour.next,
      text: 'Next &raquo;'
    }]
  }).on('before-show', module.scrollTop);
  module.tour.addStep('step-2', {
    title: 'The Network-View',
    text: 'The circles represent the taxonomies. Sustainability in red, inner change in green. The bigger the circle, the more items are connected. Select a circle to filter items.',
    attachTo: '.node-sustainability_keywords top',
    buttons: [{
      action: module.tour.back,
      classes: 'shepherd-button-secondary',
      text: '&laquo; Back'
    }, {
      action: module.tour.next,
      text: 'Next &raquo;'
    }]
  }).on('before-show', module.scrollTop);
  module.tour.addStep('step-3', {
    title: 'The Network-View',
    text: 'Hover over an icon to learn more and click the icon to continue to its details page.',
    attachTo: {
      element: '.node-unknown',
      on: 'top'
    },
    buttons: [{
      action: module.tour.back,
      classes: 'shepherd-button-secondary',
      text: '&laquo; Back'
    }, {
      action: module.tour.next,
      text: 'Next &raquo;'
    }]
  }).on('before-show', module.scrollTop);
  module.tour.addStep('step-3-1', {
    title: 'The Matrix-View',
    text: 'You can use the type filters to narrow down the results to a specific type.',
    attachTo: {
      element: '#type-nav',
      on: 'top'
    },
    buttons: [{
      action: module.tour.back,
      classes: 'shepherd-button-secondary',
      text: '&laquo; Back'
    }, {
      action: module.tour.next,
      text: 'Next &raquo;'
    }]
  }).on('before-show', module.scrollTop);

  if (d3.selectAll('#explore-con').size() >= 1) {
    module.tour.addStep('step-3-2', {
      title: 'The Matrix-View',
      text: 'You can use the taxonomy filters to narrow down the results to specific categories.',
      attachTo: {
        element: '#filter-nav',
        on: 'top'
      },
      buttons: [{
        action: module.tour.back,
        classes: 'shepherd-button-secondary',
        text: '&laquo; Back'
      }, {
        action: module.tour.next,
        text: 'Next &raquo;'
      }]
    }).on('before-show', module.scrollTop);
    module.tour.addStep('step-4', {
      title: 'The Network-View',
      text: 'Selecting taxonomies act as filters. The number of resulting items is displayed below.',
      attachTo: {
        element: '#result-display',
        on: 'top'
      },
      buttons: [{
        action: module.tour.back,
        classes: 'shepherd-button-secondary',
        text: '&laquo; Back'
      }, {
        action: module.tour.next,
        text: 'Next &raquo;'
      }]
    }).on('before-show', module.scrollTop);
    module.tour.addStep('step-5', {
      title: 'The Network-View',
      text: 'All filtered items are displayed as a list below the visualisation.',
      attachTo: 'a.connection top',
      scrollTo: true,
      buttons: [{
        action: module.tour.back,
        classes: 'shepherd-button-secondary',
        text: '&laquo; Back'
      }, {
        action: module.tour.cancel,
        text: 'Exit &times;'
      }]
    }).on('before-show', module.scrollTop);
  } else {
    module.tour.addStep('step-3-2', {
      title: 'The Matrix-View',
      text: 'You can use the taxonomy filters to narrow down the results to specific categories.',
      attachTo: {
        element: '#filter-nav',
        on: 'top'
      },
      buttons: [{
        action: module.tour.back,
        classes: 'shepherd-button-secondary',
        text: '&laquo; Back'
      }, {
        action: module.tour.cancel,
        text: 'Exit &times;'
      }]
    }).on('before-show', module.scrollTop);
  }

  if (d3.selectAll('body.page-template-explore, body.single').size() >= 1) {
    container.append('button').attr('id', 'master-help-button').text('?').on('click', function () {
      module.tour.start();
    });
  }

  var defs = svg.append('defs');
  defs.append('filter').attr('id', 'shadow').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%').html('<feGaussianBlur in="SourceAlpha" stdDeviation="3" />' + '<feOffset dx="0" dy="0" />' + '<feComponentTransfer>' + '<feFuncA type="linear" slope="0.2" />' + '</feComponentTransfer>' + '<feMerge>' + '<feMergeNode />' + '<feMergeNode in="SourceGraphic"/>' + '</feMerge>');
  var dragX = width / 2;
  var dragY = height / 2;
  svg.append('rect').attr('width', width).attr('height', height).attr('fill', 'transparent').call(d3.drag().on('drag', function () {
    s.attr('transform', "translate(".concat(dragX + d3.event.x - d3.event.subject.x, ",").concat(dragY + d3.event.y - d3.event.subject.y, ")"));
  }).on('end', function () {
    dragX = dragX + d3.event.x - d3.event.subject.x;
    dragY = dragY + d3.event.y - d3.event.subject.y;
  }));
  var s = svg.append('g');
  var nodes = [];
  var nodeKeys = {
    tax: {},
    el: {}
  };
  var edges = [];
  var filters = {
    taxonomy: [],
    type: []
  };
  var selection = [];
  var nodeSel;

  module.resetSelection = function () {
    selection = [];
  };

  module.setSelection = function (id) {
    if (id) {
      var i = selection.indexOf(id);

      if (i == -1) {
        selection.push(id);
      } else {
        selection.splice(i, 1);
      }
    }
  };

  module.updateSelection = function () {
    var nodeIDs = [];
    var taxIDs = [];

    if (selection.length > 0) {
      icons.style('fill', function (d) {
        if (d.type == 'taxonomy') {
          if (d.tax == 'sustainability_keywords') {
            return 'rgb(181, 128, 150)';
          } else {
            return 'rgb(124, 161, 162)';
          }
        } else {
          if (individual && d.oid == id) {
            return 'transparent';
          } else {
            return '#999';
          }
        }
      }).style('stroke', 'transparent'); // let icoSel = ''
      // if(selection.length==1){
      //   icoSel = '.node.ico-'+selection[0]+' path, '
      // }else if(selection.length>1){
      //   icoSel += ' .node'
      //   selection.forEach(s=>{
      //     icoSel += '.ico-'+s
      //   })
      //   icoSel += ' path, '
      // }
      // icoSel

      nodeSel = d3.selectAll('.node.taxonomy-' + selection.join(' path, .node.taxonomy-') + ' path, .node.tax-' + selection.join('.tax-') + ' path').style('fill', function (d) {
        if (d.type == 'taxonomy') {
          if (d.tax == 'sustainability_keywords') {
            return '#761B41';
          } else {
            return '#0D6B6F';
          }
        } else {
          if (individual && d.oid == id) {
            return 'transparent';
          } else {
            return '#000';
          }
        }
      }).each(function (d) {
        if (d.type != 'taxonomy') {
          nodeIDs.push(d.oid);
        } else {
          taxIDs.push(d.oid);
        }
      });
      d3.selectAll('.node.child-' + nodeIDs.join(' path, .node.child-') + ' path').style('fill', function (d) {
        if (d.type == 'taxonomy') {
          taxIDs.push(d.oid);

          if (d.tax == 'sustainability_keywords') {
            return '#761B41';
          } else {
            return '#0D6B6F';
          }
        } else {
          if (individual && d.oid == id) {
            return 'transparent';
          } else {
            return '#000';
          }
        }
      });
      d3.selectAll('.node.taxonomy-' + selection.join(' path, .node.taxonomy-') + ' path').style('stroke', '#000').style('stroke-width', 2);
      d3.selectAll('.connection').style('stroke-opacity', 0.05);
      module.highlightSelection();
    } else {
      icons.style('fill', function (d) {
        if (d.type == 'taxonomy') {
          if (d.tax == 'sustainability_keywords') {
            return '#761B41';
          } else {
            return '#0D6B6F';
          }
        } else {
          if (individual && d.oid == id) {
            return 'transparent';
          } else {
            return '#000';
          }
        }
      }).style('stroke', 'transparent');
      d3.selectAll('.connection').style('stroke-opacity', 0.2);
    }

    for (var skey in taxSelects) {
      taxSelects[skey].forEach(function (tax) {
        if (selection.length == 0) {
          tax.has = tax.oHas;
        } else {
          if (taxIDs.indexOf(tax.value) >= 0) {
            tax.has = tax.oHas ? true : false;
          } else {
            tax.has = false;
          }
        }
      });
    }

    module.updateSelects();
  };

  module.applyFilter = function (type, value, set) {
    var change = false;
    var i = filters[type].indexOf(value);

    if (!set) {
      if (i >= 0) {
        filters[type].splice(i, 1);
        change = true;
      }
    } else {
      if (i == -1) {
        filters[type].push(value);
        change = true;
      }
    }

    if (change) {
      module.buildNetwork();
      module.updateSimulation(true);
    }
  };

  module.resetFilter = function (update) {
    filters = {
      taxonomy: [],
      type: []
    };

    if (update) {
      module.buildNetwork();
      module.updateSimulation(true);
    }
  };

  var firstUpper = function firstUpper(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  module.buildNetwork = function () {
    var oNodes = nodes;
    var oNodeKeys = nodeKeys;
    nodes = [];
    nodeKeys = {
      tax: {},
      el: {}
    };
    edges = [];
    selection = [];
    taxSelects = {
      'sustainability_keywords': [],
      'inner_change_keywords': [],
      'journey_station': [],
      'perspective_keywords': [],
      'ama_role': []
    };
    taxSelectKeys = {
      'sustainability_keywords': {},
      'inner_change_keywords': {},
      'journey_station': {},
      'perspective_keywords': {},
      'ama_role': {}
    };

    var _loop = function _loop(key) {
      if ('title' in data[key] && data[key].taxonomy.length > 0) {
        var hasConnection = false;
        data[key].taxonomy.forEach(function (t) {
          if (taxonomy[t].taxonomy == 'sustainability_keywords' || taxonomy[t].taxonomy == 'inner_change_keywords') {
            hasConnection = true;
          }
        });
        var inTypeFilter = true;
        var inTaxFilter = true; // taxonomy filter

        if (filters.taxonomy.length > 0) {
          inTaxFilter = false;
          data[key].taxonomy.forEach(function (t) {
            if (filters.taxonomy.indexOf(t) >= 0) {
              inTaxFilter = true;
            }
          });
        } // type filter


        if (filters.type.length > 0) {
          inTypeFilter = false;

          if (filters.type.indexOf(data[key].type) >= 0) {
            inTypeFilter = true;
          }
        }

        if (hasConnection && inTypeFilter && inTaxFilter || individual && key == id) {
          nodes.push({
            id: data[key].type + '-' + key,
            oid: key,
            type: data[key].type,
            title: firstUpper(data[key].title),
            taxonomy: data[key].taxonomy,
            slug: data[key].slug,
            r: 10,
            x: key in oNodeKeys.el ? oNodes[oNodeKeys.el[key]].x : 0,
            y: key in oNodeKeys.el ? oNodes[oNodeKeys.el[key]].y : 0,
            // fx:(key in oNodeKeys.el)?oNodes[oNodeKeys.el[key]].fx:0,
            // fy:(key in oNodeKeys.el)?oNodes[oNodeKeys.el[key]].fy:0,
            c: 1
          });
          nodeKeys.el[key] = nodes.length - 1;
          data[key].taxonomy.forEach(function (t) {
            if (taxonomy[t].taxonomy == 'sustainability_keywords' || taxonomy[t].taxonomy == 'inner_change_keywords' || 'journey_station' == taxonomy[t].taxonomy || 'ama_role' == taxonomy[t].taxonomy || 'perspective_keywords' == taxonomy[t].taxonomy) {
              if (!(t in nodeKeys.tax)) {
                var ico = [];
                taxonomy[t].direct.forEach(function (dc) {
                  if (dc in data) {
                    data[dc].taxonomy.forEach(function (dct) {
                      if (ico.indexOf(dct) == -1) {
                        ico.push(dct);
                      }
                    });
                  }
                });

                if (!individual || taxLimit.indexOf(t) > -1) {
                  taxSelects[taxonomy[t].taxonomy].push({
                    name: firstUpper(taxonomy[t].name),
                    value: t,
                    parent: taxonomy[t].parent,
                    has: true,
                    oHas: true
                  });
                  taxSelectKeys[taxonomy[t].taxonomy][t] = taxSelects[taxonomy[t].taxonomy].length - 1;
                }

                if (!taxLimit || taxLimit.indexOf(t) > -1) {
                  nodes.push({
                    id: 'taxonomy-' + t,
                    oid: t,
                    type: 'taxonomy',
                    tax: taxonomy[t].taxonomy,
                    title: firstUpper(taxonomy[t].name),
                    r: 10,
                    x: t in oNodeKeys.tax ? oNodes[oNodeKeys.tax[t]].x : 0,
                    y: t in oNodeKeys.tax ? oNodes[oNodeKeys.tax[t]].y : 0,
                    // fx:(t in oNodeKeys.tax)?oNodes[oNodeKeys.tax[t]].fx:0,
                    // fy:(t in oNodeKeys.tax)?oNodes[oNodeKeys.tax[t]].fy:0,
                    // indirect connections
                    ico: ico,
                    c: 0
                  });
                  nodeKeys.tax[t] = nodes.length - 1;
                }
              }

              if (!taxLimit || taxLimit.indexOf(t) > -1) {
                nodes[nodeKeys.tax[t]].c++;
                edges.push({
                  source: nodes[nodeKeys.el[key]].id,
                  target: nodes[nodeKeys.tax[t]].id
                });
              }
            }
          });
        }
      }
    };

    for (var key in data) {
      _loop(key);
    }

    if (individual) {
      rScale = d3.scaleLinear().range([0.5, 5]).domain([1, taxLimit.length]);
    } else {
      rScale = d3.scaleLinear().range([1, 10]).domain([1, d3.max(nodes, function (d) {
        return d.c;
      })]);
    }

    nodes.forEach(function (n, ni) {
      if (individual) {
        if (nodes[ni].type == 'taxonomy') {
          nodes[ni].r = 2.5;
        } else if (id == nodes[ni].oid) {
          nodes[ni].r = 50;
        } else {
          var ct = 0;
          nodes[ni].taxonomy.forEach(function (t) {
            if (taxLimit.indexOf(t) > -1) ct++;
          });
          nodes[ni].r = rScale(ct);
        }
      } else {
        nodes[ni].r = rScale(nodes[ni].c);
      }
    });

    var _loop2 = function _loop2(skey) {
      taxSelects[skey].forEach(function (s) {
        addParentSelect(skey, taxonomy[s.value]);
      });
      taxSelects[skey].sort(function (a, b) {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
      });
      var tempList = [];
      taxSelects[skey].forEach(function (s) {
        if (s.parent == 0) tempList.push(s);
      });
      taxSelects[skey].sort(function (a, b) {
        if (a.name > b.name) return -1;
        if (a.name < b.name) return 1;
        return 0;
      }); // let depth = 0

      var _loop3 = function _loop3(i) {
        taxSelects[skey].forEach(function (s) {
          // if(tempList[i].parent == 0) depth = 0
          if (s.parent == tempList[i].value) {
            s.name = new Array(getDepth(s.value) + 1).join('-') + ' ' + s.name;
            tempList.splice(i + 1, 0, s);
          }
        });
      };

      for (var i = 0; i < tempList.length; i++) {
        _loop3(i);
      }

      taxSelects[skey] = tempList;
      taxSelectsNodes[skey] = d3.select('#select_' + skey);
      taxSelectsNodes[skey].selectAll('li').remove();
      taxSelectsOptions[skey] = taxSelectsNodes[skey].selectAll('li').data(taxSelects[skey]).enter().append('li').append('a').text(function (d) {
        return d.name;
      }).attr('data-value', function (d) {
        return d.value;
      }).classed('disabled', function (d) {
        return !d.has ? true : false;
      }).on('click', function (d) {
        module.setSelection(d.value);
        callback(selection);
      });
    };

    for (var skey in taxSelects) {
      _loop2(skey);
    }
  };

  module.updateSelects = function () {
    for (var skey in taxSelects) {
      taxSelectsOptions[skey].data(taxSelects[skey]).each(function (d) {
        if (selection.indexOf(d.value) >= 0) {
          d3.select(this).classed('selected', true);
        } else {
          d3.select(this).classed('selected', false);
        }

        if (!d.has) {
          d3.select(this).classed('disabled', true);
        } else {
          d3.select(this).classed('disabled', false);
        }
      });
    }
  };

  var getDepth = function getDepth(id) {
    if (taxonomy[id].parent == 0) {
      return 0;
    } else {
      return 1 + getDepth(taxonomy[id].parent);
    }
  };

  var addParentSelect = function addParentSelect(skey, item) {
    if (item.parent != 0 && !(item.parent in taxSelectKeys[skey])) {
      taxSelects[skey].push({
        name: taxonomy[item.parent].name,
        value: item.parent,
        parent: taxonomy[item.parent].parent,
        has: false,
        oHas: false
      });
      taxSelectKeys[skey][item.parent] = taxSelects[skey].length - 1;
      addParentSelect(skey, taxSelects[skey][taxSelects[skey].length - 1]);
    }
  };

  var ticked = function ticked() {
    node.attr('transform', function (d) {
      var x = d.x = Math.max(d.r + 20 - width / 2, Math.min(width / 2 - (d.r + 20), d.x));
      var y = d.y = Math.max(d.r + 20 - height / 2, Math.min(height / 2 - (d.r + 20), d.y));
      return "translate(".concat(x, ",").concat(y, ")");
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
  }; // let drag = simulation => {
  //   function dragstarted(d) {
  //     if (!d3.event.active) simulation.alphaTarget(0.7).restart();
  //     d.fx = d.x;
  //     d.fy = d.y;
  //   }
  //   function dragged(d) {
  //     d.fx = d3.event.x;
  //     d.fy = d3.event.y;
  //   }
  //   function dragended(d) {
  //     if (!d3.event.active) simulation.alphaTarget(0);
  //     d.fx = null;
  //     d.fy = null;
  //   }
  //   return d3.drag()
  //       .on("start", dragstarted)
  //       .on("drag", dragged)
  //       .on("end", dragended);
  // }


  var link = s.append('g').attr('stroke-width', 1).attr('stroke', '#000').attr('stroke-opacity', 0.2).style('pointer-events', 'none').selectAll('line');
  var node = s.append('g').selectAll('g');
  var icons;

  module.updateSimulation = function (anim) {
    if (individual) {
      nodes.sort(function (a, b) {
        if (a.oid == id) return 1;
        return 0;
      });
    }

    simulation.nodes(nodes).on('tick', ticked);
    simulation.force('link').links(edges);

    if (anim) {
      simulation.alpha(1).restart();
    } else {
      for (var i = 0; i < 80; ++i) {
        simulation.tick();
      }
    }

    link = link.data(edges);
    link.exit().remove();
    link = link.enter().append('line').merge(link);
    link.attr('class', function (d) {
      var cl = 'connection';
      ['source', 'target'].forEach(function (t) {
        cl += ' ' + d[t].type + '-' + d[t].oid;

        if (d[t].type != 'taxonomy') {
          d[t].taxonomy.forEach(function (tax) {
            cl += ' ico-' + tax;
          });
        }
      });
      return cl.trim();
    });
    node = node.data(nodes, function (d) {
      return d.id;
    });
    node.exit().remove();
    node = node.enter().append('g') // .call(drag(simulation))
    .merge(node);
    node.attr('class', function (d) {
      var cl = 'node ' + d.type + '-' + d.oid;

      if ('taxonomy' in d) {
        d.taxonomy.forEach(function (t) {
          cl += ' tax-' + t;
        });
      }

      if (d.type == 'taxonomy') {
        taxonomy[d.oid].direct.forEach(function (c) {
          cl += ' child-' + c;
        });
      }

      if ('ico' in d) {
        d.ico.forEach(function (t) {
          cl += ' ico-' + t;
        });
      }

      return cl.trim();
    });
    node.selectAll('path').remove();
    icons = node.append('path').style('stroke', 'none').attr('d', d3.symbol().size(function (d) {
      return d.r * 100;
    }).type(function (d) {
      if (d.type == 'taxonomy') {
        return d3.symbolCircle;
      } else {
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
      }
    })).style('fill', function (d) {
      if (d.type == 'taxonomy') {
        if (d.tax == 'sustainability_keywords') {
          return '#761B41';
        } else {
          return '#0D6B6F';
        }
      } else {
        return '#000';
      }
    }).attr('class', function (d) {
      if (d.type == 'taxonomy') {
        return 'node-' + d.tax;
      } else {
        if (individual && d.oid == id) {
          return 'node-individual';
        } else {
          return 'node-unknown';
        }
      }
    }).style('cursor', 'pointer').on('click', function (d) {
      if (d.type == 'taxonomy') {
        module.setSelection(d.oid);
        callback(selection);
      } else {
        window.location = "https://www.ama-project.org/".concat(d.type, "/").concat(d.slug);
      }
    }).on('mouseover', function (d) {
      d3.selectAll(".".concat(d.type, "-").concat(d.oid)).style('stroke-opacity', 1);
      module.updateTooltip(d);
    }).on('mouseout', function () {
      tooltip.style('display', 'none');

      if (selection.length > 0) {
        d3.selectAll('.connection').style('stroke-opacity', 0.05);
        module.highlightSelection();
      } else {
        d3.selectAll('.connection').style('stroke-opacity', 0.2);
      }
    });

    if (individual) {
      var icon = d3.select(".node.".concat(data[id].type, "-").concat(id));
      var d = icon.datum();
      var item = icon.append('g');
      item.append('circle').attr('r', 40).attr('fill', '#f9f9f9').attr('stroke', '#000').attr('stroke-width', '2px;');
      item.append('image').attr('width', 80).attr('height', 80).attr('x', -40).attr('y', -40).attr('xlink:href', jspath + '/assets/images/icon_' + d.type + 's@2x.png');
      var itembg = item.append('g');
      var itemtext = item.append('g').attr('transform', 'translate(0,43)').append('text').attr('style', 'fill:#fff; font-size:15px; font-style:italic;').text(d.title.length < 30 ? d.title : d.title.substr(0, 27) + '...').attr('text-anchor', 'middle');
      var itemTextSize = itemtext.node().getBoundingClientRect();
      itembg.append('rect').attr('x', itemTextSize.width / -2 - 8).attr('y', 27).attr('width', itemTextSize.width + 16).attr('height', 24).attr('fill', '#000');
    }
  };

  module.highlightSelection = function () {
    if (selection.length > 0) {
      var sel = '';
      nodeSel.each(function (d) {
        if (d.type != 'taxonomy') {
          if (sel != '') sel += ',';
          sel += ' .connection.' + d.type + '-' + d.oid;
        }
      });

      if (sel != '') {
        d3.selectAll(sel).style('stroke-opacity', 0.3);
      }
    }

    if (selection.length == 1) {
      d3.selectAll('.connection.taxonomy-' + selection[0]).style('stroke-opacity', 1);
    } else if (selection.length > 1) {// selection.forEach(s=>{
      //   let sel = `.connection.taxonomy-${s}`
      //   selection.forEach(ss=>{
      //     sel += `.ico-${ss}`
      //   })
      // })
    }
  };

  var tooltip = s.append('g').style('display', 'none').style('pointer-events', 'none');
  var tooltipBg = tooltip.append('rect').style('fill', '#fff').attr('height', 47).style('filter', 'url(#shadow)');
  var tooltipTri = tooltip.append('path').attr('d', 'M0,0L15,0L15,15,L0,0Z');
  var tooltipLine = tooltip.append('line').attr('y1', 0).attr('y2', 0).attr('x1', -20);
  var tooltipType = tooltip.append('text').style('fill', '#000').attr('dy', 17).style('font-size', '10px').style('font-family', 'Arial').style('text-transform', 'capitalize');
  var tooltipText = tooltip.append('text').style('fill', '#000').attr('dy', 35).style('font-size', '16px').style('font-family', 'Arial').style('font-weight', 'bold');

  module.updateTooltip = function (d) {
    var highColor = '#000';

    if (d.type == 'taxonomy') {
      if (d.tax == 'sustainability_keywords') {
        highColor = '#761B41';
      } else {
        highColor = '#0D6B6F';
      }
    }

    tooltipLine.attr('stroke', highColor);
    tooltipTri.attr('fill', highColor);
    tooltip.attr('transform', "translate(".concat(d.x + (d.x < 0 ? 20 : -20), ",").concat(d.y, ")"));
    var labelTrans = {
      'sustainability_keywords': 'Sustainablity',
      'inner_change_keywords': 'Inner Change',
      'journey_station': 'Journey Stations',
      'ama_role': 'AMA Roles',
      'perspective_keywords': 'Perspective'
    };
    tooltipType.text(d.type == 'taxonomy' ? labelTrans[d.tax] : d.type).attr('text-anchor', d.x < 0 ? 'start' : 'end').attr('dx', d.x < 0 ? '10' : '-10');
    tooltip.style('display', 'block'); // TODO: Nicer Multiline Tooltips
    // tooltipText.selectAll('tspan').remove()
    // let lRest = '', cText = '', ri = 0, words = d.title.split(' '), count = 0,
    //     cSpan = tooltipText.append('tspan').attr('dx',0).attr('dy','1.2em')
    // if(d.title.indexOf(' ')>=0){
    //   while(ri < words.length){
    //     lRest = cText
    //     cText += ' ' + words[ri]
    //     cSpan.text(cText.trim())
    //     let cbb = cSpan.node().getBoundingClientRect()
    //     if(cbb.width > 150 && count > 0){
    //       cSpan.text(lRest.trim())
    //       cSpan = tooltipText.append('tspan').attr('dx',0).attr('dy','1.2em')
    //       cText = ''
    //       count = -1
    //       ri--
    //     }
    //     count++
    //     ri++
    //   }
    // }else{
    //   cSpan.text((d.title.length<30)?d.title:d.title.substr(0,27)+'...')
    // }

    tooltipText.text(d.title.length < 30 ? d.title : d.title.substr(0, 27) + '...').attr('text-anchor', d.x < 0 ? 'start' : 'end').attr('dx', d.x < 0 ? '10' : '-10');
    var bb = tooltipText.node().getBoundingClientRect();
    var bb1 = tooltipType.node().getBoundingClientRect();
    if (bb1.width > bb.width) bb = bb1; // let dir = (d.x>0)?1:-1

    tooltipBg.attr('width', bb.width + 20).attr('transform', d.x < 0 ? '' : "translate(".concat(-(bb.width + 20), ",0)"));
    tooltipTri.attr('transform', "translate(".concat(d.x < 0 ? bb.width + 5 : -(bb.width + 5), ",0) scale(").concat(d.x < 0 ? 1 : -1, ",1)"));
    tooltipLine.attr('x1', d.x < 0 ? -20 : 20).attr('x2', d.x < 0 ? bb.width + 20 : -(bb.width + 20));
  };

  module.responsive = function () {
    svg.attr('width', width).attr('height', height);
    s.attr('transform', "translate(".concat(width / 2, ",").concat(height / 2, ")"));
  };

  module.responsive();
  window.addEventListener('resize', debounce(function () {
    module.updateSize();
    module.responsive();
  }));
  module.buildNetwork();
  module.updateSimulation(false);

  module.svg = function () {
    return svg;
  };

  return module;
};