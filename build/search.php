<?php
/**
 * The template for displaying search results pages
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/#search-result
 *
 */

global $result_count;

get_header(); ?>
<div id="search">
	<main>
	<h1>Search</h1>
	<form action="<?php echo home_url(); ?>" method="get">
		<p>
    	<input class="search" type="text" name="s" id="s" placeholder="Search..." value="<?php the_search_query(); ?>" />
    	<input type="submit" value="Search" id="wp-submit" />
    </p>
	</form>

	<div class="wrap content-connections">

		<header class="page-header">
			<?php if ( have_posts() ) : ?>
				<h2 class="page-title"><?php printf( __( 'Search Results for: %s', 'ama' ), '<span>' . get_search_query() . '</span>' ); ?></h2>
			<?php else : ?>
				<h2 class="page-title"><?php _e( 'Nothing Found', 'ama' ); ?></h2>
			<?php endif; ?>
		</header>

		<div id="search-results" class="connections<?php if ( have_posts() ) { echo ' has-results'; } ?>">

			<?php
			if ( have_posts() ) :
				$result_count = 1; $result_count_bi = 1;
				while ( have_posts() ) : the_post();

					get_template_part( 'template-parts/post/content', 'excerpt' );

					$result_count++;
	        if( $result_count > 3 ){
	          $result_count = 1;
	        }

	        $result_count_bi++;
	        if($result_count_bi > 2){
	        	$result_count_bi = 1;
	        }

				endwhile;

				the_posts_pagination( array(
					'prev_text' => '<span class="screen-reader-text">' . __( 'Previous page', 'ama' ) . '</span>',
					'next_text' => '<span class="screen-reader-text">' . __( 'Next page', 'ama' ) . '</span>',
					'before_page_number' => '<span class="meta-nav screen-reader-text">' . __( 'Page', 'ama' ) . ' </span>',
				) );

			else : ?>

				<p><?php _e( 'Sorry, but nothing matched your search terms. Please try again with some different keywords.', 'ama' ); ?></p>
				<?php

			endif;
			?>
    <hr class="clear" />

		</div>
		<?php get_sidebar(); ?>
	</div>
	</main>
</div>
<?php get_footer();
