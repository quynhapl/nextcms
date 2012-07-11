<?php
/**
 * NextCMS
 * 
 * @author		Nguyen Huu Phuoc <thenextcms@gmail.com>
 * @copyright	Copyright (c) 2011 - 2012, Nguyen Huu Phuoc
 * @license		http://nextcms.org/license.txt	(GNU GPL version 2 or later)
 * @link		http://nextcms.org
 * @category	modules
 * @package		util
 * @subpackage	hooks
 * @since		1.0
 * @version		2012-07-11
 */

defined('APP_VALID_REQUEST') || die('You cannot access the script directly.');

class Util_Hooks_Slideshow_Hook extends Core_Base_Extension_Hook
	implements Zend_Filter_Interface
{
	public function __construct()
	{
		parent::__construct();
		if (!Zend_Layout::getMvcInstance() || Zend_Layout::getMvcInstance()->getLayout() != 'admin') {
			$this->view->style()->appendStylesheet($this->view->APP_STATIC_URL . '/templates/default/js/jquery.colorbox.css')
								->appendStylesheet($this->view->APP_STATIC_URL . '/templates/' . $this->view->APP_TEMPLATE . '/skins/' . $this->view->APP_SKIN . '/util.hooks.slideshow.css');
		}
	}
	
	/**
	 * Shows a slideshow whenever user click on any image found in the content
	 * 
	 * @see Zend_Filter_Interface::filter()
	 * @param string $value The original content
	 * @return string
	 */
	public function filter($value)
	{
		$slide = $this->show();
		return $value . $slide;
	}
	
	/**
	 * Shows slideshow scripts
	 * 
	 * @return void
	 */
	public function showAction()
	{
		Core_Services_Db::connect('slave');
		
		$options = Core_Services_Hook::getOptionsByInstance($this);
		$this->view->assign(array(
			'autorun'  => ($options && isset($options['autorun'])) ? $options['autorun'] : 'true',
			'duration' => ($options && isset($options['duration'])) ? $options['duration'] : 5000,
		));
	}
	
	/**
	 * Shows configuration form
	 * 
	 * @return void
	 */
	public function configAction()
	{
		Core_Services_Db::connect('master');
		
		$options = Core_Services_Hook::getOptionsByInstance($this);
		$this->view->assign(array(
			'autorun'  => ($options && isset($options['autorun'])) ? $options['autorun'] : 'true',
			'duration' => ($options && isset($options['duration'])) ? $options['duration'] : 5000,
		));
	}
	
	/**
	 * Saves the hook's options
	 * 
	 * @return string
	 */
	public function saveAction()
	{
		Core_Services_Db::connect('master');
		
		$request = $this->getRequest();
		$hook	 = Core_Services_Hook::getHookInstance('slideshow', 'util');
		$options = array(
			'autorun'  => $request->getParam('autorun') ? 'true' : 'false',
			'duration' => $request->getParam('duration', 5000),
		);
		$result = Core_Services_Hook::setOptionsForInstance($this, $options);
		return $result ? 'true' : 'false';
	}
}
