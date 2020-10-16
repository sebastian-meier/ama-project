/* exported icons,networkHome */
/* globals matrixCircle,Promise,d3,iconBuilder,debounce,state,dispatcher,createURL,jspath,jsppath,taxonomy:true,networkHome,siteFile,list,retrieveURL,listFunc:true,nodes:true */

let icons = iconBuilder();

/* --------- NETWORK DEMO ---------*/

function updateFilterSide() {
  if (window.pageYOffset > height/2) {
    d3.selectAll('#filter-nav .dropdown').classed('top', false);
  } else {
    d3.selectAll('#filter-nav .dropdown').classed('top', true);
  }
}

function updateResize() {
  width = window.innerWidth;
  height = window.innerHeight;

  if (d3.select('#filters').size() >= 1) {
    d3.selectAll('#content')
        .style('top', (height-110)+'px');
  } else {
    d3.selectAll('#content')
        .style('top', (height-210)+'px');
  }

  // if (svg) svg.attr('width', width).attr('height', height);
}

if (d3.select('#svg-container').size() >= 1) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  d3.select('#svg-container')
      .attr('width', width)
      .attr('height', height);

  if (d3.select('#filters').size() >= 1) {
    d3.selectAll('#content')
        .style('top', (height-110)+'px');
  } else {
    d3.selectAll('#content')
        .style('top', (height-210)+'px');
  }

  window.scrollTo(0, Math.round(height/2));
  document.body.scrollTop = Math.round(height/2);

  d3.select('#explore-message').style('top', Math.round(height/4));


  Promise.all(([jspath+'/cache/'+jsppath+''+siteFile, jspath+'/cache/'+jsppath+'taxonomy.json']).map((d)=>d3.json(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
      .then(([_nodes, _taxonomy]) => {
        nodes = _nodes;
        taxonomy = _taxonomy;

        const listCon = d3.select('#explore-con');
        listCon.selectAll('*').remove();

        updateResize();

        listFunc = list(listCon, nodes, taxonomy);
        listFunc.update();

        retrieveURL();
      }).catch((e)=>{
        throw e;
      });
}

// Show static image alternative
updateResize();

if (d3.select('#svg-container').size() >= 1) {
  updateFilterSide();

  d3.select(window).on('scroll', debounce(function() {
    updateFilterSide();
  }, 200));

  updateResize();

  d3.select(window).on('resize', debounce(function() {
    updateResize();
  }, 200));
}

if (d3.select('#matrix-circle-container').size() >= 1) {
  Promise.all(([jspath+'/cache/'+jsppath+'iass.json', jspath+'/cache/'+jsppath+'taxonomy.json']).map((d)=>d3.json(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
      .then(([_nodes, _taxonomy]) => {
        const listCon = d3.select('#matrix-circle-list');
        listCon.selectAll('*').remove();

        const tNodes = _nodes.filter((n)=>(n.id!=15)?true:false);

        listFunc = list(listCon, tNodes, _taxonomy);
        listFunc.update();

        matrixCircle(d3.select('#matrix-circle-container'), listFunc, tNodes, _taxonomy);
      }).catch((e)=>{
        throw e;
      });
}

// Content-type switch buttons
(['person', 'institution', 'project', 'publication']).forEach((type)=>{
  d3.select(`#type-nav .${type} a`).attr('href', null).on('click', (d, i, _nodes)=>{
    if (!d3.select(_nodes[i]).classed('disabled')) {
      if (state.type[0] == type) {
        state.type = [];
      } else {
        state.type[0] = type;
      }

      state.taxonomy = [];

      dispatcher.call('action', this, createURL());
    }
  });
});


// Vis-Type Switch Buttons
(['map', 'network', 'bipartite', 'flow', 'radial', 'matrix']).forEach((type)=>{
  d3.select(`#vis-nav .${type}`).attr('href', null).on('click', ()=>{
    state.vis[0] = type;
    state.taxonomy = [];
    dispatcher.call('action', this, createURL());
  });
});


if (d3.select('#home-svg').size() >= 1) {
  Promise.all(([jspath+'/cache/'+jsppath+''+siteFile, jspath+'/cache/'+jsppath+'taxonomy.json']).map((d)=>d3.json(d, {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}})))
      .then(([_nodes, _taxonomy]) => {
        const networkHomeObj = networkHome(d3.select('#home-svg'), _nodes, _taxonomy);
        networkHomeObj.init();
      }).catch((e)=>{
        throw e;
      });
}

if (d3.select('#search-results.has-results').size() >= 1) {
  const filterTypes = [{id: 0, type: 'person'}, {id: 1, type: 'institution'}, {id: 2, type: 'project'}, {id: 3, type: 'publication'}];
  const filterLabels = ['Persons', 'Institutions', 'Projects', 'Publications'];
  const filterIcons = ['M0,-2.942830956382712L1.6990442448471226,0L0,2.942830956382712L-1.6990442448471226,0Z', 'M-2.121320343559643,-0.7071067811865476L-0.7071067811865476,-0.7071067811865476L-0.7071067811865476,-2.121320343559643L0.7071067811865476,-2.121320343559643L0.7071067811865476,-0.7071067811865476L2.121320343559643,-0.7071067811865476L2.121320343559643,0.7071067811865476L0.7071067811865476,0.7071067811865476L0.7071067811865476,2.121320343559643L-0.7071067811865476,2.121320343559643L-0.7071067811865476,0.7071067811865476L-2.121320343559643,0.7071067811865476Z', 'M-1.5811388300841898,-1.5811388300841898h3.1622776601683795v3.1622776601683795h-3.1622776601683795Z', 'M0,-2.7745276335252114L2.402811414134754,1.3872638167626057L-2.402811414134754,1.3872638167626057Z'];
  const foundFilters = [];

  filterTypes.forEach((f)=>{
    foundFilters.push( (d3.select(`.connection.c-type-${f.type}`).size() >= 1) ? true : false );
  });

  const filterContainer = d3.select('header.page-header').append('div').attr('id', 'filters');
  filterContainer.append('span').text('Filter your search results:');
  filterContainer.append('ul').attr('id', 'type-nav').selectAll('li').data(filterTypes.filter((d, i)=>foundFilters[i])).enter().append('li')
      .attr('class', (d)=>d.type)
      .append('a').html((d)=>`<svg width="16" height="16"><g transform="translate(8,8) scale(2)"><path d="${filterIcons[d.id]}" style="fill: rgb(0, 0, 0); stroke: transparent;"></path></g></svg><br>${filterLabels[d.id]}`)
      .on('click', function(d) {
        if (d3.select(this).classed('active')==true) {
          d3.select(this).classed('active', false);
          d3.selectAll('.connection').style('display', 'block').classed('on-show', true);
        } else {
          d3.selectAll('#type-nav a').classed('active', false);
          d3.select(this).classed('active', true);
          d3.selectAll('.connection').style('display', 'none').classed('on-show', false);
          d3.selectAll('.connection.c-type-'+d.type).style('display', 'block').classed('on-show', true);
        }

        d3.selectAll('.connection.on-show')
            .classed('b1', (d, i)=>(i%2)?false:true)
            .classed('b2', (d, i)=>(i%2)?true:false)
            .classed('c1', (d, i)=>{
              const c = (i+1) - (Math.floor((i+1)/3))*3; if (c==1) {
                return true;
              } else {
                return false;
              }
            })
            .classed('c2', (d, i)=>{
              const c = (i+1) - (Math.floor((i+1)/3))*3; if (c==2) {
                return true;
              } else {
                return false;
              }
            })
            .classed('c3', (d, i)=>{
              const c = (i+1) - (Math.floor((i+1)/3))*3; if (c==0) {
                return true;
              } else {
                return false;
              }
            });
      });
}
