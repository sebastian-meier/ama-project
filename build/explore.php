<?php
/**
 * Template Name: Explore Page
 *
 * @package AMA
 */

get_header();

echo '<div id="explore-con" class="connections">';

// TODO: There is a lot going on here. Maybe cache this somehow. Particularly getRatio is really expensive.

  $results = $wpdb->get_results( "SELECT ID, post_title, post_type, post_author, post_date, GROUP_CONCAT(term_taxonomy_id) AS taxonomy FROM wp_ama_posts INNER JOIN wp_ama_term_relationships ON ID = object_id WHERE post_parent = 0 AND (post_type = 'publication' OR post_type = 'institution' OR post_type = 'project' OR post_type = 'person') GROUP BY ID ORDER BY post_title");

  $result_count = 1;
  $result_count_bi = 1;

  foreach ($results as $result) {
    $taxonomies = explode(',', $result->taxonomy);

    $subline = '';

    $id = $result->ID;
    $title = $result->post_title;
    $type = $result->post_type;

    switch ($type) {
      case 'publication':
        $title = "&ldquo;".$title."&rdquo;";
        $subline = get_field('publication_year', $id);
      break;
      case 'project':
        $title = "&ldquo;".$title."&rdquo;";
        $subline = get_field('from', $id).' - '.get_field('to', $id);
      break;
    }

    echo '<a data-type="'.$result->post_type.'" data-date="'.$result->post_date.'" data-author="'.$result->post_author.'" data-tax="'.$result->taxonomy.'" class="';

    echo 'author-'.$result->post_author.' ';

    echo 'type-'.$result->post_type.' ';

    foreach ($taxonomies as $tax) {
      echo 'tax-'.$tax.' ';
    }

    echo 'connection list b'.$result_count_bi.' c'.$result_count.'" href="'.get_permalink( $id ).'">'."\n";
    echo '  <span class="skytitle '.$type.'">'.$type.'</span>'."\n";
    echo '  <span class="title">'.$title.'</span>'."\n";
    echo '  <span class="line">'."\n";

    $ratio = getRatio($id);
    $overall_ratio["ic"] += $ratio["ic"];
    $overall_ratio["s"] += $ratio["s"];

    if($ratio['s']==0 && $ratio['ic']==0){
      echo '<span class="ratioline v-none"></span>'."\n";
    }elseif($ratio['s']==0){
      echo '<span class="ratioline v-ic"></span>'."\n";
    }elseif($ratio['ic']==0){
      echo '<span class="ratioline v-s"></span>'."\n";
    }else{
      echo '<span class="ratioline v-s-50"></span>'."\n";
      echo '<span class="ratioline v-ic-50"></span>'."\n";
    }

    echo '</span>'."\n";

    echo '<span class="subline">'.$subline.'</span>';

    echo '<hr class="clear" />'."\n";
    echo '</a>'."\n";

    $result_count++;
    $result_count_bi++;
    if($result_count > 3){
      $result_count = 1;
    }
    if($result_count_bi>2){
      $result_count_bi = 1;
    }

  }


echo '</div><hr class="clear" />';

get_footer();