<?php
/**
 * The template for displaying all single instition
 */

get_header(); ?>

<div id="primary" class="content-area type-institution">
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
          <div title="<?php the_title(); ?>" class="icon main-icon" data-icon="<?php echo get_template_directory_uri(); ?>/assets/images/icon_institutions@2x.gif" data-s="<?php echo $ratio['s']; ?>" data-ic="<?php echo $ratio['ic']; ?>"></div>
      <?php
          }
      ?>
    </div>
    <div class="content-title">
          <h1><?php the_title(); ?></h1>
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
  $html .= buildConnections($post_id, 'field_590b3a80dda43', 'Persons', 'Person', 'list');
  $html .= buildConnections($post_id, 'field_590b3a91dda44', 'Projects', 'Project', 'cards');
  $html .= buildConnections($post_id, 'field_59e12bbb1c20a', 'Publications', 'Publication', 'cards');

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
