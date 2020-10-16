function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/* exported debounce, iconBuilder, createURL, retrieveURL, updateFilter, map, matrix, _hibipartVis, network_overall_geographic */

/* global Promise, matrixRect, fullFile, rings, matrix:true, flow, d3, nodes, siteID, network:true, taxonomy, networkOverallThematic, siteType, mapCluster, jspath, jsppath, map:true, hibipart, hibipartVis, listFunc, _hibipart:true, _hibipartVis:true */

/* --- Wordpress Responsive Menu ---*/
d3.select('#site-navigation button').on('click', function () {
  var cState = d3.select('#site-navigation').classed('open');

  if (!cState) {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  }

  d3.select('#site-navigation').classed('open', !cState);
});
/* --- Default Debouncer ---*/

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var context = this;

    var later = function later() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}
/* --- History / State > System ---*/


var state = {
  taxonomy: [],
  type: [],
  vis: ['network']
};
var cVis = false;
var biPartiteType = false;

function createURL() {
  var keys = [];

  for (var key in state) {
    keys.push(key + '=' + state[key].join(','));
  }

  return '?' + keys.join('&');
}

function retrieveURL() {
  state = {
    taxonomy: [],
    type: [],
    vis: ['network']
  };
  var comps = window.location.href.split('?');

  if (comps.length > 1) {
    var cs = comps[1].split('&');
    cs.forEach(function (c) {
      var el = c.split('#')[0].split('=');

      if (el[1] == '') {
        state[el[0]] = [];
      } else {
        state[el[0]] = el[1].split(',');
      }
    });
  }

  updateUI();
}

window.addEventListener('popstate', function () {
  retrieveURL();
});
var dispatcher = d3.history('action');
dispatcher.on('action', function () {
  updateUI();
});
/* Filter Helper Function */

var filter = {
  taxonomy: [],
  type: []
};

function updateFilter() {
  var changed = false;

  var _loop = function _loop(key) {
    state[key].forEach(function (s) {
      if (filter[key].indexOf(s) == -1) {
        changed = true;
        filter[key].push(s);
      }
    });
  };

  for (var key in state) {
    _loop(key);
  }

  if (changed) {
    dispatcher.call('action', this, createURL());
  }
}
/* updateUI > responsible for applying the current state to the UI */


function updateUI() {
  var _this = this;

  if (!('vis' in state)) state['vis'] = ['network'];

  if ((window.innerWidth > 0 ? window.innerWidth : screen.width) < 768) {
    // Only static image
    if (siteType && siteType == 'detail') {
      d3.select('#svg-container').style('background-image', "url(".concat(jspath, "/assets/images/mobile_snap_detail_").concat(state.vis[0], "@2x.jpg)"));
    } else {
      d3.select('#svg-container').style('background-image', "url(".concat(jspath, "/assets/images/mobile_snap_explore_").concat(state.vis[0], "@2x.jpg)"));
    }
  } else {
    d3.select('#svg-container').style('background-image', "none"); // change vis if necessary

    if (cVis != state.vis[0]) {
      cVis = state.vis[0]; // remove current vis

      d3.selectAll('#svg-container *').remove(); // clean classes

      d3.selectAll('#svg-container').classed('network', false).classed('map', false).classed('matrix', false).classed('bipartite', false).classed(state.vis[0], true); // add new vis

      switch (state.vis[0]) {
        case 'network':
          // NETWORK DONE!
          updateTypeFilter(true);
          updateTaxFilter(true);
          var taxLimit = false;

          for (var key in nodes) {
            if (key == siteID) taxLimit = nodes[key].taxonomy;
          }

          network = networkOverallThematic(d3.select('#svg-container'), nodes, taxonomy, siteType == 'detail' ? siteID : false, function (selection) {
            state.taxonomy = selection;
            dispatcher.call('action', _this, createURL());
          }, siteType == 'detail' ? taxLimit : false, siteType == 'detail' ? true : false);
          break;

        case 'map':
          updateTypeFilter(false);
          updateTaxFilter(true);
          Promise.all([jspath + '/cache/' + jsppath + 'geo_network_nodes.json', jspath + '/cache/' + jsppath + 'taxonomy.json'].map(function (d) {
            return d3.json(d, {
              headers: {
                'Authorization': 'Basic ' + btoa('iass:amama2017')
              }
            });
          })).then(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2),
                geoNodes = _ref2[0],
                _taxonomy = _ref2[1];

            map = mapCluster(d3.select('#svg-container'), geoNodes, _taxonomy, function (selection) {
              console.log(state.taxonomy, selection);

              if (state.taxonomy[0] == selection[0]) {
                state.taxonomy = [];
              } else {
                state.taxonomy = selection;
              }

              dispatcher.call('action', _this, createURL());
            });
            updateUI();
          })["catch"](function (e) {
            throw e;
          });
          break;

        case 'matrix':
          updateTypeFilter(true);
          updateTaxFilter(false);
          Promise.all([jspath + '/cache/' + jsppath + '' + fullFile, jspath + '/cache/' + jsppath + 'taxonomy.json'].map(function (d) {
            return d3.json(d, {
              headers: {
                'Authorization': 'Basic ' + btoa('iass:amama2017')
              }
            });
          })).then(function (_ref3) {
            var _ref4 = _slicedToArray(_ref3, 2),
                _nodes = _ref4[0],
                _taxonomy = _ref4[1];

            matrix = matrixRect(d3.select('#svg-container'), _nodes, _taxonomy, function (selection) {
              state.taxonomy = selection;
              dispatcher.call('action', _this, createURL());
            });
            updateUI();
          })["catch"](function (e) {
            throw e;
          });
          break;

        case 'radial':
          updateTypeFilter(false);
          updateTaxFilter(false);
          Promise.all([jspath + '/cache/' + fullFile, jspath + '/cache/taxonomy.json'].map(function (d) {
            return d3.json(d, {
              headers: {
                'Authorization': 'Basic ' + btoa('iass:amama2017')
              }
            });
          })).then(function (_ref5) {
            var _ref6 = _slicedToArray(_ref5, 2),
                _nodes = _ref6[0],
                _taxonomy = _ref6[1];

            rings(d3.select('#svg-container'), _nodes, _taxonomy, siteID);
          })["catch"](function (e) {
            throw e;
          });
          break;

        case 'flow':
          updateTypeFilter(false);
          updateTaxFilter(false);
          Promise.all([jspath + '/cache/' + jsppath + '' + fullFile, jspath + '/cache/' + jsppath + 'taxonomy.json'].map(function (d) {
            return d3.json(d, {
              headers: {
                'Authorization': 'Basic ' + btoa('iass:amama2017')
              }
            });
          })).then(function (_ref7) {
            var _ref8 = _slicedToArray(_ref7, 2),
                _nodes = _ref8[0],
                _taxonomy = _ref8[1];

            flow(d3.select('#svg-container'), _nodes, _taxonomy);
          })["catch"](function (e) {
            throw e;
          });
          break;

        case 'bipartite':
          // BIPARTITE DONE!
          updateTypeFilter(true);
          updateTaxFilter(false);

          if (state.type.length == 0) {
            biPartiteType = false;
            _hibipart = false;
            Promise.all([jspath + '/cache/' + jsppath + 'cat_nodes_clean_min.csv', jspath + '/cache/' + jsppath + 'cat_edges_all_grouped_min.csv'].map(function (d) {
              return d3.csv(d, {
                headers: {
                  'Authorization': 'Basic ' + btoa('iass:amama2017')
                }
              });
            })).then(function (_ref9) {
              var _ref10 = _slicedToArray(_ref9, 2),
                  nodes = _ref10[0],
                  edges = _ref10[1];

              setupBiPartite(nodes, edges);
            })["catch"](function (e) {
              throw e;
            });
          } else {
            biPartiteType = state.type[0];
            _hibipart = false;
            Promise.all([jspath + '/cache/' + jsppath + 'cat_nodes_clean_min-' + state.type[0] + '.csv', jspath + '/cache/' + jsppath + 'cat_edges_all_grouped_min-' + state.type[0] + '.csv'].map(function (d) {
              return d3.csv(d, {
                headers: {
                  'Authorization': 'Basic ' + btoa('iass:amama2017')
                }
              });
            })).then(function (_ref11) {
              var _ref12 = _slicedToArray(_ref11, 2),
                  nodes = _ref12[0],
                  edges = _ref12[1];

              setupBiPartite(nodes, edges);
            })["catch"](function (e) {
              throw e;
            });
          }

          break;
      }
    }
  }

  d3.selectAll('#vis-nav a').classed('active', false);
  d3.select("#vis-nav .".concat(state.vis[0], " a")).classed('active', true);
  var cSel = listFunc.selection;
  d3.selectAll("#type-nav a").classed('active', false);

  if ((window.innerWidth > 0 ? window.innerWidth : screen.width) < 768) {
    cSel.type = state.type.length == 0 ? [] : [state.type[0]];
  } else {
    if (state.type.length == 0) {
      if (state.vis[0] == 'network') {
        if (network.filterType.length > 0) {
          network.resetSelection();
          network.resetFilter(true);
        }
      } else if (state.vis[0] == 'matrix' && matrix) {
        matrix.filter = 'all';
      }

      if (state.vis[0] == 'bipartite') {
        if (biPartiteType != false) {
          biPartiteType = false;
          _hibipart = false;
          d3.selectAll('#svg-container *').remove();
          Promise.all([jspath + '/cache/' + jsppath + 'cat_nodes_clean_min.csv', jspath + '/cache/' + jsppath + 'cat_edges_all_grouped_min.csv'].map(function (d) {
            return d3.csv(d, {
              headers: {
                'Authorization': 'Basic ' + btoa('iass:amama2017')
              }
            });
          })).then(function (_ref13) {
            var _ref14 = _slicedToArray(_ref13, 2),
                nodes = _ref14[0],
                edges = _ref14[1];

            setupBiPartite(nodes, edges);
          })["catch"](function (e) {
            throw e;
          });
        }
      }

      cSel.type = [];
    } else {
      if (state.vis[0] == 'network') {
        if (network.filterType[0] != state.type[0]) {
          network.resetSelection();
          network.resetFilter(false);
          network.applyFilter('type', state.type[0], true);
        }
      } else if (state.vis[0] == 'matrix' && matrix) {
        matrix.filter = state.type[0];
      }

      if (state.vis[0] == 'bipartite') {
        if (biPartiteType != state.type[0]) {
          biPartiteType = state.type[0];
          _hibipart = false;
          d3.selectAll('#svg-container *').remove();
          Promise.all([jspath + '/cache/' + jsppath + 'cat_nodes_clean_min-' + state.type[0] + '.csv', jspath + '/cache/' + jsppath + 'cat_edges_all_grouped_min-' + state.type[0] + '.csv'].map(function (d) {
            return d3.csv(d, {
              headers: {
                'Authorization': 'Basic ' + btoa('iass:amama2017')
              }
            });
          })).then(function (_ref15) {
            var _ref16 = _slicedToArray(_ref15, 2),
                nodes = _ref16[0],
                edges = _ref16[1];

            setupBiPartite(nodes, edges);
          })["catch"](function (e) {
            throw e;
          });
        }
      }

      cSel.type = [state.type[0]];
    }
  }

  if ((window.innerWidth > 0 ? window.innerWidth : screen.width) < 768) {
    cSel.taxonomy = state.taxonomy.length == 0 ? [] : state.taxonomy;
  } else {
    if (state.taxonomy.length == 0) {
      if (state.vis[0] == 'network') {
        network.resetSelection();
        network.updateSelection();
      } else if (state.vis[0] == 'matrix' && matrix) {
        matrix.selection = [];
        matrix.updateSelection();
      } else if (state.vis[0] == 'map' && map) {
        map.selection = [];
        map.updateSelection();
      }

      if (state.vis[0] == 'bipartite' && _hibipart) {
        if (_hibipart.getArcFilters().length >= 0) {
          _hibipart.reset();

          _hibipartVis.linkModules();

          _hibipartVis.update();
        }
      }

      cSel.taxonomy = [];
    } else {
      if (state.vis[0] == 'network') {
        network.selection = state.taxonomy;
        network.updateSelection();
      } else if (state.vis[0] == 'matrix' && matrix) {
        matrix.selection = state.taxonomy;
        matrix.updateSelection();
      } else if (state.vis[0] == 'map' && map) {
        map.selection = state.taxonomy;
        map.updateSelection();
      }

      if (state.vis[0] == 'bipartite' && _hibipart) {
        _hibipart.reset();

        state.taxonomy.forEach(function (tax) {
          _hibipart.filter(+tax);
        });

        _hibipartVis.linkModules();

        _hibipartVis.update();
      }

      cSel.taxonomy = state.taxonomy;
    }
  }

  if (state.type.length > 0) d3.select("#type-nav .".concat(state.type[0], " a")).classed('active', true);
  listFunc.selection = cSel;
  listFunc.visType = state.vis[0];
}

function updateTypeFilter(disabled) {
  d3.selectAll('#type-nav a').classed('disabled', !disabled);
}

function updateTaxFilter(disabled) {
  d3.selectAll('#filter-nav .filter-block').classed('disabled', !disabled);
}

function setupBiPartite(nodes, edges) {
  var _this2 = this;

  _hibipart = hibipart();

  _hibipart.idAccessor(function (d) {
    return d.id;
  }).parentAccessor(function (d) {
    return d.parent;
  }).nameAccessor(function (d) {
    return d.name;
  }).sideAccessor(function (d) {
    return d.systematic;
  });

  nodes = nodes.filter(function (d) {
    if (d.systematic != 'c_s' && d.systematic != 'c_ic') {
      return false;
    } else {
      return true;
    }
  });
  nodes.forEach(function (n) {
    for (var key in n) {
      if (key != 'name' && key != 'systematic') {
        n[key] = +n[key];
      }
    }
  });
  edges.forEach(function (e) {
    for (var key in e) {
      e[key] = +e[key];
    }
  });

  _hibipart.init(nodes, edges);

  _hibipartVis = hibipartVis(d3.select('#svg-container'), function (id, addRemove) {
    if (!addRemove && (state.taxonomy.indexOf(id) >= 0 || state.taxonomy.indexOf('' + id) >= 0)) {
      state.taxonomy.splice(state.taxonomy.indexOf(parseInt(id)), 1);
    } else if (addRemove) {
      state.taxonomy.push(id);
    }

    dispatcher.call('action', _this2, createURL());
  });

  _hibipartVis.bipart(_hibipart).sides({
    c_ic: {
      start: Math.PI / 180 * 225,
      end: Math.PI / 180 * 315
    },
    c_s: {
      start: Math.PI / 180 * 45,
      end: Math.PI / 180 * 135
    }
  }).render();

  updateUI();
}
/* --- Toggle for Tag-List ---*/


var contentCatsMode = 1;

if (d3.select('.single .content-cats').size() >= 1 && d3.selectAll('.single .content-cats .term').size() > 4) {
  contentCatsMode = 1;
  toggleContentCats();
  d3.select('.single .content-cats').append('div').attr('class', 'content-cats-toggle-container').append('a').attr('class', 'content-cats-toggle').html('&#10010; Show all ' + d3.selectAll('.single .content-cats .term').size() + ' terms').on('click', function () {
    toggleContentCats();
  });
}

function toggleContentCats() {
  if (contentCatsMode == 0) {
    contentCatsMode = 1;
    d3.selectAll('.single .content-cats .term').style('display', 'inline-block');
    d3.select('.content-cats-toggle').html('&#x002D; Show less terms');
  } else {
    contentCatsMode = 0;
    d3.selectAll('.single .content-cats .term').style('display', function (d, i) {
      if (i < 4) {
        return 'inline-block';
      } else {
        return 'none';
      }
    });
    d3.select('.content-cats-toggle').html('&#10010; Show all ' + d3.selectAll('.single .content-cats .term').size() + ' terms');
  }
}
/* --- Create Icons ---*/


var iconBuilder = function iconBuilder() {
  var arc = d3.arc().innerRadius(38).outerRadius(38);
  var gap = 7;
  var colors = {
    'ic': '#AD245C',
    's': '#0A9EA3',
    'none': '#000000'
  };
  var icons = d3.selectAll('.icon').datum(function () {
    var el = d3.select(this);
    var s = +el.attr('data-s');
    var ic = +el.attr('data-ic');
    return {
      icon: d3.select(this).attr('data-icon'),
      s: s,
      ic: ic,
      none: ic == 0 && s == 0 ? 1 : 0,
      full: s + ic,
      els: ic == 0 || s == 0 ? 1 : 2
    };
  }).append('svg').attr('width', 80).attr('height', 80);
  icons.append('image').attr('xlink:href', function (d) {
    return d.icon;
  }).attr('width', 80).attr('height', 80);
  var igs = icons.append('g').attr('transform', 'translate(40,40)');
  ['s', 'ic', 'none'].forEach(function (type) {
    igs.append('path').style('stroke', colors[type]).attr('title', type).style('stroke-width', 2.5).style('stroke-linecap', 'round').style('stroke-linejoin', 'round').attr('d', function (d) {
      var start;
      var end;

      if (d[type] != 0) {
        if (d.els == 2) {
          if (type == 's') {
            start = Math.PI / 4;
            end = Math.PI / 180 * ((360 - 2 * gap) * d[type] / d.full) + Math.PI / 4;
          } else {
            start = Math.PI / 180 * ((360 - 2 * gap) * d['s'] / d.full) + Math.PI / 4 + Math.PI / 180 * gap;
            end = Math.PI * 2.25 - Math.PI / 180 * gap;
          }
        } else {
          start = 0;
          end = Math.PI * 2;
        }

        return arc({
          startAngle: start,
          endAngle: end
        });
      } else {
        return '';
      }
    });
  });
};