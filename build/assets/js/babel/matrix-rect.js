/* exported matrixRect */

/* global d3, debounce, Shepherd */
var matrixRect = function matrixRect(_container, _nodes, _taxonomy, _callback) {
  var module = {
    set filter(_filter) {
      var changed = _filter != filter ? true : false;
      filter = _filter || 'all';
      if (changed) module.update();
    },

    get filter() {
      return filter;
    },

    set selection(_selection) {
      selection = _selection;
    },

    get selection() {
      return selection;
    },

    set dimensions(_dimensions) {
      dimensions = _dimensions;
      module.update();
    },

    get dimensions() {
      return dimensions;
    }

  };
  var nodes = _nodes;
  var taxonomy = _taxonomy;
  var callback = _callback;
  var container = _container;
  var width;
  var height;
  var margin = 20;
  var textWidth = 150;
  var textHeight = 150;
  var taxonomyKeys = ['objectives', 'layer',
  /* 'sustainability_keywords',*/
  'inner_change_keywords', 'journey_station', 'perspective_keywords'];
  var taxonomyLabels = ['Objectives', 'Layer',
  /* 'sustainability_keywords',*/
  'Inner Change', 'Journey Station', 'Perspective'];
  var taxonomies = {};
  var upperTax = {};
  var upperTaxKeys = {};
  taxonomyKeys.forEach(function (t) {
    taxonomies[t] = {};
    upperTax[t] = [];
    upperTaxKeys[t] = {};
    taxonomyKeys.forEach(function (tt) {
      if (tt != t) {
        taxonomies[t][tt] = {
          keys_1: {},
          keys_2: {},
          data: []
        };
      }
    });
  });

  for (var t in taxonomy) {
    if (taxonomy[t].parent == 0 && taxonomyKeys.indexOf(taxonomy[t].taxonomy) >= 0) {
      upperTax[taxonomy[t].taxonomy].push(taxonomy[t]);
    } else if (taxonomy[t].parent == 61) {
      upperTax['objectives'].push(taxonomy[t]);
    } else if (taxonomy[t].parent == 83) {
      upperTax['layer'].push(taxonomy[t]);
    }
  }

  var _loop = function _loop(_t) {
    upperTax[_t].sort(function (a, b) {
      return ('' + a.name).localeCompare('' + b.name);
    });

    upperTax[_t].forEach(function (tt, tti) {
      upperTaxKeys[_t][tt.id] = tti;
    });
  };

  for (var _t in upperTax) {
    _loop(_t);
  }

  var _loop2 = function _loop2(_t2) {
    var _loop4 = function _loop4(tt) {
      taxonomies[_t2][tt].keys_1 = upperTaxKeys[_t2];
      taxonomies[_t2][tt].keys_2 = upperTaxKeys[tt];

      upperTax[_t2].forEach(function (t1, t1i) {
        var row = {
          id: t1.id,
          name: t1.name,
          sort: t1i,
          cols: []
        };
        upperTax[tt].forEach(function (t2, t2i) {
          row.cols.push({
            id: t2.id,
            pid: t1.id,
            name: t2.name,
            sort: t2i,
            person: {
              c: 0,
              ids: []
            },
            institution: {
              c: 0,
              ids: []
            },
            project: {
              c: 0,
              ids: []
            },
            publication: {
              c: 0,
              ids: []
            },
            all: {
              c: 0,
              ids: []
            }
          });
        });

        taxonomies[_t2][tt].data.push(row);
      });
    };

    for (var tt in taxonomies[_t2]) {
      _loop4(tt);
    }
  };

  for (var _t2 in taxonomies) {
    _loop2(_t2);
  }

  var _loop3 = function _loop3(n) {
    nodes[n].root_taxonomy.forEach(function (t) {
      nodes[n].root_taxonomy.forEach(function (tt) {
        if (t != tt && (taxonomy[tt].parent == 61 || taxonomy[tt].parent == 83 || taxonomyKeys.indexOf(taxonomy[tt].taxonomy) >= 0) && (taxonomy[t].parent == 61 || taxonomy[t].parent == 83 || taxonomyKeys.indexOf(taxonomy[t].taxonomy) >= 0)) {
          var t1 = taxonomy[t].taxonomy;
          var t2 = taxonomy[tt].taxonomy;
          if (t == 61 || taxonomy[t].parent == 61) t1 = 'objectives';
          if (tt == 61 || taxonomy[tt].parent == 61) t2 = 'objectives';
          if (t == 83 || taxonomy[t].parent == 83) t1 = 'layer';
          if (tt == 83 || taxonomy[tt].parent == 83) t2 = 'layer';

          if (t1 != t2) {
            var tax = taxonomies[t1][t2];
            tax.data[tax.keys_1[t]].cols[tax.keys_2[tt]].all.c++;
            tax.data[tax.keys_1[t]].cols[tax.keys_2[tt]].all.ids.push(n);
            tax.data[tax.keys_1[t]].cols[tax.keys_2[tt]][nodes[n].type].c++;
            tax.data[tax.keys_1[t]].cols[tax.keys_2[tt]][nodes[n].type].ids.push(n);
          }
        }
      });
    });
  };

  for (var n in nodes) {
    _loop3(n);
  }

  module.updateSize = function () {
    var bb = container.node().getBoundingClientRect();
    width = bb.width;
    height = bb.height;
  };

  module.updateSize();
  var svg = container.append('svg').attr('width', width).attr('height', height).style('overflow', 'visible');
  var gui = container.append('div').attr('id', 'matrix-gui');
  var guiBody = gui.append('div');
  guiBody.append('div').text('Choose Dimensions');
  var guiSelect1 = guiBody.append('select').attr('id', 'gui-select-1').on('change', function () {
    dimensions[0] = d3.select(this).property('value');
    module.update();
  });
  var guiSelect2 = guiBody.append('select').attr('id', 'gui-select-2').on('change', function () {
    dimensions[1] = d3.select(this).property('value');
    module.update();
  });
  var guiOption1 = guiSelect1.selectAll('option').data(taxonomyKeys).enter().append('option').attr('value', function (d) {
    return d;
  }).text(function (d, di) {
    return taxonomyLabels[di];
  });
  var guiOption2 = guiSelect2.selectAll('option').data(taxonomyKeys).enter().append('option').attr('value', function (d) {
    return d;
  }).text(function (d, di) {
    return taxonomyLabels[di];
  });

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
    title: 'The Matrix-View',
    text: 'The visualisation shows the relationship between two taxonomies.',
    buttons: [{
      action: module.tour.next,
      text: 'Next &raquo;'
    }]
  }).on('before-show', module.scrollTop);
  module.tour.addStep('step-2', {
    title: 'The Matrix-View',
    text: 'Each rectangle represents the number of items connected to two corresponding categories. Click on a rectangle to explore the resulting items.',
    attachTo: '.click-box bottom',
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
  module.tour.addStep('step-4', {
    title: 'The Matrix-View',
    text: 'Use the dropdowns to switch between taxonomies.',
    attachTo: {
      element: '#matrix-gui',
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
    title: 'The Matrix-View',
    text: 'The items are displayed as a list below the visualisation.',
    attachTo: '.connection top',
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
  container.append('button').attr('id', 'master-help-button').text('?').on('click', function () {
    module.tour.start();
  });
  var s = svg.append('g').attr('transform', "translate(".concat(margin, " ").concat(margin, ")"));
  var dimensions = ['layer', 'inner_change_keywords'];
  var filter = 'all';
  var selection = false;
  var legend1 = svg.append('g').attr('transform', "translate(".concat(textWidth - 10, ",").concat(textHeight, ")")).style('opacity', 0.5);
  var legend2 = svg.append('g').attr('transform', "translate(".concat(textWidth, ",").concat(textHeight - 10, ")")).style('opacity', 0.5);
  legend1.append('text').html('&darr;');
  legend2.append('text').html('&rarr;');
  var legend1Label = legend1.append('text').attr('text-anchor', 'end').style('font-weight', 'bold').attr('transform', 'translate(-5,0)');
  var legend2Label = legend1.append('text').attr('text-anchor', 'start').style('font-weight', 'bold').attr('transform', 'translate(15,-20) rotate(-45)');

  module.updateDimensions = function () {
    guiOption1.attr('disabled', function (d) {
      return dimensions[1] == d ? 'disabled' : null;
    });
    guiOption2.attr('disabled', function (d) {
      return dimensions[0] == d ? 'disabled' : null;
    });
    guiSelect1.property('value', dimensions[0]);
    guiSelect2.property('value', dimensions[1]);
    legend1Label.text(taxonomyLabels[taxonomyKeys.indexOf(dimensions[0])]);
    legend2Label.text(taxonomyLabels[taxonomyKeys.indexOf(dimensions[1])]);
  };

  var rowTextContainer = s.append('g').attr('id', 'rowTexts').attr('transform', "translate(0 ".concat(textHeight, ")"));
  var colTextContainer = s.append('g').attr('id', 'colTexts').attr('transform', "translate(".concat(textWidth, " ").concat(textHeight, ")"));
  var boxes = s.append('g').attr('id', 'boxes').attr('transform', "translate(".concat(textWidth, " ").concat(textHeight, ")"));
  var scaleX = d3.scaleLinear();
  var scaleY = d3.scaleLinear();
  var animate = false;

  module.update = function () {
    // ----- Text Rows
    var rowTexts = rowTextContainer.selectAll('text').data(taxonomies[dimensions[0]][dimensions[1]].data);
    rowTexts.enter().append('text').attr('x', textWidth).attr('text-anchor', 'end').merge(rowTexts).html(function (d) {
      return d.name;
    }).attr('dx', -10).attr('class', function (d) {
      return "row-label row-label-".concat(d.id);
    });
    rowTexts.exit().remove(); // ----- Text Columns

    var colTexts = colTextContainer.selectAll('text').data(taxonomies[dimensions[0]][dimensions[1]].data[0].cols);
    colTexts.enter().append('text').merge(colTexts).html(function (d) {
      return d.name;
    }).attr('text-anchor', 'start').attr('dx', 10).attr('dy', -5).attr('class', function (d) {
      return "col-label col-label-".concat(d.id);
    });
    colTexts.exit().remove(); // ----- Line Rows

    var rowLines = rowTextContainer.selectAll('line').data(taxonomies[dimensions[0]][dimensions[1]].data);
    rowLines.enter().append('line').merge(rowLines).style('stroke', 'rgba(0,0,0,0.2)').attr('x1', textWidth);
    rowLines.exit().remove(); // ----- Line Columns

    var colLines = colTextContainer.selectAll('line').data(taxonomies[dimensions[0]][dimensions[1]].data[0].cols);
    colLines.enter().append('line').merge(colLines).style('stroke', 'rgba(0,0,0,0.2)');
    colLines.exit().remove(); // ----- Boxes

    boxes.selectAll('*').remove();
    var rowBoxes = boxes.selectAll('g').data(taxonomies[dimensions[0]][dimensions[1]].data).enter().append('g').attr('class', 'rowBoxes');
    var colBoxes = rowBoxes.selectAll('g').data(function (d) {
      return d.cols;
    }).enter().append('g').attr('class', 'colBoxes');
    scaleX.domain([0, d3.max(taxonomies[dimensions[0]][dimensions[1]].data, function (d) {
      return d3.max(d.cols, function (d) {
        return d[filter].c;
      });
    })]);
    scaleY.domain([0, d3.max(taxonomies[dimensions[0]][dimensions[1]].data, function (d) {
      return d3.max(d.cols, function (d) {
        return d[filter].c;
      });
    })]);
    colBoxes.append('rect').attr('class', function (d) {
      return "box box-c-".concat(d.id, " box-c-").concat(d.pid);
    }).style('fill', 'rgba(0,0,0,0.3)');
    colBoxes.append('text').attr('class', function (d) {
      return "text-box box-c-".concat(d.id, " box-c-").concat(d.pid);
    }).text(function (d) {
      return d[filter].c > 0 ? d[filter].c : '';
    }).attr('dy', 4).style('opacity', 0).attr('text-anchor', 'middle').style('font-weight', 'bold').style('fill', 'rgba(255,255,255,1)').style('font-size', '16px').style('text-shadow', '2px 2px 0 #555, 2px -2px 0 #555, -2px 2px 0 #555, -2px -2px 0 #555, 2px 0px 0 #555, 0px 2px 0 #555, -2px 0px 0 #555, 0px -2px 0 #555');
    colBoxes.append('rect').attr('class', function (d) {
      return "click-box box-cl-".concat(d.id, " box-cl-").concat(d.pid);
    }).style('fill', 'rgba(0,0,0,0)').style('cursor', 'pointer').on('click', function (d) {
      if (selection && selection.indexOf(d.id) >= 0 && selection.indexOf(d.pid) >= 0) {
        callback([]);
      } else {
        callback([d.id, d.pid]);
      }
    }).on('mouseover', function (d) {
      d3.selectAll(".box:not(.active)").style('fill', 'rgba(0,0,0,0.3)');
      d3.select(".box.box-c-".concat(d.id, ".box-c-").concat(d.pid)).style('fill', 'rgba(0,0,0,0.6)');
      d3.select(".text-box.box-c-".concat(d.id, ".box-c-").concat(d.pid)).style('opacity', 1);
      d3.selectAll(".row-label-".concat(d.id, ", .row-label-").concat(d.pid, ", .col-label-").concat(d.id, ", .col-label-").concat(d.pid)).style('font-weight', 'bold');
    }).on('mouseout', function () {
      d3.selectAll(".text-box").style('opacity', 0);
      d3.selectAll(".row-label, .col-label").style('font-weight', 'normal');
      d3.selectAll(".box:not(.active)").style('fill', 'rgba(0,0,0,0.3)');
    });
    animate = true;
    module.responsive();
  };

  module.responsive = function () {
    svg.attr('width', width).attr('height', height);
    var extraHeight = 150;
    gui.style('top', height - extraHeight + 'px');
    rowTextContainer.selectAll('text').attr('y', function (d, i) {
      return (height - margin * 2 - textHeight - extraHeight) / taxonomies[dimensions[0]][dimensions[1]].data.length * (i + 0.5);
    });
    colTextContainer.selectAll('text').attr('transform', function (d, i) {
      return "translate(".concat((width - margin * 2 - textWidth) / taxonomies[dimensions[0]][dimensions[1]].data[0].cols.length * (i + 0.5), " 0) rotate(-45)");
    });
    rowTextContainer.selectAll('line').attr('y1', function (d, i) {
      return (height - margin * 2 - textHeight - extraHeight) / taxonomies[dimensions[0]][dimensions[1]].data.length * (i + 1);
    }).attr('y2', function (d, i) {
      return (height - margin * 2 - textHeight - extraHeight) / taxonomies[dimensions[0]][dimensions[1]].data.length * (i + 1);
    }).attr('x2', width - margin * 2);
    colTextContainer.selectAll('line').attr('transform', function (d, i) {
      return "translate(".concat((width - margin * 2 - textWidth) / taxonomies[dimensions[0]][dimensions[1]].data[0].cols.length * (i + 1), " 0)");
    }).attr('y2', height - 2 * margin - extraHeight - textHeight);
    boxes.selectAll('.rowBoxes').attr('transform', function (d, i) {
      return "translate(0 ".concat((height - margin * 2 - textHeight - extraHeight) / taxonomies[dimensions[0]][dimensions[1]].data.length * i, ")");
    });
    boxes.selectAll('.colBoxes').attr('transform', function (d) {
      return "translate(".concat((width - margin * 2 - textWidth) / taxonomies[dimensions[0]][dimensions[1]].data[0].cols.length * d.sort, " 0)");
    });
    var boxWidth = (width - margin * 2 - textWidth) / taxonomies[dimensions[0]][dimensions[1]].data[0].cols.length;
    var boxHeight = (height - margin * 2 - textHeight - extraHeight) / taxonomies[dimensions[0]][dimensions[1]].data.length;
    scaleX.range([0, boxWidth]);
    scaleY.range([0, boxHeight]);
    boxes.selectAll('rect.box').attr('width', 0).attr('height', 0).attr('x', boxWidth / 2).attr('y', boxHeight / 2).transition().delay(function (d) {
      if (!animate) return 0;
      return d3.select(this.parentNode).datum().sort * 100 + d.sort * 100;
    }).duration(animate ? 500 : 0).attr('width', function (d) {
      return scaleX(d[filter].c);
    }).attr('height', function (d) {
      return scaleY(d[filter].c);
    }).attr('x', function (d) {
      return (boxWidth - scaleX(d[filter].c)) / 2;
    }).attr('y', function (d) {
      return (boxHeight - scaleY(d[filter].c)) / 2;
    });
    boxes.selectAll('rect.click-box').attr('width', boxWidth).attr('height', boxHeight).attr('x', 0).attr('y', 0);
    boxes.selectAll('text').attr('x', boxWidth / 2).attr('y', boxHeight / 2);
    module.updateDimensions();
    animate = false;
  };

  module.update();

  module.updateSelection = function () {
    d3.selectAll('.box').classed('active', false);

    if (selection && selection.length == 2) {
      d3.select(".box.box-c-".concat(selection[0], ".box-c-").concat(selection[1])).classed('active', true).style('fill', 'rgba(0,0,0,0.8)');
    }

    d3.selectAll(".box:not(.active)").style('fill', 'rgba(0,0,0,0.3)');
  };

  window.addEventListener('resize', debounce(function () {
    module.updateSize();
    module.responsive();
  }));

  module.svg = function () {
    return svg;
  };

  return module;
};