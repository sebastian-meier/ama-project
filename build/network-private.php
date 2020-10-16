<?php
/**
 * Template Name: Network (private) generation
 *
 * @package AMA
 */

// !!!!!! Attention this is the same file as network-private.php only the private variable is set differently here, due to limited funding there is no cleaner implementation
// TODO: JavaScript checks if there are links with not existing nodes, but this should be checked here...
ini_set("memory_limit","512M");

$private_path = "private/";
$is_private = true;
$private_query = " AND ( post_status = 'publish' OR post_status = 'private' ) "; // ""

//Check if correct code has been submitted
if(isset($_GET['code']) && $_GET['code']=='23470upsHDv98qykPQ23u09'){

ignore_user_abort(true);
  $time_start = microtime(true);

  global $wpdb;

  /*
   *
   * The code below builds two global networks based on direct (e.g. an author and her publications) and indirect connections (e.g. two people working at the same institution) as well as based on thematic connections (e.g. two people working in the same field)
   * The global networks are then broken down into individual networks for each item in the database
   * All networks are then stored in a database and individual csv files, accompanied by json dictionaries, the file-based export is intended to increase the performance for the d3 visualisations, therefore no dynamic sql queries are required to build the visualisations on the site 
   *
   */

  //For reference we need the taxonomy structure (e.g. who is whose parent)
  $results = $wpdb->get_results( "SELECT wp_ama_term_taxonomy.term_id AS id, taxonomy, parent, name, slug FROM wp_ama_term_taxonomy INNER JOIN wp_ama_terms ON wp_ama_terms.term_id = wp_ama_term_taxonomy.term_id WHERE NOT taxonomy = 'attachment_category' AND NOT taxonomy = 'protection' AND NOT taxonomy = 'category' AND NOT taxonomy = 'nav_menu' ");

  //taxonomy hashtable
  $taxonomy = array();
  foreach ($results as $result) {
    $taxonomy[$result->id] = array(
      'id' => $result->id,
      'taxonomy' => $result->taxonomy,
      'parent' => $result->parent,
      'root' => 0,
      'name' => $result->name,
      'slug' => $result->slug,
      'direct' => array(),
      'indirect' => array(),
      'indirect-direct' => array(),
      'indirect-indirect' => array(),
      'connections' => array()
    );
  }

  foreach ($taxonomy as $id => $tax) {
    $taxonomy[$id]['root'] = getRootId($id);
  }

  //All Authors for reference
  $results = $wpdb->get_results( "SELECT ID, display_name FROM wp_ama_users");

  //authors hashtable
  $authors = array();
  foreach ($results as $result) {
    $authors[$result->ID] = $result->display_name;
  }

  $geolocations = array();

  //All Posts
  //TODO: post_author, post_date
  $results = $wpdb->get_results( "SELECT ID, post_name, post_title, post_type, post_author, post_date, GROUP_CONCAT(term_taxonomy_id) AS taxonomy FROM wp_ama_posts INNER JOIN wp_ama_term_relationships ON ID = object_id WHERE post_parent = 0 AND (post_type = 'publication' OR post_type = 'institution' OR post_type = 'project' OR post_type = 'person') ".$private_query." GROUP BY ID");

  $attributes_result = $wpdb->get_results( "SELECT post_id, meta_key, meta_value, post_type FROM wp_ama_postmeta INNER JOIN wp_ama_posts ON post_id = ID WHERE meta_value<>'' AND (meta_key = 'from' OR meta_key = 'to' OR meta_key = 'publication_year')" );

  $attribute_keys = array();

  foreach ($attributes_result as $attribute) {
    if(!array_key_exists($attribute->post_id, $attribute_keys)){
      $attribute_keys[$attribute->post_id] = array();
    }

    $attribute_keys[$attribute->post_id][$attribute->meta_key] = $attribute->meta_value; 
  }

  //nodes hashtable
  $nodes = array();
  foreach ($results as $result) {
    $taxonomies = explode(',', $result->taxonomy);
    $rootTaxonomies = array();

    foreach($taxonomies as $taxId){
      $rootId = $taxonomy[$taxId]['root'];
      if(!in_array($rootId, $rootTaxonomies)){
        array_push($rootTaxonomies, $rootId);
      }
    }

    $nodes[$result->ID] = array(
      'title' => $result->post_title,
      'type' => $result->post_type,
      'author' => $result->post_author,
      'date' => $result->post_date,
      'slug' => $result->post_name,
      'taxonomy' => $taxonomies,
      'root_taxonomy' => $rootTaxonomies,
      'indirect-taxonomy' => array(),
      'direct' => array(),
      'indirect' => array(),
      'relatives' => array(),
      'thematic-direct-direct' => array(),
      'thematic-indirect-direct' => array(),
      'thematic-indirect-indirect' => array(),
      'thematic-direct-indirect' => array()
    );



    $object_location = $wpdb->get_row( 'SELECT gmlr.object_id, gmlr.geo_date, gml.* FROM wp_ama_geo_mashup_locations gml INNER JOIN wp_ama_geo_mashup_location_relationships gmlr ON gmlr.object_name = "post" AND gmlr.location_id = gml.id WHERE gmlr.object_id = '.$result->ID );

    if($object_location && !is_null($object_location->lat)){
      $nodes[$result->ID]['geo_latitude'] = $object_location->lat;
      $nodes[$result->ID]['geo_longitude'] = $object_location->lng;
      $nodes[$result->ID]['geo_address'] = $object_location->address;

      array_push($geolocations, $result->ID);
    }

    //Load additional meta data
    $additionals = array("from", "to", "publication_year", "");

    foreach ($additionals as $attribute) {
      $attr = '';
      if(array_key_exists($result->ID, $attribute_keys)){
        if(array_key_exists($attribute, $attribute_keys[$result->ID])){
          $attr = $attribute_keys[$result->ID][$attribute];
        }
      }
      $nodes[$result->ID][$attribute] = $attr;
    }

    foreach ($taxonomies as $tax) {
      addToTax($result->ID, $tax, 0, '');
    }
  }

  //Direct Connections
  $results = $wpdb->get_results( "SELECT post_id, meta_key, meta_value, post_type FROM wp_ama_postmeta INNER JOIN wp_ama_posts ON post_id = ID WHERE meta_value<>'' AND (meta_key = 'project_institution' OR meta_key = 'institution_person' OR meta_key = 'publication_institution' OR meta_key = 'publication_person' OR meta_key = 'project_person')" );

  foreach ($results as $result) {
    $con = toArray($result->meta_value, $result->meta_key);
    if(array_key_exists($result->post_id, $nodes)){
      $nodes[$result->post_id]['direct'] = array_merge($nodes[$result->post_id]['direct'], $con);
    }
  }

  //indirect
  //colleagues at institutes
  //coauthors from papers
  //coauthors from projects
  //papers from employees

  $indirect = array(
    array('person',       'publication_person', 'publication_person', 'person'),
    array('person',       'institution_person', 'institution_person', 'person'),
    array('person',       'project_person',     'project_person',     'person'),
    array('publication',  'publication_person', 'institution_person', 'institution'),

    array('person',       'publication_person', 'publication_person', 'institution_person', 'institution'),
    array('person',       'project_person',     'project_person',     'institution_person', 'institution'),
    array('institution',  'institution_person', 'project_person',     'project_person',     'person'),
    array('institution',  'institution_person', 'publication_person', 'institution_person', 'institution'),
    array('institution',  'institution_person', 'project_person',     'institution_person', 'institution')
  );

  foreach ($nodes as $id => $node) {
    $indirect_links = array();
    foreach ($indirect as $connection) {
      if($node['type'] == $connection[0]){
        foreach ($node['direct'] as $direct_connection) {
          if($direct_connection[1] == $connection[1] && array_key_exists($direct_connection[0], $nodes)){
            foreach($nodes[$direct_connection[0]]['direct'] as $sub_direct_connection){
              if($sub_direct_connection[1] == $connection[2] && $sub_direct_connection[0] != $id){
                if(count($connection)==4){
                  array_push($nodes[$id]['indirect'], array($sub_direct_connection[0], $direct_connection[0], $connection[0], $connection[1], $connection[2], $connection[3]));
                }else{
                  if(array_key_exists($sub_direct_connection[0], $nodes)){
                    foreach($nodes[$sub_direct_connection[0]]['direct'] as $sub_sub_direct_connection){
                      if($sub_sub_direct_connection[1] == $connection[3] && $sub_sub_direct_connection[0] != $id){
                        array_push($nodes[$id]['indirect'], array($sub_sub_direct_connection[0], $sub_direct_connection[0], $direct_connection[0], $connection[0], $connection[1], $connection[2], $connection[3], $connection[4]));
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  //thematic
  foreach ($nodes as $id => $node) {
    foreach ($node['taxonomy'] as $tax) {
      $nodes[$id]['thematic-direct-direct'] = array_merge(retrieveTaxIds($tax,0,'direct'), $nodes[$id]['thematic-direct-direct']);
    }
  }

  //acquiring the taxonomy of children (where relevant)

  $indirect_thematic = array(
    array('person','publication_person'),
    array('person','project_person'),
    array('person','institution_person'),
    array('institution','institution_person'),
    array('institution','project_institution')
  );

  foreach ($nodes as $id => $node) {
    foreach ($indirect_thematic as $indirect) {
      if($node['type'] == $indirect[0]){
        foreach($node['direct'] as $direct){
          if($direct[1] == $indirect[1] && array_key_exists($id, $nodes) && array_key_exists($direct[0], $nodes)){
            $nodes[$id]['indirect-taxonomy'] = array_merge($nodes[$id]['indirect-taxonomy'], $nodes[$direct[0]]['taxonomy']);
          }
        }
      }
    }
    //Add the new created indirect taxonomy to the taxonomy tree
    foreach ($nodes[$id]['indirect-taxonomy'] as $tax) {
      addToTax($id, $tax, 0, 'indirect-');
    }
  }

  //acquiring indirect thematic relationships
  foreach ($nodes as $id => $node) {
    foreach ($node['indirect-taxonomy'] as $tax) {
      $nodes[$id]['thematic-indirect-direct'] = array_merge(retrieveTaxIds($tax,0,'direct'), $nodes[$id]['thematic-indirect-direct']);
    }
  }

  foreach ($nodes as $id => $node) {
    foreach ($node['indirect-taxonomy'] as $tax) {
      $nodes[$id]['thematic-indirect-indirect'] = array_merge(retrieveTaxIds($tax,0,'indirect'), $nodes[$id]['thematic-indirect-indirect']);
    }
  }

  foreach ($nodes as $id => $node) {
    foreach ($node['taxonomy'] as $tax) {
      $nodes[$id]['thematic-direct-indirect'] = array_merge(retrieveTaxIds($tax,0,'indirect'), $nodes[$id]['thematic-direct-indirect']);
    }
  }

  //Creating Cached files for faster access
  $fp = fopen(get_template_directory().'/cache/'.$private_path.'taxonomy.json', 'w');
  fwrite($fp, json_encode($taxonomy));
  fclose($fp);

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'nodes.json', 'w');
  $json_str = "{";
  foreach ($nodes as $id => $node) {
    if($json_str != "{"){
      $json_str .= ",";
    }
    $json_str += '"'.$id.'":'.json_encode($node);
  }
  $json_str .= "}";
  fwrite($fp, $json_str);
  fclose($fp);

  //nodes light version for thematic network
  $nodesLight = array();

  foreach ($nodes as $id => $node) {

    if($node['title'] != null){

      $sub = false;
      $title = $node['title'];

      switch ($node['type']) {
        case 'publication':
          $sub = $node['publication_year'];
        break;
        case 'project':
          $sub = $node['from'].' - '.$node['to'];
        break;
      }

      $gIf = 0;

      if(isset($node['geo_latitude'])){
        $gIf = 1;
      }

      $nodesLight[$id] = array(
        'title' => $title,
        'type' => $node['type'],
        'slug' => $node['slug'],
        'taxonomy' => $node['taxonomy'],
        'root_taxonomy' => $node['root_taxonomy'],
        'author' => $node['author'],
        'date' => $node['date'],
        'g' => $gIf
      );

      if($sub && $sub != ' - '){
        $nodesLight[$id]['sub'] = $sub;
      }
    }
  }

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'nodes_light.json', 'w');
  fwrite($fp, json_encode($nodesLight));
  fclose($fp);

  //D3 optimised Network files

  $most_connections = array(0,false);

  foreach ($nodes as $id => $node) {
    $links = array(
      'direct' => array(),
      'indirect' => array(),
      'thematic-direct-direct' => array(),
      'thematic-direct-indirect' => array(),
      'thematic-indirect-indirect' => array(),
      'thematic-indirect-direct' => array()
    );

    foreach ($links as $link_key => $link_array) {
      foreach ($node[$link_key] as $link) {
        if(array_key_exists($link[0], $nodes)){
          array_push($links[$link_key], $link);
          //TODO WHAT DO WE REALLY NEED TO KEEP??
          $node['relatives'][$link[0]] = array(
            'title' => $nodes[$link[0]]['title'],
            'slug' => $nodes[$link[0]]['slug'],
            'author' => $nodes[$link[0]]['author'],
            'date' => $nodes[$link[0]]['date'],
            'type' =>  $nodes[$link[0]]['type'],
            'direct' =>  $nodes[$link[0]]['direct'],
            'indirect' =>  $nodes[$link[0]]['indirect'],
            'taxonomy' =>  $nodes[$link[0]]['taxonomy']
          );
        }
      }
    }

    if((count($links['direct'])+count($links['indirect']))>$most_connections[0]){
      $most_connections[0] = (count($links['direct'])+count($links['indirect']));
      $most_connections[1] = $id;
    }

    $fp = fopen(get_template_directory().'/cache/'.$private_path.'individual/'. $id .'.json', 'w');
    fwrite($fp, json_encode($node));
    fclose($fp);

    $individualLight = array();

    //add core node
    $individualLight = addIndividualNode($individualLight, $node, $id);

    foreach ($node['thematic-direct-direct'] as $key => $value) {
      if($value[2] == 0 && $value[0] != $id && ($value[3] == 'sustainability_keywords' || $value[3] == 'inner_change_keywords')){
        if(array_key_exists($value[0], $node['relatives'])){
          $individualLight = addIndividualNode($individualLight, $node['relatives'][$value[0]], $value[0]);
        }
      }
    }

    $fp = fopen(get_template_directory().'/cache/'.$private_path.'individual/'. $id .'_light.json', 'w');
    fwrite($fp, json_encode($individualLight));
    fclose($fp);

  }

  //IASS Special case
  $iass_direct = iass_direct(15, 1, 3);
  $iass_direct_clean = array();
  $iass_map = array();
  foreach($iass_direct as $direct){
    if(!in_array($direct['id'], $iass_map)){
      array_push($iass_map, $direct['id']);
      array_push($iass_direct_clean, $direct);
    }
  }

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'iass.json', 'w');
  fwrite($fp, json_encode($iass_direct_clean));
  fclose($fp);

  $geo_nodes = array();
  $geo_edges = array();
  $con_keys = array();
  $con_map = array();

  $edge_keys = array('direct','indirect','thematic-direct-direct', 'thematic-direct-indirect', 'thematic-indirect-indirect', 'thematic-indirect-direct');

  foreach($geolocations as $gid){
    $sub = false;
    switch ($nodes[$gid]['type']) {
      case 'publication':
        $sub = $nodes[$gid]['publication_year'];
      break;
      case 'project':
        $sub = $nodes[$gid]['from'].' - '.$nodes[$gid]['to'];
      break;
    }
    array_push($geo_nodes, array($gid, $nodes[$gid]['title'],$nodes[$gid]['type'],$nodes[$gid]['author'],$nodes[$gid]['date'],$nodes[$gid]['geo_latitude'],$nodes[$gid]['geo_longitude'],$nodes[$gid]['taxonomy'],$nodes[$gid]['slug'],$sub));
    foreach($edge_keys as $key){
      foreach ($nodes[$gid][$key] as $edge){
        if($key == 'thematic-direct-direct'){
          $cid1 = $edge[0];
          $cid2 = $gid;
          if($gid < $edge[0]){
            $cid2 = $edge[0];
            $cid1 = $gid;
          }
          $c1 = $cid1.'-'.$cid2;
          if($edge[0] != $gid && in_array($edge[0], $geolocations)){
            if(!in_array($c1, $con_keys)){
              array_push($geo_edges, array($gid, $edge[0], 1));
              array_push($con_keys, $c1);
              $con_map[$c1] = count($geo_edges)-1;
            }else{
              $geo_edges[$con_map[$c1]][2]++;
            }
          }
        }
      }
    }
  }

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'geo_network_nodes.json', 'w');
  fwrite($fp, json_encode($geo_nodes));
  fclose($fp);

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'geo_network_edges.json', 'w');
  fwrite($fp, json_encode($geo_edges));
  fclose($fp);

  //Building the entity network through (direct) thematic intersections
  //thematic-direct-direct
  $thematic_network = buildNetwork($nodes, array("thematic-direct-direct"), true);

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'entity-thematic-nodes.csv', 'w');
  fwrite($fp, $thematic_network[0]);
  fclose($fp);

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'entity-thematic-edges.csv', 'w');
  fwrite($fp, $thematic_network[1]);
  fclose($fp);  

  //Building the entity network through direct intersections
  //direct
  $direct_network = buildNetwork($nodes, array("direct"), false);

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'entity-direct-nodes.csv', 'w');
  fwrite($fp, $direct_network[0]);
  fclose($fp);

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'entity-direct-edges.csv', 'w');
  fwrite($fp, $direct_network[1]);
  fclose($fp);  

  //Building the thematic network by finding the intersections

  $tax_node_csv = 'id,parent,name,systematic';
  $tax_edge_csv = 'source,target,weight';

  foreach ($taxonomy as $tax_id => $tax) {
    if($tax['taxonomy'] == 'sustainability_keywords' || $tax['taxonomy'] == 'inner_change_keywords'){
      foreach ($tax['direct'] as $node_id) {
        foreach ($nodes[$node_id]['taxonomy'] as $node_tax_id){
          if($taxonomy[$node_tax_id]['taxonomy'] == 'sustainability_keywords' || $taxonomy[$node_tax_id]['taxonomy'] == 'inner_change_keywords'){
            if($node_tax_id != $tax_id){
              if(!array_key_exists($node_tax_id, $taxonomy[$tax_id]['connections'])){
                $taxonomy[$tax_id]['connections'][$node_tax_id] = 1;
              }else{
                $taxonomy[$tax_id]['connections'][$node_tax_id]++;
              }
            }
          }
        }
      }
    }
  }

  $con_nodes = array();

  foreach ($taxonomy as $tax_id => $tax) {
    if($tax['taxonomy'] == 'sustainability_keywords' || $tax['taxonomy'] == 'inner_change_keywords'){
      //before adding the node, check that this nodes has connections, otherwise ignore
      foreach ($tax['connections'] as $connection_id => $count) {
        if($connection_id>$tax_id){
          $con_nodes = array_merge($con_nodes, addTaxCon($tax_id, $con_nodes));
          $con_nodes = array_merge($con_nodes, addTaxCon($connection_id, $con_nodes));

          $tax_edge_csv .= "\n".$tax_id.','.$connection_id.','.$count;
        }
      }
    }
  }

  $tax_translate = array(
    "sustainability_keywords" => "c_s",
    "inner_change_keywords" => "c_ic"
  );

  foreach ($taxonomy as $tax_id => $tax) {
    if(in_array($tax_id, $con_nodes)){

      $tax_node_csv .= "\n".$tax_id.',';
      if($tax['parent'] == 0){
        $tax_node_csv .= -1;
      }else{
        $tax_node_csv .= $tax['parent'];
      }
      $tax_node_csv .= ',';
      if(strpos($tax['name'], ',')){
        $tax_node_csv .= '"'.$tax['name'].'"';
      }else{
        $tax_node_csv .= $tax['name'];
      }
      $tax_node_csv .= ','.$tax_translate[$tax['taxonomy']];
    }
  }

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'cat_nodes_clean_min.csv', 'w');
  fwrite($fp, $tax_node_csv);
  fclose($fp);

  $fp = fopen(get_template_directory().'/cache/'.$private_path.'cat_edges_all_grouped_min.csv', 'w');
  fwrite($fp, $tax_edge_csv);
  fclose($fp);


  //Building the thematic network for each type

  $network_types = array("person","institution","publication","project");
  foreach ($network_types as $network_type) {

    $tax_node_csv = 'id,parent,name,systematic';
    $tax_edge_csv = 'source,target,weight';

    


    foreach ($taxonomy as $tax_id => $tax) {
      //Reset before counting everything...

      foreach($taxonomy[$tax_id]['connections'] as $connections_id => $connections){
        $taxonomy[$tax_id]['connections'][$connections_id] = 0;
      }

      if($tax['taxonomy'] == 'sustainability_keywords' || $tax['taxonomy'] == 'inner_change_keywords'){
        foreach ($tax['direct'] as $node_id) {
          if($nodes[$node_id]['type'] == $network_type){
            foreach ($nodes[$node_id]['taxonomy'] as $node_tax_id){
              if($taxonomy[$node_tax_id]['taxonomy'] == 'sustainability_keywords' || $taxonomy[$node_tax_id]['taxonomy'] == 'inner_change_keywords'){
                if($node_tax_id != $tax_id){
                  if(!array_key_exists($node_tax_id, $taxonomy[$tax_id]['connections'])){
                    $taxonomy[$tax_id]['connections'][$node_tax_id] = 1;
                  }else{
                    $taxonomy[$tax_id]['connections'][$node_tax_id]++;
                  }
                }
              }
            }
          }
        }
      }
    }

    $con_nodes = array();

    foreach ($taxonomy as $tax_id => $tax) {
      if($tax['taxonomy'] == 'sustainability_keywords' || $tax['taxonomy'] == 'inner_change_keywords'){
        //before adding the node, check that this nodes has connections, otherwise ignore
        foreach ($tax['connections'] as $connection_id => $count) {
          if($connection_id>$tax_id){
            $con_nodes = array_merge($con_nodes, addTaxCon($tax_id, $con_nodes));
            $con_nodes = array_merge($con_nodes, addTaxCon($connection_id, $con_nodes));

            $tax_edge_csv .= "\n".$tax_id.','.$connection_id.','.$count;
          }
        }
      }
    }

    $tax_translate = array(
      "sustainability_keywords" => "c_s",
      "inner_change_keywords" => "c_ic"
    );

    foreach ($taxonomy as $tax_id => $tax) {
      if(in_array($tax_id, $con_nodes)){

        $tax_node_csv .= "\n".$tax_id.',';
        if($tax['parent'] == 0){
          $tax_node_csv .= -1;
        }else{
          $tax_node_csv .= $tax['parent'];
        }
        $tax_node_csv .= ',';
        if(strpos($tax['name'], ',')){
          $tax_node_csv .= '"'.$tax['name'].'"';
        }else{
          $tax_node_csv .= $tax['name'];
        }
        $tax_node_csv .= ','.$tax_translate[$tax['taxonomy']];
      }
    }

    $fp = fopen(get_template_directory().'/cache/'.$private_path.'cat_nodes_clean_min-'.$network_type.'.csv', 'w');
    fwrite($fp, $tax_node_csv);
    fclose($fp);

    $fp = fopen(get_template_directory().'/cache/'.$private_path.'cat_edges_all_grouped_min-'.$network_type.'.csv', 'w');
    fwrite($fp, $tax_edge_csv);
    fclose($fp);
  }

  $time_end = microtime(true);
  $time = $time_end - $time_start;
  echo floatval($time).' Microseconds';


}else{
  echo 'Access denied';
}

function iass_direct($id, $current, $max){
  global $nodes;

  $additional_nodes = array();

  foreach($nodes[$id]['direct'] as $link){

    if(array_key_exists($link[0], $nodes) && $nodes[$link[0]]['title'] != null){

      array_push($additional_nodes, array(
          'id' => $link[0],
          'title' => $nodes[$link[0]]['title'],
          'slug' => $nodes[$link[0]]['slug'],
          'author' => $nodes[$link[0]]['author'],
          'date' => $nodes[$link[0]]['date'],
          'type' =>  $nodes[$link[0]]['type'],
          'taxonomy' =>  $nodes[$link[0]]['taxonomy'],
          'root_taxonomy' =>  $nodes[$link[0]]['root_taxonomy']
        )
      );

      if($current < $max){
        $additional_nodes = array_merge($additional_nodes, iass_direct($link[0], $current+1, $max));
      }
    }

  }

  return $additional_nodes;
}

function buildNetwork($nodes, $connectors, $withType){
  global $taxonomy;
  $node_csv = 'id,title,type';
  $edge_csv = 'source,target,weight';
  if($withType){
    $edge_csv .= ',type';
  }

  foreach ($nodes as $id => $node) {
    $id = intval($id);
    $c = 0;
    foreach ($connectors as $connector) {
      $cc = 0;
      foreach ($node[$connector] as $cid) {
        $cid[0] = intval($cid[0]);
        if($cc <= 2){
          if($id<$cid[0]){
            if($withType){

              //limit to inner_change_keywords and sustainability_keywords
              //One of each kind

              $tax_type = $taxonomy[$cid[1]]['taxonomy'];

              $tax_short = array(
                'inner_change_keywords' => 'ic',
                'sustainability_keywords' => 's'
              );

              if(($tax_type == 'inner_change_keywords' || $tax_type == 'sustainability_keywords') && $cid[2] == 0){
                $edge_csv .= "\n".$id.','.$cid[0].',1,'.$tax_short[$tax_type];
                $cc++;
                $c++;
              }
            }else{
              $edge_csv .= "\n".$id.','.$cid[0].',1';
              $cc++;
              $c++;
            }
          }else{
            if($withType){
              $tax_type = $taxonomy[$cid[1]]['taxonomy'];
              if(($tax_type == 'inner_change_keywords' || $tax_type == 'sustainability_keywords') && $cid[2] == 0){
                $c++;
              }
            }else{
              $c++;
            }
          }
        }
      }
    }
    if($c>0){
      $node_csv .= "\n".$id.',';
      if(strpos($node['title'], ',')){
        $node_csv .= '"'.$node['title'].'",';
      }else{
        $node_csv .= $node['title'].',';
      }
      $node_csv .= $node['type'];
    }
  }

  return array($node_csv, $edge_csv);
}

function addIndividualNode($array, $node, $id){

  if($node['title'] != null){

    $sub = false;
    $title = $node['title'];

    switch ($node['type']) {
      case 'publication':
        $sub = "";
        if(array_key_exists('publication_year', $node)){
          $sub = $node['publication_year'];
        }
      break;
      case 'project':
        $from = ""; $to = "";
        if(array_key_exists('from', $node)){
          $from = $node['from'];
        }
        if(array_key_exists('to', $node)){
          $from = $node['to'];
        }
        $sub = $from;
        if($to != "" && $from != ""){
          $sub .= " - ";
        }
        $sub .= $to;
      break;
    }

    $array[$id] = array(
      'title' => $title,
      'type' => $node['type'],
      'slug' => $node['slug'],
      'taxonomy' => $node['taxonomy'],
      'author' => $node['author'],
      'date' => $node['date']
    );

    if($sub && $sub != ' - '){
      $array[$id]['sub'] = $sub;
    }
  }

  return $array;
}

function addToTax($post_id, $tax_id, $level, $prefix){
  global $taxonomy;
  $a = $prefix.'indirect';
  if($level == 0){
    $a = $prefix.'direct';
  }
  array_push($taxonomy[$tax_id][$a], $post_id);
  if($taxonomy[$tax_id]['parent'] != 0){
    addToTax($post_id, $taxonomy[$tax_id]['parent'], $level+1, $prefix);
  }
}

function retrieveTaxIds($tax, $level, $source){
  global $taxonomy;
  $a = array();
  foreach ($taxonomy[$tax][$source] as $node_id){
    array_push($a, array($node_id, $tax, $level, $taxonomy[$tax]['taxonomy']));
  }

  if($taxonomy[$tax]['parent'] != 0){
    $a = array_merge(retrieveTaxIds($taxonomy[$tax]['parent'], $level+1, $source), $a);
  }

  return $a;
}

function getRootId($tax){
  global $taxonomy;
  $temp = $taxonomy[$tax];
  while($temp['parent'] != 0 && $temp['parent'] != 61 && $temp['parent'] != 83){
    $temp = $taxonomy[$temp['parent']];
  }
  return $temp['id'];
}

function addTaxCon($id, $a){
  global $taxonomy;
  if(in_array($id, $a)){
    return array();
  }else{
    if($taxonomy[$id]['parent'] != 0){
      return array_merge(array($id), addTaxCon($taxonomy[$id]['parent'], $a));
    }else{
      return array($id);
    }
  }
}

//print_r($wpdb->get_results("SELECT * FROM wp_ama_postmeta WHERE meta_key = 'institution_person'"));
function toArray($str, $meta_key){
  $a = array();

  $count = intval(explode(':', $str)[1]);

  $exp = explode(';', substr($str, strpos($str, '{'), -1));

  for($i = 0; $i<$count; $i++){
    $exp1 = explode(':', $exp[$i*2+1]);
    array_push($a, array(str_replace('"', '', $exp1[count($exp1)-1]), $meta_key));
  }

  return $a;
}