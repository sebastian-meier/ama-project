/* exported hibipart, hibipartVis */
/* global d3 */


/*
   TODOS

  - Present filter results below (with more filters + time + author)
  - show which ones are click able
  - add tooltip
  - Only one -1 filter on each side ??

*/

const hibipart = (function() {
  const module = {};
  const nodes = {};
  const structure = {};
  let edges;
  let arcFilters = [];
  let arcEFilters = [];
  let sideAccessor = function(d) {
    return d.side;
  };
  let nameAccessor = function(d) {
    return d.name;
  };
  let idAccessor = function(d) {
    return d.id;
  };
  let parentAccessor = function(d) {
    return d.parent;
  };
  let sortFunction = function(a, b) {
    if (a.side < b.side) {
      return -1;
    } else if (a.side > b.side) {
      return 1;
    } else {
      if (a.side != 'c_ic') {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      } else {
        if (a.name > b.name) {
          return -1;
        }
        if (a.name < b.name) {
          return 1;
        }
        return 0;
      }
    }
  };

  module.init = function(nodesData, edgesData) {
    nodesData.forEach(function(d) {
      nodes[idAccessor(d)] = {
        edges: {direct: {}, all: {}, fDirect: {}, fAll: {}},
        count: 0,
        level: 0,
        directCount: 0,
        path: [], oPath: [],
        visible: (parentAccessor(d)==-1)?true:false,
        side: sideAccessor(d),
        name: nameAccessor(d),
        id: idAccessor(d),
        parent: parentAccessor(d),
        children: [],
        o: d,
      };
    });

    edges = edgesData.filter(function(d) {
      if ((d.source in nodes) && (d.target in nodes)) {
        return true;
      } else {
        return false;
      }
    });

    module.parse();
  };

  module.parse = function() {
    // Gather hash info on the tree structure for faster access
    const tnodes = [];
    for (const id in nodes) {
      tnodes.push(nodes[id]);
    }

    while (tnodes.length > 0) {
      for (let i = tnodes.length-1; i>=0; i--) {
        const side = tnodes[i].side;
        const parent = tnodes[i].parent;
        const id = tnodes[i].id;
        const name = tnodes[i].name;

        if (parent == -1) {
          if (!(side in structure)) {
            structure[side] = [];
          }
          structure[side].push({
            id: id,
            count: 0,
            level: 0,
            directCount: 0,
            side: side,
            name: name,
            children: [],
            edges: {direct: {}, all: {}},
          });

          nodes[id].path=[structure[side].length-1];
          nodes[id].oPath=[id];

          tnodes.splice(i, 1);
        } else if (nodes[parent].path.length > 0) {
          const path = nodes[parent].path;
          const oPath = nodes[parent].oPath;
          let s = structure[side][path[0]].children;
          for (let si = 1; si<path.length; si++) {
            s = s[path[si]].children;
          }
          s.push({
            id: id,
            count: 0,
            level: path.length,
            directCount: 0,
            name: name,
            children: [],
            edges: {direct: {}, all: {}},
          });

          nodes[parent].children.push(id);

          nodes[id].path=path.concat([s.length-1]);
          nodes[id].oPath=oPath.concat([id]);

          tnodes.splice(i, 1);
        }
      }
    }

    // Sort the table and then update the hash accordingly
    for (const side in structure) {
      module.sort(structure[side]);
      module.hashOut(structure[side], []);
    }

    edges.forEach(function(e) {
      nodes[e.source].edges.direct[e.target] = e.weight;
      nodes[e.target].edges.direct[e.source] = e.weight;
    });

    module.update();
  };

  module.hashOut = function(_nodes, _path) {
    _nodes.forEach(function(n, ni) {
      nodes[n.id].path = _path.concat([ni]);
      if ('children' in n) {
        module.hashOut(n.children, _path.concat([ni]));
      }
    });
  };

  module.sort = function(nodes) {
    nodes.sort(sortFunction);
    nodes.forEach(function(n) {
      if ('children' in n) {
        module.sort(n.children);
      }
    });
  };

  module.getStructure = function() {
    return structure;
  };

  module.getNodes = function() {
    return nodes;
  };

  module.update = function() {
    module.count(nodes);

    for (const side in structure) {
      module.updateStructure(nodes, structure[side]);
    }

    return structure;
  };

  module.count = function(nodes) {
    for (const nID in nodes) {
      nodes[nID].visible = (nodes[nID].parent == -1)?true:(arcFilters.indexOf(parseInt(nodes[nID].parent))>=0)?true:false;
    }

    for (const nID in nodes) {
      if (nodes[nID].parent == -1) {
        module.countChildren(nodes[nID]);
      }
    }
  };

  module.countChildren = function(node) {
    const nID = parseInt(node.id); const dummy = {edges: {}};
    dummy.edges.fAll = nodes[nID].edges.fAll = {};
    dummy.edges.fDirect = nodes[nID].edges.fDirect = {};
    dummy.count = nodes[nID].count = 0;
    dummy.directCount = nodes[nID].directCount = 0;

    // eslint-disable-next-line guard-for-in
    for (const eID in nodes[nID].edges.direct) {
      let pi = nodes[eID].oPath.length-1;
      let add = arcFilters.length;
      while (!nodes[nodes[eID].oPath[pi]].visible) {
        pi--;
      }


      if (arcFilters.length >= 1) {
        add = 0;

        if (arcEFilters.length == 1) {
          if (arcEFilters.indexOf(nID)>=0 || arcEFilters.indexOf(parseInt(eID))>=0) {
            add = arcFilters.length;
          }

          if (arcEFilters.indexOf(parseInt(nodes[nID].parent))>=0 || arcEFilters.indexOf(parseInt(nodes[eID].parent))>=0) {
            add = arcFilters.length;
          }
        } else if (arcEFilters.length > 1) {
          if (arcEFilters.indexOf(parseInt(nID))>=0 && arcEFilters.indexOf(parseInt(eID))>=0) {
            add = arcFilters.length;
          }

          if (arcEFilters.indexOf(parseInt(nodes[nID].parent))>=0 && arcEFilters.indexOf(parseInt(nodes[eID].parent))>=0 && nodes[eID].parent != nodes[nID].parent) {
            add = arcFilters.length;
          }

          if (arcEFilters.indexOf(parseInt(nID))>=0 && arcEFilters.indexOf(parseInt(nodes[eID].parent))>=0 && nodes[eID].parent != nID) {
            add = arcFilters.length;
          }

          if (arcEFilters.indexOf(parseInt(nodes[nID].parent))>=0 && arcEFilters.indexOf(parseInt(eID))>=0 && eID != nodes[nID].parent) {
            add = arcFilters.length;
          }
        }
      }

      if (add >= arcFilters.length) {
        dummy.directCount += nodes[nID].edges.direct[eID];
        if (!(nodes[eID].oPath[pi] in dummy.edges.fDirect)) {
          dummy.edges.fDirect[nodes[eID].oPath[pi]] = {c: 0};
        }
        dummy.edges.fDirect[nodes[eID].oPath[pi]].c += nodes[nID].edges.direct[eID];

        if (nodes[eID].oPath[pi] != nID) {
          dummy.count += nodes[nID].edges.direct[eID];
          if (!(nodes[eID].oPath[pi] in dummy.edges.fAll)) {
            dummy.edges.fAll[nodes[eID].oPath[pi]] = {c: 0};
          }
          dummy.edges.fAll[nodes[eID].oPath[pi]].c += nodes[nID].edges.direct[eID];
        }
      }
    }

    for (let i = 0; i<nodes[nID].children.length; i++) {
      const fAll = module.countChildren(nodes[nodes[nID].children[i]]);

      for (const rID in fAll) {
        if (arcFilters.indexOf(parseInt(nID))>=0) {// } && nodes[nID].children.indexOf(parseInt(rID))>=0){
          // ignore
        } else {
          if (!(rID in dummy.edges.fAll)) {
            dummy.edges.fAll[rID] = {c: 0};
          }
          dummy.edges.fAll[rID].c += fAll[rID].c;
          dummy.count += fAll[rID].c;
        }
      }
    }

    if (nodes[nID].visible) {
      nodes[nID].edges.fAll = dummy.edges.fAll;
      nodes[nID].edges.fDirect = dummy.edges.fDirect;
      nodes[nID].count = dummy.count;
      nodes[nID].directCount = dummy.directCount;
    }

    return dummy.edges.fAll;
  };

  module.updateStructure = function(nodes, structure) {
    structure.forEach(function(s) {
      s.count = nodes[s.id].count;
      s.directCount = nodes[s.id].directCount;
      s.edges.direct = nodes[s.id].edges.fDirect;
      s.edges.all = nodes[s.id].edges.fAll;
      module.updateStructure(nodes, s.children);
    });
  };

  // According to several benchmarks manually cloning objects is a lot faster than using other methods e.g. JSON.parse/stringify, for...in, etc.
  module.clone = function(source, target) {
    source.forEach(function(s) {
      target.push({
        id: s.id,
        count: s.count,
        directCount: s.directCount,
        name: s.name,
        children: [],
      });
      module.clone(s.children, target[target.length-1].children);
    });
  };

  module.reset = function() {
    arcFilters = [];
    return module.update();
  };

  module.filter = function(id) {
    if (!(id in nodes)) {
      // console.log('invalid id:', id);
      return false;
    }
    if (arcFilters.indexOf(parseInt(id))<0) {
      filterArcs(id);
      return module.update();
    } else {
      // console.log('filter already set');
      return structure;
    }
  };

  function filterArcs(id) {
    if (arcFilters.indexOf(parseInt(id))<0) {
      arcFilters.push(id);
      module.updateFilterStructure();
    }
    if (nodes[id].parent > -1) {
      filterArcs(nodes[id].parent);
    }
  }

  module.unFilter = function(id) {
    if (!(id in nodes)) {
      // console.log('invalid id:', id);
      return false;
    }
    if (arcFilters.indexOf(parseInt(id))<0) {
      // console.log('filter not set');
      return structure;
    } else {
      arcFilters.splice(arcFilters.indexOf(parseInt(id)), 1);
      module.updateFilterStructure();
      unfilterChildArcs(id);
      return module.update();
    }
  };

  module.updateFilterStructure = function() {
    arcEFilters = [];
    const banFilters = [];
    arcFilters.forEach(function(a) {
      if (nodes[a].parent != -1) {
        banFilters.push(nodes[a].parent);
      }
    });
    arcFilters.forEach(function(a) {
      if (banFilters.indexOf(a)<0) {
        arcEFilters.push(a);
      }
    });

    // console.log(arcFilters, arcEFilters)
  };

  function unfilterChildArcs(id) {
    const removed = [];
    arcFilters.forEach(function(f) {
      if (nodes[f].parent == id) {
        removed.push(f);
      }
    });
    if (removed.length >= 1) {
      removed.forEach(function(r) {
        arcFilters.splice(arcFilters.indexOf(parseInt(r)), 1);
        unfilterChildArcs(r);
      });
    }
  }

  module.getArcFilters = function() {
    return arcFilters;
  };

  module.getArcEFilters = function() {
    return arcEFilters;
  };

  // setting accessors, etc.

  module.idAccessor = function(_idAccessor) {
    idAccessor = _idAccessor;
    return module;
  };

  module.parentAccessor = function(_parentAccessor) {
    parentAccessor = _parentAccessor;
    return module;
  };

  module.sideAccessor = function(_sideAccessor) {
    sideAccessor = _sideAccessor;
    return module;
  };

  module.nameAccessor = function(_nameAccessor) {
    nameAccessor = _nameAccessor;
    return module;
  };

  module.sortFunction = function(_sortFunction) {
    sortFunction = _sortFunction;
    return module;
  };

  return module;
});

const hibipartVis = (function(_container, _callback) {
  const module = {
    set selection(_selection) {
      arcFilters = _selection;
    },
    get selection() {
      return arcFilters;
    },
  };
  let bipart;
  const callback = _callback;
  let structure; let nodes;
  let sides;
  let width;
  const container = _container;
  const labelSides = {};
  let height;
  const arc = d3.arc();
  const labelWidth = 250;
  const padding = 50;
  const outerArcs = {};
  let g; let radius; let gEdges; let gArcs; const gLabels = {};
  let gap = Math.PI/180*0.5;

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
    title: 'Sustainability & Inner Change',
    text: 'The visualisation explores the relationship between the Sustainability and Inner Change taxonomy.',
    buttons: [
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-2', {
    title: 'Sustainability & Inner Change',
    text: 'Select taxonomies in order to dive deeper into the topic.',
    attachTo: '.label left',
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-3', {
    title: 'Sustainability & Inner Change',
    text: 'You can use the type filters narrow down the results to a specific type.',
    attachTo: {element: '#type-nav', on: 'top'},
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-4', {
    title: 'Sustainability & Inner Change',
    text: 'Selecting taxonomies act as filters. The number of resulting items is displayed below.',
    attachTo: {element: '#result-display', on: 'top'},
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-5', {
    title: 'Sustainability & Inner Change',
    text: 'All filtered items are displayed as a list below the visualisation.',
    attachTo: '.connection top',
    scrollTo: true,
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.cancel, text: 'Exit &times;'},
    ],
  }).on('before-show', module.scrollTop);

  container.append('button')
      .attr('id', 'master-help-button')
      .text('?')
      .on('click', ()=>{
        module.tour.start();
      });

  module.responsive = function() {
    svg.attr('width', width)
        .attr('height', height);

    g.attr('transform', 'translate('+(width/2)+','+(height/2)+')');

    updateRadius();

    arc.innerRadius(radius+5)
        .outerRadius(radius+10);

    for (const side in structure) {
      outerArcs[side].attr('d', arc);
    }

    module.update();
  };

  module.render = function() {
    g = svg.append('g').attr('transform', 'translate('+(width/2)+','+(height/2)+')');
    gEdges = g.append('g');
    gArcs = g.append('g');

    updateRadius();

    // increase radius so it matches the height
    // find angle closest to 0/180/360 or find out if one of the angles crosses one of each
    arc.innerRadius(radius+5)
        .outerRadius(radius+10);

    /* _____DEV_____*/
    for (const side in structure) {
      outerArcs[side] = gArcs.append('path')
          .attr('class', 'l1')
          .datum({startAngle: sides[side].start, endAngle: sides[side].end})
          .attr('d', arc);

      gLabels[side] = g.append('g');
    }
    /* _____DEV_____*/

    module.draw();
  };

  module.draw = function() {
    // Figuring out which side has the most connections and using that as a reference

    let multi = Math.PI*2; const sums = {}; let biggestGap = 0; let biggestSum = 0; const sideGaps = {};

    for (const side in structure) {
      const result = countChildren(structure[side]);
      const sum = result[0];
      const gaps = result[1];

      // TODO: Possible too many gaps, because some arcs are empty...

      sums[side] = sum;
      sideGaps[side] = gaps-1;
      const tMulti = (sides[side].end-sides[side].start - (gaps-1) * gap)/sum;
      if (tMulti < multi) {
        multi = tMulti;
        biggestSum = sum;
        biggestGap = gaps-1;
      }
    }

    // Set start/end angle for all groups
    for (const side in structure) {
      labelSides[side] = [];
      const offset = sides[side].start + (biggestSum-sums[side])/2*multi + (biggestGap-sideGaps[side])*gap/2;
      arcGroup(offset, multi, structure[side], 0, side);
      buildLabels(side);
    }

    // Calculate the distance between source and target edge group and sort them thereby
    for (const side in structure) {
      structure[side].forEach(function(node) {
        sortEdges(node, 'oAll', 'oKeys', 'all');
        sortEdges(node, 'oDirect', 'oDKeys', 'direct');
      });
    }

    // //Calculate the position of the edges within the group
    for (const side in structure) {
      setAngles(structure[side], multi);
    }

    drawEdges();
  };

  function updateRadius() {
    if (width && height) {
      radius = (width<height)?width/2:height/2;
      const peaks = [0, 180, 360]; let peak = false; let closestPeak = false; let peakDiff = 360;
      for (const side in sides) {
        // check if one crosses a peak
        peaks.forEach(function(p) {
          if (sides[side].start < p && sides[side].end > p) {
            peak = true;
          } else if (!peak) {
            (['start', 'end']).forEach(function(a) {
              const diff = Math.abs(sides[side][a]-p);
              if (diff<peakDiff) {
                peakDiff = diff;
                closestPeak = sides[side][a];
              }
            });
          }
        });
      }

      if (peak) {
        closestPeak = 0;
      }

      radius = height/2-2*padding;
      const p = polarToCartesian(closestPeak, radius);
      radius = radius / Math.abs(p[1]) * (height/2-2*padding);

      // max radius
      if (width/2-radius < labelWidth+padding) {
        radius = width/2-labelWidth-padding;
      }
    }
  }

  function countChildren(_structure) {
    let sum = 0;
    let gaps = 0;
    _structure.forEach(function(node) {
      if (nodes[node.id].visible) {
        if (arcFilters.indexOf(parseInt(node.id))>=0) {
          const result = countChildren(node.children);
          sum += result[0];
          sum += node.directCount;
          if (node.directCount>0) {
            gaps++;
          }
          gaps += result[1];
        } else {
          sum += node.count;
          if (node.count > 0) {
            gaps++;
          }
        }
      }
    });
    return [sum, gaps];
  }

  function countChildrenArc(_structure) {
    let sum = 0;
    let gaps = 0;
    _structure.forEach(function(node) {
      if (nodes[node.id].visible) {
        if (arcFilters.indexOf(parseInt(node.id))>=0) {
          const result = countChildrenArc(node.children);
          sum += result[0];
          sum += node.directCount;
          if (node.directCount>0) {
            gaps++;
          }
          gaps += result[1];
        } else {
          sum += node.count;
          if (node.count > 0) {
            gaps++;
          }
        }
      }
    });
    return [sum, gaps];
  }

  function setAngles(_structure, multi) {
    _structure.forEach(function(node) {
      let oOffset = node.a1;
      let dOffset = node.a1;

      node.edges.oAll.forEach(function(n) {
        n['a1'] = oOffset;
        oOffset += n.c * multi;
        n['a2'] = oOffset;
      });

      node.edges.oDirect.forEach(function(n) {
        n['a1'] = dOffset;
        dOffset += n.c * multi;
        n['a2'] = dOffset;
      });

      setAngles(node.children, multi);
    });
  }

  function sortEdges(node, sortKey, keyKey, key) {
    const sourceAngle = node.a2;
    node.edges[sortKey] = [];
    node.edges[keyKey] = {};

    for (const eID in node.edges[key]) {
      let targetAngle = walkPath(structure[nodes[eID].side], nodes[eID].path, 0).a1;
      if (targetAngle<sourceAngle) {
        targetAngle+=Math.PI*2;
      }
      let diff = targetAngle - sourceAngle;
      if (diff>Math.PI) {
        // diff = (Math.PI*2-targetAngle) + sourceAngle;
      }
      if (eID == nodes[node.id].parent) {
        diff = Math.PI*2;
      }
      node.edges[sortKey].push({id: eID, angle: diff, c: node.edges[key][eID].c});
    }

    node.edges[sortKey].sort(function(a, b) {
      if (a.angle < b.angle) {
        return 1;
      }
      if (a.angle > b.angle) {
        return -1;
      }
      return 0;
    });

    node.edges[sortKey].forEach(function(e, ei) {
      node.edges[keyKey][e.id] = ei;
    });

    node.children.forEach(function(c) {
      sortEdges(c, sortKey, keyKey, key);
    });
  }

  function arcGroup(offset, multi, structure, level, side) {
    const arc = d3.arc()
        .innerRadius(radius-level*10-5)
        .outerRadius(radius-level*10);

    structure.forEach(function(node) {
      if ((nodes[node.id].visible && node.count > 0) || arcFilters.indexOf(parseInt(node.id))>=0) {
        node['a1'] = offset;
        if (arcFilters.indexOf(parseInt(node.id))>=0) {
          const childOffset = countChildrenArc(node.children);
          offset += nodes[node.id].directCount*multi + childOffset[0]*multi + gap*childOffset[1];
        } else {
          offset += nodes[node.id].count*multi;
        }
        node['a2'] = offset;
      }

      if (node.a1 == undefined) {
        node['a1'] = offset;
      }
      if (node.a2 == undefined) {
        node['a2'] = offset;
      }

      let oldA1 = node.a1; let oldA2 = node.a2;

      const old = gArcs.select('#arc'+node.id);
      if (!old.empty()) {
        const datum = old.datum();
        oldA2 = datum.endAngle;
        oldA1 = datum.startAngle;
      } else {
        gArcs.append('path')
            .attr('class', 'arc l2')
            .attr('id', 'arc'+node.id)
            .on('mouseover', function() {
              const id = (d3.select(this).datum()).id;
              d3.selectAll('svg .edge,svg .label').style('opacity', 0.2);
              d3.selectAll('.arc').style('fill', 'rgba(150,150,150,1)');
              d3.selectAll('#arc'+id).style('fill', 'rgba(70,70,70,1)');
              d3.selectAll('#label'+id).style('opacity', 1);
              d3.selectAll('.e-'+id).style('opacity', 1);
            })
            .on('mouseout', function() {
              d3.selectAll('.arc').style('fill', 'rgba(70,70,70,1)');
              d3.selectAll('svg .edge,svg .label').style('opacity', 1);
            })
            .on('click', function(d) {
              if (arcFilters.indexOf(parseInt(d.id))>=0) {
                callback(d.id, false);
              } else if ((d.parent == -1 || (arcFilters.indexOf(parseInt(d.parent)) >= 0 && d.level == arcFilters.length))) {// &&nodes[d.id].children.length>=1){
                callback(d.id, true);
              }
            });
      }

      if ((!nodes[node.id].visible || node.count <= 0)&&arcFilters.indexOf(parseInt(node.id))<0) {
        node.a2 = node.a1;
      }

      gArcs.select('#arc'+node.id)
          .datum({startAngle: oldA1, endAngle: oldA2, id: node.id, level: level, parent: nodes[node.id].parent})
          .attr('d', arc)
          .transition()
          .duration(200)
          .attrTween('d', arcTween(node.a1, node.a2, arc));

      labelSides[side].push({
        id: node.id,
        name: nodes[node.id].name,
        a1: node.a1,
        a2: node.a2,
        radius: radius-level*10,
        level: node.level,
        count: node.count,
        directCount: node.directCount,
        visible: nodes[node.id].visible,
      });

      if (node.children.length > 0) {
        node['multi'] = getMulti(node.children, node.a1, node.a2, nodes[node.id].directCount);
        let extraOffset = 0;
        for (const eID in node.edges.direct) {
          extraOffset += node.edges.direct[eID].c*multi;
        }
        arcGroup(node.a1+extraOffset, multi, node.children, level+1, side);
      }

      offset += gap;
    });
  }

  function buildLabels(side) {
    labelSides[side].sort(function(a, b) {
      if (side != 'c_ic') {
        return a.a1 - b.a1;
      } else {
        return b.a2 - a.a2;
      }
    });

    let activeLabels = 0;

    labelSides[side].forEach(function(l) {
      if ((l.visible && l.count > 0) || arcFilters.indexOf(parseInt(l.id))>=0) {
        l['c'] = activeLabels;
        activeLabels++;
      }
    });

    labelSides[side].forEach(function(l) {
      let label = d3.selectAll('#label'+l.id);
      if ((l.visible && l.count > 0) || arcFilters.indexOf(parseInt(l.id))>=0) {
        const cFont = 16 - 2*l.level;

        if (label.empty()) {
          label = gLabels[side].append('g')
              .attr('id', 'label'+l.id)
              .attr('class', 'label')
              .attr('transform', `translate(${(side!='c_ic')?width/2-labelWidth+l.level*5:-width/2+labelWidth-l.level*5},${padding -height/2 + (l.c+1)*(height-2*padding)/(activeLabels+1)})`);

          label.append('text')
              .style('font-size', cFont)
              .attr('text-anchor', (side!='c_ic')?'start':'end');

          label.append('path')
              .style('fill', 'transparent')
              .style('stroke', 'rgba(0,0,0,0.2)')
              .style('stroke-dasharray', '3 3');

          const icon = label.append('g').attr('transform', 'translate('+((side!='c_ic')?-14:10)+',-'+cFont/2+')').attr('class', 'icon').style('display', 'none');
          icon.append('circle')
              .attr('cx', 2.5)
              .attr('cy', 2.5)
              .attr('r', 5);
          icon.append('line')
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', 5)
              .attr('y2', 5);
          icon.append('line')
              .attr('x1', 5)
              .attr('y1', 0)
              .attr('x2', 0)
              .attr('y2', 5);

          label.append('rect')
              .datum({id: l.id})
              .attr('y', -cFont-1)
              .style('fill', 'transparent')
              .style('cursor', 'pointer')
              .attr('height', cFont+4)
              .on('mouseover', function() {
                const id = (d3.select(this).datum()).id;
                d3.selectAll('svg .edge,svg .label').style('opacity', 0.2);
                d3.selectAll('.arc').style('fill', 'rgba(150,150,150,1)');
                d3.selectAll('#arc'+id).style('fill', 'rgba(70,70,70,1)');
                d3.selectAll('#label'+id).style('opacity', 1);
                d3.selectAll('.e-'+id).style('opacity', 1);
              })
              .on('mouseout', function() {
                d3.selectAll('.arc').style('fill', 'rgba(70,70,70,1)');
                d3.selectAll('svg .edge,svg .label').style('opacity', 1);
              })
              .on('click', function() {
                if (arcFilters.indexOf(parseInt(l.id))>=0) {
                  callback(l.id, false);
                } else if ((nodes[l.id].parent == -1 || arcFilters.indexOf(parseInt(nodes[l.id].parent)) >= 0)) {// && nodes[d.id].children.length>=1){
                  callback(l.id, true);
                }
              });
        }

        label.select('text')
            .style('font-weight', (arcFilters.indexOf(parseInt(l.id))>=0)?'bold':'normal')
            .html(`${shortenStr(l.name, 30)}`); // ${(l.count>0)?'('+l.count+')':''} > this is confusing for most people

        const bb = label.node().getBBox();

        label.select('rect')
            .attr('x', (side!='c_ic')?-2:-(bb.width+2))
            .attr('width', bb.width+4);

        const pp = polarToCartesian((l.a1 > 0 && l.a1 < Math.PI)?l.a1:l.a2, l.radius);
        const ppp = polarToCartesian((l.a1 > 0 && l.a1 < Math.PI)?l.a1:l.a2, l.radius+50);

        label.select('path').transition()
            .duration(200)
            .attr('d', `M${(side!='c_ic')?-5:5} ${-cFont/2+3}C${(side!='c_ic')?-30:30} ${-cFont/2+3},${((side!='c_ic')?-width/2+labelWidth+l.level*5:width/2-labelWidth+l.level*5)+ppp[0]} ${(height/2 - (l.c+1)*height/(activeLabels+1))+ppp[1]},${((side!='c_ic')?-width/2+labelWidth+l.level*5:width/2-labelWidth+l.level*5)+pp[0]} ${(height/2 - (l.c+1)*height/(activeLabels+1))+pp[1]}`);

        label.transition()
            .duration(200)
            .attr('transform', `translate(${(side!='c_ic')?width/2-labelWidth+l.level*5:-width/2+labelWidth-l.level*5},${padding -height/2 + (l.c+1)*(height-2*padding)/(activeLabels+1)})`);

        if ( arcFilters.indexOf(parseInt(l.id)) >= 0 ) {
          label.select('.icon').style('display', 'block');
        } else {
          label.select('.icon').style('display', 'none');
        }
      } else {
        if (!label.empty()) {
          label
              .classed('noani', true)
              .transition()
              .duration(500)
              .style('opacity', 0)
              .on('end', function() {
                d3.select(this).remove();
              });
        }
      }
    });
  }

  function arcTween(endAngle, startAngle, arc) {
    return function(d) {
      const interpolateEnd = d3.interpolate(d.endAngle, endAngle);
      const interpolateStart = d3.interpolate(d.startAngle, startAngle);
      return function(t) {
        d.endAngle = interpolateEnd(t);
        d.startAngle = interpolateStart(t);
        return arc(d);
      };
    };
  }

  function getMulti(structure, start, end, direct) {
    let sum = direct;
    structure.forEach(function(node) {
      sum += node.count;
    });
    const multi = (end-start - (structure.length-1) * gap)/sum;
    return multi;
  }

  module.update = function() {
    d3.selectAll('.edge')
        .classed('noani', true)
        .transition()
        .duration(100)
        .style('opacity', 0)
        .on('end', function() {
          d3.select(this).remove();
        });

    module.draw();
  };

  let drawn = {};

  function drawEdges() {
    drawn = {};

    for (const id in nodes) {
      const node = nodes[id];
      const sNode = walkPath(structure[node.side], node.path, 0);

      if (sNode.count > 0) {
        sNode.edges.oAll.forEach(function(edge) {
          const id1 = (id<edge.id)?id:edge.id;
          const id2 = (id>edge.id)?id:edge.id;
          let exists = true;
          const nEdge = nodes[edge.id];
          const sEdge = walkPath(structure[nEdge.side], nEdge.path, 0);

          if (!(id1 in drawn)) {
            drawn[id1] = {}; exists = false;
          }
          if (!(id2 in drawn[id1])) {
            drawn[id1][id2] = true; exists = false;
          }

          if (!exists) {
            let a1 = false;
            let a2 = false;
            // c1, c2;

            a1 = sEdge.edges.oAll[sEdge.edges.oKeys[id]].a1;
            a2 = sEdge.edges.oAll[sEdge.edges.oKeys[id]].a2;
            // c1 = sEdge.edges.oAll[sEdge.edges.oKeys[id]].c;

            if (arcFilters.indexOf(parseInt(edge.id))>=0) {
              a1 = sEdge.edges.oDirect[sEdge.edges.oDKeys[id]].a1;
              a2 = sEdge.edges.oDirect[sEdge.edges.oDKeys[id]].a2;
              // c1 = sEdge.edges.oDirect[sEdge.edges.oDKeys[id]].c;
            }

            let aa1 = sNode.edges.oAll[sNode.edges.oKeys[edge.id]].a1;
            let aa2 = sNode.edges.oAll[sNode.edges.oKeys[edge.id]].a2;
            // c2 = sNode.edges.oAll[sNode.edges.oKeys[edge.id]].c;

            if (arcFilters.indexOf(parseInt(id))>=0) {
              aa1 = sNode.edges.oDirect[sNode.edges.oDKeys[edge.id]].a1;
              aa2 = sNode.edges.oDirect[sNode.edges.oDKeys[edge.id]].a2;
              // c2 = sNode.edges.oDirect[sNode.edges.oDKeys[edge.id]].c;
            }

            // console.log(c1, c2, id, edge.id)

            if (a1 && a2) {
              const sourceRadius = radius-(nEdge.path.length-1)*10-5;
              const targetRadius = radius-(node.path.length-1)*10-5;

              const line1 = createConnection(a2, aa1, (id == edge.id)?true:false, sourceRadius, targetRadius);
              const line2 = createConnection(aa2, a1, (id == edge.id)?true:false, targetRadius, sourceRadius);

              gEdges.append('path')
                  .datum({nodes: [id, edge.id]})
                  .style('fill', 'rgba(0,0,0,0.5)')
                  .style('opacity', 0)
              // .attr('title', id+'('+ JSON.stringify(node.edges.all[nnode.id]) +') '+nnode.id+'('+ JSON.stringify(nnode.edges.all[node.id]) +')')
                  .attr('class', 'edge '+((line1[4])?'r1 ':'')+((line2[4])?'r2 ':'')+'e-'+id+' e-'+edge.id)
                  .attr('d', 'M '+line1[0][0]+' '+line1[0][1]+
                              ' C '+line1[1][0]+' '+line1[1][1]+' '+line1[2][0]+' '+line1[2][1]+' '+line1[3][0]+' '+line1[3][1]+
                              ' A '+radius+' '+targetRadius+' 0 0 1 '+line2[0][0]+' '+line2[0][1]+
                              ' C '+line2[1][0]+' '+line2[1][1]+' '+line2[2][0]+' '+line2[2][1]+' '+line2[3][0]+' '+line2[3][1]+
                              ' A '+radius+' '+sourceRadius+' 0 0 1 '+line1[0][0]+' '+line1[0][1]+'Z')
                  .on('mouseover', function() {
                    d3.selectAll('.edge').style('opacity', 0.2);
                    d3.selectAll('svg .label').style('opacity', 0.2);
                    d3.select(this).style('opacity', 1);
                    d3.selectAll('.arc').style('fill', 'rgba(150,150,150,1)');
                    (d3.select(this).datum()).nodes.forEach(function(n) {
                      d3.select('#arc'+n).style('fill', 'rgba(70,70,70,1)');
                      d3.select('#label'+n).style('opacity', 1);
                    });
                  })
                  .on('mouseout', function() {
                    d3.selectAll('svg .label').style('opacity', 1);
                    d3.selectAll('.edge').style('opacity', 1);
                    d3.selectAll('.arc').style('fill', 'rgba(70,70,70,1)');
                  })
                  .on('click', function() {
                    (d3.select(this).datum()).nodes.forEach(function(n) {
                      callback(n, true);
                    });
                  })
                  .transition()
                  .delay(100)
                  .duration(100)
                  .style('opacity', 1);
            }
          }
        });
      }
    }
  }

  function walkPath(structure, path, level) {
    if (path.length-1 > level) {
      return walkPath(structure[path[level]].children, path, level+1);
    }
    return structure[path[level]];
  }

  function createConnection(sourceAngle, targetAngle, same, sRadius, tRadius) {
    const line = []; let diff; let control;
    const reverse = false;
    if (targetAngle < sourceAngle) {
      // targetAngle += Math.PI*2;
      diff = Math.abs(sourceAngle-targetAngle);
      if (diff>Math.PI) {
        diff -= Math.PI*2;
      }
      if (diff>Math.PI) {/* console.log('huh1', sourceAngle, targetAngle);*/}
      control = (1-Math.sqrt(Math.abs(diff)/Math.PI))*(((sRadius<tRadius)?sRadius:tRadius)*0.99);
    } else {
      // modify innerRadius based on distance
      diff = Math.abs(sourceAngle-targetAngle);
      if (diff>Math.PI) {
        diff = sourceAngle + (Math.PI*2 - targetAngle);
      }
      if (diff>Math.PI) {/* console.log('huh2', sourceAngle, targetAngle);*/}
      control = (1-Math.sqrt(Math.abs(diff)/Math.PI))*(((sRadius<tRadius)?sRadius:tRadius)*0.99);
    }

    if (same) {
      control = radius - 10 - (Math.sqrt(Math.abs(diff)/Math.PI))*30;
    }

    if (reverse) {
      line.push(polarToCartesian(targetAngle, tRadius));
      line.push(polarToCartesian(targetAngle, control));
      line.push(polarToCartesian(sourceAngle, control));
      line.push(polarToCartesian(sourceAngle, sRadius));
      line.push(true);
    } else {
      line.push(polarToCartesian(sourceAngle, sRadius));
      line.push(polarToCartesian(sourceAngle, control));
      line.push(polarToCartesian(targetAngle, control));
      line.push(polarToCartesian(targetAngle, tRadius));
      line.push(false);
    }

    return line;
  }

  function shortenStr(str, len) {
    if (str.length > len) return str.substring(0, len-3)+'...';
    return str;
  }

  // function radians(angle){
  //   return Math.PI/180 * angle;
  // }

  /**
    * Calculates x,y coordinates for angle, radius based on the polar-cartesian function
    * @param theta (float) angle in radians
    * @param radius (float)
    * @returns array of x,y coordinates
    */

  function polarToCartesian(theta, radius) {
    theta += Math.PI/180*-90;
    const returnFloat = [0.0, 0.0];
    returnFloat[0] = radius * Math.cos(theta);
    returnFloat[1] = radius * Math.sin(theta);
    return returnFloat;
  }

  /**
    * Calculates angle, radius for x,y coordinates based on the polar-cartesian function
    * @param x (float)
    * @param y (float)
    * @returns array of angle, radius
    */

  // function cartesianToPolar(x, y) {
  //   var returnFloat = [0.0 , 0.0];
  //   returnFloat[0] = Math.atan2( y , x );
  //   returnFloat[1] = Math.sqrt( x * x + y * y );
  //   return returnFloat;
  // }

  module.bipart = function(_bipart) {
    bipart = _bipart;
    module.linkModules();
    return module;
  };

  module.reset = function(noUpdate) {
    bipart.reset();
    if (noUpdate) {

    } else {
      module.linkModules();
      module.update();
    }
  };

  module.unFilter = function(id, noUpdate) {
    bipart.unFilter(id);
    if (noUpdate) {

    } else {
      module.linkModules();
      module.update();
    }
  };

  module.filter = function(id, noUpdate) {
    bipart.filter(id);
    if (noUpdate) {

    } else {
      module.linkModules();
      module.update();
    }
  };

  module.linkModules = function() {
    module.data(bipart.getStructure(), bipart.getNodes());
    module.arcFilters(bipart.getArcFilters());
    module.arcEFilters(bipart.getArcEFilters());
  };

  module.data = function(_structure, _nodes) {
    structure = _structure;
    nodes = _nodes;
    return module;
  };

  module.gap = function(_gap) {
    gap = _gap;
    return module;
  };

  module.sides = function(_sides) {
    sides = _sides;
    return module;
  };

  module.width = function(_width) {
    width = _width;
    updateRadius();
    return module;
  };

  module.height = function(_height) {
    height = _height;
    updateRadius();
    return module;
  };

  module.arcFilters = function(_arcFilters) {
    arcFilters = _arcFilters;
    return module;
  };

  module.arcEFilters = function(_arcEFilters) {
    arcEFilters = _arcEFilters;
    return module;
  };

  window.addEventListener('resize', debounce(()=>{
    module.updateSize();
    module.responsive();
  }));

  return module;
});
