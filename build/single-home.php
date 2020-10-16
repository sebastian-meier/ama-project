<?php
/**
 * Template Name: Home Page
 *
 * Description: Based on single.php
 *
 * @package AMA
 */

get_header(); ?>

<div class="wrap">
	<div id="primary" class="content-area">
		<main id="main" class="site-main" role="main">
			<?php
				/* Start the Loop */
				while ( have_posts() ) : the_post();
?>
<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>

	<div class="home-content">
		<?php
			/* translators: %s: Name of current post */
			the_content();
		?>
	</div><!-- .entry-content -->


</article><!-- #post-## -->
<?php
				endwhile; // End of the loop.
			?>
			<hr class="clear" />
		</main><!-- #main -->
	</div><!-- #primary -->
	<?php get_sidebar(); ?>
</div><!-- .wrap -->

<?php get_footer();
