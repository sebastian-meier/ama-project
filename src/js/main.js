/* exported debounce, iconBuilder, createURL, retrieveURL, updateFilter, map, matrix, _hibipartVis, network_overall_geographic */
/* global Promise, matrixRect, fullFile, rings, matrix:true, flow, d3, nodes, siteID, network:true, taxonomy, networkOverallThematic, siteType, mapCluster, jspath, jsppath, map:true, hibipart, hibipartVis, listFunc, _hibipart:true, _hibipartVis:true */

/* --- Wordpress Responsive Menu ---*/

d3.select('#site-navigation button').on('click', ()=>{
  const cState = d3.select('#site-navigation').classed('open');
  if (!cState) {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  }
  d3.select('#site-navigation').classed('open', !cState);
});

/* --- Default Debouncer ---*/

function debounce(func, wait, immediate) {
  let timeout;
  return function(...args) {
    const context = this;
    const later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

/* --- History / State > System ---*/

let state = {taxonomy: [], type: [], vis: ['network']}; let cVis = false; let biPartiteType = false;

function createURL() {
  const keys = [];
  for (const key in state) {
    keys.push(key + '=' + state[key].join(','));
  }
  return '?' + keys.join('&');
}

function retrieveURL() {
  state = {taxonomy: [], type: [], vis: ['network']};

  const comps = window.location.href.split('?');

  if (comps.length > 1) {
    const cs = comps[1].split('&');

    cs.forEach(function(c) {
      const el = c.split('#')[0].split('=');

      if (el[1]=='') {
        state[el[0]] = [];
      } else {
        state[el[0]] = el[1].split(',');
      }
    });
  }

  updateUI();
}

window.addEventListener('popstate', function() {
  retrieveURL();
});

const dispatcher = d3.history('action');

dispatcher.on('action', function() {
  updateUI();
});

/* Filter Helper Function */

const filter = {taxonomy: [], type: []};

function updateFilter() {
  let changed = false;

  for (const key in state) {
    state[key].forEach(function(s) {
      if (filter[key].indexOf(s)==-1) {
        changed = true;
        filter[key].push(s);
      }
    });
  }

  if (changed) {
    dispatcher.call('action', this, createURL());
  }
}

/* updateUI > responsible for applying the current state to the UI */

function updateUI() {
  if (!('vis' in state)) state['vis'] = ['network'];


  if (((window.innerWidth > 0) ? window.innerWidth : screen.width) < 768) {
    // Only static image

    if (siteType && siteType == 'detail') {
      d3.select('#svg-container').style('background-image', `url(${jspath}/assets/images/mobile_snap_detail_${state.vis[0]}@2x.jpg)`);
    } else {
      d3.select('#svg-container').style('background-image', `url(${jspath}/assets/images/mobile_snap_explore_${state.vis[0]}@2x.jpg)`);
    }
  } else {
    d3.select('#svg-container').style('background-image', `none`);

    // change vis if necessary
    if (cVis != state.vis[0]) {
      cVis = state.vis[0];

      // remove current vis
      d3.selectAll('#svg-container *').remove();

      // clean classes
      d3.selectAll('#svg-container')
          .classed('network', false)
          .classed('map', false)
          .classed('matrix', false)
          .classed('bipartite', false)
          .classed(state.vis[0], true);

      // add new vis
      switch (state.vis[0]) {
        case 'network':

          // NETWORK DONE!

          updateTypeFilter(true);
          updateTaxFilter(true);

          let taxLimit = false;

          for (const key in nodes) {
            if (key == siteID) taxLimit = nodes[key].taxonomy;
          }

          network = networkOverallThematic(d3.select('#svg-container'), nodes, taxonomy, (siteType=='detail')?siteID:false, (selection)=>{
            state.taxonomy = selection;
            dispatcher.call('action', this, createURL());
          }, (siteType=='detail')?taxLimit:false, (siteType=='detail')?true:false);

          break;
        case 'map':

          updateTypeFilter(false);
          updateTaxFilter(true);

          Promise.all(([jspath+'/cache/'+jsppath+'geo_network_nodes.json', jspath+'/cache/'+jsppath+'taxonomy.json']).map((d)=>d3.json(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
              .then(([geoNodes, _taxonomy]) => {
                map = mapCluster(d3.select('#svg-container'), geoNodes, _taxonomy, (selection)=>{
                  console.log(state.taxonomy, selection);
                  if (state.taxonomy[0] == selection[0]) {
                    state.taxonomy = [];
                  } else {
                    state.taxonomy = selection;
                  }
                  dispatcher.call('action', this, createURL());
                });
                updateUI();
              }).catch((e)=>{
                throw e;
              });

          break;
        case 'matrix':

          updateTypeFilter(true);
          updateTaxFilter(false);

          Promise.all(([jspath+'/cache/'+jsppath+''+fullFile, jspath+'/cache/'+jsppath+'taxonomy.json']).map((d)=>d3.json(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
              .then(([_nodes, _taxonomy]) => {
                matrix = matrixRect(d3.select('#svg-container'), _nodes, _taxonomy, (selection) => {
                  state.taxonomy = selection;
                  dispatcher.call('action', this, createURL());
                });

                updateUI();
              }).catch((e)=>{
                throw e;
              });

          break;

        case 'radial':

          updateTypeFilter(false);
          updateTaxFilter(false);

          Promise.all(([jspath+'/cache/'+fullFile, jspath+'/cache/taxonomy.json']).map((d)=>d3.json(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
              .then(([_nodes, _taxonomy]) => {
                rings(d3.select('#svg-container'), _nodes, _taxonomy, siteID);
              }).catch((e)=>{
                throw e;
              });

          break;

        case 'flow':

          updateTypeFilter(false);
          updateTaxFilter(false);

          Promise.all(([jspath+'/cache/'+jsppath+''+fullFile, jspath+'/cache/'+jsppath+'taxonomy.json']).map((d)=>d3.json(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
              .then(([_nodes, _taxonomy]) => {
                flow(d3.select('#svg-container'), _nodes, _taxonomy);
              }).catch((e)=>{
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
            Promise.all(([jspath+'/cache/'+jsppath+'cat_nodes_clean_min.csv', jspath+'/cache/'+jsppath+'cat_edges_all_grouped_min.csv']).map((d)=>d3.csv(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
                .then(([nodes, edges]) => {
                  setupBiPartite(nodes, edges);
                }).catch((e)=>{
                  throw e;
                });
          } else {
            biPartiteType = state.type[0];
            _hibipart = false;

            Promise.all(([jspath+'/cache/'+jsppath+'cat_nodes_clean_min-'+state.type[0]+'.csv', jspath+'/cache/'+jsppath+'cat_edges_all_grouped_min-'+state.type[0]+'.csv']).map((d)=>d3.csv(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
                .then(([nodes, edges]) => {
                  setupBiPartite(nodes, edges);
                }).catch((e)=>{
                  throw e;
                });
          }

          break;
      }
    }
  }

  d3.selectAll('#vis-nav a').classed('active', false);
  d3.select(`#vis-nav .${state.vis[0]} a`).classed('active', true);

  const cSel = listFunc.selection;

  d3.selectAll(`#type-nav a`).classed('active', false);


  if (((window.innerWidth > 0) ? window.innerWidth : screen.width) < 768) {
    cSel.type = (state.type.length == 0) ? [] : [state.type[0]];
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
          Promise.all(([jspath+'/cache/'+jsppath+'cat_nodes_clean_min.csv', jspath+'/cache/'+jsppath+'cat_edges_all_grouped_min.csv']).map((d)=>d3.csv(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
              .then(([nodes, edges]) => {
                setupBiPartite(nodes, edges);
              }).catch((e)=>{
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
          Promise.all(([jspath+'/cache/'+jsppath+'cat_nodes_clean_min-'+state.type[0]+'.csv', jspath+'/cache/'+jsppath+'cat_edges_all_grouped_min-'+state.type[0]+'.csv']).map((d)=>d3.csv(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
              .then(([nodes, edges]) => {
                setupBiPartite(nodes, edges);
              }).catch((e)=>{
                throw e;
              });
        }
      }

      cSel.type = [state.type[0]];
    }
  }


  if (((window.innerWidth > 0) ? window.innerWidth : screen.width) < 768) {
    cSel.taxonomy = (state.taxonomy.length == 0) ? [] : state.taxonomy;
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
        if (_hibipart.getArcFilters().length>=0) {
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
        state.taxonomy.forEach((tax)=>{
          _hibipart.filter(+tax);
        });
        _hibipartVis.linkModules();
        _hibipartVis.update();
      }

      cSel.taxonomy = state.taxonomy;
    }
  }

  if (state.type.length > 0) d3.select(`#type-nav .${state.type[0]} a`).classed('active', true);

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
  _hibipart = hibipart();
  _hibipart
      .idAccessor(function(d) {
        return d.id;
      })
      .parentAccessor(function(d) {
        return d.parent;
      })
      .nameAccessor(function(d) {
        return d.name;
      })
      .sideAccessor(function(d) {
        return d.systematic;
      });

  nodes = nodes.filter(function(d) {
    if (d.systematic != 'c_s' && d.systematic != 'c_ic') {
      return false;
    } else {
      return true;
    }
  });

  nodes.forEach(function(n) {
    for (const key in n) {
      if (key != 'name' && key != 'systematic') {
        n[key] = +n[key];
      }
    }
  });

  edges.forEach(function(e) {
    for (const key in e) {
      e[key] = +e[key];
    }
  });

  _hibipart.init(nodes, edges);

  _hibipartVis = hibipartVis(d3.select('#svg-container'), (id, addRemove)=>{
    if (!addRemove && (state.taxonomy.indexOf(id)>=0 || state.taxonomy.indexOf(''+id)>=0)) {
      state.taxonomy.splice(state.taxonomy.indexOf(parseInt(id)), 1);
    } else if (addRemove) {
      state.taxonomy.push(id);
    }
    dispatcher.call('action', this, createURL());
  });

  _hibipartVis
      .bipart(_hibipart)
      .sides({
        c_ic: {
          start: Math.PI/180*225,
          end: Math.PI/180*315,
        },
        c_s: {
          start: Math.PI/180*45,
          end: Math.PI/180*135,
        },
      })
      .render();

  updateUI();
}

/* --- Toggle for Tag-List ---*/

let contentCatsMode = 1;
if (d3.select('.single .content-cats').size()>=1 && d3.selectAll('.single .content-cats .term').size() > 4) {
  contentCatsMode = 1;

  toggleContentCats();

  d3.select('.single .content-cats').append('div').attr('class', 'content-cats-toggle-container').append('a')
      .attr('class', 'content-cats-toggle')
      .html('&#10010; Show all '+d3.selectAll('.single .content-cats .term').size()+' terms')
      .on('click', function() {
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
    d3.selectAll('.single .content-cats .term').style('display', function(d, i) {
      if (i<4) {
        return 'inline-block';
      } else {
        return 'none';
      }
    });
    d3.select('.content-cats-toggle').html('&#10010; Show all '+d3.selectAll('.single .content-cats .term').size()+' terms');
  }
}

/* --- Create Icons ---*/

const iconBuilder = () => {
  const arc = d3.arc()
      .innerRadius(38)
      .outerRadius(38);
  const gap = 7;
  const colors = {
    'ic': '#AD245C',
    's': '#0A9EA3',
    'none': '#000000',
  };

  const icons = d3.selectAll('.icon').datum(function() {
    const el = d3.select(this);
    const s = +el.attr('data-s');
    const ic = +el.attr('data-ic');

    return {
      icon: d3.select(this).attr('data-icon'),
      s: s,
      ic: ic,
      none: (ic==0&&s==0)?1:0,
      full: s+ic,
      els: (ic==0||s==0)?1:2,
    };
  }).append('svg')
      .attr('width', 80)
      .attr('height', 80);

  icons.append('image')
      .attr('xlink:href', function(d) {
        return d.icon;
      })
      .attr('width', 80)
      .attr('height', 80);

  const igs = icons.append('g')
      .attr('transform', 'translate(40,40)');

  ['s', 'ic', 'none'].forEach((type) => {
    igs.append('path')
        .style('stroke', colors[type])
        .attr('title', type)
        .style('stroke-width', 2.5)
        .style('stroke-linecap', 'round')
        .style('stroke-linejoin', 'round')
        .attr('d', (d) => {
          let start; let end;
          if (d[type] != 0) {
            if (d.els == 2) {
              if (type == 's') {
                start = Math.PI/4;
                end = Math.PI/180 * ((360-2*gap) * d[type]/d.full) + Math.PI/4;
              } else {
                start = Math.PI/180 * ((360-2*gap) * d['s']/d.full) + Math.PI/4 + Math.PI/180*gap;
                end = Math.PI*2.25 - Math.PI/180*gap;
              }
            } else {
              start = 0;
              end = Math.PI*2;
            }
            return arc({
              startAngle: start,
              endAngle: end,
            });
          } else {
            return '';
          }
        });
  });
};
