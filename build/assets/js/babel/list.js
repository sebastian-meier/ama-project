function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/* exported list */
var list = function list(_container, _data, _taxonomy) {
  var module = {
    set selection(_selection) {
      selection = _selection;
      module.update();
    },

    set visType(_visType) {
      visType = _visType;
      module.update();
    },

    set sortKey(_sortKey) {
      sortKey = _sortKey;
    },

    set sortOrder(_sortOrder) {
      sortOrder = _sortOrder;
    },

    set sortType(_sortType) {
      sortType = _sortType;
    },

    get selection() {
      return selection;
    },

    get sortKey() {
      return sortKey;
    },

    get sortOrder() {
      return sortOrder;
    },

    get sortType() {
      return sortType;
    },

    get filter() {
      return filter;
    }

  };
  var container = _container;
  var taxonomy = _taxonomy;
  var data = _data;
  var selection = {
    taxonomy: [],
    type: []
  };
  var visType = 'network';
  var filterdata = [];
  var sortKey = 'title';
  var sortOrder = 'asc';
  var sortType = 'str'; // faster retrieval of child ids for taxonomies

  for (var tID in taxonomy) {
    taxonomy[tID]['children'] = [];

    if (taxonomy[tID].parent != 0) {
      addChild(taxonomy[tID].parent, tID);
    }
  }

  function addChild(parent, child) {
    if (!('children' in taxonomy[parent])) {
      taxonomy[parent]['children'] = [];
    }

    taxonomy[parent].children.push(child);

    if (taxonomy[parent].parent != 0) {
      addChild(taxonomy[parent].parent, child);
    }
  }

  for (var key in data) {
    filterdata.push(_objectSpread(_objectSpread({}, data[key]), {}, {
      id: key
    }));
  }

  var items = container.selectAll('a');

  module.update = function () {
    var selCount = 0;

    for (var _key in selection) {
      selCount += selection[_key].length;
    }

    var updatedata = filterdata.filter(function (d) {
      if (visType == 'map' && (d.g == 0 || d.g == '0' || !d.g)) return false;
      if (selCount == 0) return true;
      var allMatch = true;

      var _loop = function _loop(_key2) {
        selection[_key2].forEach(function (f) {
          if (visType == 'bipartite') {
            if (d[_key2].indexOf(f) >= 0 || d[_key2].indexOf('' + f) >= 0) {
              // all good
              if (d.id == 607) {// console.log('direct hit', d, key, f)
              }
            } else if (_key2 == 'taxonomy') {
              var matchMade = false;

              if (d.id == 607) {// console.log('check kids', d, key, f)
              }

              taxonomy[f].children.forEach(function (c) {
                if (d[_key2].indexOf(c) >= 0) {
                  matchMade = true;
                }
              });

              if (!matchMade) {
                allMatch = false;
              }
            } else {
              allMatch = false;
            }
          } else if (visType == 'matrix' && _key2 == 'taxonomy') {
            if (d['root_taxonomy'].indexOf('' + f) == -1) {
              allMatch = false;
            }
          } else {
            if (d[_key2].indexOf(f) == -1) {
              allMatch = false;
            }
          }
        });
      };

      for (var _key2 in selection) {
        _loop(_key2);
      }

      if (allMatch) return true;
      return false;
    }).sort(function (a, b) {
      if (sortOrder != 'asc') {
        var ta = a;
        a = b;
        b = ta;
      }

      if (sortType == 'str') {
        if (a[sortKey] < b[sortKey]) return -1;
        if (a[sortKey] > b[sortKey]) return 1;
        return 0;
      } else if (sortType == 'date') {
        return new Date(a[sortKey]) - new Date(b[sortKey]);
      } else {
        return a[sortKey] - b[sortKey];
      }
    });
    d3.select('#result-display').html(updatedata.length + '&nbsp;Results&nbsp;<span>&#8675;</span>');
    d3.select('#result-display').classed('updated', true);
    setTimeout(function () {
      d3.select('#result-display').classed('updated', false);
    }, 1000);
    items = items.data(updatedata);
    items.exit().remove();
    var tItems = items.enter().append('a');
    tItems.append('span').attr('class', 'skytitle');
    tItems.append('span').attr('class', 'title');
    tItems.append('span').attr('class', 'line');
    tItems.append('span').attr('class', 'subline');
    tItems.append('hr').attr('class', 'clear');
    items = tItems.merge(items);
    items.attr('data-type', function (d) {
      return d.type;
    }).attr('data-date', function (d) {
      return d.date;
    }).attr('data-author', function (d) {
      return d.author;
    }).attr('href', function (d) {
      return "https://www.ama-project.org/".concat(d.type, "/").concat(d.slug);
    }).attr('class', function (d, i) {
      var c = i + 1 - Math.floor((i + 1) / 3) * 3;
      var cl = "type-".concat(d.type, " connection list author-").concat(d.author, " b").concat(i % 2 ? 2 : 1, " c").concat(c == 0 ? 3 : c);
      cl += 'taxonomy' in d && d.taxonomy != null && d.taxonomy.length > 0 ? ' tax-' + d.taxonomy.join(' tax-') : '';
      cl += 'root_taxonomy' in d && d.root_taxonomy != null && d.root_taxonomy.length > 0 ? ' root-tax-' + d.taxonomy.join(' root-tax-') : ''; // if has geo_location

      cl += d.g == 1 ? ' has-geo' : '';
      return cl;
    });
    items.select('.skytitle').attr('data-type', function (d) {
      return d.type;
    }).text(function (d) {
      return d.type;
    });
    items.select('.title').text(function (d) {
      return "".concat(d.type == 'publication' || d.type == 'project' ? '“' : '').concat(d.title).concat(d.type == 'publication' || d.type == 'project' ? '”' : '');
    });
    items.select('.line').html(function (d) {
      var found = {
        'sustainability_keywords': {
          c: 0,
          l: 's'
        },
        'inner_change_keywords': {
          c: 0,
          l: 'ic'
        }
      };
      var fc = 0;

      if ('taxonomy' in d && d.taxonomy != null && d.taxonomy.length > 0) {
        d.taxonomy.forEach(function (t) {
          if (taxonomy[t].taxonomy in found) {
            found[taxonomy[t].taxonomy].c++;
            fc++;
          }
        });
      }

      if (fc == 0) {
        return '<span class="ratioline v-none"></span>';
      } else {
        var lines = 0;

        for (var _key3 in found) {
          if (found[_key3].c > 0) {
            lines++;
          }
        }

        if (lines == 2) {
          return '<span class="ratioline v-s-50"></span><span class="ratioline v-ic-50"></span>';
        } else {
          for (var _key4 in found) {
            if (found[_key4].c > 0) {
              return "<span class=\"ratioline v-".concat(found[_key4].l, "\"></span>");
            }
          }
        }
      }
    });
    items.selectAll('.subline').text(function (d) {
      return 'sub' in d ? d.sub : '-';
    });
  };

  return module;
};