<?php
/**
 * Displays top navigation
 *
 */

?>
<nav id="site-navigation" class="main-navigation" role="navigation" aria-label="<?php _e( 'Top Menu', 'ama' ); ?>">
	<button class="menu-toggle" aria-controls="top-menu" aria-expanded="false"><?php _e( 'Menu', 'ama' ); ?></button>
	<?php wp_nav_menu( array(
		'theme_location' => 'top',
		'menu_id'        => 'top-menu',
	) ); ?>

</nav><!-- #site-navigation -->
