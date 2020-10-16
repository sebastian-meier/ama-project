/* exported list */

const list = (_container, _data, _taxonomy) => {
  const module = {
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
    },
  };
  const container = _container;
  const taxonomy = _taxonomy;
  const data = _data;
  let selection = {taxonomy: [], type: []};
  let visType = 'network';
  const filterdata = [];
  let sortKey = 'title';
  let sortOrder = 'asc';
  let sortType = 'str';

  // faster retrieval of child ids for taxonomies
  for (const tID in taxonomy) {
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

  for (const key in data) {
    filterdata.push({...data[key], id: key});
  }

  let items = container.selectAll('a');

  module.update = () => {
    let selCount = 0;
    for (const key in selection) {
      selCount += selection[key].length;
    }

    const updatedata = filterdata.filter((d)=>{
      if (visType == 'map' && (d.g == 0 || d.g == '0' || !d.g)) return false;
      if (selCount == 0) return true;

      let allMatch = true;
      for (const key in selection) {
        selection[key].forEach((f)=>{
          if (visType == 'bipartite') {
            if (d[key].indexOf(f)>=0 || d[key].indexOf(''+f)>=0) {
              // all good
              if (d.id == 607) {
                // console.log('direct hit', d, key, f)
              }
            } else if (key == 'taxonomy') {
              let matchMade = false;
              if (d.id == 607) {
                // console.log('check kids', d, key, f)
              }
              taxonomy[f].children.forEach((c)=>{
                if (d[key].indexOf(c)>=0) {
                  matchMade = true;
                }
              });
              if (!matchMade) {
                allMatch = false;
              }
            } else {
              allMatch = false;
            }
          } else if (visType == 'matrix' && key == 'taxonomy') {
            if (d['root_taxonomy'].indexOf(''+f)==-1) {
              allMatch = false;
            }
          } else {
            if (d[key].indexOf(f)==-1) {
              allMatch = false;
            }
          }
        });
      }

      if (allMatch) return true;

      return false;
    }).sort((a, b)=>{
      if (sortOrder != 'asc') {
        const ta = a;
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
        return a[sortKey]-b[sortKey];
      }
    });

    d3.select('#result-display').html(updatedata.length + '&nbsp;Results&nbsp;<span>&#8675;</span>');
    d3.select('#result-display').classed('updated', true);
    setTimeout(()=>{
      d3.select('#result-display').classed('updated', false);
    }, 1000);

    items = items.data(updatedata);
    items.exit().remove();
    const tItems = items.enter().append('a');

    tItems.append('span').attr('class', 'skytitle');
    tItems.append('span').attr('class', 'title');
    tItems.append('span').attr('class', 'line');
    tItems.append('span').attr('class', 'subline');
    tItems.append('hr').attr('class', 'clear');

    items = tItems.merge(items);

    items
        .attr('data-type', (d)=>d.type)
        .attr('data-date', (d)=>d.date)
        .attr('data-author', (d)=>d.author)
        .attr('href', (d)=>`https://www.ama-project.org/${d.type}/${d.slug}`)
        .attr('class', (d, i)=>{
          const c = (i+1) - (Math.floor((i+1)/3))*3;
          let cl = `type-${d.type} connection list author-${d.author} b${(i%2)?2:1} c${ (c==0)?3:c }`;

          cl += ('taxonomy' in d && d.taxonomy != null && d.taxonomy.length > 0) ? ' tax-'+d.taxonomy.join(' tax-'):'';

          cl += ('root_taxonomy' in d && d.root_taxonomy != null && d.root_taxonomy.length > 0) ? ' root-tax-'+d.taxonomy.join(' root-tax-'):'';

          // if has geo_location
          cl += (d.g == 1)?' has-geo':'';

          return cl;
        });

    items.select('.skytitle').attr('data-type', (d) => d.type).text((d)=>d.type);
    items.select('.title').text((d)=>`${(d.type == 'publication' || d.type == 'project')?'“':''}${d.title}${(d.type == 'publication' || d.type == 'project')?'”':''}`);
    items.select('.line').html((d)=>{
      const found = {
        'sustainability_keywords': {c: 0, l: 's'},
        'inner_change_keywords': {c: 0, l: 'ic'},
      }; let fc = 0;

      if ('taxonomy' in d && d.taxonomy != null && d.taxonomy.length > 0) {
        d.taxonomy.forEach((t)=>{
          if (taxonomy[t].taxonomy in found) {
            found[taxonomy[t].taxonomy].c++;
            fc++;
          }
        });
      }

      if (fc == 0) {
        return '<span class="ratioline v-none"></span>';
      } else {
        let lines = 0;

        for (const key in found) {
          if (found[key].c>0) {
            lines++;
          }
        }

        if (lines == 2) {
          return '<span class="ratioline v-s-50"></span><span class="ratioline v-ic-50"></span>';
        } else {
          for (const key in found) {
            if (found[key].c>0) {
              return `<span class="ratioline v-${found[key].l}"></span>`;
            }
          }
        }
      }
    });

    items.selectAll('.subline').text((d)=>('sub' in d)?d.sub:'-');
  };

  return module;
};
