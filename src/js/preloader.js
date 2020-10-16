/* exported preloader */
/* global d3,debounce */

const preloader = (_container) => {
  const module = {};
  const container = _container;
  let width; let height;
  const svg = d3.select('#container').append('svg');

  module.resize = () => {
    const bb = container.node().getBoundingClientRect();
    width = bb.width;
    height = bb.height;
  };

  module.responsive = () => {
    svg.attr('width', width)
        .attr('height', height);
  };

  module.resize();
  module.responsive();

  window.addEventListener('resize', debounce(()=>{
    module.resize();
    module.responsive();
  }));

  const onodes = [{x: 0, y: 0, id: 1, fx: 0, fy: 0, fixed: true}]; let nodes = onodes;
  let links = []; const olinks = [];

  const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody())
      .force('link', d3.forceLink().id(function(d) {
        return d.id;
      }))
      .force('center', d3.forceCenter(0, 0))
      .force('collide', d3.forceCollide(10))
      .on('tick', ticked);

  const g = svg.append('g').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
  let link = g.append('g').attr('stroke', 'rgba(0,0,0,0.2)').attr('stroke-width', 1).selectAll('.link');
  let node = g.append('g').attr('stroke', 'rgba(255,255,255,0.5)').attr('stroke-width', 0.5).selectAll('.node');
  const label = g.append('g').attr('transform', 'translate(0,40)');
  const labelBg = label.append('rect').attr('height', 19).attr('fill', '#000').style('opacity', 0.6).attr('stroke', '#000').attr('stroke-width', 8).style('stroke-linejoin', 'round');
  const labelText = label.append('text').attr('fill', '#fff').attr('dy', 14).text('Loading Network').style('font-style', 'italic').attr('text-anchor', 'middle');

  // Center
  g.append('g').append('circle').attr('r', 5).attr('stroke-width', 1).attr('stroke', 'rgba(255,255,255,1)').attr('fill', '#000');


  module.updateLabel = (txt) => {
    const b = labelText.text(txt).node().getBoundingClientRect();
    labelBg.attr('width', b.width+10).attr('x', (b.width/-2)-5);
  };

  module.updateLabel('Loading Network');


  const interval = d3.interval(function() {
    nodes.forEach((n, ni)=>{
      onodes[ni].x = n.x;
      onodes[ni].y = n.y;
      onodes[ni].fx = n.fx;
      onodes[ni].fy = n.fy;
    });

    onodes.push({
      x: 0,
      y: 0,
      id: onodes.length+1,
    });

    nodes = JSON.parse(JSON.stringify(onodes));

    const cons = Math.ceil(Math.random()*Math.min(nodes.length-1, 3));
    const cIDs = [];

    while (cIDs.length<cons) {
      const cID = 1 + Math.round(Math.random()*(nodes.length-1));
      if ((cIDs.indexOf(cID)==-1)&&(cID != nodes.length)) cIDs.push(cID);
    }

    cIDs.forEach((c)=>{
      olinks.push({
        source: onodes.length,
        target: c,
      });
    });

    links = JSON.parse(JSON.stringify(olinks));

    // Update ForceSimulation
    simulation.nodes(nodes)
        .force('link', d3.forceLink(links).id(function(d) {
          return d.id;
        }))
        .alpha(1)
        .restart();

    // Update nodes and links
    node = node.data(nodes, function(d) {
      return d.id;
    });
    node.exit().remove();
    node = node.enter().append('circle').attr('fill', (d)=>(('fixed' in d)?'#000':'#555')).attr('r', (d)=>(('fixed' in d)?5:3)).merge(node);

    link = link.data(links);
    link.exit().remove();
    link = link.enter().append('line').merge(link);
  }, 1000, d3.now());

  module.stop = () => {
    interval.stop();
  };

  module.restart = () => {
    interval.restart();
  };

  function ticked() {
    node.attr('cx', function(d) {
      return d.x;
    })
        .attr('cy', function(d) {
          return d.y;
        });

    link.attr('x1', function(d) {
      return d.source.x;
    })
        .attr('y1', function(d) {
          return d.source.y;
        })
        .attr('x2', function(d) {
          return d.target.x;
        })
        .attr('y2', function(d) {
          return d.target.y;
        });
  }

  return module;
};
