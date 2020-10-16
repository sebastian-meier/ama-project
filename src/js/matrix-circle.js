/* exported matrixCircle */
/* global d3, debounce, Shepherd */

const matrixCircle = (_container, _list, _nodes, _taxonomy) => {
  const module = {
    set filter(_filter) {
      const changed = (_filter != filter) ? true : false;
      filter = _filter||'all';
      if (changed) module.update();
    },
    get filter() {
      return filter;
    },
    set selection(_selection) {
      selection = _selection;
    },
    get selection() {
      return selection;
    },
    set dimensions(_dimensions) {
      dimensions = _dimensions;
      module.update();
    },
    get dimensions() {
      return dimensions;
    },
  };

  const nodes = _nodes;
  const taxonomy = _taxonomy;
  const list = _list;
  const container = _container;
  let width; let height; const margin = 20;

  list.visType = 'matrix';

  const taxonomyKeys = ['objectives', 'layer', /* 'sustainability_keywords',*/ 'inner_change_keywords', 'journey_station', 'perspective_keywords'];
  const taxonomies = {}; const upperTax = {}; const upperTaxKeys = {};

  for (const key in taxonomy) {
    if (taxonomy[key].name.match(/#[0-9]*/)) {
      const sdg = taxonomy[key].name.match(/#[0-9]*/);
      taxonomy[key].name = sdg + ' ' + (taxonomy[key].name.replace(/\(SDG #[0-9]*\)/g, '')).trim();
      taxonomy[key]['sdg'] = sdg[0];
    }
  }

  taxonomyKeys.forEach((t)=>{
    taxonomies[t] = {};
    upperTax[t] = [];
    upperTaxKeys[t] = {};
    taxonomyKeys.forEach((tt)=>{
      if (tt != t) {
        taxonomies[t][tt] = {
          keys_1: {},
          keys_2: {},
          data: [],
        };
      }
    });
  });

  for (const t in taxonomy) {
    if (taxonomy[t].parent == 0 && (taxonomyKeys.indexOf(taxonomy[t].taxonomy) >= 0)) {
      upperTax[taxonomy[t].taxonomy].push(taxonomy[t]);
    } else if (taxonomy[t].parent == 61) {
      upperTax['objectives'].push(taxonomy[t]);
    } else if (taxonomy[t].parent == 83) {
      upperTax['layer'].push(taxonomy[t]);
    }
  }

  for (const t in upperTax) {
    upperTax[t].sort((a, b)=>{
      return ('' + a.name).localeCompare('' + b.name);
    });
    upperTax[t].forEach((tt, tti)=>{
      upperTaxKeys[t][tt.id] = tti;
    });
  }

  for (const t in taxonomies) {
    for (const tt in taxonomies[t]) {
      taxonomies[t][tt].keys_1 = upperTaxKeys[t];
      taxonomies[t][tt].keys_2 = upperTaxKeys[tt];
      upperTax[t].forEach((t1, t1i)=>{
        const row = {
          id: t1.id,
          name: t1.name,
          sdg: t1.sdg,
          sort: t1i,
          cols: [],
        };

        upperTax[tt].forEach((t2, t2i)=>{
          row.cols.push({
            id: t2.id,
            pid: t1.id,
            name: t2.name,
            sdg: t2.sdg,
            sort: t2i,
            person: {c: 0, ids: []},
            institution: {c: 0, ids: []},
            project: {c: 0, ids: []},
            publication: {c: 0, ids: []},
            all: {c: 0, ids: []},
          });
        });

        taxonomies[t][tt].data.push(row);
      });
    }
  }

  nodes.forEach((node, n)=>{
    nodes[n].root_taxonomy.forEach((t)=>{
      nodes[n].root_taxonomy.forEach((tt)=>{
        if (
          t != tt &&
            (
              (taxonomy[tt].parent == 61 || taxonomy[tt].parent == 83) ||
              taxonomyKeys.indexOf(taxonomy[tt].taxonomy) >= 0
            ) &&
            (
              (taxonomy[t].parent == 61 || taxonomy[t].parent == 83) ||
              taxonomyKeys.indexOf(taxonomy[t].taxonomy) >= 0
            )
        ) {
          let t1 = taxonomy[t].taxonomy;
          let t2 = taxonomy[tt].taxonomy;

          if (t == 61 || taxonomy[t].parent == 61) t1 = 'objectives';
          if (tt == 61 || taxonomy[tt].parent == 61) t2 = 'objectives';

          if (t == 83 || taxonomy[t].parent == 83) t1 = 'layer';
          if (tt == 83 || taxonomy[tt].parent == 83) t2 = 'layer';

          if (t1 != t2) {
            const tax = taxonomies[t1][t2];

            tax.data[tax.keys_1[t]].cols[tax.keys_2[tt]].all.c++;
            tax.data[tax.keys_1[t]].cols[tax.keys_2[tt]].all.ids.push(n);

            tax.data[tax.keys_1[t]].cols[tax.keys_2[tt]][nodes[n].type].c++;
            tax.data[tax.keys_1[t]].cols[tax.keys_2[tt]][nodes[n].type].ids.push(n);
          }
        }
      });
    });
  });

  let radius;

  module.updateSize = ()=>{
    const bb = container.node().getBoundingClientRect();
    width = bb.width;
    radius = (width/2-margin);
    if (radius > 400) radius = 400;
    height = radius*2 + 2*margin;
  };

  module.updateSize();

  const svg = container.append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('overflow', 'visible');

  const defs = svg.append('defs');

  module.tour = new Shepherd.Tour({
    defaultStepOptions: {
      showCancelLink: true,
    },
  });

  module.scrollTop = () => {
    document.getElementById('matrix-circle-container').scrollIntoView();
  };

  module.tour.on('show', module.scrollTop);

  module.tour.addStep('step-1', {
    title: 'Sustainability — Goals and Layers',
    text: 'This visualisation explores the relationship between sustainability layers and goals.',
    buttons: [
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-2', {
    title: 'Sustainability — Goals and Layers',
    text: 'Each slice represents one Sustainable-Development-Goal (SDG)',
    attachTo: '.row-label left',
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-3', {
    title: 'Sustainability — Goals and Layers',
    text: 'Each ring represents one layer from the sustainability taxonomy',
    attachTo: {element: '.col-label:nth-child(3)', on: 'bottom'},
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-5', {
    title: 'Sustainability — Goals and Layers',
    text: 'The grey arcs highlight the number of elements in the AMA database related to IASS. Select an intersection, to see which items can befound between the two categories. For a full matrix of all items in the database, use matrix mode in the explore mode.',
    attachTo: '.vis-box left',
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.next, text: 'Next &raquo;'},
    ],
  }).on('before-show', module.scrollTop);

  module.tour.addStep('step-5', {
    title: 'Sustainability — Goals and Layers',
    text: 'The resulting items are displayed below.',
    attachTo: '#matrix-circle-list .connection top',
    scrollTo: true,
    buttons: [
      {action: module.tour.back, classes: 'shepherd-button-secondary', text: '&laquo; Back'},
      {action: module.tour.cancel, text: 'Exit &times;'},
    ],
  });


  const helpButton = container.append('button')
      .attr('id', 'master-help-button')
      .attr('class', 'inbody')
      .style('left', 20)
      .text('?')
      .on('click', ()=>{
        module.tour.start();
      });

  const s = svg.append('g').attr('transform', `translate(${width/2} ${height/2})`);

  let dimensions = ['objectives', 'layer'];
  let filter = 'all'; let selection = {taxonomy: []};

  const bgCircles = s.append('g').selectAll('circle').data(new Array(taxonomies[dimensions[1]][dimensions[0]].data.length+1)).enter().append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .style('fill', 'transparent')
      .style('stroke', 'rgba(0,0,0,0.1)');

  const arc = d3.arc();

  const scaleR = d3.scaleLinear();
  const scaleTheTa = d3.scaleLinear();

  const labelBG = s.append('g').append('path')
      .style('stroke', 'transparent')
      .style('fill', '#fff');

  const bgDivider = s.append('g').selectAll('line').data(new Array(taxonomies[dimensions[0]][dimensions[1]].data.length+1)).enter().append('line')
      .style('stroke', 'rgba(0,0,0,0.1)');

  const boxGroup = s.append('g').attr('id', 'boxes');
  let boxes; let boxLabels; let boxButtons;

  const rowTextContainer = s.append('g').attr('id', 'rowTexts');
  const colTextContainer = s.append('g').attr('id', 'colTexts');

  module.update = () => {
    scaleR.domain([0, d3.max(taxonomies[dimensions[0]][dimensions[1]].data, (d)=>d3.max(d.cols, (d)=>d[filter].c))]);
    scaleTheTa.domain([0, d3.max(taxonomies[dimensions[0]][dimensions[1]].data, (d)=>d3.max(d.cols, (d)=>d[filter].c))]);

    // ----- Path Rows

    const rowPaths = defs.selectAll('path.row-path').data(taxonomies[dimensions[0]][dimensions[1]].data);

    const newRowPaths = rowPaths.enter().append('path')
        .attr('class', 'row-path');

    newRowPaths.merge(rowPaths)
        .attr('id', (d, i) => `row-path-${i}`);

    rowPaths.exit().remove();

    // ----- Text Rows

    const rowTexts = rowTextContainer.selectAll('text.row-label').data(taxonomies[dimensions[0]][dimensions[1]].data);

    const newRowTexts = rowTexts.enter().append('text')
        .attr('text-anchor', 'middle');

    newRowTexts.append('textPath')
        .attr('xlink:href', (d, i) => `#row-path-${i}`)
        .attr('text-anchor', 'middle')
        .attr('startOffset', '50%');

    newRowTexts.merge(rowTexts)
        .attr('class', (d)=>`row-label row-label-${d.id}`);

    rowTextContainer.selectAll('textPath')
        .html((d) => d.sdg);

    rowTexts.exit().remove();

    // ----- Overlay Rows

    const rowOverlays = rowTextContainer.selectAll('path.row-overlay').data(taxonomies[dimensions[0]][dimensions[1]].data);

    rowOverlays.enter().append('path')
        .attr('text-anchor', 'middle')
        .merge(rowOverlays)
        .attr('class', (d)=>`row-overlay row-overlay-${d.id}`)
        .style('display', 'none');

    rowOverlays.exit().remove();

    // ----- Overlay Text Rows

    const rowOverlayTexts = rowTextContainer.selectAll('text.row-text-overlay').data(taxonomies[dimensions[0]][dimensions[1]].data);

    rowOverlayTexts.enter().append('text')
        .merge(rowOverlayTexts)
        .attr('class', (d)=>`row-text-overlay row-text-overlay-${d.id}`)
        .html((d)=>d.name)
        .style('display', 'none');

    rowOverlayTexts.exit().remove();

    // ----- Overlay Text Rows

    const rowOverlayButtons = rowTextContainer.selectAll('path.row-button-overlay').data(taxonomies[dimensions[0]][dimensions[1]].data);

    rowOverlayButtons.enter().append('path')
        .merge(rowOverlayButtons)
        .attr('class', (d)=>`row-button-overlay row-button-overlay-${d.id}`)
        .style('cursor', 'pointer')
        .style('fill', 'transparent')
        .on('mouseover', (d)=>{
          d3.selectAll(`.row-text-overlay-${d.id}, .row-overlay-${d.id}`).style('display', 'block');
        })
        .on('mouseout', ()=>{
          d3.selectAll('.row-text-overlay, .row-overlay').style('display', 'none');
        });

    rowOverlayButtons.exit().remove();

    // ----- Path Cols

    const colPaths = defs.selectAll('path.col-path').data(taxonomies[dimensions[0]][dimensions[1]].data[0].cols);

    const newColPaths = colPaths.enter().append('path')
        .attr('class', 'col-path');

    newColPaths.merge(colPaths)
        .attr('id', (d, i) => `col-path-${i}`);

    colPaths.exit().remove();

    // ----- Text Columns

    const colTexts = colTextContainer.selectAll('text').data(taxonomies[dimensions[0]][dimensions[1]].data[0].cols);

    const newColTexts = colTexts.enter().append('text')
        .attr('text-anchor', 'middle');

    newColTexts.append('textPath')
        .attr('xlink:href', (d, i) => `#col-path-${i}`)
        .attr('text-anchor', 'middle')
        .attr('startOffset', '50%');

    newColTexts.merge(colTexts)
        .attr('class', (d)=>`col-label col-label-${d.id}`);

    colTextContainer.selectAll('textPath')
        .html((d) => d.name.substring(3));

    colTexts.exit().remove();

    // ----- Boxes

    boxGroup.selectAll('*').remove();

    // merge the data
    const boxData = [];

    taxonomies[dimensions[0]][dimensions[1]].data.forEach((d, di) => {
      d.cols.forEach((dd, ddi)=>{
        if (dd[filter].c > 0) {
          boxData.push({
            data: dd,
            x: di,
            y: ddi,
          });
        }
      });
    });

    boxes = boxGroup.selectAll('path.vis-box').data(boxData).enter().append('path')
        .attr('class', (d) => `vis-box vis-box-${d.data.id} vis-box-${d.data.pid}`);

    boxLabels = boxGroup.selectAll('text').data(boxData).enter().append('text')
        .text((d) => d.data[filter].c)
        .attr('dy', 5)
        .attr('text-anchor', 'middle')
        .attr('class', (d) => `countLabel countLabel-${d.data.id} countLabel-${d.data.pid}`)
        .style('display', 'none');

    boxButtons = boxGroup.selectAll('path.box-button').data(boxData).enter().append('path')
        .style('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseover', (d)=>{
          d3.selectAll(`.vis-box-${d.data.id}.vis-box-${d.data.pid}:not(.selected)`).style('fill', 'rgba(0,0,0,0.6)');
          d3.selectAll(`.countLabel-${d.data.id}.countLabel-${d.data.pid}`).style('display', 'block');
          d3.selectAll(`.row-label-${d.data.id},.row-label-${d.data.pid},.col-label-${d.data.id},.col-label-${d.data.pid}`).style('font-weight', 'bold');
        }).on('mouseout', ()=>{
          d3.selectAll('.vis-box:not(.selected)').style('fill', 'rgba(0,0,0,0.3)');
          d3.selectAll('.countLabel').style('display', 'none');
          d3.selectAll(`.row-label,.col-label`).style('font-weight', 'normal');
        }).on('click', (d)=>{
          d3.selectAll('.vis-box').style('fill', 'rgba(0,0,0,0.3)').classed('selected', false);

          if (selection.taxonomy.length == 0 || selection.taxonomy[0] != d.data.id || selection.taxonomy[1] != d.data.pid) {
            selection.taxonomy = [d.data.id, d.data.pid];
            d3.selectAll(`.vis-box-${d.data.id}.vis-box-${d.data.pid}`).style('fill', 'rgba(0,0,0,0.8)').classed('selected', true);
            list.selection = selection;
          } else {
            selection.taxonomy = [];
            list.selection = selection;
          }
        });

    module.responsive();
  };

  let theta = 0; let thetaOffset = 0; let thetaOffsetLabel = 0;
  const px = (r, i) => r * Math.cos(i * theta + thetaOffset);
  const py = (r, i) => r * Math.sin(i * theta + thetaOffset);

  module.responsive = () => {
    svg
        .attr('width', width)
        .attr('height', height);

    s.attr('transform', `translate(${width/2} ${height/2})`);

    helpButton.style('top', ((height-2*margin-height/16)*-1)+'px');

    labelBG.attr('d', arc({
      innerRadius: 0,
      outerRadius: radius+1,
      startAngle: - Math.PI/180*22.5,
      endAngle: + Math.PI/180*22.5,
    }));

    bgCircles.attr('r', (d, i)=>{
      return radius/(taxonomies[dimensions[1]][dimensions[0]].data.length+1)*(i+1);
    });

    theta = (1.75 * Math.PI) / (taxonomies[dimensions[0]][dimensions[1]].data.length);
    thetaOffsetLabel = Math.PI/180*22.5;
    thetaOffset = thetaOffsetLabel - Math.PI/180*90;

    const innerR = radius/(taxonomies[dimensions[1]][dimensions[0]].data.length+1);

    bgDivider
        .attr('x1', (d, i)=>px(radius, i))
        .attr('y1', (d, i)=>py(radius, i))
        .attr('x2', (d, i)=>px(innerR, i))
        .attr('y2', (d, i)=>py(innerR, i));

    scaleR.range([0, innerR]);
    scaleTheTa.range([0, theta]);

    boxes.attr('d', (d) => {
      return arc({
        innerRadius: innerR + innerR*d.y + (innerR - scaleR(d.data[filter].c))/2,
        outerRadius: innerR + innerR*(d.y+1) - (innerR - scaleR(d.data[filter].c))/2,
        startAngle: thetaOffsetLabel + d.x * theta + (theta - scaleTheTa(d.data[filter].c))/2,
        endAngle: thetaOffsetLabel + (d.x+1)*theta - (theta - scaleTheTa(d.data[filter].c))/2,
      });
    }).style('fill', 'rgba(0,0,0,0.3)'); // on hover 0.6

    boxButtons.attr('d', (d) => {
      return arc({
        innerRadius: innerR + innerR*d.y,
        outerRadius: innerR + innerR*(d.y+1),
        startAngle: thetaOffsetLabel + d.x * theta,
        endAngle: thetaOffsetLabel + (d.x+1)*theta,
      });
    });

    boxLabels
        .attr('transform', (d) => `translate(${px(innerR + innerR*(d.y+0.5), d.x+0.5)},${py(innerR + innerR*(d.y+0.5), d.x+0.5)})`);

    defs.selectAll('path.row-path').attr('d', (d, i) => {
      const a1 = thetaOffsetLabel + i * theta; const a2 = thetaOffsetLabel + (i+1)*theta;
      return (arc({
        innerRadius: radius,
        outerRadius: radius+((a1 > Math.PI*0.5 && a1 < Math.PI*1.5)?25:20),
        startAngle: (a1 > Math.PI*0.5 && a1 < Math.PI*1.5)?a2:a1,
        endAngle: (a1 > Math.PI*0.5 && a1 < Math.PI*1.5)?a1:a2,
      })).split('L')[0];
    });

    defs.selectAll('path.col-path').attr('d', (d, i) => {
      return (arc({
        innerRadius: innerR + innerR*i,
        outerRadius: innerR + innerR*i + innerR*0.5,
        startAngle: -thetaOffsetLabel,
        endAngle: thetaOffsetLabel,
      })).split('L')[0];
    });

    rowTextContainer.selectAll('path.row-overlay').attr('d', (d, i)=>{
      return arc({
        innerRadius: innerR,
        outerRadius: radius,
        startAngle: thetaOffsetLabel + i * theta,
        endAngle: thetaOffsetLabel + (i+1)*theta,
      });
    }).style('fill', 'rgba(255,255,255,0.75)')
        .style('stroke', 'transparent')
        .style('display', 'none');

    rowTextContainer.selectAll('path.row-button-overlay').attr('d', (d, i)=>{
      return arc({
        innerRadius: radius,
        outerRadius: radius+40,
        startAngle: thetaOffsetLabel + i * theta,
        endAngle: thetaOffsetLabel + (i+1)*theta,
      });
    });

    rowTextContainer.selectAll('text.row-text-overlay')
        .attr('transform', (d, i) => `translate(${px((radius-innerR)/2 + innerR, i+0.5)},${py((radius-innerR)/2 + innerR, i+0.5)}) rotate(${((thetaOffsetLabel+theta*(i+0.5))/Math.PI*180 + 90 + (((thetaOffsetLabel+theta*(i+0.5))<Math.PI)?180:0))})`)
        .attr('text-anchor', 'middle');
  };

  module.update();

  window.addEventListener('resize', debounce(()=>{
    module.updateSize();
    module.responsive();
  }));

  module.svg = () => svg;

  return module;
};
