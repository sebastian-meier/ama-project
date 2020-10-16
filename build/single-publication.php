<?php
/**
 * The template for displaying all single publication
 */

get_header(); ?>

<div id="primary" class="content-area type-person">
  <main id="main" class="site-main" role="main">
    <?php
      while ( have_posts() ) : the_post();
          $post_id = get_the_ID();
    ?>
    <div class="content-icon">
      <?php
          if(has_post_thumbnail()){
            $thumbnail = get_the_post_thumbnail_url($post_id, 'thumb');
            echo styled_image($thumbnail, '#000000', get_the_title());
          }else{
            $ratio = getRatio($post_id);
      ?>
          <div title="<?php the_title(); ?>" class="icon main-icon" data-icon="<?php echo get_template_directory_uri(); ?>/assets/images/icon_publications@2x.gif" data-s="<?php echo $ratio['s']; ?>" data-ic="<?php echo $ratio['ic']; ?>"></div>
      <?php
          }
      ?>
    </div>
    <div class="content-title">
<?php
          $from = get_field('publication_year');
          $to = get_field('type');
          $value = false;          
          if((isset($from) && strlen($from) > 0)||(isset($to) && strlen($to) > 0)){
            $value = true;
            echo '          <h2>'.$from;
            if((isset($from) && strlen($from) > 0)&&(isset($to) && strlen($to) > 0)){
              echo ',&nbsp;';
            }
            echo $to;
            echo '</h2>'."\n";
          }
?>
          <h1<?php if($value){ echo ' class="w-h2"'; } ?>><?php the_title(); ?></h1>
          <hr>
    </div>
<?php

  $html = buildTerms($post_id);
  if($html != ''){ 

?>
    <div class="content-cats">
<?php echo $html; ?>
    </div>
<?php
  }
  if(strlen(get_the_content())>1){
?>
    <div class="content-detail">
      <p><?php the_content(); ?></p>
    </div>
<?php
  }
?>
<?php

$html = buildMetaHtml($post->ID);

if($html != ''){
?>
<div class="content-meta">
<?php echo $html; ?>
</div>
<?php 
}

	$html = '';

	$attachments = get_posts( array(
		'post_type' => 'attachment',
		'posts_per_page' => -1,
		'post_parent' => $post_id,
		'exclude'     => get_post_thumbnail_id()
	));

	if ( $attachments ) {
		$ai = 1;
		foreach ( $attachments as $attachment ) {
			if($attachment->post_mime_type == 'application/pdf'){
				$url = $attachment->guid;
				$title = $attachment->post_title;
				$file = get_attached_file($attachment->ID);
				$size = getSize($file);
				$cats = wp_get_post_terms($attachment->ID,'attachment_category');
				$private = false;
				foreach ($cats as $cat) {
					if($cat->slug == 'private'){
						$private = true;
					}
				}
				if($private && !is_user_logged_in()){
					$html .= '<li class="private p'.$ai.'"><span class="title">'.$title.'</span><span class="size">PDF / '.$size.'</span></li>';
				}else{
					$html .= '<li class="p'.$ai.'"><a href="'.$url.'"><span class="title">'.$title.'</span><span class="size">PDF / '.$size.'</span></a></li>';
				}
				$ai++;
				if($ai > 3){
					$ai = 1;
				}
			}
		}
	}

	if($html != ''){
?> 
    <div class="content-downloads">
    	<h3>Downloads</h3>
    		<ul>
<?php echo $html; ?>
			</ul>
    </div>
<?php
	}

	$html = buildConnections($post_id, 'publication_person', 'Persons', 'Person', 'list');
	if($html != ''){
?>
    <div class="content-connections">
      <h3>Connections</h3>
<?php

  echo $html;

?>
    </div>
<?php
	}
      endwhile;
    ?>
      <hr class="clear" />
  </main>
</div>

<?php get_footer();
