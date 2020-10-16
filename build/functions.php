<?php
/**
 * AMA Theme functions and definitions
 */

// Allow Subscribers to read private pages
$subRole = get_role( 'subscriber' );
$subRole->add_cap( 'read_private_posts' );

// custom field bug fix
add_filter('remove_hube2_nag', '__return_true');

// scripts for forms
function conditionally_load_plugin_js_css(){
	if(!is_page(array(920,925,184,922,970,1005,994,972,998,1003,916)) ) { # Only load CSS and JS on needed Pages	
		wp_dequeue_script('contact-form-7'); # Restrict scripts.
		wp_dequeue_script('google-recaptcha');
		wp_dequeue_style('contact-form-7'); # Restrict css.
  }
}
add_action( 'wp_enqueue_scripts', 'conditionally_load_plugin_js_css' ); 

//Hide the admin toolbar in the frontend
add_filter('admin_body_class', 'add_body_classes');
function add_body_classes($classes) {
  $user = wp_get_current_user();
  foreach ($user->roles as $key => $value) {
    $classes .= ' role-'.$value;
  }
  return $classes;
}
add_filter('show_admin_bar', '__return_false');

// Minor styling bugfix for the backend
add_action('admin_head', 'admin_style_fix');
function admin_style_fix() {
  echo '<style>body.role-editor #menu-settings, body.role-editor #toplevel_page_edit-post_type-acf{display:none;}</style>';
}

//Change the order and content of the backend menu
function remove_menus() {
    remove_menu_page( 'edit-comments.php' );
    remove_menu_page( 'edit.php' );
    remove_menu_page( 'upload.php' );

    add_menu_page(
        __( 'Categories', 'textdomain' ),
        'Categories',
        'read',
        'edit-tags.php?taxonomy=category',
        '',
        'dashicons-category',
        34
    );

    add_menu_page(
        __( 'Tags', 'textdomain' ),
        'Tags',
        'read',
        'edit-tags.php?taxonomy=post_tag',
        '',
        'dashicons-tag',
        34
    );

    add_menu_page(
        __( 'Media', 'textdomain' ),
        'Media',
        'read',
        'upload.php',
        '',
        'dashicons-admin-media',
        34
    );

    global $menu;
}
add_action( 'admin_menu', 'remove_menus', 999 );

//Add custom post types and taxonomies
function setup_custom_types_and_taxonomies() {

  $custom_post_types = array(
    //Singular, Plural, Slug, Icon
    array('Person','Persons','person','dashicons-admin-users'),
    array('Institution','Institutions','institution','dashicons-building'),
    array('Project','Projects','project','dashicons-layout'),
    array('Event','Events','event','dashicons-calendar-alt'),
    array('News','News','news','dashicons-megaphone'), // > Category: Jobs, Events (?)
    array('Publication','Publications','publication','dashicons-book-alt'),
    array('Quote','Quotes','quote','dashicons-format-quote')
  );

  foreach ($custom_post_types as $type) {
    
    $singular = $type[0];
    $plural = $type[1];
    $slug = $type[2];
    $icon = $type[3];

    $labels = array(
      'name'               => _x( $plural, 'post type general name', 'your-plugin-textdomain' ),
      'singular_name'      => _x( $singular, 'post type singular name', 'your-plugin-textdomain' ),
      'menu_name'          => _x( $plural, 'admin menu', 'your-plugin-textdomain' ),
      'name_admin_bar'     => _x( $singular, 'add new on admin bar', 'your-plugin-textdomain' ),
      'add_new'            => _x( 'Add New', $slug, 'your-plugin-textdomain' ),
      'add_new_item'       => __( 'Add New '.$singular, 'your-plugin-textdomain' ),
      'new_item'           => __( 'New '.$singular, 'your-plugin-textdomain' ),
      'edit_item'          => __( 'Edit '.$singular, 'your-plugin-textdomain' ),
      'view_item'          => __( 'View '.$singular, 'your-plugin-textdomain' ),
      'all_items'          => __( 'All '.$plural, 'your-plugin-textdomain' ),
      'search_items'       => __( 'Search '.$plural, 'your-plugin-textdomain' ),
      'parent_item_colon'  => __( 'Parent '.$plural.':', 'your-plugin-textdomain' ),
      'not_found'          => __( 'No '.$plural.' found.', 'your-plugin-textdomain' ),
      'not_found_in_trash' => __( 'No '.$plural.' found in Trash.', 'your-plugin-textdomain' )
    );

    $args = array(
      'labels'             => $labels,
      'description'        => __( 'Description.', 'your-plugin-textdomain' ),
      'public'             => true,
      'publicly_queryable' => true,
      'show_ui'            => true,
      'show_in_menu'       => true,
      'query_var'          => true,
      'rewrite'            => array( 'slug' => $slug ),
      'capability_type'    => 'post',
      'has_archive'        => true,
      'hierarchical'       => false,
      'menu_position'      => null,
      'supports'           => array( 'title', 'editor', 'author', 'thumbnail', 'excerpt', 'comments' ),
      'menu_icon'          => $icon
    );

    register_post_type( $singular, $args );
  }

  $custom_taxonomies = array(
    //Singular, Plural, Slug, Hierarchical (true/false), all/array of post types
    array('Journey Station','Journey Stations','journey_station',true,'all'),
    array('Inner Change','Inner Change','inner_change_keywords',true,'all'),
    array('Sustainability','Sustainability','sustainability_keywords',true,'all'),
    array('Perspective','Perspectives','perspective_keywords',true,'all'),
    array('AMA Role','AMA Roles','ama_role',true,array('person')),
    array('News Type','News Types','news_type_keywords',false,array('news')),
    array('Publication Type','Publication Types','publication_type_keywords',false,array('publication'))
    //array('Protection','Protections','protection',true,array('attachment'))
  );
  
  foreach ($custom_taxonomies as $tax) {
    
    $singular = $tax[0];
    $plural = $tax[1];
    $slug = $tax[2];
    $hierarchical = $tax[3];
    $types = $tax[4];

    if($hierarchical){
      // Add new taxonomy, make it hierarchical (like categories)
      $labels = array(
        'name'              => _x( $plural, 'taxonomy general name', 'textdomain' ),
        'singular_name'     => _x( $singular, 'taxonomy singular name', 'textdomain' ),
        'search_items'      => __( 'Search '.$plural, 'textdomain' ),
        'all_items'         => __( 'All '.$plural, 'textdomain' ),
        'parent_item'       => __( 'Parent '.$singular, 'textdomain' ),
        'parent_item_colon' => __( 'Parent '.$singular.':', 'textdomain' ),
        'edit_item'         => __( 'Edit '.$singular, 'textdomain' ),
        'update_item'       => __( 'Update '.$singular, 'textdomain' ),
        'add_new_item'      => __( 'Add New '.$singular, 'textdomain' ),
        'new_item_name'     => __( 'New '.$singular.' Name', 'textdomain' ),
        'menu_name'         => __( $singular, 'textdomain' ),
      );

      $args = array(
        'hierarchical'      => true,
        'labels'            => $labels,
        'show_ui'           => true,
        'show_admin_column' => true,
        'show_in_nav_menus' => true,
        'query_var'         => true,
        'rewrite'           => array( 'slug' => $slug ),
      );

    }else{

      // Add new taxonomy, NOT hierarchical (like tags)
      $labels = array(
        'name'                       => _x( $plural, 'taxonomy general name', 'textdomain' ),
        'singular_name'              => _x( $singular, 'taxonomy singular name', 'textdomain' ),
        'search_items'               => __( 'Search '.$plural, 'textdomain' ),
        'popular_items'              => __( 'Popular '.$plural, 'textdomain' ),
        'all_items'                  => __( 'All '.$plural, 'textdomain' ),
        'parent_item'                => null,
        'parent_item_colon'          => null,
        'edit_item'                  => __( 'Edit '.$singular, 'textdomain' ),
        'update_item'                => __( 'Update '.$singular, 'textdomain' ),
        'add_new_item'               => __( 'Add New '.$singular, 'textdomain' ),
        'new_item_name'              => __( 'New '.$singular.' Name', 'textdomain' ),
        'separate_items_with_commas' => __( 'Separate '.$plural.' with commas', 'textdomain' ),
        'add_or_remove_items'        => __( 'Add or remove '.$plural, 'textdomain' ),
        'choose_from_most_used'      => __( 'Choose from the most used '.$plural, 'textdomain' ),
        'not_found'                  => __( 'No '.$plural.' found.', 'textdomain' ),
        'menu_name'                  => __( $plural, 'textdomain' ),
      );

      $args = array(
        'hierarchical'          => false,
        'labels'                => $labels,
        'show_ui'               => true,
        'show_in_nav_menus' => true,
        'show_admin_column'     => true,
        'update_count_callback' => '_update_post_term_count',
        'query_var'             => true,
        'rewrite'               => array( 'slug' => $slug ),
      );
    }

    if($types == "all"){
      $t = array('post','page','person','institution','project','event','news','publication','quote');
    }else{
      $t = $types;
    }

    register_taxonomy( $slug, $t, $args );
  }
}
add_action('init', 'setup_custom_types_and_taxonomies');

// For Persons we don't want to add an additional title, so we generate the title from the first- and lastname
function update_person_title( $value, $post_id, $field ) {
  
  $firstname = get_field('firstname', $post_id);
  $lastname = get_field('lastname', $post_id);
  
  switch($field['name']){
    case 'firstname':
      $firstname = $value;
    break;
    case 'lastname':
      $lastname = $value;
    break;
  }

  $title = $lastname;

  if(strlen($firstname)>=1 && strlen($lastname)>=1){
    $title .= ', ';
  }

  $title .= $firstname;

  $slug = sanitize_title( $title );

  $postdata = array(
    'ID'          => $post_id,
    'post_title'  => $title,
    'post_type'   => 'person',
    'post_name'   => $slug
  );
  
  wp_update_post( $postdata );
  
  return $value;
}
add_filter('acf/update_value/name=firstname', 'update_person_title', 10, 3);
add_filter('acf/update_value/name=lastname', 'update_person_title', 10, 3);

// For quotes we generate the title based on author and date
function update_quote_title( $value, $post_id, $field ) {
  
  $date = get_field('quote-date', $post_id);
  $author = get_field('quote-author', $post_id);
  
  switch($field['name']){
    case 'quote-date':
      $date = $value;
    break;
    case 'quote-author':
      $author = $value;
    break;
  }

  $title = $author;

  if(strlen($date)>=1 && strlen($date)>=1){
    $title .= ', ';
  }

  $title .= $date;

  $slug = sanitize_title( $title );

  $postdata = array(
    'ID'          => $post_id,
    'post_title'  => $title,
    'post_type'   => 'quote',
    'post_name'   => $slug
  );
  
  wp_update_post( $postdata );
  
  return $value;
}
add_filter('acf/update_value/name=quote-date', 'update_quote_title', 10, 3);
add_filter('acf/update_value/name=quote-author', 'update_quote_title', 10, 3);

// Accept empty posts (with only meta)
add_filter ('wp_insert_post_empty_content', function() { return false; });

// The two custom variables is_upload and upload_url need to registered
function upload_register_query_var( $query_vars ) {
    $query_vars[] = 'uploads_url';
    return $query_vars;
}
add_filter( 'query_vars', 'upload_register_query_var' );

// Whenever is_upload == 'true' wordpress should use the upload template
function upload_template_include($template)
{
    global $wp_query;
    $page_value = false;
    if(array_key_exists('uploads_url', $wp_query->query_vars)){
      $page_value = $wp_query->query_vars['uploads_url'];
    }

    if ($page_value && strlen($page_value) > 4) {
        //plugin_dir_path(__FILE__)
        return get_template_directory() . '/upload.php';
    }

    return $template;
}
add_filter('template_include', 'upload_template_include'); 

// When a new attachment is uploaded check which extension it has and thereby apply default category (PDF > private | everything else > public)
function upload_add_attachment($a_id){
  //wp_get_attachment_url
  $file = strtolower(get_attached_file( $a_id ));
  if (
      //These file extensions are automatically set to private > should be turned into an array
      (strpos($file, 'pdf') !== false) || 
      (strpos($file, 'zip') !== false) || 
      (strpos($file, 'rar') !== false)
  ) {
    wp_set_object_terms($a_id, 'private', 'attachment_category', false);
  }else{
    wp_set_object_terms($a_id, 'public', 'attachment_category', false);
  }
}
add_action('add_attachment', 'upload_add_attachment');

// When connections are being setup A > B, this script makes sure that the direction is bi-directional (A <> B => B <> A)
function bidirectional_acf_update_value($value, $post_id, $field) {

  $field_name = $field['name'];
  $field_key = $field['key'];

  $key_a = $field_key;
  $key_b = $field_key;
   
  $name_a = $field_name;
  $name_b = $field_name;
  
  $old_values = get_post_meta($post_id, $name_a, true);
  if (!is_array($old_values)) {
    if (empty($old_values)) {
      $old_values = array();
    } else {
      $old_values = array($old_values);
    }
  }

  $new_values = $value;
  if (!is_array($new_values)) {
    if (empty($new_values)) {
      $new_values = array();
    } else {
      $new_values = array($new_values);
    }
  }

  //only on initital setups    
  $add = $new_values;
  $delete = array_diff($old_values, $new_values);
  
  // reorder the arrays to prevent possible invalid index errors
  $add = array_values($add);
  $delete = array_values($delete);
  
  if (!count($add) && !count($delete)) {
    return $value;
  }
  
  for ($i=0; $i<count($delete); $i++) {
    $related_values = get_post_meta($delete[$i], $name_b, true);
    if (!is_array($related_values)) {
      if (empty($related_values)) {
        $related_values = array();
      } else {
        $related_values = array($related_values);
      }
    }
    $related_values = array_diff($related_values, array($post_id));
    update_post_meta($delete[$i], $name_b, $related_values);
    update_post_meta($delete[$i], '_'.$name_b, $key_b);
  }
  
  for ($i=0; $i<count($add); $i++) {
    $related_values = get_post_meta($add[$i], $name_b, true);
    if (!is_array($related_values)) {
      if (empty($related_values)) {
        $related_values = array();
      } else {
        $related_values = array($related_values);
      }
    }
    if (!in_array($post_id, $related_values)) {
      $related_values[] = $post_id;
    }
    update_post_meta($add[$i], $name_b, $related_values);
    update_post_meta($add[$i], '_'.$name_b, $key_b);
  }
  
  return $value;
  
}
add_filter('acf/update_value/name=project_person', 'bidirectional_acf_update_value', 10, 3);
add_filter('acf/update_value/name=institution_person', 'bidirectional_acf_update_value', 10, 3);
add_filter('acf/update_value/name=project_institution', 'bidirectional_acf_update_value', 10, 3);
add_filter('acf/update_value/name=publication_person', 'bidirectional_acf_update_value', 10, 3);

/*--------*/
// General AMA Theme setup
function ama_setup() {

  add_image_size( 'thumb', 80, 80, array('left', 'top') );
  add_image_size( 'thumb-highres', 160, 160, array('left', 'top') );

	// Add default posts and comments RSS feed links to head.
	add_theme_support( 'automatic-feed-links' );

	// Let WordPress manage the document title.
	add_theme_support( 'title-tag' );

	// Enable support for Post Thumbnails on posts and pages.
	add_theme_support( 'post-thumbnails' );

	// This theme uses wp_nav_menu() in two locations.
	register_nav_menus( array(
		'top'    => __( 'Top Menu', 'ama' ),
    'footer'    => __( 'Footer Menu', 'ama' )
	) );

	/*
	 * Switch default core markup for search form, comment form, and comments
	 * to output valid HTML5.
	 */
	add_theme_support( 'html5', array(
		'comment-form',
		'comment-list',
		'gallery',
		'caption',
	) );

  /*
	 * This theme styles the visual editor to resemble the theme style,
	 * specifically font, colors, and column width.
 	 */
	add_editor_style( array( 'assets/css/editor-style.css', ama_fonts_url() ) );
}
add_action( 'after_setup_theme', 'ama_setup' );

/**
 * Register custom fonts.
 */
function ama_fonts_url() {
  // TODO: Define fonts (for backend use)
	$fonts_url = '';
	return esc_url_raw( $fonts_url );
}

/**
 * Replaces "[...]" (appended to automatically generated excerpts) with ... and
 * a 'Continue reading' link.
 */
function ama_excerpt_more( $link ) {
	if ( is_admin() ) {
		return $link;
	}

	$link = sprintf( '<p class="link-more"><a href="%1$s" class="more-link">%2$s</a></p>',
		esc_url( get_permalink( get_the_ID() ) ),
		/* translators: %s: Name of current post */
		sprintf( __( 'Continue reading<span class="screen-reader-text"> "%s"</span>', 'ama' ), get_the_title( get_the_ID() ) )
	);
	return ' &hellip; ' . $link;
}
add_filter( 'excerpt_more', 'ama_excerpt_more' );

/**
 * Add a pingback url auto-discovery header for singularly identifiable articles.
 */
function ama_pingback_header() {
	if ( is_singular() && pings_open() ) {
		printf( '<link rel="pingback" href="%s">' . "\n", get_bloginfo( 'pingback_url' ) );
	}
}
add_action( 'wp_head', 'ama_pingback_header' );

/**
 * Enqueue scripts and styles.
 */
function ama_scripts() {
	// Add custom fonts, used in the main stylesheet.
	wp_enqueue_style( 'ama-fonts', ama_fonts_url(), array(), null );

	// Theme stylesheet.
	wp_enqueue_style( 'ama-style', get_stylesheet_uri() );
}
add_action( 'wp_enqueue_scripts', 'ama_scripts' );


/*
 * Remove all emoji related functions and features (keeping the site clean)
 */

function disable_wp_emojicons() {
  remove_action( 'admin_print_styles', 'print_emoji_styles' );
  remove_action( 'wp_head', 'print_emoji_detection_script', 7 );
  remove_action( 'admin_print_scripts', 'print_emoji_detection_script' );
  remove_action( 'wp_print_styles', 'print_emoji_styles' );
  remove_filter( 'wp_mail', 'wp_staticize_emoji_for_email' );
  remove_filter( 'the_content_feed', 'wp_staticize_emoji' );
  remove_filter( 'comment_text_rss', 'wp_staticize_emoji' );
  add_filter( 'tiny_mce_plugins', 'disable_emojicons_tinymce' );
}
add_action( 'init', 'disable_wp_emojicons' );

function disable_emojicons_tinymce( $plugins ) {
  if ( is_array( $plugins ) ) {
    return array_diff( $plugins, array( 'wpemoji' ) );
  } else {
    return array();
  }
}

add_filter( 'emoji_svg_url', '__return_false' );

// UI Function to quickly check for a role
function user_has_role($role){
  if(is_user_logged_in()){
    $user = wp_get_current_user();
    if ( in_array( $role, (array) $user->roles ) ) {
      return true;
    }
  }
  return false;
}

$styled_image_count = 0;

/*
 * The following functions are html-generators, now that wordpress has template-parts, those bits should probably move there
 */

function styled_image($image_url, $color, $alt){
  global $styled_image_count;
  $styled_image_count++;
  return '<svg role="image" aria-label="'.$alt.'" class="svg-graphic" width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/4000/svg" xlink="http://www.w3.org/1999/xlink" version="1.1">
  <defs>
    <filter id="color-filter-'.$styled_image_count.'">
      <feColorMatrix type=\'matrix\' values=\'0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0\' />

    </filter>
  </defs>
  <g>
   <clipPath id="circle-mask-'.$styled_image_count.'">
    <circle cx="40" cy="40" r="40" />
   </clipPath>
  </g> 
  <circle cx="40" cy="40" r="40" style="fill:'.$color.'" />
  <image alt="'.$alt.'" title="'.$alt.'" clip-path="url(#circle-mask-'.$styled_image_count.')" style="filter:url(#color-filter-'.$styled_image_count.'); mix-blend-mode: screen;" height="80" width="80" xlink:href="'.$image_url.'" />
</svg>';
}

function buildFieldList($fields, $id){

  $r = '';

  $ranks = array(
    'administrator',
    'editor',
    'author',
    'subscriber'
  );

  $column_count = 1;
  foreach ($fields as $key => $field) {

    $show = false;

    if($field["role"] == 'all'){
      $show = true;
    }else{
      
      $rank = array_search($field['role'], $ranks);
      if($rank){
        for($i = 0; $i<=$rank; $i++){
          if(user_has_role($ranks[$i])){
            $show = true;
          }
        }
      }

    }

    if($show){
      $value = trim(get_field($field['name'], $id));
      if(strlen($value)>0){
        if($field['type'] == 'true_false'){
          if($value == 1){
            $value = "Yes";
          }else{
            $value = "No";
          }
        }elseif($field['type'] == 'date_picker'){
          $date = date_parse($value);
          $value = $date['year'].'/'.$date['month'].'/'.$date['day'];
        }elseif($field['name'] == 'email'){
          $value = '<a href="mailto:'.$value.'">'.$value.'</a>';
        }elseif($field['name'] == 'website' || $field['name'] == 'website_url'){
          $svalue = $value;
          if(substr($value,0,7)=="http://"){
            $svalue = substr($value, 7);
          }elseif(substr($value,0,8)=="https://"){
            $svalue = substr($value, 7);
          }else{
            $value = "http://".$value;
          }
          if(strlen($svalue)>27){
            $svalue = substr($svalue,0,24).'...';
          }
          $value = '<a href="'.$value.'">'.$svalue.'</a>';
        }
        $r .= '<dl class="c'.$column_count.'"><dt><span>'.$field['label'].':</span></dt><dd><span>'.$value.'</span></dd></dl>';
        $column_count++;
        if($column_count>3){
          $column_count = 1;
        }
      }
    }
     
  }

  return $r.'';
}

function buildMetaHtml($id){
  $fields = array();
  $custom_fields = get_post_custom($id);
  $hidden = array("firstname", "lastname", "function", "wpa_off",'start','end','from','to','contributor_email','contributor_name','contributor_note','project_institution','institution_person','publication_institution','publication_person','project_person');
  $editor = array("phone", "possible_speaker");
  $subscriber = array("email", "ama_member", "ama_role", "beginning", "end", "ama_role_2", "beginning_2", "end_2", "ama_role_3", "beginning3", "end_3");
  foreach( $custom_fields as $key => $value ){
    if(substr($key, 0,1) != "_" && !in_array($key, $hidden) && !empty($value[0]) && $value[0] != "None") {
      $fieldObject = get_field_object($key, $id);
      if(!empty($fieldObject["label"])){ //field was deleted
          $role = "all";
        if(in_array($key, $editor)){
          $role = "editor";
        }
        if(in_array($key, $subscriber)){
          $role = "subscriber";
        }
        array_push($fields, array(
          "label" => $fieldObject["label"],
          "name" => $key,
          "role" => $role,
          "type" => $fieldObject["type"]
        ));
      }
    }
  }

  return buildFieldList($fields, $post_id);
}

function buildConnections($id, $name, $label, $slabel, $style){
  $r = '';
  $posts = get_field($name, $id);

  if( $posts ){
    $list = array();
    $sort = array();
    foreach( $posts as $p ){
      $title = get_the_title( $p->ID );
      if(strlen($title)>120){
        $title = substr($title,0,117).'...';
      }
      $obj = array(
        "id" => $p->ID,
        "permalink" => get_permalink( $p->ID ),
        "title" => $title
      );
      $sobj = 0;
  
      switch ($label) {
        case 'Publications':
          $obj["title"] = "&ldquo;".$obj["title"]."&rdquo;";
          $obj["subline"] = get_field('publication_year', $p->ID);
          $sobj = intval(get_field('publication_year', $p->ID));
          break;
        case 'Projects':
          $obj["title"] = "&ldquo;".$obj["title"]."&rdquo;";
          $obj["subline"] = get_field('from', $p->ID).' - '.get_field('to', $p->ID);
          $sobj = intval(get_field('to', $p->ID));
          break;
      }

      array_push($list, $obj);
      array_push($sort, $sobj);
    }

    array_multisort($sort, SORT_DESC, SORT_NUMERIC, $list);

    $r .= '<h4>';

    if(count($list)>1){
      $r .= count($list).' '.$label;
    }else{
      $r .= '1 '.$slabel;
    }

    $r .= '</h4>';

    $overall_ratio = array("ic"=>0, "s" => 0);

    if($style == 'cards'){

      $i = 1;
      $c = 1;
      foreach ($list as $key => $value) {
        $r .= '<a class="connection c'.$i;
        if($c>3){
          $r .= ' toomuch';
        }
        $r .= '" href="'.$value['permalink'].'">';

        $r .= '<span class="title">'.$value['title'].'</span>';
        $r .= '<span class="line">';

        $ratio = getRatio($value['id']);
        $overall_ratio["ic"] += $ratio["ic"];
        $overall_ratio["s"] += $ratio["s"];

        if($ratio['s']==0 && $ratio['ic']==0){
          $r .= '<span class="ratioline v-none"></span>';
        }elseif($ratio['s']==0){
          $r .= '<span class="ratioline v-ic"></span>';
        }elseif($ratio['ic']==0){
          $r .= '<span class="ratioline v-s"></span>';
        }else{
          $r .= '<span class="ratioline v-s-50"></span>';
          $r .= '<span class="ratioline v-ic-50"></span>';
        }

        $r .= '</span>';
        $r .= '<span class="subline">'.$value['subline'].'</span>';

        $r .= '</a>';

        $i++;
        $c++;
        if( $i > 3 ){
          $i = 1;
        }

      }
      if(count($list)>3){
        $r .= '<a class="opener closed" onclick="toggleList(this)" title="'.$label.'"><img src="'.get_template_directory_uri().'/assets/images/close.gif"><span class="label">Show all '.$label.'<span></a>';
      }

    }elseif($style == 'list'){

      $i = 1;
      $c = 1;
      foreach ($list as $key => $value) {
        $r .= '<a class="connection list c'.$i;
        $r .= '" href="'.$value['permalink'].'">';

        $r .= '<span class="title">'.$value['title'].'</span>';
        $r .= '<span class="line">';

        $ratio = getRatio($value['id']);
        $overall_ratio["ic"] += $ratio["ic"];
        $overall_ratio["s"] += $ratio["s"];

        if($ratio['s']==0 && $ratio['ic']==0){
          $r .= '<span class="ratioline v-none"></span>';
        }elseif($ratio['s']==0){
          $r .= '<span class="ratioline v-ic"></span>';
        }elseif($ratio['ic']==0){
          $r .= '<span class="ratioline v-s"></span>';
        }else{
          $r .= '<span class="ratioline v-s-50"></span>';
          $r .= '<span class="ratioline v-ic-50"></span>';
        }

        $r .= '</span>';
        $r .= '<hr class="clear" />';

        $r .= '</a>';

        $i++;
        $c++;
        if( $i > 3 ){
          $i = 1;
        }
      }

    }

    $r = '<div class="connections"><div class="icon" data-icon="'.get_template_directory_uri().'/assets/images/icon_'.strtolower($label).'@2x.gif" data-s="'. $overall_ratio['s'] .'" data-ic="'. $overall_ratio['ic'] .'"></div>'.$r;


    $r .= '</div>';
  }
  
  return $r;
}

function term_crumbs($term){
  $r = array($term); $rr = array();
  if($term->parent){
    $p = get_term($term->parent);
    $rr = term_crumbs($p);
  }
  return array_merge($r, $rr);
}

function buildTerms($post_id){
  $r = '';
  $tax_labels = array('Perspective','Journey','Inner&nbsp;Change','Sustainability');
  $taxs = array('perspective_keywords','journey_station','inner_change_keywords','sustainability_keywords');
  foreach ($taxs as $key => $tax) {
    $cats = wp_get_post_terms($post_id, $tax);
    if(count($cats)>=1){
      foreach ($cats as $ckey => $cat) {
        $crumbs = term_crumbs($cat);

        $crumblist = $tax_labels[$key];
        for ($ci = count($crumbs)-1; $ci >= 0; $ci--) {
          $result = str_replace(' ', '&nbsp;', preg_replace('/([0-9])*\\. /us', '', $crumbs[$ci]->name));
          $crumblist .= '&nbsp;>&nbsp;';
          $crumblist .= $result;
        }

        //get_term_link()
        $r .= '<a href="'.get_permalink(163).'?vis=network&taxonomy='.$cat->term_id.'&filterTitle='.urlencode($crumblist).'" class="term term-'.$tax.'">'.$crumblist.'</a> ';
        
      }
    }
  }
  return $r;
}

function getRatio($post_id){
  $r = ["s"=>0,"ic"=>0];
  $tax_labels = array('s','ic');
  $taxs = array('sustainability_keywords','inner_change_keywords');
  foreach ($taxs as $key => $tax) {
    $cats = wp_get_post_terms($post_id, $tax);
    if(count($cats)>=1){
      $r[$tax_labels[$key]] = 1;
    }
  }
  return $r;
}

function destroyAttachmentList( $html ) {
    return '';
}
add_filter( 'wpatt_list_html', 'destroyAttachmentList' );

function getSize($file){
  $bytes = filesize($file);
  $s = array('b', 'Kb', 'Mb', 'Gb');
  $e = floor(log($bytes)/log(1024));
  return sprintf('%.2f '.$s[$e], ($bytes/pow(1024, floor($e))));
}

function organizeTerms($taxonomy){
  $terms = get_terms(array(
    'taxonomy' => $taxonomy, 
    'hide_empty' => true
  ));

  $hterms = array();

  foreach ($terms as $term) {
    if($term->parent == 0){
      
      $hterms[$term->term_id] = array(
        'name' => $term->name,
        'description' => $term->description,
        'count' => $term->count,
        'children' => array()
      );

      foreach ($terms as $tterm) {
        if($tterm->parent == $term->term_id){

          $hterms[$term->term_id]['children'][$tterm->term_id] = array(
            'name' => $tterm->name,
            'description' => $tterm->description,
            'count' => $tterm->count,
            'children' => array()
          );

          foreach ($terms as $ttterm) {
            if($ttterm->parent == $tterm->term_id){

              $hterms[$term->term_id]['children'][$tterm->term_id]['children'][$ttterm->term_id] = array(
                'name' => $ttterm->name,
                'description' => $ttterm->description,
                'count' => $ttterm->count,
                'children' => array()
              );

            }
          }
        }
      }
    }
  }

  return $hterms;
}

function listTerms($terms){
  $r = '<ul>';

  foreach ($terms as $term_id => $term) {
    $r .= '<li><a title="'.$term['description'].'" data-id="'.$term_id.'" data-count="'.$term['count'].'">'.str_replace(' ', '&nbsp;', $term['name']).'</a></li>';
    if(count($term['children'])>=1){
      $r .= listTerms($term['children']);
    }
  }

  $r .= '</ul>';
  return $r;
}