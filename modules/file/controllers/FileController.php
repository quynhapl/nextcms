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
 * @subpackage	controllers
 * @since		1.0
 * @version		2012-07-09
 */

defined('APP_VALID_REQUEST') || die('You cannot access the script directly.');

class File_FileController extends Zend_Controller_Action
{
	////////// BACKEND ACTIONS //////////

	/**
	 * Uploads files
	 * 
	 * @return void
	 */
	public function uploadAction()
	{
		$request   = $this->getRequest();
		$fileName  = $request->getParam('name');
		$module    = $request->getParam('mod', 'file');
		$thumbnail = $request->getParam('thumbnail', 'false');
		$watermark = $request->getParam('watermark', 'false');
		$uploader  = $request->getParam('uploader', 'flash');
		
		switch ($uploader) {
			case 'html5':
				// Dojo HTML5 uploader automatically appends the "s" at the end of name
				$fileName = $request->getParam('name', 'uploadedfile') . 's';
				$files	  = File_Services_Uploader::upload($fileName, $module, array(
					'thumbnail' => 'true' == $thumbnail,
					'watermark' => 'true' == $watermark,
				));
				$this->_helper->json($files);
				break;
			case 'flash':
			default:
				// Use Flash to upload files
				$this->getResponse()->setHeader('Content-Type', 'text/html; charset=utf-8');
				$this->_helper->getHelper('layout')->disableLayout();
				$this->_helper->getHelper('viewRenderer')->setNoRender();
				
				$fileName = $request->getParam('name', 'uploadedfile');
				$files	  = File_Services_Uploader::upload($fileName, $module, array(
					'thumbnail' => 'true' == $thumbnail,
					'watermark' => 'true' == $watermark,
				));
				$return	  = array(
					'name=' . (isset($files[0]['original']['name'])		 ? $files[0]['original']['name']	  : ''),
					'type=' . (isset($files[0]['original']['extension']) ? $files[0]['original']['extension'] : ''),
					'size=' . (isset($files[0]['original']['size'])		 ? $files[0]['original']['size']	  : 0),
					'appUploadedFiles=' . rawurlencode(base64_encode(Zend_Json::encode($files))),
				);
				$return = implode(',', $return);
				$this->getResponse()->setBody($return);
				break;
		}
	}
}
