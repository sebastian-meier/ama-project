<?php
/**
 * Template Name: Search Page
 *
 * Description: Duplicate of search.php
 *
 * @package AMA
 */

get_header(); ?>

<div id="search">
	<h1>Search</h1>
	<form action="<?php echo home_url(); ?>" method="get">
		<p>
    	<input class="search" type="text" name="s" id="s" placeholder="Search..." value="<?php the_search_query(); ?>" />
    	<input type="submit" value="Search" id="wp-submit" />
    </p>
	</form>
</div>

<?php get_footer();
