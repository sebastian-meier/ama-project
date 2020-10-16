function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

/* exported mapCluster */

/* global mapboxgl,d3,debounce */
// https://www.mapbox.com/mapbox-gl-js/example/add-image/
var mapCluster = function mapCluster(_container, _nodes, _taxonomy, _callback) {
  var module = {
    set selection(_selection) {
      selection = _selection;
    },

    get selection() {
      return selection;
    }

  };
  var taxonomy = _taxonomy;
  var callback = _callback;
  var nodes = _nodes;
  var selection = [];
  var popup;
  var mapLoaded = false;
  var locations = [];
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
    'journey_tation': {},
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

  var firstUpper = function firstUpper(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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

  var getDepth = function getDepth(id) {
    if (taxonomy[id].parent == 0) {
      return 0;
    } else {
      return 1 + getDepth(taxonomy[id].parent);
    }
  };

  nodes.forEach(function (n) {
    n[7].forEach(function (t) {
      if (t in taxonomy && taxonomy[t].taxonomy in taxSelectKeys && !(t in taxSelectKeys[taxonomy[t].taxonomy])) {
        taxSelects[taxonomy[t].taxonomy].push({
          name: firstUpper(taxonomy[t].name),
          value: t,
          parent: taxonomy[t].parent,
          has: true,
          oHas: true
        });
        taxSelectKeys[taxonomy[t].taxonomy][t] = taxSelects[taxonomy[t].taxonomy].length - 1;
      }
    });
  });

  var _loop = function _loop(skey) {
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

    var _loop2 = function _loop2(i) {
      taxSelects[skey].forEach(function (s) {
        // if(tempList[i].parent == 0) depth = 0
        if (s.parent == tempList[i].value) {
          s.name = new Array(getDepth(s.value) + 1).join('-') + ' ' + s.name;
          tempList.splice(i + 1, 0, s);
        }
      });
    };

    for (var i = 0; i < tempList.length; i++) {
      _loop2(i);
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
      callback([d.value]);
    });
  };

  for (var skey in taxSelects) {
    _loop(skey);
  }

  module.updateSize = function () {};

  module.updateSize();
  var map = new mapboxgl.Map({
    container: 'svg-container',
    style: {
      'version': 8,
      'glyphs': 'https://www.ama-project.org/wp-content/themes/ama/assets/map_fonts/{fontstack}/{range}.pbf',
      'sources': {
        'simple-tiles': {
          'type': 'raster',
          'tiles': ['https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png'],
          'tileSize': 256
        }
      },
      'layers': [{
        'id': 'simple-tiles',
        'type': 'raster',
        'source': 'simple-tiles',
        'minzoom': 0,
        'maxzoom': 22,
        'paint': {
          'raster-opacity': 0.6
        }
      }]
    },
    center: [0, 0],
    zoom: 1
  });
  /*
  The custom control is simply to add a padding to the upper right before the zoom controls appear
  */

  module.scrollTop = function () {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  };

  module.tour = new Shepherd.Tour({
    defaultStepOptions: {
      showCancelLink: true
      /* ,
      scrollTo: true*/

    }
  });
  module.tour.on('show', module.scrollTop);
  module.tour.addStep('step-1', {
    title: 'The Map-View',
    text: 'Explore items that have a location attached. The large circle represent clusters of locations. Click on a cluster to zoom in and see more details.',
    buttons: [{
      action: module.tour.next,
      text: 'Next &raquo;'
    }]
  }).on('before-show', module.scrollTop);
  module.tour.addStep('step-2', {
    title: 'The Map-View',
    text: 'Use the zoom buttons for navigation.',
    attachTo: '.mapboxgl-ctrl-top-right left',
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
    title: 'The Map-View',
    text: 'Use the taxonomies to filter the locations.',
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
    title: 'The Map-View',
    text: 'Number of locations shown on the map will update, as you use the filters.',
    attachTo: '#result-display top',
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
    title: 'The Map-View',
    text: 'The locations shown on the map are also displayed as a list.',
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

  var MyCustomControl = /*#__PURE__*/function () {
    function MyCustomControl() {
      _classCallCheck(this, MyCustomControl);
    }

    _createClass(MyCustomControl, [{
      key: "onAdd",
      value: function onAdd(map) {
        this.map = map;
        this.container = document.createElement('div');
        this.container.id = 'map-help-button';
        this.container.className = 'map-help-button mapboxgl-ctrl mapboxgl-ctrl-group';
        this.container.innerHTML = '<button class="mapboxgl-ctrl-icon" type="button" title="Help" aria-label="Help">?</button>';
        this.container.addEventListener('click', function () {
          module.tour.start();
        });
        return this.container;
      }
    }, {
      key: "onRemove",
      value: function onRemove() {
        this.container.parentNode.removeChild(this.container);
        this.map = undefined;
      }
    }]);

    return MyCustomControl;
  }();

  var myCustomControl = new MyCustomControl();
  map.addControl(new mapboxgl.NavigationControl(), 'top-right');
  map.addControl(myCustomControl, 'top-right');
  map.scrollZoom.disable();
  nodes.forEach(function (n) {
    locations.push({
      properties: n,
      type: 'Feature',
      geometry: {
        'type': 'Point',
        'coordinates': [parseFloat(n[6]), parseFloat(n[5])]
      }
    });
  });
  map.on('load', function () {
    map.loadImage('https://www.ama-project.org/wp-content/themes/ama/assets/images/institution_map_icon.png', function (error, image) {
      if (error) throw error;
      map.addImage('institution', image);
      map.addSource('locations', {
        type: 'geojson',
        data: {
          'type': 'FeatureCollection',
          'features': locations
        },
        cluster: true,
        clusterMaxZoom: 14,
        // Max zoom to cluster points on
        clusterRadius: 50 // Radius of each cluster when clustering points (defaults to 50)

      });
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'locations',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#000000',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
          'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40]
        }
      });
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'locations',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ' \n{point_count_abbreviated}',
          'text-font': ['Metropolis Regular'],
          'text-size': 13,
          'text-line-height': 0.3
        },
        paint: {
          'text-color': '#ffffff'
        }
      });
      map.addLayer({
        id: 'unclustered-point',
        type: 'symbol',
        source: 'locations',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': 'institution',
          'icon-size': 0.25
        },
        paint: {}
      }); // inspect a cluster on click

      map.on('click', 'clusters', function (e) {
        var features = map.queryRenderedFeatures(e.point, {
          layers: ['clusters']
        });
        var clusterId = features[0].properties.cluster_id;
        map.getSource('locations').getClusterExpansionZoom(clusterId, function (err, zoom) {
          if (err) {
            return;
          }

          map.easeTo({
            center: features[0].geometry.coordinates,
            zoom: zoom
          });
        });
      });
      map.on('mouseenter', 'clusters', function () {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'clusters', function () {
        map.getCanvas().style.cursor = '';
      });
      map.on('mouseenter', 'unclustered-point', function (e) {
        // var features = map.queryRenderedFeatures(e.point, { layers: ['unclustered-point'] });
        // module.updateTooltip(features[0].properties);
        map.getCanvas().style.cursor = 'pointer';
        var coordinates = e.features[0].geometry.coordinates.slice();
        var title = e.features[0].properties[1].length < 30 ? e.features[0].properties[1] : e.features[0].properties[1].substr(0, 27) + '...';
        var description = '<svg id="popup-svg" height="150" width="300" style="pointer-events:none;">' + '<defs>' + '<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">' + '<feGaussianBlur in="SourceAlpha" stdDeviation="3" />' + '<feOffset dx="0" dy="0" />' + '<feComponentTransfer>' + '<feFuncA type="linear" slope="0.2" />' + '</feComponentTransfer>' + '<feMerge>' + '<feMergeNode />' + '<feMergeNode in="SourceGraphic"/>' + '</feMerge>' + '</filter>' + '</defs>' + '<g transform="translate(20 75)">' + '<rect fill="#fff" height="47" style="filter:url(#shadow)" width="200" />' + '<path d="M0,0L15,0L15,15,L0,0Z" />' + '<line stroke="#000" y1="0" y2="0" x1="-20" />' + '<text id="popup-svg-type" transform="translate(10,0)" text-anchor="' + (e.point.x < window.innerWidth / 2 ? 'start' : 'end') + '" style="fill:#000; font-size:10px; font-family:Arial;" dy="17">Institution</text>' + '<text id="popup-svg-text" transform="translate(10,0)" text-anchor="' + (e.point.x < window.innerWidth / 2 ? 'start' : 'end') + '" style="fill:#000; font-size:16px; font-weight:bold; font-family:Arial;" dy="35">' + title + '</text>' + '</g>' + '</svg>'; // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        } // Populate the popup and set its coordinates
        // based on the feature found.


        popup = new mapboxgl.Popup({
          className: 'ama-overview-popup',
          offset: {
            left: [7, 0],
            right: [-7, 0]
          },
          closeButton: false,
          closeOnClick: false,
          anchor: e.point.x < window.innerWidth / 2 ? 'left' : 'right'
        }).setLngLat(coordinates).setHTML(description).addTo(map);
        var bb = d3.select('#popup-svg-text').node().getBoundingClientRect();
        var bb1 = d3.select('#popup-svg-type').node().getBoundingClientRect();
        if (bb1.width > bb.width) bb = bb1;
        d3.select('#popup-svg path').attr('transform', 'translate(' + (e.point.x < window.innerWidth / 2 ? bb.width + 5 : 15) + ',0) scale(' + (e.point.x < window.innerWidth / 2 ? '1' : '-1') + ',1)');
        d3.select('#popup-svg rect').attr('width', bb.width + 20);
        d3.select('#popup-svg line').attr('x1', e.point.x > window.innerWidth / 2 ? 0 : -20).attr('x2', e.point.x > window.innerWidth / 2 ? bb.width + 40 : bb.width + 20);
        d3.selectAll('#popup-svg text').attr('transform', 'translate(' + (e.point.x > window.innerWidth / 2 ? bb.width + 10 : 10) + ',0)');
        d3.select('#popup-svg g').attr('transform', 'translate' + (e.point.x > window.innerWidth / 2 ? '(' + (300 - bb.width - 40) + ' 75)' : '(20 75)'));
      });
      map.on('mouseleave', 'unclustered-point', function () {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });
      map.on('click', 'unclustered-point', function (e) {
        window.location = "https://www.ama-project.org/".concat(e.features[0].properties[2], "/").concat(e.features[0].properties[8]);
      });
      mapLoaded = true;
      module.updateSelection();
    });
  });

  module.updateSelection = function () {
    locations = [];
    nodes.forEach(function (n) {
      var hasFeatures = true;

      if (selection) {
        selection.forEach(function (s) {
          if (n[7].indexOf('' + s) == -1) hasFeatures = false;
        });
      }

      if (hasFeatures) {
        locations.push({
          properties: n,
          type: 'Feature',
          geometry: {
            'type': 'Point',
            'coordinates': [parseFloat(n[6]), parseFloat(n[5])]
          }
        });
      }
    });

    if (mapLoaded) {
      map.getSource('locations').setData({
        'type': 'FeatureCollection',
        'features': locations
      });
    }

    if (selection.length > 0) {
      for (var _skey in taxSelects) {
        taxSelectsOptions[_skey].each(function (d) {
          if (selection.indexOf(d.value) >= 0) {
            d3.select(this).classed('selected', true);
          } else {
            d3.select(this).classed('selected', false);
          }
        });
      }
    }
  };

  module.responsive = function () {};

  module.responsive();
  window.addEventListener('resize', debounce(function () {
    module.updateSize();
    module.responsive();
  }));
  return module;
};