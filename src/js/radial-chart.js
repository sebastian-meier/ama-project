/* exported rings */
/* global d3,debounce,jspath */

const rings = function(_container, _data, _taxonomy, _id) {
  const module = {};
  const data = _data;
  const id = _id;
  const container = _container;
  const taxonomy = _taxonomy;
  let width; let height;

  module.polarX = (d) => d[1] * Math.cos(d[0]);
  module.polarY = (d) => d[1] * Math.sin(d[0]);

  const line = d3.line()
      .curve(d3.curveCatmullRom)
      .x(module.polarX)
      .y(module.polarY);

  const curvyConnector = (d, r)=>{
    const x1 = module.polarX([d[3], 40]);
    const y1 = module.polarY([d[3], 40]);
    const x2 = module.polarX([d[3], r]);
    const y2 = module.polarY([d[3], r]);
    const dir = Math.random();
    const o1 = Math.random();
    const cx1 = module.polarX([d[3]+((dir<0.5)?-1:1)*(o1*Math.PI/180*20), 40+(r-40)*0.1]);
    const cy1 = module.polarY([d[3]+((dir<0.5)?-1:1)*(o1*Math.PI/180*20), 40+(r-40)*0.1]);
    const o2 = Math.random();
    const cx2 = module.polarX([d[3]+((dir<0.5)?1:-1)*(o2*Math.PI/180*20), 40+(r-40)*0.9]);
    const cy2 = module.polarY([d[3]+((dir<0.5)?1:-1)*(o2*Math.PI/180*20), 40+(r-40)*0.9]);

    return `M${x1},${y1}C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}`;
  };

  module.updateSize = ()=>{
    const bb = container.node().getBoundingClientRect();
    width = bb.width;
    height = bb.height;
  };

  module.updateSize();

  const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height);

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

  const simScale = d3.scaleLinear().domain([1, data.taxonomy.length]).range([32, 256]);
  const hitScale = d3.scaleLinear().domain([1, data.taxonomy.length]).range([4, 8]);

  const s = svg.append('g');

  const rings = {
    'sustainability_keywords': [],
    'inner_change_keywords': [],
  };

  const ringKeys = {
    'sustainability_keywords': {},
    'inner_change_keywords': {},
  };
  let ringCount = 0;

  data.taxonomy.forEach((t)=>{
    if (taxonomy[t].taxonomy in rings) {
      rings[taxonomy[t].taxonomy].push([t, 0, []]);
      ringKeys[taxonomy[t].taxonomy][t] = rings[taxonomy[t].taxonomy].length-1;
      ringCount++;
    }
  });

  data['thematic-direct-direct'].forEach((t)=>{
    if ((t[3] in rings) && t[2] == 0 && t[0] != id) {
      rings[t[3]][ringKeys[t[3]][t[1]]][2].push(t[0]);
      rings[t[3]][ringKeys[t[3]][t[1]]][1]++;
    }
  });

  const configs = {
    'sustainability_keywords': {
      'r': 300,
      'g': null,
      'p': [],
      'pI': [],
      'c': '#761B41', // 'rgb(173, 36, 92)',
      'ac': 0,
      'o': 175,
    },
    'inner_change_keywords': {
      'r': 150,
      'g': null,
      'p': [],
      'pI': [],
      'c': '#0D6B6F', // 'rgb(10, 158, 163)',
      'ac': 0,
      'o': 100,
    },
  };
  const extraW = 50;
  const minW = 5;

  module.rotate = (a, angle) => {
    a.forEach((d, i)=>{
      a[i][0] = module.rotateA(d[0], angle);
    });
    return a;
  };

  module.rotateA = (item, angle) => {
    item += angle;
    if (angle > Math.PI*2) angle -= Math.PI*2;
    if (angle < 0) angle += Math.PI*2;
    return item;
  };

  const maxs = [];
  for (const key in rings) {
    maxs.push(d3.max(rings[key], (d)=>d[1]));
  }

  const ringScale = d3.scaleLinear().domain([0, d3.max(maxs)]).range([minW, extraW]);

  const ringStep = (Math.PI*2/ringCount);

  let ir = 0;
  for (let r = 0; r<ringCount; r++) {
    for (const key in rings) {
      const n = Math.round(r/ringCount * rings[key].length);
      if (n >= configs[key].ac && n<rings[key].length) {
        rings[key][configs[key].ac].push(ir*ringStep);
        ir++;
        configs[key].ac++;
      }
    }
  }

  const simNodes = []; const simNodeKeys = {};

  function jigger(a, d) {
    a.forEach((el, i)=>{
      a[i][1] += d*Math.random();
    });
    return a;
  }

  for (const key in rings) {
    configs[key].g = s.append('g');

    if (rings[key].length == 0) {
      configs[key].g.append('circle')
          .attr('r', configs[key].r);
    } else if (rings[key].length == 1) {
      rings[key][0].push(0);
      configs[key].p.push([rings[key][0][3], configs[key].r+extraW]);
      configs[key].p.push([Math.PI, configs[key].r+2]);
      configs[key].pI.push([rings[key][0][3], configs[key].r-extraW]);
      configs[key].pI.push([Math.PI, configs[key].r-2]);
    } else {
      rings[key].forEach((r, ri) => {
        rings[key][ri].push(r[3]);
        configs[key].p.push([r[3], configs[key].r + ringScale(r[1])]);
        configs[key].pI.push([r[3], configs[key].r - ringScale(r[1])]);
      });
    }
    if (rings[key].length>0) {
      configs[key].p.push([configs[key].p[0][0]+Math.PI*2, configs[key].p[0][1]]);
      configs[key].pI.push([configs[key].pI[0][0]+Math.PI*2, configs[key].pI[0][1]]);

      const dPath = [configs[key].p[0]];
      const dPathI = [configs[key].pI[0]];

      configs[key].p.forEach((p, pi)=>{
        if (pi>0) {
          const last = dPath[dPath.length-1];
          const diff = p[0]-last[0];
          const rDiff = p[1]-last[1];
          const extra = Math.ceil(diff*((configs[key].r/10*2)/Math.PI));
          for (let i = 0; i<extra; i++) {
            const m1 = Math.pow(i/extra, 2) * (1-i/extra);
            const m2 = Math.pow(i/extra, 0.5) * (i/extra);

            dPath.push([last[0]+diff*i/extra, last[1]+rDiff*(m1+m2)]);
          }
          dPath.push(p);
        }
      });

      configs[key].pI.forEach((p, pi)=>{
        if (pi>0) {
          const last = dPathI[dPathI.length-1];
          const diff = p[0]-last[0];
          const rDiff = p[1]-last[1];
          const extra = Math.ceil(diff*((configs[key].r/10*2)/Math.PI));
          for (let i = 0; i<extra; i++) {
            const m1 = Math.pow(i/extra, 2) * (1-i/extra);
            const m2 = Math.pow(i/extra, 0.5) * (i/extra);

            dPathI.push([last[0]+diff*i/extra, last[1]+rDiff*(m1+m2)]);
          }
          dPathI.push(p);
        }
      });

      dPathI.reverse();

      for (let i = 0; i<20; i++) {
        const outer = jigger(JSON.parse(JSON.stringify(dPath)), 5);
        const inner = jigger(JSON.parse(JSON.stringify(dPathI)), -5);

        s.append('path')
        // .style('mix-blend-mode','multiply')
            .style('fill', configs[key].c)
        // .attr('d', line(module.rotate(dPath, (key == 'sustainability_keywords')?-Math.PI*0.25:+Math.PI*0.75))+line(module.rotate(dPathI.reverse(), (key == 'sustainability_keywords')?-Math.PI*0.25:+Math.PI*0.75)))
            .attr('d', line(outer) + line(inner))
            .style('opacity', 0.025);
      }
    }
  }

  for (const key in rings) {
    s.append('g').selectAll('line')
        .data(rings[key])
        .enter()
        .append('path')
        .attr('class', 'central-links')
        .attr('d', (d)=>curvyConnector(d, configs[key].r))
        .attr('fill', 'transparent')
        .style('stroke', 'rgba(0,0,0,1)')
        .style('opacity', '0.3')
        .style('stroke-width', 2)
        .style('stroke-dashArray', '4,4');

    rings[key].forEach((r)=>{
      let shiftI = 0;
      simNodes.push({
        0: r[3],
        1: configs[key].r,
        fx: module.polarX([r[3], configs[key].r]),
        fy: module.polarY([r[3], configs[key].r]),
        fixed: true,
        dist: 8,
        id: r[0],
      });
      r[2].forEach((ri)=>{
        if (!(ri in simNodeKeys)) {
          let similar = 0; const simTargets = {
            // TODO change to s (sustainability) & ic (inner change)
            'sustainability_keywords': [],
            'inner_change_keywords': [],
          };
          data.relatives[ri].taxonomy.forEach((t)=>{
            if (taxonomy[t].taxonomy in configs) {
              if (data.taxonomy.indexOf(t)>=0) {
                simTargets[taxonomy[t].taxonomy].push(t);
                similar++;
              }
            }
          });
          if (similar > 0) {
            let sumAngle = 0; let sumItems = 0;
            for (const sKey in simTargets) {
              simTargets[sKey].forEach((s)=>{
                sumAngle += rings[sKey][ringKeys[sKey][s]][3];
                sumItems++;
              });
            }
            if (simTargets.sustainability_keywords.length > 0 && simTargets.inner_change_keywords.length > 0) {
              simNodes.push({
                0: sumAngle/sumItems+shiftI*((shiftI % 2 == 0)?0.3/r[2].length:-0.3/r[2].length),
                1: (configs['sustainability_keywords'].r-configs['inner_change_keywords'].r)/2 + configs['inner_change_keywords'].r,
                dist: similar,
                id: ri,
              });
            } else {
              simNodes.push({
                0: sumAngle/sumItems+shiftI*((shiftI % 2 == 0)?0.3/r[2].length:-0.3/r[2].length),
                1: configs[key].r,
                dist: similar,
                id: ri,
              });
            }
          } else {
            simNodes.push({
              0: r[3]+shiftI*((shiftI % 2 == 0)?0.3/r[2].length:-0.3/r[2].length), // +(shiftI%2)?-0.01:0.01
              1: configs[key].r,
              dist: similar,
              id: ri,
            });
          }
          shiftI++;
          simNodeKeys[ri] = simNodes.length-1;
        }
      });
    });
  }

  // TODO: d3.forceRadial(radius[, x][, y])

  const simulation = d3.forceSimulation(simNodes)
      .force('x', d3.forceX(module.polarX).strength(1))
      .force('y', d3.forceY(module.polarY))
      .force('collide', d3.forceCollide((d)=>hitScale(d.dist)+2))
      .stop();

  for (let i = 0; i < 120; ++i) simulation.tick();

  s.append('g')
      .selectAll('g.symbol')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'symbol')
      .attr('id', (d)=>(('fixed' in d)&&d.fixed)?'sym-'+d.id:'')
      .style('opacity', 1)
      .attr('transform', (d)=>`translate(${(('fixed' in d)&&d.fixed)?d.fx:d.x},${(('fixed' in d)&&d.fixed)?d.fy:d.y})`)
      .append('path')
      .style('stroke', 'none')
      .style('fill', (d)=>('fixed' in d)?'transparent':'#000')
      .attr('d', d3.symbol()
          .size((d)=>simScale(d.dist))
          .type(function(d) {
            if ('fixed' in d) {
              return d3.symbolCircle;
            }

            if
            (data.relatives[d.id].type == 'institution') {
              return d3.symbolCross;
            } else if
            (data.relatives[d.id].type == 'person') {
              return d3.symbolDiamond;
            } else if
            (data.relatives[d.id].type == 'project') {
              return d3.symbolSquare;
            } else if
            (data.relatives[d.id].type == 'publication') {
              return d3.symbolTriangle;
            } else {
              return d3.symbolCircle;
            }
          }))
      .style('cursor', 'pointer')
      .on('mouseover', (d)=>{
        if (!('fixed' in d)) {
          module.updateTooltip([d[0], 300, data.relatives[d.id].title, d.x, d.y]);
          d3.selectAll('.item-tax-'+d.id).style('stroke', 'rgba(0,0,0,0.4)');
          d3.selectAll('.symbol').filter((dd)=>(dd.id==d.id)?false:true).style('opacity', 0.2);
          d3.selectAll('.central-links').style('opacity', 0.1);
          d3.selectAll('.tax-has-'+d.id).style('opacity', 1);
        }
      })
      .on('mouseout', () => {
        d3.selectAll('.item-tax').style('stroke', 'transparent');
        tooltip.style('display', 'none');
        d3.selectAll('.symbol').style('opacity', 1);
        d3.selectAll('.central-links').style('opacity', 0.3);
        d3.selectAll('.tax').style('opacity', 0);
      })
      .on('click', (d)=>{
        window.location = `https://www.ama-project.org/${data.relatives[d.id].type}/${data.relatives[d.id].slug}`;
        // alert('Open '+data.relatives[d.id].title+','+d.id)
      });

  const connections = s.append('g');

  simNodes.forEach((s)=>{
    if (!s.fixed || !('fixed' in s)) {
      data.relatives[s.id].taxonomy.forEach((t)=>{
        if ((taxonomy[t].taxonomy in configs) && data.taxonomy.indexOf(t)>=0) {
          const a1 = s[0] + (rings[taxonomy[t].taxonomy][ringKeys[taxonomy[t].taxonomy][t]][3]-s[0])*0.25;
          const a2 = s[0] + (rings[taxonomy[t].taxonomy][ringKeys[taxonomy[t].taxonomy][t]][3]-s[0])*0.75;
          const tr = d3.max([s[1], configs[taxonomy[t].taxonomy].r]);
          const cx1 = module.polarX([a1, tr]);
          const cx2 = module.polarX([a2, tr]);
          const cy1 = module.polarY([a1, tr]);
          const cy2 = module.polarY([a2, tr]);

          const tx = module.polarX([rings[taxonomy[t].taxonomy][ringKeys[taxonomy[t].taxonomy][t]][3], configs[taxonomy[t].taxonomy].r]);
          const ty = module.polarY([rings[taxonomy[t].taxonomy][ringKeys[taxonomy[t].taxonomy][t]][3], configs[taxonomy[t].taxonomy].r]);

          connections.append('path')
              .attr('class', `item-tax item-tax-${s.id} item-taxo-${t}`)
              .style('stroke', 'transparent')
              .style('pointer-events', 'none')
              .style('fill', 'transparent')
              .attr('d', `M${s.x},${s.y}C${cx1},${cy1} ${cx2},${cy2} ${tx},${ty}`);
        }
      });
    }
  });

  for (const key in rings) {
    s.append('g').selectAll('circle')
        .data(rings[key])
        .enter()
        .append('circle')
        .attr('cx', (d)=>{
          return module.polarX([d[3], configs[key].r]);
        })
        .attr('cy', (d)=>{
          return module.polarY([d[3], configs[key].r]);
        })
        .attr('r', 5)
        .style('fill', configs[key].c)
        .style('stroke', '#fff')
        .style('stroke-width', 2)
        .style('cursor', 'pointer')
        .on('mouseover', (d)=>{
          d3.selectAll('.item-taxo-'+d[0]).style('stroke', 'rgba(0,0,0,0.4)');
          d3.selectAll('#tax-'+d[0]).style('opacity', 1);
        })
        .on('mouseout', () => {
          d3.selectAll('.tax').style('opacity', 0);
          d3.selectAll('.item-tax').style('stroke', 'transparent');
        })
        .on('click', (d)=>{
          alert(`Show related ${d[0]} to ${id}`);
        });

    const taxTooltips = s.append('g').selectAll('g.tax-tooltip')
        .data(rings[key])
        .enter()
        .append('g')
        .attr('class', (d)=>'tax tax-has-'+taxonomy[d[0]].direct.join(' tax-has-'))
        .attr('id', (d)=>'tax-'+d[0])
        .style('opacity', 0)
        .style('pointer-events', 'none')
        .attr('transform', (d)=>`translate(${module.polarX([d[3], configs[key].r])},${module.polarY([d[3], configs[key].r])})`);

    const taxTooltipRects = taxTooltips
        .append('rect');

    taxTooltips
        .append('text')
        .attr('id', (d)=>'tax-title-'+d[0])
        .text((d)=>taxonomy[d[0]].name)
        .attr('text-anchor', (d)=>(module.polarX([d[3], configs[key].r])>0)?'start':'end')
        .attr('dy', 4)
        .attr('dx', (d)=>(module.polarX([d[3], configs[key].r])>0)?15:-15)
        .style('fill', '#fff')
        .style('font-size', 12)
        .style('text-transform', 'capitalize');

    taxTooltipRects.attr('style', 'opacity:0.7; fill:#000; stroke:#000; stroke-width:5; stroke-linejoin:round;')
        .attr('x', (d)=>{
          const bb = d3.select('#tax-title-'+d[0]).node().getBoundingClientRect();
          return (module.polarX([d[3], configs[key].r])>0)?10:-10-bb.width-10;
        })
        .attr('y', -8)
        .attr('width', (d)=>{
          const bb = d3.select('#tax-title-'+d[0]).node().getBoundingClientRect();
          return bb.width+10;
        })
        .attr('height', 16);
  }

  const tooltip = s.append('g').style('display', 'none').style('pointer-events', 'none');
  const tooltipLine = tooltip.append('line').style('stroke', 'rgba(0,0,0,0.4)');
  const tooltipBg = tooltip.append('path').style('fill', '#000').style('stroke', '#000').style('stroke-width', 5).style('stroke-linejoin', 'round');
  const tooltipText = tooltip.append('text').style('fill', '#fff').attr('dy', 4);

  module.updateTooltip = (d)=>{
    const ox = d[3];
    const oy = d[4];
    const tx = module.polarX([d[0], d[1]+extraW+20]);
    const ty = module.polarY([d[0], d[1]+extraW+20]);

    // tooltip.attr('transform',`translate(${ox},${oy})`)

    tooltipText
        .attr('transform', `translate(${tx+((ox>0)?23:-23)},${ty})`)
        .text((d[2].length<30)?d[2]:d[2].substr(0, 27)+'...')
        .attr('text-anchor', (ox>0)?'start':'end');

    const bb = tooltipText.node().getBoundingClientRect();

    tooltipLine
        .attr('x1', ox)
        .attr('y1', oy)
        .attr('x2', tx+((ox>0)?-2.5:2.5))
        .attr('y2', ty);

    const dir = (ox>0)?1:-1;

    tooltipBg.attr('d', `M${tx},${ty}L${tx+15*dir},${ty+15}L${tx+(15+bb.width+20)*dir},${ty+15}L${tx+(15+bb.width+20)*dir},${ty-15}L${tx+15*dir},${ty-15}Z`);

    tooltip.style('display', 'block');
  };


  // Draw Icon and label in the center

  const item = s.append('g');
  item.append('image')
      .attr('width', 80)
      .attr('height', 80)
      .attr('x', -40)
      .attr('y', -40)
      .attr('xlink:href', jspath+'/assets/images/icon_'+data.type+'s@2x.png');
  item.append('circle')
      .attr('r', 40)
      .attr('class', 'item-circle');
  const itembg = s.append('g');
  const itemtext = s.append('g')
      .attr('transform', 'translate(0,50)')
      .append('text')
      .attr('style', 'fill:#fff; font-size:20px; font-style:italic;')
      .text((data.title.length<30)?data.title:data.title.substr(0, 27)+'...')
      .attr('text-anchor', 'middle');
  const itemTextSize = itemtext.node().getBoundingClientRect();

  itembg.append('rect')
      .attr('x', itemTextSize.width/-2-8)
      .attr('y', 30)
      .attr('width', itemTextSize.width+16)
      .attr('height', 30)
      .attr('fill', '#000');

  module.responsive = ()=>{
    s.attr('transform', `translate(${width/2},${height/2})`);
  };

  module.responsive();

  window.addEventListener('resize', debounce(()=>{
    module.updateSize();
    module.responsive();
  }));

  return module;
};
