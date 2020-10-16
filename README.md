# ama-project
Wordpress Theme for ama-project.org

## SETUP

For wordpress details (see below).

### CSS & JS

```
npm install
```

JS Linting using ESLINT
```
npm run lint
```

Transpiling for older browsers
```
npm run babel
```

Minify and combine files (uglify-js)
```
npm run minify
```

Build CSS files
```
npm run css
```

Do all the above in one run
```
npm run build
```

### PLUGINS

Several Plugins are required for setting up this system:

#### 0. Private Files

There is a custom .htaccess to protect private files:

```
RewriteEngine On
RewriteRule ^wp-content/uploads/(.*)$ index.php?pagename=uploads&uploads_url=$1 [L,NC]
```

#### 1. WPML

For the initial setup of this project everything will be in english, therefore not language switch is implement. As it was required to allow multi-language content in the future the WPML Plugin was bough and implemented.

The following plugins should be installed:

wpml-cms-nav
wpml-string-translation
sitepress-multilingual-cms

#### 2. Advanced Custom Fields (ACF)

For better structured meta data ACF is integrated:

advanced-custom-fields
acfml (WPML extension for ACF)

#### 3. Restrict Content by Role

In order to let users define which content be view by whom this plugin is integrated:

restrict-content-by-role

For further information on the roles and their meaning see below.

#### 4. All Import

In order to easily import data from CSV and XML files, the plugin All Import was purchased and implement. All-Import works with WPML as well as ACF.

all import (pro)
all export
acf-all-import
wpml-all-import (WPML extension for All Import)

#### 5. Geo Mashup

Geo Mashup is used to add a map to the backend for easier input of geo locations (if required).

### Custom Post Types & Taxonomies

All post types have the global categories and tags.

In addition the system requires several custom post types and taxonomies. For each post type additional ACF fields are created.

Those post types and taxonomies are registered in the functions.php in the ama theme folder. The ACFs per type are registered in the data base.

#### Overview

- Person
- Institution
- Project
- Event
- News
- Job
- Publication
- Quote 

## Roles

Roles have two meanings in this setup. First, they define the rules for the backend. Second, they grant users access to additional content or information on the frontend.

Role | Backend | Frontend
------------ | ------------- | -------------
Administrator | Create, Edit, Publish, Remove Content, Import Data, Settings | Sees everything
Editor | Create, Edit, Publish, Remove | Does not see sensitive information (S1)
Author  | Create, Edit, Remove (their content) | Does not see sensitive information (S2)
Subscriber | Cannot access backend | Does not see sensitive information (S3)
Visitor | Cannot access backend | Does not see sensitive information

Sensitive information are for example phone numbers. Sensitive information is defined on a global level. The level of sensitivity (S1-S3) can be defined, this means that some sensitive information is available for editors while others are also available for authors. As this is defined globally it cannot be modified on a per item level. 

The above rules define the default settings for added content. In addition to the above rules items can be restricted to certain roles on an per item level, this means that items are only accessible to certain roles, this can be defined when creating or editing an item.

## Visualisations (Network / Private Network)

The visualisations are build in D3 and are driven by nightly generated json and csv files (ama/network.php and ama/network-private.php). The building of the network takes too long to do it in real time. Therefore a cached nightly build is generated. As wordpress cron is not great. Currently cron-job.org calls the two network generators at 00:00.

# TODOs:

ReCaptcha for forms looks broken.

functions.php: html-generators move to template-parts

functions.php: font-definitions for better backend editing

