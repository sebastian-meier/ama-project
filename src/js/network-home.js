/* exported networkHome */
/* global d3,debounce,jspath,jsppath */

const networkHome = (_container, _data, _taxonomy) => {
  const module = {};
  const data = _data;
  const taxonomy = _taxonomy;
  let width;
  const segmentHeight = 250;
  let nodes; let nodeMap = {};
  const svg = _container;
  const s = svg.append('g');
  let edges; let edge;

  module.updateSize = ()=>{
    const bb = svg.node().getBoundingClientRect();
    width = bb.width;
  };

  module.init = ()=>{
    d3.csv(jspath+'/cache/'+jsppath+'entity-thematic-edges.csv', {headers: {'Authorization': 'Basic ' + btoa('iass:amama2017')}}).then((_data)=>{
      _data.forEach((d)=>{
        if (d.source != d.target) {
          if (!('edges' in data[d.source])) data[d.source]['edges'] = [];
          data[d.source]['edges'].push(d.target);
        }
      });

      module.construct();
    }).catch((err)=>{
      throw err;
    });
  };

  module.construct = ()=>{
    module.updateSize();

    nodeMap = {};
    nodes = [];
    edges = [];

    const taxonomySort = [];
    const taxonomySortKey = {};

    for (const tkey in taxonomy) {
      if (taxonomy[tkey].taxonomy == 'journey_station') {
        taxonomySort.push({
          name: taxonomy[tkey].name,
          key: tkey,
        });
      }
    }

    taxonomySort.sort((a, b)=>{
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    });

    taxonomySort.forEach((s, si)=>{
      taxonomySortKey[s.key] = si;
    });

    // extract journey
    taxonomySort.forEach((ts)=>{
      tkey = ts.key;

      const tLength = taxonomySortKey[tkey];
      const tX = width/2+((!(tLength%2))?-width/4:width/4);
      const tY = segmentHeight/2 + tLength*segmentHeight;

      nodes.push({
        g: s.append('g').datum(nodes.length),
        tLength: tLength,
        id: nodes.length-1,
        oid: tkey,
        node: false,
        origin: true,
        type: 'taxonomy',
        title: taxonomy[tkey].name,
        slug: taxonomy[tkey].slug,
        x: tX,
        y: tY,
        simulation: false,
        nodeMap: {},
        nodes: [],
        edges: [],
      });

      for (const nkey in data) {
        let hasJourney = false;

        if (data[nkey].taxonomy.indexOf(tkey)>=0) {
          hasJourney = true;
        }

        if (hasJourney) {
          nodes[nodes.length-1].nodes.push({
            id: nodes[nodes.length-1].nodes.length-1,
            oid: nkey,
            type: data[nkey].type,
            slug: data[nkey].slug,
            title: data[nkey].title,
            randX: Math.random()*10*((Math.random()>0.5)?-1:1),
            randY: Math.random()*10*((Math.random()>0.5)?-1:1),
            r: 5,
          });

          if ('edges' in data[nkey]) {
            data[nkey].edges.forEach((e)=>{
              edges.push({
                source: nkey,
                target: e,
              });
            });
          }

          nodeMap[nkey] = nodes.length-1;

          nodes[nodes.length-1].nodeMap[nkey] = nodes[nodes.length-1].nodes.length-1;
        }
      }

      // console.log(taxonomy[tkey], nodes[nodes.length-1].nodes.length)

      nodes[nodes.length-1].simulation = d3.forceSimulation(nodes[nodes.length-1].nodes)
          .velocityDecay(0.2)
          .force('x', d3.forceX().strength(0.002))
          .force('y', d3.forceY().strength(0.002))
          .force('collide', d3.forceCollide().radius(12).iterations(2));

      nodes[nodes.length-1].node = nodes[nodes.length-1].g
          .selectAll('g')
          .data(nodes[nodes.length-1].nodes)
          .enter().append('g')
          .attr('transform', (d) => {
            `translate(${d.x},${d.y})`;
          })
          .on('click', (d)=>{
            window.location = `https://www.ama-project.org/${d.type}/${d.slug}`;
            // alert(`Open ${d.title}:${d.id}`)
          })
          .on('mouseover', function(d) {
            // d3.selectAll(`.${d.type}-${d.oid}`).style('stroke-opacity', 1)
            module.updateTooltip(d, nodes[d3.select(d3.select(this).node().parentNode).datum()]);
          })
          .on('mouseout', ()=>{
            tooltip.style('display', 'none');
            // d3.selectAll('.connection').style('stroke-opacity', 0.2)
          });


      nodes[nodes.length-1].node.append('path')
          .style('stroke', 'none')
          .attr('d', d3.symbol()
              .size(160)
              .type(function(d) {
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
              }),
          )
          .style('fill', '#000')
          .style('cursor', 'pointer');
    });

    edges = edges.filter((e)=>((e.source in nodeMap)&&(e.target in nodeMap)));

    edge = s.append('g').selectAll('path').data(edges).enter().append('path').style('stroke', 'rgba(0,0,0,0.05)').style('fill', 'transparent').style('pointer-events', 'none');

    // add items to the node list and keep closest to their journey
    for (let i = 0; i < 5; ++i) {
      nodes.forEach((n)=>{
        n.simulation.tick();
      });
    }

    nodes.forEach((n)=>{
      n.node.attr('transform', (d)=>`translate(${d.x},${d.y})`);
    });

    module.updateSize();
    module.responsive();
  };

  module.redrawEdges = ()=>{
    edge.transition().attr('d', (d)=>{
      let sox = nodes[nodeMap[d.source]].x;
      let soy = nodes[nodeMap[d.source]].y;
      let sx = (sox+nodes[nodeMap[d.source]].nodes[nodes[nodeMap[d.source]].nodeMap[d.source]].x);
      let sy = (soy+nodes[nodeMap[d.source]].nodes[nodes[nodeMap[d.source]].nodeMap[d.source]].y);
      let si = Math.floor(sy/250);
      let eox = nodes[nodeMap[d.target]].x;
      let eoy = nodes[nodeMap[d.target]].y;
      let ex = (eox+nodes[nodeMap[d.target]].nodes[nodes[nodeMap[d.target]].nodeMap[d.target]].x);
      let ey = (eoy+nodes[nodeMap[d.target]].nodes[nodes[nodeMap[d.target]].nodeMap[d.target]].y);
      let ei = Math.floor(ey/250);
      const rx = nodes[nodeMap[d.source]].nodes[nodes[nodeMap[d.source]].nodeMap[d.source]].randX;
      const ry = nodes[nodeMap[d.source]].nodes[nodes[nodeMap[d.source]].nodeMap[d.source]].randY;

      if (si == ei || Math.abs(si-ei)==1) {
        return `M${sx} ${sy}C${sox} ${soy},${eox} ${eoy},${ex} ${ey}`;
      } else {
        if (ei < si) {
          const tx = sx;
          const ty = sy;
          const ti = si;
          const tox = sox;
          const toy = soy;

          sx = ex;
          sy = ey;
          si = ei;
          sox = eox;
          soy = eoy;
          ex = tx;
          ey = ty;
          ei = ti;
          eoy = toy;
          eox = tox;
        }

        let path = `M${sx} ${sy}C${sox+rx} ${soy+ry},${sox+rx} ${soy+ry},${(sox+rx + (nodes[si+1].x-sox)*0.5)} ${soy+ry + (nodes[si+1].y-soy)*0.5}`;

        for (let i = si+1; i<ei; i++) {
          path += `C${nodes[i].x+rx} ${nodes[i].y+ry},${nodes[i].x+rx} ${nodes[i].y+ry},${nodes[i].x+rx + (nodes[i+1].x-nodes[i].x)*0.5} ${nodes[i].y+ry+(nodes[i+1].y-nodes[i].y)*0.5}`;
        }

        path += `C${eox+rx} ${eoy+ry},${eox+rx} ${eoy+ry},${ex} ${ey}`;

        return path;
      }
    });
  };

  const tooltip = svg.append('g').style('display', 'none').style('pointer-events', 'none');
  const tooltipBg = tooltip.append('path').style('fill', '#000').style('stroke', '#000').style('stroke-width', 5).style('stroke-linejoin', 'round');
  const tooltipText = tooltip.append('text').style('fill', '#fff').attr('dy', 4);

  module.updateTooltip = (d, parent)=>{
    tooltip
        .attr('transform', `translate(${parent.x+d.x+((parent.x+d.x<width/2)?15:-15)},${parent.y+d.y})`);

    tooltipText
        .text((d.title.length<30)?d.title:d.title.substr(0, 27)+'...')
        .attr('text-anchor', (parent.x+d.x<width/2)?'start':'end')
        .attr('dx', (parent.x+d.x<width/2)?'20':'-20');

    const bb = tooltipText.node().getBoundingClientRect();

    const dir = (parent.x+d.x<width/2)?1:-1;

    tooltipBg.attr('d', `M0,0L${15*dir},15L${(15+bb.width+15)*dir},15L${(15+bb.width+15)*dir},-15L${15*dir},-15Z`);

    tooltip.style('display', 'block');
  };

  module.responsive = ()=>{
    nodes.forEach((n)=>{
      n.x = (!(n.tLength%2))?width*0.75:width*0.25;
      n.g.attr('transform', `translate(${n.x},${n.y})`);
    });
    module.redrawEdges();
  };

  window.addEventListener('resize', debounce(()=>{
    module.updateSize();
    module.responsive();
  }));

  return module;
};
