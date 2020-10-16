<?php
/**
 * The front page template file
 *
 */

get_header(); ?>

<div id="primary" class="content-area front-page">
	<main id="main" class="site-main" role="main">
			<?php
				/* Start the Loop */
				while ( have_posts() ) : the_post();
?>
<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>

	<div class="home-content">
		<h1>A Mindset for the Anthropocene</h1>
		<?php
			/* translators: %s: Name of current post */
			the_content();
		?>
		<p><a href="<?php echo get_permalink(163); ?>" class="copy-btn copy-btn-network">Start exploring the network &raquo;</a></p>
	</div><!-- .entry-content -->

	<div id="home-svg-container">
		
		<img src="<?php echo get_template_directory_uri(); ?>/assets/images/icon_mountain_large@2x.png" alt="" id="moutain-icon" />

		<svg id="home-svg"></svg>
		
		<div class="home-svg-copy" id="home-svg-copy-1">
			<h2><span class="home-svg-icon">1</span><?php echo get_field('journey_1'); ?></h2>
			<p><?php echo get_field('journey_description_1'); ?></p>
		</div>

		<div class="home-svg-copy" id="home-svg-copy-2">
			<h2><span class="home-svg-icon">2</span><?php echo get_field('journey_2'); ?></h2>
			<p><?php echo get_field('journey_description_2'); ?></p>
		</div>
		
		<div class="home-svg-copy" id="home-svg-copy-3">
			<h2><span class="home-svg-icon">3</span><?php echo get_field('journey_3'); ?></h2>
			<p><?php echo get_field('journey_description_3'); ?></p>
		</div>
		
		<div class="home-svg-copy" id="home-svg-copy-4">
			<h2><span class="home-svg-icon">4</span><?php echo get_field('journey_4'); ?></h2>
			<p><?php echo get_field('journey_description_4'); ?></p>
		</div>
		
		<div class="home-svg-copy" id="home-svg-copy-5">
			<h2><span class="home-svg-icon">5</span><?php echo get_field('journey_5'); ?></h2>
			<p><?php echo get_field('journey_description_5'); ?></p>
		</div>
		
		<div class="home-svg-copy" id="home-svg-copy-6">
			<h2><span class="home-svg-icon">6</span><?php echo get_field('journey_6'); ?></h2>
			<p><?php echo get_field('journey_description_6'); ?></p>
		</div>

		<div class="home-svg-copy" id="home-svg-copy-7">
			<h2><span class="home-svg-icon">7</span><?php echo get_field('journey_7'); ?></h2>
			<p><?php echo get_field('journey_description_7'); ?></p>
		</div>
		
	</div>
<hr class="clear" />
</article><!-- #post-## -->
<?php
				endwhile; // End of the loop.
			?>
		<hr class="clear" />
	</main><!-- #main -->
</div><!-- #primary -->

<?php get_footer();
