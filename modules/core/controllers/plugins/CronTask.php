<?php
/**
 * NextCMS
 * 
 * @author		Nguyen Huu Phuoc <thenextcms@gmail.com>
 * @copyright	Copyright (c) 2011 - 2012, Nguyen Huu Phuoc
 * @license		http://nextcms.org/license.txt	(GNU GPL version 2 or later)
 * @link		http://nextcms.org
 * @category	modules
 * @package		core
 * @subpackage	controllers
 * @since		1.0
 * @version		2012-06-26
 */

defined('APP_VALID_REQUEST') || die('You cannot access the script directly.');

class Core_Controllers_Plugins_CronTask extends Zend_Controller_Plugin_Abstract
{
	/**
	 * @see Zend_Controller_Plugin_Abstract::dispatchLoopShutdown()
	 */
	public function dispatchLoopShutdown()
	{
		// Return if request is POST or I am in the back-end section
		if (!empty($_POST) || (Zend_Layout::getMvcInstance() && 'admin' == Zend_Layout::getMvcInstance()->getLayout())) {
			return;
		}
		
		register_shutdown_function(array($this, 'requestCronTasks'));
	}
	
	/**
	 * Requests to the cron scripts
	 * 
	 * @return void
	 */
	public function requestCronTasks()
	{
		$view	 = Zend_Controller_Action_HelperBroker::getStaticHelper('viewRenderer')->view;
		// Get the root URL which is defined in the Core_Controllers_Plugins_Init plugin
		$rootUrl = $view->APP_ROOT_URL;
		
		// Request to the cron script
		$script = rtrim($rootUrl, '/') . '/cron.php';
		$uri	= Zend_Uri::factory($script);
		$host	= $uri->getHost();
		$port	= $uri->getPort();
		$port	= !is_numeric($port) ? 80 : $port;
		
		$fp = @fsockopen('tcp://' . $host, $port, $errno, $errstr, 5);
		if ($fp !== false) {
			@stream_set_blocking($fp, 0);
			$path = $uri->getPath();
			$out  = "GET {$path} HTTP/1.1\r\n";
			$out .= "Host: " . $host . "\r\n";
			$out .= "Connection: Close\r\n\r\n";
			@fwrite($fp, $out);
			@fclose($fp);
		}
	}
}
