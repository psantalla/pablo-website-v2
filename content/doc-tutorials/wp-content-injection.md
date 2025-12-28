---
title: "Fast content injection in WordPress"
description: "PHP code to inject content in WP based on CPT usage."
order: 99
date: 2025-12-26
docTopics:
  - WordPress
  - ACF
  - PHP
changelog:
  - "Added taxonomy category filtering"
  - "Initial FAQ injection pattern"
---

When you need to create or update multiple WordPress posts quickly, this pattern lets you define content in an array and inject it directly with a single file save. No clicking through the admin interface or relying on third-party import tools.

This example uses FAQs with page assignments and categories, but the pattern works for any custom post type with ACF fields.

## Generator

**Features:**
- Create or update posts by title match or ID
- Assign to pages and taxonomy terms
- Control over updating existing entries
- Bulk delete non-declared entries
- Nuke option for complete cleanup

**IMPORTANT:** Fields are ACF-dependent. Nuke requires active: true.
```php
// ============================================================================
// FAQ GENERATOR (DEVELOPMENT ONLY)
// ============================================================================
// Creates/updates FAQ posts with granular control
// Usage: Configure $config, set active true, save, refresh admin, set active false
//        Use page IDs in assignment for precision
//        Use category slug or ID for taxonomy assignment
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
		'question'   => 'Will I be able to take my FTA pet home the same day?',
		'answer'     => '<p>Yes, once the adoption is finalized, you can take your new companion home immediately.</p><p>We provide all necessary documentation and initial care instructions.</p>',
		'assignment' => array(123, 456),
		'category'   => 'foster-to-adopt',
	),
	array(
		'question'   => 'Are there any fees or payments for FTAs?',
		'answer'     => '<p>Foster to Adopt programs typically have reduced fees compared to standard adoptions.</p><p>Contact our office for specific pricing information.</p>',
		'assignment' => array('Services'),
		'category'   => 'foster-to-adopt',
	),
	array(
		'question'   => 'Can I take my FTA to an outside vet?',
		'answer'     => '<p>Yes, you are welcome to use your preferred veterinarian.</p><p>We recommend maintaining consistent veterinary care for your pet.</p>',
		'assignment' => array(789),
		'category'   => 'foster-to-adopt',
	),
	array(
		'question'   => 'What is the adoption process timeline?',
		'answer'     => '<p>The standard adoption process typically takes 3-5 business days from application to approval.</p><p>This includes background checks and home visits when required.</p>',
		'assignment' => array('Home'),
		'category'   => 'adopt',
	),
	array(
		'question'   => 'What supplies do I need before bringing my pet home?',
		'answer'     => '<p>Basic supplies include food and water bowls, appropriate food, bedding, toys, and grooming supplies.</p><p>We provide a complete checklist during the adoption process.</p>',
		'assignment' => array(123),
		'category'   => 'adopt',
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
			
			if (!empty($faq['category'])) {
				$term = is_numeric($faq['category']) 
					? get_term($faq['category'], 'faq-category')
					: get_term_by('slug', $faq['category'], 'faq-category');
				
				if ($term && !is_wp_error($term)) {
					wp_set_object_terms($post_id, $term->term_id, 'faq-category');
				}
			}
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