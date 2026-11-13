<?php
/**
 * Plugin Name: Example Reviews
 * Description: Fixture for ASST tests.
 */

add_action('wp_ajax_save_review', 'er_save_review'); // @expect CWE-352
add_action('wp_ajax_delete_review', 'er_delete_review');

function er_save_review()
{
    global $wpdb;
    $title = $_POST['title'];
    $wpdb->query("INSERT INTO {$wpdb->prefix}reviews (title) VALUES ('$title')"); // @expect CWE-89
    wp_die();
}

function er_delete_review()
{
    check_ajax_referer('delete_review');
    if (!current_user_can('manage_options')) {
        wp_die();
    }
    global $wpdb;
    $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->prefix}reviews WHERE id = %d", $_POST['id']));
    wp_die();
}

function er_render_box()
{
    echo '<h2>' . esc_html($_GET['heading']) . '</h2>';
    echo '<a href="' . esc_url($_GET['link']) . '">Link</a>';
    echo '<p>' . $_GET['note'] . '</p>'; // @expect CWE-79
}

function er_go()
{
    wp_redirect($_GET['to']); // @expect CWE-601
    exit;
}
