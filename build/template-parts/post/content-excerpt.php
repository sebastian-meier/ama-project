<?php
/**
 * Template part for displaying posts with excerpts
 *
 * Used in Search Results and for Recent Posts in Front Page panels.
 *
 * @link https://codex.wordpress.org/Template_Hierarchy
 *
 */

global $result_count, $result_count_bi;

$id = get_the_ID();

$title = get_the_title( $p->ID );

$type = get_post_type();

switch ($type) {
  case 'publication':
    $title = "&ldquo;".$title."&rdquo;";
    $subline = get_field('publication_year', $p->ID);
  break;
  case 'project':
    $title = "&ldquo;".$title."&rdquo;";
    $subline = get_field('from', $p->ID).' - '.get_field('to', $p->ID);
  break;
}

//if ( 'post' === get_post_type() )

echo '<a id="'.$id.'" class="connection c-type-'.$type.' list b'.$result_count_bi.' c'.$result_count.'" href="'.get_permalink( $id ).'">'."\n";
echo '	<span class="skytitle '.$type.'">'.$type.'</span>'."\n";
echo '	<span class="title">'.$title.'</span>'."\n";
echo '	<span class="line">'."\n";

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

?>