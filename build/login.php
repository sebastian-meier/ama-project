<?php
/**
 * Template Name: Login Page
 *
 * @package AMA
 */

get_header(); ?>


<div id="login">

<?php

  

  if ( ! is_user_logged_in() ) {
    echo '<h1>Login</h1>'."\n";

    $args = array(
        'form_id' => 'loginform-custom',
        'label_username' => __( 'Username' ),
        'label_password' => __( 'Password' ),
        'label_remember' => __( 'Remember Me' ),
        'label_log_in' => __( 'Log In' ),
        'remember' => true
    );
    wp_login_form( $args );

    echo '<p>If you are interested in joining the AMA Community, <a href="'.get_permalink(icl_object_id( 184 , 'page', true, ICL_LANGUAGE_CODE )).'">apply now</a> to become a member. </p>'."\n";

} else {

    global $current_user;
    get_currentuserinfo();

    echo '<h1>Willkommen '.$current_user->display_name.'</h1>'."\n";
    echo '<p>Continue <a href="'.get_permalink(icl_object_id( 163 , 'page', true, ICL_LANGUAGE_CODE )).'">exploring</a> the website.</p>'."\n";

    echo '<p>';
    wp_loginout( get_permalink(icl_object_id( 161 , 'page', true, ICL_LANGUAGE_CODE )) );

    $roles = wp_get_current_user()->roles;

    if(!in_array('subscriber', $roles)){
      echo ' | <a href="'.admin_url().'">Go to Backend</a>';
    }

    echo '</p>';
}
?>

</div>


<?php get_footer();
