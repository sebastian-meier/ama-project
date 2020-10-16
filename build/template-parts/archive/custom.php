<?php
/**
 * The template for displaying custom archive pages
 *
 */
global $result_count, $result_count_bi;
?>

<div id="search">
    <main>

	<?php if ( have_posts() ) : ?>
			<?php
				the_archive_title( '<h1 class="page-title">', '</h1>' );
			?>
	<?php endif; ?>

	<div class="wrap content-connections">
    <div id="search-results" class="connections<?php if ( have_posts() ) { echo ' has-results'; } ?>">
		<?php
		if ( have_posts() ) : ?>
			<?php
			/* Start the Loop */
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

		else :

			get_template_part( 'template-parts/post/content', 'none' );

		endif; ?>

<hr class="clear" />

</div>
<?php get_sidebar(); ?>
</div>
</main>
</div>