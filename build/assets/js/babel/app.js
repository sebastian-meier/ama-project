var _this = this;

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return; var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/* exported icons,networkHome */

/* globals matrixCircle,Promise,d3,iconBuilder,debounce,state,dispatcher,createURL,jspath,jsppath,taxonomy:true,networkHome,siteFile,list,retrieveURL,listFunc:true,nodes:true */
var icons = iconBuilder();
/* --------- NETWORK DEMO ---------*/

function updateFilterSide() {
  if (window.pageYOffset > height / 2) {
    d3.selectAll('#filter-nav .dropdown').classed('top', false);
  } else {
    d3.selectAll('#filter-nav .dropdown').classed('top', true);
  }
}

function updateResize() {
  width = window.innerWidth;
  height = window.innerHeight;

  if (d3.select('#filters').size() >= 1) {
    d3.selectAll('#content').style('top', height - 110 + 'px');
  } else {
    d3.selectAll('#content').style('top', height - 210 + 'px');
  } // if (svg) svg.attr('width', width).attr('height', height);

}

if (d3.select('#svg-container').size() >= 1) {
  var _width = window.innerWidth;
  var _height = window.innerHeight;
  d3.select('#svg-container').attr('width', _width).attr('height', _height);

  if (d3.select('#filters').size() >= 1) {
    d3.selectAll('#content').style('top', _height - 110 + 'px');
  } else {
    d3.selectAll('#content').style('top', _height - 210 + 'px');
  }

  window.scrollTo(0, Math.round(_height / 2));
  document.body.scrollTop = Math.round(_height / 2);
  d3.select('#explore-message').style('top', Math.round(_height / 4));
  Promise.all([jspath + '/cache/' + jsppath + '' + siteFile, jspath + '/cache/' + jsppath + 'taxonomy.json'].map(function (d) {
    return d3.json(d, {
      headers: {
        'Authorization': 'Basic ' + btoa('iass:amama2017')
      }
    });
  })).then(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        _nodes = _ref2[0],
        _taxonomy = _ref2[1];

    nodes = _nodes;
    taxonomy = _taxonomy;
    var listCon = d3.select('#explore-con');
    listCon.selectAll('*').remove();
    updateResize();
    listFunc = list(listCon, nodes, taxonomy);
    listFunc.update();
    retrieveURL();
  })["catch"](function (e) {
    throw e;
  });
} // Show static image alternative


updateResize();

if (d3.select('#svg-container').size() >= 1) {
  updateFilterSide();
  d3.select(window).on('scroll', debounce(function () {
    updateFilterSide();
  }, 200));
  updateResize();
  d3.select(window).on('resize', debounce(function () {
    updateResize();
  }, 200));
}

if (d3.select('#matrix-circle-container').size() >= 1) {
  Promise.all([jspath + '/cache/' + jsppath + 'iass.json', jspath + '/cache/' + jsppath + 'taxonomy.json'].map(function (d) {
    return d3.json(d, {
      headers: {
        'Authorization': 'Basic ' + btoa('iass:amama2017')
      }
    });
  })).then(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2),
        _nodes = _ref4[0],
        _taxonomy = _ref4[1];

    var listCon = d3.select('#matrix-circle-list');
    listCon.selectAll('*').remove();

    var tNodes = _nodes.filter(function (n) {
      return n.id != 15 ? true : false;
    });

    listFunc = list(listCon, tNodes, _taxonomy);
    listFunc.update();
    matrixCircle(d3.select('#matrix-circle-container'), listFunc, tNodes, _taxonomy);
  })["catch"](function (e) {
    throw e;
  });
} // Content-type switch buttons


['person', 'institution', 'project', 'publication'].forEach(function (type) {
  d3.select("#type-nav .".concat(type, " a")).attr('href', null).on('click', function (d, i, _nodes) {
    if (!d3.select(_nodes[i]).classed('disabled')) {
      if (state.type[0] == type) {
        state.type = [];
      } else {
        state.type[0] = type;
      }

      state.taxonomy = [];
      dispatcher.call('action', _this, createURL());
    }
  });
}); // Vis-Type Switch Buttons

['map', 'network', 'bipartite', 'flow', 'radial', 'matrix'].forEach(function (type) {
  d3.select("#vis-nav .".concat(type)).attr('href', null).on('click', function () {
    state.vis[0] = type;
    state.taxonomy = [];
    dispatcher.call('action', _this, createURL());
  });
});

if (d3.select('#home-svg').size() >= 1) {
  Promise.all([jspath + '/cache/' + jsppath + '' + siteFile, jspath + '/cache/' + jsppath + 'taxonomy.json'].map(function (d) {
    return d3.json(d, {
      headers: {
        'Authorization': 'Basic ' + btoa('iass:amama2017')
      }
    });
  })).then(function (_ref5) {
    var _ref6 = _slicedToArray(_ref5, 2),
        _nodes = _ref6[0],
        _taxonomy = _ref6[1];

    var networkHomeObj = networkHome(d3.select('#home-svg'), _nodes, _taxonomy);
    networkHomeObj.init();
  })["catch"](function (e) {
    throw e;
  });
}

if (d3.select('#search-results.has-results').size() >= 1) {
  var filterTypes = [{
    id: 0,
    type: 'person'
  }, {
    id: 1,
    type: 'institution'
  }, {
    id: 2,
    type: 'project'
  }, {
    id: 3,
    type: 'publication'
  }];
  var filterLabels = ['Persons', 'Institutions', 'Projects', 'Publications'];
  var filterIcons = ['M0,-2.942830956382712L1.6990442448471226,0L0,2.942830956382712L-1.6990442448471226,0Z', 'M-2.121320343559643,-0.7071067811865476L-0.7071067811865476,-0.7071067811865476L-0.7071067811865476,-2.121320343559643L0.7071067811865476,-2.121320343559643L0.7071067811865476,-0.7071067811865476L2.121320343559643,-0.7071067811865476L2.121320343559643,0.7071067811865476L0.7071067811865476,0.7071067811865476L0.7071067811865476,2.121320343559643L-0.7071067811865476,2.121320343559643L-0.7071067811865476,0.7071067811865476L-2.121320343559643,0.7071067811865476Z', 'M-1.5811388300841898,-1.5811388300841898h3.1622776601683795v3.1622776601683795h-3.1622776601683795Z', 'M0,-2.7745276335252114L2.402811414134754,1.3872638167626057L-2.402811414134754,1.3872638167626057Z'];
  var foundFilters = [];
  filterTypes.forEach(function (f) {
    foundFilters.push(d3.select(".connection.c-type-".concat(f.type)).size() >= 1 ? true : false);
  });
  var filterContainer = d3.select('header.page-header').append('div').attr('id', 'filters');
  filterContainer.append('span').text('Filter your search results:');
  filterContainer.append('ul').attr('id', 'type-nav').selectAll('li').data(filterTypes.filter(function (d, i) {
    return foundFilters[i];
  })).enter().append('li').attr('class', function (d) {
    return d.type;
  }).append('a').html(function (d) {
    return "<svg width=\"16\" height=\"16\"><g transform=\"translate(8,8) scale(2)\"><path d=\"".concat(filterIcons[d.id], "\" style=\"fill: rgb(0, 0, 0); stroke: transparent;\"></path></g></svg><br>").concat(filterLabels[d.id]);
  }).on('click', function (d) {
    if (d3.select(this).classed('active') == true) {
      d3.select(this).classed('active', false);
      d3.selectAll('.connection').style('display', 'block').classed('on-show', true);
    } else {
      d3.selectAll('#type-nav a').classed('active', false);
      d3.select(this).classed('active', true);
      d3.selectAll('.connection').style('display', 'none').classed('on-show', false);
      d3.selectAll('.connection.c-type-' + d.type).style('display', 'block').classed('on-show', true);
    }

    d3.selectAll('.connection.on-show').classed('b1', function (d, i) {
      return i % 2 ? false : true;
    }).classed('b2', function (d, i) {
      return i % 2 ? true : false;
    }).classed('c1', function (d, i) {
      var c = i + 1 - Math.floor((i + 1) / 3) * 3;

      if (c == 1) {
        return true;
      } else {
        return false;
      }
    }).classed('c2', function (d, i) {
      var c = i + 1 - Math.floor((i + 1) / 3) * 3;

      if (c == 2) {
        return true;
      } else {
        return false;
      }
    }).classed('c3', function (d, i) {
      var c = i + 1 - Math.floor((i + 1) / 3) * 3;

      if (c == 0) {
        return true;
      } else {
        return false;
      }
    });
  });
}