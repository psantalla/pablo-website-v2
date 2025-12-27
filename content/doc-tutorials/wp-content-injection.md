---
title: "Fast content injection in WordPress"
description: "PHP code to inject content in WP based on CPT usage."
order: 99
date: 2025-12-26
docTopics:
  - WordPress
  - ACF
  - PHP
---

# Fast Content Injection in WordPress

When you need to create or update multiple WordPress posts quickly without clicking through the admin interface, this pattern provides a code-based alternative. Instead of relying on third-party import tools or manually publishing entries one by one through the WordPress backend, you can define your content in an array and inject it directly into the database with a single file save.

This approach is especially useful when migrating content between environments, bulk updating post meta fields, or managing assignments between posts. The example below uses FAQs with page assignments, but the same pattern applies to any custom post type with ACF fields.

## FAQs Example

This example serves as the base pattern for all content injection generators. The structure and logic can be adapted for any custom post type with ACF fields.

Includes crosslet (page assignment based on ID or title). Assignment by ID is recommended.

- Control over trashing non-declared entries
- Override/update based on given editable properties  
- Saves errors to log
- FAQ ID is optional and allows forced update based on ID matching
- Nuke option permanently deletes all FAQ posts (requires active: true to execute)

**IMPORTANT:** 
- Fields are ACF-dependent
- Nuke only works when active is true
- Use nuke with extreme caution - deletion is permanent and irreversible
```php
// ============================================================================
// FAQ GENERATOR (DEVELOPMENT ONLY)
// ============================================================================
// Creates/updates FAQ posts with granular control
// Usage: Configure $config, set active true, save, refresh admin, set active false
//        Use page IDs in assignment for precision
//        Optional 'id' key in FAQ array forces update of specific post

// WARNING: nuke_all requires active: true and DELETES ALL FAQ POSTS PERMANENTLY
$config = array(
	'active'            => false,
	'override_existing' => true,
	'delete_undeclared' => false,
	'nuke_all'          => false,
);

$faqs = array(
	array(
		'question'   => 'Lorem ipsum dolor sit amet consectetur?',
		'answer'     => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		'assignment' => array(123, 456),
	),
	array(
		'id'         => 789,
		'question'   => 'Sed do eiusmod tempor incididunt?',
		'answer'     => 'Duis aute irure dolor in reprehenderit.',
		'assignment' => array('Services'),
	),
);

if ($config['active']) {
	delete_transient('faq_generator_ran');
	
	add_action('init', function() use ($config, $faqs) {
		if (get_transient('faq_generator_ran')) {
			return;
		}
		
		if ($config['nuke_all']) {
			$all_faqs = get_posts(array(
				'post_type'   => 'faq',
				'post_status' => array('publish', 'draft', 'pending', 'trash'),
				'numberposts' => -1,
				'fields'      => 'ids',
			));
			
			foreach ($all_faqs as $id) {
				wp_delete_post($id, true);
			}
			
			set_transient('faq_generator_ran', true, HOUR_IN_SECONDS);
			return;
		}
		
		$declared_ids = array();
		
		foreach ($faqs as $faq) {
			$post_id = null;
			
			if (!empty($faq['id'])) {
				$post_id = get_post_status($faq['id']) === 'publish' ? $faq['id'] : null;
			} else {
				$existing = get_posts(array(
					'post_type'   => 'faq',
					'title'       => $faq['question'],
					'post_status' => 'publish',
					'numberposts' => 1,
				));
				$post_id = $existing ? $existing[0]->ID : null;
			}
			
			if ($post_id && !$config['override_existing']) {
				$declared_ids[] = $post_id;
				continue;
			}
			
			$post_id = $post_id ?: wp_insert_post(array(
				'post_type'   => 'faq',
				'post_title'  => $faq['question'],
				'post_status' => 'publish',
			));
			
			if (!$post_id || is_wp_error($post_id)) {
				error_log("FAQ creation failed: {$faq['question']}");
				continue;
			}
			
			$declared_ids[] = $post_id;
			
			update_field('faq-wordlet_answer', $faq['answer'], $post_id);
			
			$page_ids = array_filter(array_map(function($id) {
				if (is_numeric($id)) {
					return get_post_status($id) === 'publish' ? (int) $id : null;
				}
				$page = get_page_by_title($id, OBJECT, 'page');
				return $page && $page->post_status === 'publish' ? $page->ID : null;
			}, (array) $faq['assignment']));
			
			update_field('faq-crosslet', $page_ids, $post_id);
		}
		
		if ($config['delete_undeclared']) {
			$all_faqs = get_posts(array(
				'post_type'   => 'faq',
				'post_status' => 'publish',
				'numberposts' => -1,
				'fields'      => 'ids',
			));
			
			foreach (array_diff($all_faqs, $declared_ids) as $id) {
				wp_trash_post($id);
			}
		}
		
		set_transient('faq_generator_ran', true, HOUR_IN_SECONDS);
	}, 999);
}
```