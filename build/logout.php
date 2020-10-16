<?php
/**
 * Template Name: Logout Page
 *
 * @package AMA
 */

wp_logout();
wp_redirect( get_permalink(icl_object_id( 161 , 'page', true, ICL_LANGUAGE_CODE )) );
exit;
