/* global d3, taxonomies */

const translates = {
  journey_station: 'journey',
  inner_change_keywords: 'innerchange',
  sustainability_keywords: 'sustainability',
  perspective_keywords: 'perspective',
};

function reorder(a) {
  const na = []; const map = {}; const map1 = {};

  a.forEach(function(item) {
    if (item.parent == 0) {
      item['children'] = [];
      map[item.term_id] = na.length;
      na.push(item);
    }
  });

  a.forEach(function(item) {
    if (item.parent in map) {
      item['children'] = [];
      map1[item.term_id] = [map[item.parent], na[map[item.parent]].children.length];
      na[map[item.parent]].children.push(item);
    }
  });

  a.forEach(function(item) {
    if (item.parent in map1) {
      na[map1[item.parent][0]].children[map1[item.parent][0]].children.push(item);
    }
  });

  na.sort(function(a, b) {
    return a.name - b.name;
  });

  na.forEach(function(item) {
    item.children.sort(function(a, b) {
      return a.name - b.name;
    });

    item.children.forEach(function(item) {
      item.children.sort(function(a, b) {
        return a.name - b.name;
      });
    });
  });

  const list = [];

  na.forEach(function(item) {
    list.push(item);
    item.children.forEach(function(item) {
      item.name = '- '+item.name;
      list.push(item);
      item.children.forEach(function(item) {
        item.name = '- - '+item.name;
        list.push(item);
      });
    });
  });

  return list;
}

for (const key in taxonomies) {
  const selectBox = d3.select('.wpcf7-form-control-wrap.'+translates[key]+' select');
  selectBox.selectAll('option').remove();
  selectBox.selectAll('option').data(reorder(taxonomies[key])).enter().append('option')
      .attr('value', function(d) {
        return d.name;
      })
      .html(function(d) {
        return d.name;
      });
}
