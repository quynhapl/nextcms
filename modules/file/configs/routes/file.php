<?php
/**
 * NextCMS
 * 
 * @author		Nguyen Huu Phuoc <thenextcms@gmail.com>
 * @copyright	Copyright (c) 2011 - 2012, Nguyen Huu Phuoc
 * @license		http://nextcms.org/license.txt	(GNU GPL version 2 or later)
 * @link		http://nextcms.org
 * @category	modules
 * @package		file
 * @subpackage	configs
 * @since		1.0
 * @version		2012-07-10
 */

defined('APP_VALID_REQUEST') || die('You cannot access the script directly.');

/**
 * Define routes for uploading, browsing files on the local server
 * 
 * @return array
 */
return array(
	////////// BACKEND ACTIONS //////////
	// Upload file. The thumbnails will be generated automatically in various sizes
	'file_file_upload' => array(
		'type'	   => 'Zend_Controller_Router_Route_Static',
		'route'	   => '{adminPrefix}/file/file/upload',
		'defaults' => array(
			'module'	 => 'file',
			'controller' => 'file',
			'action'	 => 'upload',
		),
	),
	
	// Flash uploader
	// I cannot pass the additional params in the URL of Dojo Flash uploader
	// such as /file/file/upload?PHPSESSID=&mod&thumbnail&watermask
	// because the Flash uploader renders the markup as
	// 	<embed type="application/x-shockwave-flash"
	//		flashvars="key1=value1&uploadUrl=url&key2=value2" />
	'file_file_upload_flash' => array(
		'type'	   => 'Zend_Controller_Router_Route_Regex',
		'route'	   => '{adminPrefix}/file/file/upload/(\w+)/(\w+)/(\w+)',
		'reverse'  => '{adminPrefix}/file/file/upload/%s/%s/%s',
		'map'	   => array(
			'1' => 'mod',
			'2' => 'thumbnail',
			'3' => 'watermark',
		),
		'defaults' => array(
			'module'	 => 'file',
			'controller' => 'file',
			'action'	 => 'upload',
			'allowed'	 => 'file_file_upload',
		),
	),
);
