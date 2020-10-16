<?php
/**
 * The header for our theme
 *
 */

  $template = get_page_template();
  $has_head = false;
  if(is_singular(array('person','institution','publication','project')) || strpos($template, 'explore.php') || strpos($template, 'front-page.php') ){
    $has_head = true;
  }

?><!DOCTYPE html>
<html <?php language_attributes(); ?> class="no-js no-svg<?php if($has_head){ echo ' hasHead';} ?>">
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="profile" href="http://gmpg.org/xfn/11">
<link href='<?php echo get_template_directory_uri(); ?>/assets/js/shepherd/shepherd-theme-dark.css' rel='stylesheet' />
<link href='https://api.tiles.mapbox.com/mapbox-gl-js/v0.52.0/mapbox-gl.css' rel='stylesheet' />
<?php wp_head(); ?>
<style type="text/css">
<?php
  if ( ! is_user_logged_in() ) {
    echo '#menu-item-231';
  }else{
    echo '#menu-item-167';
  }
?>{ display:none; }
</style>
</head>
<body <?php body_class(); ?>>
  <a class="skip-link screen-reader-text" href="#content" name="backtotop"><?php _e( 'Skip to content', 'ama' ); ?></a>
  <header>
    <div id="header">
      <div class="left">
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" id="logo"><img src="<?php echo get_template_directory_uri(); ?>/assets/images/Logo-Black@2x.png" alt="<?php echo bloginfo('name'); ?>" /></a>
      </div>
      <div class="right">
        <nav id="site-navigation" class="main-navigation" role="navigation">
            <button class="menu-toggle">Menu</button>
<?php

  wp_nav_menu(array(
    'menu' => 'Meta-Menu', 'menu_class' => 'nav-menu'
  ));

?>
        </nav>
      </div>
    </div>
  </header>

  <div id="page" class="site<?php if(!$has_head){ echo ' nosvg'; } ?>">
    <a name="#top"></a>
    <div id="svg-container"<?php
  if($has_head){
?> class="interactive-svg"<?php
  }
?>>
    </div>
      <div id="mobile-message">
        <p>
          Sorry, this visualisation only works on tablet and desktop computers.<br />
        </p>
      </div>
<?php
  if(!$has_head){
?>
      <div id="explore-message">
        <a href="<?php echo get_permalink(163); ?>">Explore the Network &raquo;</a>
      </div>
<?php
  }
?>
		<div id="content" class="site-content<?php if($has_head){ echo ' nopadtop'; } ?>">

<?php
  if($has_head){
?>
    <div id="filters">
      <ul id="type-nav">
        <li class="person">
          <a href="<?php echo get_post_type_archive_link('person'); ?>">
            <!--<span class="circle"></span><br />-->
            <svg width="16" height="16"><g transform="translate(8,8) scale(2)"><path d="M0,-2.942830956382712L1.6990442448471226,0L0,2.942830956382712L-1.6990442448471226,0Z" style="fill: rgb(0, 0, 0); stroke: transparent;"></path></g></svg><br />
            Persons
          </a>
        </li>
        <li class="institution">
          <a href="<?php echo get_post_type_archive_link('institution'); ?>">
            <!--<span class="circle"></span><br />-->
            <svg width="16" height="16"><g transform="translate(8,8) scale(2)"><path d="M-2.121320343559643,-0.7071067811865476L-0.7071067811865476,-0.7071067811865476L-0.7071067811865476,-2.121320343559643L0.7071067811865476,-2.121320343559643L0.7071067811865476,-0.7071067811865476L2.121320343559643,-0.7071067811865476L2.121320343559643,0.7071067811865476L0.7071067811865476,0.7071067811865476L0.7071067811865476,2.121320343559643L-0.7071067811865476,2.121320343559643L-0.7071067811865476,0.7071067811865476L-2.121320343559643,0.7071067811865476Z" style="fill: rgb(0, 0, 0); stroke: transparent;"></path></g></svg><br />
            Institutions
          </a>
        </li>
        <li class="project">
          <a href="<?php echo get_post_type_archive_link('project'); ?>">
            <!--<span class="circle"></span><br />-->
            <svg width="16" height="16"><g transform="translate(8,8) scale(2)"><path d="M-1.5811388300841898,-1.5811388300841898h3.1622776601683795v3.1622776601683795h-3.1622776601683795Z" style="fill: rgb(0, 0, 0); stroke: transparent;"></path></g></svg><br />
            Projects
          </a>
        </li>
        <li class="publication">
          <a href="<?php echo get_post_type_archive_link('publication'); ?>">
            <!--<span class="circle"></span><br />-->
            <svg width="16" height="16"><g transform="translate(8,8) scale(2)"><path d="M0,-2.7745276335252114L2.402811414134754,1.3872638167626057L-2.402811414134754,1.3872638167626057Z" style="fill: rgb(0, 0, 0); stroke: transparent;"></path></g></svg><br />
            Publications
          </a>
        </li>
      </ul>
      <span class="vdiv"></span>
      <ul id="vis-nav">
        <li class="network"><a class="active">Network</a></li>
<?php if(!is_singular(array('person','institution','publication','project'))){ ?>
        <li class="bipartite"><a>Topics</a></li>
        <li class="map"><a>Map</a></li>
        <li class="matrix"><a>Matrix</a></li>
<?php }else{ ?>
        <li class="radial"><a>Related</a></li>
        <!--<li class="matrix"><a>Matrix</a></li>-->
<?php } ?>
      </ul>
      <span class="vdiv"></span>
      <div id="result-display"></div>
      <span class="vdiv"></span>
      <div id="filter-nav">
        <div id="filter-inner-change" class="filter-block">
          <span class="label"><span style="color:rgb(13, 107, 111);">&#9679;</span><br />Inner Change</span>
          <div class="dropdown">
            <ul id="select_inner_change_keywords"></ul>
          </div>
        </div>
        <div id="filter-sustainability" class="filter-block">
          <span class="label"><span style="color:rgb(118, 27, 65);">&#9679;</span><br />Sustainability</span>
          <div class="dropdown">
            <ul id="select_sustainability_keywords"></ul>
          </div>
        </div>
        <div id="filter-perspective" class="filter-block">
          <span class="label">&nbsp;<br />Perspective</span>
          <div class="dropdown">
            <ul id="select_perspective_keywords"></ul>
          </div>
        </div>
        <div id="filter-journey-station" class="filter-block">
          <span class="label">&nbsp;<br />Journey Stations</span>
          <div class="dropdown">
            <ul id="select_journey_station"></ul>
          </div>
        </div>
        <div id="filter-ama-role" class="filter-block">
          <span class="label">&nbsp;<br />AMA Roles</span>
          <div class="dropdown">
            <ul id="select_ama_role"></ul>
          </div>
        </div>
      </div>
    </div>
<?php
  }
?>
      <div id="content-column" class="content-column">