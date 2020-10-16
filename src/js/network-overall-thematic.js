/* exported networkOverallThematic */
/* global d3,debounce, Shepherd, jspath */

const networkOverallThematic = (_container, _data, _taxonomy, _id, _callback, _taxLimit, _individual) => {
  const module = {
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
    },
  };
  const taxLimit = _taxLimit || false;
  const id = _id;
  const individual = _individual || false;
  const data = _data;
  const taxonomy = _taxonomy;
  // id = _id,
  const callback = _callback;
  const container = _container;
  let width; let height;
  let rScale;
  const simulation = d3.forceSimulation()
      .force('charge', d3.forceManyBody())
      .force('link', d3.forceLink().id(function(d) {
        return d.id;
      }))
      .force('center', d3.forceCenter(0, 0))
      .force('collide', d3.forceCollide((d)=>d.r+20));

  let taxSelects = {'sustainability_keywords': [], 'inner_change_keywords': [], 'journey_station': [], 'perspective_keywords': [], 'ama_role': []};
  let taxSelectKeys = {'sustainability_keywords': {}, 'inner_change_keywords': {}, 'journey_station': {}, 'perspective_keywords': {}, 'ama_role': {}};
  const taxSelectsNodes = {'sustainability_keywords': null, 'inner_change_keywords': null, 'journey_station': null, 'perspective_keywords': null, 'ama_role': null};
  const taxSelectsOptions = {'sustainability_keywords': null, 'inner_change_keywords': null, 'journey_station': null, 'perspective_keywords': null, 'ama_role': null};

  module.updateSize = ()=>{
    const bb = container.node().getBoundingClientRect();
    width = bb.width;
    height = bb.height;
  };

  module.updateSize();

  const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height);

  module.scrollTop = () => {
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
  };

  module.tour = new Shepherd.Tour({
    defaultStepOptions: {
      showCancelLink: true,
    },
  });

  module.tour.on('show', module.scrollTop);

  module.tour.addStep('step-1', {
    title: 'The Network-View',
    text: 'The visualisation shows which items are connected to which categories.',
    buttons: [
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-2', {
    title: 'The Network-View',
    text: 'The circles represent the taxonomies. Sustainability in red, inner change in green. The bigger the circle, the more items are connected. Select a circle to filter items.',
    attachTo: '.node-sustainability_keywords top',
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-3', {
    title: 'The Network-View',
    text: 'Hover over an icon to learn more and click the icon to continue to its details page.',
    attachTo: {element: '.node-unknown', on: 'top'},
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-3-1', {
    title: 'The Matrix-View',
    text: 'You can use the type filters to narrow down the results to a specific type.',
    attachTo: {element: '#type-nav', on: 'top'},
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  if (d3.selectAll('#explore-con').size() >= 1) {
    module.tour.addStep('step-3-2', {
      title: 'The Matrix-View',
      text: 'You can use the taxonomy filters to narrow down the results to specific categories.',
      attachTo: {element: '#filter-nav', on: 'top'},
      buttons: [
        {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
        {action: module.tour.next, text: 'Next &raquo;'},
      ],
    }).on('before-show', module.scrollTop);

    module.tour.addStep('step-4', {
      title: 'The Network-View',
      text: 'Selecting taxonomies act as filters. The number of resulting items is displayed below.',
      attachTo: {element: '#result-display', on: 'top'},
      buttons: [
        {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
        {action: module.tour.next, text: 'Next &raquo;'},
      ],
    }).on('before-show', module.scrollTop);

    module.tour.addStep('step-5', {
      title: 'The Network-View',
      text: 'All filtered items are displayed as a list below the visualisation.',
      attachTo: 'a.connection top',
      scrollTo: true,
      buttons: [
        {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
        {action: module.tour.cancel, text: 'Exit &times;'},
      ],
    }).on('before-show', module.scrollTop);
  } else {
    module.tour.addStep('step-3-2', {
      title: 'The Matrix-View',
      text: 'You can use the taxonomy filters to narrow down the results to specific categories.',
      attachTo: {element: '#filter-nav', on: 'top'},
      buttons: [
        {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
        {action: module.tour.cancel, text: 'Exit &times;'},
      ],
    }).on('before-show', module.scrollTop);
  }

  if (d3.selectAll('body.page-template-explore, body.single').size()>=1) {
    container.append('button')
        .attr('id', 'master-help-button')
        .text('?')
        .on('click', ()=>{
          module.tour.start();
        });
  }

  const defs = svg.append('defs');

  defs.append('filter')
      .attr('id', 'shadow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
      .html('<feGaussianBlur in="SourceAlpha" stdDeviation="3" />'+
          '<feOffset dx="0" dy="0" />'+
          '<feComponentTransfer>'+
            '<feFuncA type="linear" slope="0.2" />'+
          '</feComponentTransfer>'+
          '<feMerge>'+
            '<feMergeNode />'+
            '<feMergeNode in="SourceGraphic"/>'+
          '</feMerge>');

  let dragX = width/2; let dragY = height/2;

  svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'transparent')
      .call(d3.drag()
          .on('drag', () => {
            s.attr('transform', `translate(${dragX + d3.event.x - d3.event.subject.x},${dragY + d3.event.y - d3.event.subject.y})`);
          })
          .on('end', () => {
            dragX = dragX + d3.event.x - d3.event.subject.x;
            dragY = dragY + d3.event.y - d3.event.subject.y;
          }),
      );

  const s = svg.append('g');

  let nodes = []; let nodeKeys = {tax: {}, el: {}}; let edges = [];
  let filters = {taxonomy: [], type: []}; let selection = []; let nodeSel;

  module.resetSelection = () => {
    selection = [];
  };

  module.setSelection = (id) => {
    if (id) {
      const i = selection.indexOf(id);
      if (i==-1) {
        selection.push(id);
      } else {
        selection.splice(i, 1);
      }
    }
  };

  module.updateSelection = () => {
    const nodeIDs = []; const taxIDs = [];

    if (selection.length > 0) {
      icons.style('fill', (d)=>{
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
      }).style('stroke', 'transparent');

      // let icoSel = ''
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

      nodeSel = d3.selectAll('.node.taxonomy-'+selection.join(' path, .node.taxonomy-')+' path, .node.tax-'+selection.join('.tax-')+' path').style('fill', (d)=>{
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
      }).each((d)=>{
        if (d.type != 'taxonomy') {
          nodeIDs.push(d.oid);
        } else {
          taxIDs.push(d.oid);
        }
      });

      d3.selectAll('.node.child-'+nodeIDs.join(' path, .node.child-')+' path').style('fill', (d)=>{
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

      d3.selectAll('.node.taxonomy-'+selection.join(' path, .node.taxonomy-')+' path').style('stroke', '#000').style('stroke-width', 2);

      d3.selectAll('.connection').style('stroke-opacity', 0.05);
      module.highlightSelection();
    } else {
      icons.style('fill', (d)=>{
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

    for (const skey in taxSelects) {
      taxSelects[skey].forEach((tax)=>{
        if (selection.length == 0) {
          tax.has = tax.oHas;
        } else {
          if (taxIDs.indexOf(tax.value)>=0) {
            tax.has = (tax.oHas)?true:false;
          } else {
            tax.has = false;
          }
        }
      });
    }

    module.updateSelects();
  };

  module.applyFilter = (type, value, set)=>{
    let change = false;
    const i = filters[type].indexOf(value);

    if (!set) {
      if (i>=0) {
        filters[type].splice(i, 1);
        change = true;
      }
    } else {
      if (i==-1) {
        filters[type].push(value);
        change = true;
      }
    }

    if (change) {
      module.buildNetwork();
      module.updateSimulation(true);
    }
  };

  module.resetFilter = (update)=>{
    filters = {taxonomy: [], type: []};
    if (update) {
      module.buildNetwork();
      module.updateSimulation(true);
    }
  };

  const firstUpper = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  module.buildNetwork = ()=>{
    const oNodes = nodes;
    const oNodeKeys = nodeKeys;

    nodes = [];
    nodeKeys = {tax: {}, el: {}};
    edges = [];

    selection = [];

    taxSelects = {'sustainability_keywords': [], 'inner_change_keywords': [], 'journey_station': [], 'perspective_keywords': [], 'ama_role': []};
    taxSelectKeys = {'sustainability_keywords': {}, 'inner_change_keywords': {}, 'journey_station': {}, 'perspective_keywords': {}, 'ama_role': {}};

    for (const key in data) {
      if ('title' in data[key] && data[key].taxonomy.length>0) {
        let hasConnection = false;
        data[key].taxonomy.forEach((t)=>{
          if (taxonomy[t].taxonomy == 'sustainability_keywords' ||
              taxonomy[t].taxonomy == 'inner_change_keywords') {
            hasConnection = true;
          }
        });
        let inTypeFilter = true;
        let inTaxFilter = true;

        // taxonomy filter
        if (filters.taxonomy.length>0) {
          inTaxFilter = false;
          data[key].taxonomy.forEach((t)=>{
            if (filters.taxonomy.indexOf(t)>=0) {
              inTaxFilter = true;
            }
          });
        }

        // type filter
        if (filters.type.length>0) {
          inTypeFilter = false;
          if (filters.type.indexOf(data[key].type)>=0) {
            inTypeFilter = true;
          }
        }

        if ((hasConnection && inTypeFilter && inTaxFilter)||(individual && key == id)) {
          nodes.push({
            id: data[key].type+'-'+key,
            oid: key,
            type: data[key].type,
            title: firstUpper(data[key].title),
            taxonomy: data[key].taxonomy,
            slug: data[key].slug,
            r: 10,
            x: (key in oNodeKeys.el)?oNodes[oNodeKeys.el[key]].x:0,
            y: (key in oNodeKeys.el)?oNodes[oNodeKeys.el[key]].y:0,
            // fx:(key in oNodeKeys.el)?oNodes[oNodeKeys.el[key]].fx:0,
            // fy:(key in oNodeKeys.el)?oNodes[oNodeKeys.el[key]].fy:0,
            c: 1,
          });
          nodeKeys.el[key] = nodes.length-1;
          data[key].taxonomy.forEach((t)=>{
            if (taxonomy[t].taxonomy == 'sustainability_keywords' || taxonomy[t].taxonomy == 'inner_change_keywords'||
            'journey_station' == taxonomy[t].taxonomy||
            'ama_role' == taxonomy[t].taxonomy||
            'perspective_keywords' == taxonomy[t].taxonomy) {
              if (!(t in nodeKeys.tax)) {
                const ico = [];

                taxonomy[t].direct.forEach((dc)=>{
                  if (dc in data) {
                    data[dc].taxonomy.forEach((dct)=>{
                      if (ico.indexOf(dct)==-1) {
                        ico.push(dct);
                      }
                    });
                  }
                });

                if (!individual || taxLimit.indexOf(t)>-1) {
                  taxSelects[taxonomy[t].taxonomy].push({name: firstUpper(taxonomy[t].name), value: t, parent: taxonomy[t].parent, has: true, oHas: true});
                  taxSelectKeys[taxonomy[t].taxonomy][t] = taxSelects[taxonomy[t].taxonomy].length-1;
                }

                if (!taxLimit || taxLimit.indexOf(t)>-1) {
                  nodes.push({
                    id: 'taxonomy-'+t,
                    oid: t,
                    type: 'taxonomy',
                    tax: taxonomy[t].taxonomy,
                    title: firstUpper(taxonomy[t].name),
                    r: 10,
                    x: (t in oNodeKeys.tax)?oNodes[oNodeKeys.tax[t]].x:0,
                    y: (t in oNodeKeys.tax)?oNodes[oNodeKeys.tax[t]].y:0,
                    // fx:(t in oNodeKeys.tax)?oNodes[oNodeKeys.tax[t]].fx:0,
                    // fy:(t in oNodeKeys.tax)?oNodes[oNodeKeys.tax[t]].fy:0,
                    // indirect connections
                    ico: ico,
                    c: 0,
                  });

                  nodeKeys.tax[t] = nodes.length-1;
                }
              }

              if (!taxLimit || taxLimit.indexOf(t)>-1) {
                nodes[nodeKeys.tax[t]].c++;
                edges.push({
                  source: nodes[nodeKeys.el[key]].id,
                  target: nodes[nodeKeys.tax[t]].id,
                });
              }
            }
          });
        }
      }
    }

    if (individual) {
      rScale = d3.scaleLinear().range([0.5, 5]).domain([1, taxLimit.length]);
    } else {
      rScale = d3.scaleLinear().range([1, 10]).domain([1, d3.max(nodes, (d)=>d.c)]);
    }

    nodes.forEach((n, ni)=>{
      if (individual) {
        if (nodes[ni].type == 'taxonomy') {
          nodes[ni].r = 2.5;
        } else if (id == nodes[ni].oid) {
          nodes[ni].r = 50;
        } else {
          let ct = 0;
          nodes[ni].taxonomy.forEach((t)=>{
            if (taxLimit.indexOf(t)>-1) ct++;
          });
          nodes[ni].r = rScale(ct);
        }
      } else {
        nodes[ni].r = rScale(nodes[ni].c);
      }
    });

    for (const skey in taxSelects) {
      taxSelects[skey].forEach((s)=>{
        addParentSelect(skey, taxonomy[s.value]);
      });

      taxSelects[skey].sort((a, b)=>{
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
      });

      const tempList = [];

      taxSelects[skey].forEach((s)=>{
        if (s.parent == 0) tempList.push(s);
      });

      taxSelects[skey].sort((a, b)=>{
        if (a.name > b.name) return -1;
        if (a.name < b.name) return 1;
        return 0;
      });

      // let depth = 0
      for (let i = 0; i<tempList.length; i++) {
        taxSelects[skey].forEach((s)=>{
          // if(tempList[i].parent == 0) depth = 0
          if (s.parent == tempList[i].value) {
            s.name = (new Array(getDepth(s.value)+1)).join('-') + ' ' + s.name;
            tempList.splice(i+1, 0, s);
          }
        });
      }

      taxSelects[skey] = tempList;

      taxSelectsNodes[skey] = d3.select('#select_'+skey);

      taxSelectsNodes[skey].selectAll('li').remove();
      taxSelectsOptions[skey] = taxSelectsNodes[skey].selectAll('li').data(taxSelects[skey]).enter().append('li')
          .append('a')
          .text((d)=>d.name)
          .attr('data-value', (d)=>d.value)
          .classed('disabled', (d)=>(!d.has)?true:false)
          .on('click', (d) =>{
            module.setSelection(d.value);
            callback(selection);
          });
    }
  };

  module.updateSelects = () => {
    for (const skey in taxSelects) {
      taxSelectsOptions[skey].data(taxSelects[skey]).each(function(d) {
        if (selection.indexOf(d.value)>=0) {
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

  const getDepth = (id) => {
    if (taxonomy[id].parent == 0) {
      return 0;
    } else {
      return 1 + getDepth(taxonomy[id].parent);
    }
  };

  const addParentSelect = (skey, item) => {
    if ((item.parent != 0)&&!(item.parent in taxSelectKeys[skey])) {
      taxSelects[skey].push({name: taxonomy[item.parent].name, value: item.parent, parent: taxonomy[item.parent].parent, has: false, oHas: false});
      taxSelectKeys[skey][item.parent] = taxSelects[skey].length-1;
      addParentSelect(skey, taxSelects[skey][taxSelects[skey].length-1]);
    }
  };

  const ticked = () => {
    node.attr('transform', (d) => {
      const x = d.x = Math.max((d.r+20)-width/2, Math.min(width/2 - (d.r+20), d.x));
      const y = d.y = Math.max((d.r+20)-height/2, Math.min(height/2 - (d.r+20), d.y));

      return `translate(${x},${y})`;
    });

    link.attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
  };

  // let drag = simulation => {

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

  let link = s.append('g')
      .attr('stroke-width', 1)
      .attr('stroke', '#000')
      .attr('stroke-opacity', 0.2)
      .style('pointer-events', 'none')
      .selectAll('line');
  let node = s.append('g').selectAll('g');
  let icons;

  module.updateSimulation = (anim) => {
    if (individual) {
      nodes.sort((a, b)=>{
        if (a.oid == id) return 1;
        return 0;
      });
    }

    simulation
        .nodes(nodes)
        .on('tick', ticked);

    simulation.force('link')
        .links(edges);

    if (anim) {
      simulation
          .alpha(1)
          .restart();
    } else {
      for (let i = 0; i < 80; ++i) simulation.tick();
    }

    link = link.data(edges);
    link.exit().remove();
    link = link.enter().append('line').merge(link);
    link.attr('class', (d)=>{
      let cl = 'connection';
      (['source', 'target']).forEach((t)=>{
        cl += ' ' + d[t].type + '-' + d[t].oid;

        if (d[t].type != 'taxonomy') {
          d[t].taxonomy.forEach((tax)=>{
            cl += ' ico-'+tax;
          });
        }
      });
      return cl.trim();
    });

    node = node.data(nodes, function(d) {
      return d.id;
    });
    node.exit().remove();
    node = node.enter().append('g')
    // .call(drag(simulation))
        .merge(node);
    node.attr('class', (d)=>{
      let cl = 'node '+d.type+'-'+d.oid;
      if ('taxonomy' in d) {
        d.taxonomy.forEach((t)=>{
          cl += ' tax-' + t;
        });
      }
      if (d.type == 'taxonomy') {
        taxonomy[d.oid].direct.forEach((c)=>{
          cl += ' child-'+c;
        });
      }
      if ('ico' in d) {
        d.ico.forEach((t)=>{
          cl += ' ico-' + t;
        });
      }
      return cl.trim();
    });

    node.selectAll('path').remove();

    icons = node.append('path')
        .style('stroke', 'none')
        .attr('d', d3.symbol()
            .size((d)=>d.r*100)
            .type(function(d) {
              if (d.type == 'taxonomy') {
                return d3.symbolCircle;
              } else {
                if
                (d.type == 'institution') {
                  return d3.symbolCross;
                } else if
                (d.type == 'person') {
                  return d3.symbolDiamond;
                } else if
                (d.type == 'project') {
                  return d3.symbolSquare;
                } else if
                (d.type == 'publication') {
                  return d3.symbolTriangle;
                } else {
                  return d3.symbolCircle;
                }
              }
            }))
        .style('fill', (d)=>{
          if (d.type == 'taxonomy') {
            if (d.tax == 'sustainability_keywords') {
              return '#761B41';
            } else {
              return '#0D6B6F';
            }
          } else {
            return '#000';
          }
        })
        .attr('class', (d)=>{
          if (d.type == 'taxonomy') {
            return 'node-'+d.tax;
          } else {
            if (individual && d.oid == id) {
              return 'node-individual';
            } else {
              return 'node-unknown';
            }
          }
        })
        .style('cursor', 'pointer')
        .on('click', (d)=>{
          if (d.type == 'taxonomy') {
            module.setSelection(d.oid);
            callback(selection);
          } else {
            window.location = `https://www.ama-project.org/${d.type}/${d.slug}`;
          }
        })
        .on('mouseover', (d)=>{
          d3.selectAll(`.${d.type}-${d.oid}`).style('stroke-opacity', 1);
          module.updateTooltip(d);
        })
        .on('mouseout', () => {
          tooltip.style('display', 'none');
          if (selection.length > 0) {
            d3.selectAll('.connection').style('stroke-opacity', 0.05);
            module.highlightSelection();
          } else {
            d3.selectAll('.connection').style('stroke-opacity', 0.2);
          }
        });

    if (individual) {
      const icon = d3.select(`.node.${data[id].type}-${id}`);

      const d = icon.datum();

      const item = icon.append('g');
      item.append('circle')
          .attr('r', 40)
          .attr('fill', '#f9f9f9')
          .attr('stroke', '#000')
          .attr('stroke-width', '2px;');

      item.append('image')
          .attr('width', 80)
          .attr('height', 80)
          .attr('x', -40)
          .attr('y', -40)
          .attr('xlink:href', jspath + '/assets/images/icon_'+d.type+'s@2x.png');

      const itembg = item.append('g');
      const itemtext = item.append('g')
          .attr('transform', 'translate(0,43)')
          .append('text')
          .attr('style', 'fill:#fff; font-size:15px; font-style:italic;')
          .text((d.title.length<30)?d.title:d.title.substr(0, 27)+'...')
          .attr('text-anchor', 'middle');
      const itemTextSize = itemtext.node().getBoundingClientRect();

      itembg.append('rect')
          .attr('x', itemTextSize.width/-2-8)
          .attr('y', 27)
          .attr('width', itemTextSize.width+16)
          .attr('height', 24)
          .attr('fill', '#000');
    }
  };

  module.highlightSelection = ()=>{
    if (selection.length > 0) {
      let sel = '';

      nodeSel.each((d)=>{
        if (d.type != 'taxonomy') {
          if (sel!='') sel += ',';
          sel += ' .connection.'+d.type+'-'+d.oid;
        }
      });

      if (sel != '') {
        d3.selectAll(sel).style('stroke-opacity', 0.3);
      }
    }

    if (selection.length == 1) {
      d3.selectAll('.connection.taxonomy-'+selection[0]).style('stroke-opacity', 1);
    } else if (selection.length > 1) {
      // selection.forEach(s=>{
      //   let sel = `.connection.taxonomy-${s}`
      //   selection.forEach(ss=>{
      //     sel += `.ico-${ss}`
      //   })

      // })
    }
  };


  const tooltip = s.append('g').style('display', 'none').style('pointer-events', 'none');
  const tooltipBg = tooltip.append('rect').style('fill', '#fff').attr('height', 47).style('filter', 'url(#shadow)');
  const tooltipTri = tooltip.append('path').attr('d', 'M0,0L15,0L15,15,L0,0Z');
  const tooltipLine = tooltip.append('line').attr('y1', 0).attr('y2', 0).attr('x1', -20);
  const tooltipType = tooltip.append('text').style('fill', '#000').attr('dy', 17).style('font-size', '10px').style('font-family', 'Arial').style('text-transform', 'capitalize');
  const tooltipText = tooltip.append('text').style('fill', '#000').attr('dy', 35).style('font-size', '16px').style('font-family', 'Arial').style('font-weight', 'bold');
  module.updateTooltip = (d)=>{
    let highColor = '#000';

    if (d.type == 'taxonomy') {
      if (d.tax == 'sustainability_keywords') {
        highColor = '#761B41';
      } else {
        highColor = '#0D6B6F';
      }
    }

    tooltipLine.attr('stroke', highColor);
    tooltipTri.attr('fill', highColor);

    tooltip
        .attr('transform', `translate(${d.x+((d.x<0)?20:-20)},${d.y})`);

    const labelTrans = {
      'sustainability_keywords': 'Sustainablity',
      'inner_change_keywords': 'Inner Change',
      'journey_station': 'Journey Stations',
      'ama_role': 'AMA Roles', 'perspective_keywords': 'Perspective',
    };

    tooltipType
        .text((d.type == 'taxonomy')?labelTrans[d.tax]:d.type)
        .attr('text-anchor', (d.x<0)?'start':'end')
        .attr('dx', (d.x<0)?'10':'-10');

    tooltip.style('display', 'block');
    // TODO: Nicer Multiline Tooltips
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

    tooltipText
        .text((d.title.length<30)?d.title:d.title.substr(0, 27)+'...')
        .attr('text-anchor', (d.x<0)?'start':'end')
        .attr('dx', (d.x<0)?'10':'-10');

    let bb = tooltipText.node().getBoundingClientRect();
    const bb1 = tooltipType.node().getBoundingClientRect();

    if (bb1.width > bb.width) bb = bb1;

    // let dir = (d.x>0)?1:-1

    tooltipBg.attr('width', bb.width+20)
        .attr('transform', (d.x<0)?'':`translate(${-(bb.width+20)},0)`);
    tooltipTri.attr('transform', `translate(${(d.x<0)?(bb.width+5):-(bb.width+5)},0) scale(${(d.x<0)?1:-1},1)`);

    tooltipLine
        .attr('x1', (d.x<0)?-20:20)
        .attr('x2', (d.x<0)?(bb.width+20):-(bb.width+20));
  };

  module.responsive = ()=>{
    svg
        .attr('width', width)
        .attr('height', height);
    s.attr('transform', `translate(${width/2},${height/2})`);
  };

  module.responsive();

  window.addEventListener('resize', debounce(()=>{
    module.updateSize();
    module.responsive();
  }));

  module.buildNetwork();
  module.updateSimulation(false);

  module.svg = () => svg;

  return module;
};
