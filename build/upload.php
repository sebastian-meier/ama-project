<?php

	// files only accessible for logged in users (see also .htaccess)

	global $wpdb, $wp_query;
	$file_path = $wp_query->query_vars['uploads_url'];
	$file_url = wp_upload_dir()['baseurl'].'/'.$uploads_url;
    $path = 'wp-content/uploads/'.$file_path;

	$attachment = $wpdb->get_col($wpdb->prepare("SELECT ID FROM $wpdb->posts WHERE guid='%s'", $file_url )); 

	$log_state = is_user_logged_in();

	if (count($attachment)<1) {
    	if(!file_exists($path)){
        	echo 'FILE DOES NOT EXIST';
        }else{
        	$name = explode(".", $file_path);
        	$ext = strtolower($name[count($name)-1]);

        	if($log_state){
        		$mime = mime_content_type($path);
				header('Content-type:'.$mime,true,200);
				readfile($path);
			}elseif (($ext == "jpg") || ($ext == "jpeg") || ($ext == "png") || ($ext == "gif")) {
        		$mime = mime_content_type($path);
				header('Content-type:'.$mime,true,200);
				readfile($path);
        	}else{
		    	echo 'PLEASE LOG IN TO ACCESS THIS FILE';
        	}
        }
    }else{

	    $terms = wp_get_post_terms($attachment[0], 'attachment_category');

	    $private = false;

	    foreach ($terms as $key => $term) {
	    	if($term->slug == "private"){
	    		$private = true;
	    	}
	    }

	    if($private && !$log_state){
	    	echo 'PLEASE LOG IN TO ACCESS THIS FILE';
	    }else{
			$mime = mime_content_type($path);
			header('Content-type:'.$mime,true,200);
			readfile($path);
	    }
	}