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
 * @subpackage	services
 * @since		1.0
 * @version		2012-07-07
 */

defined('APP_VALID_REQUEST') || die('You cannot access the script directly.');

class Core_Services_Logger
{
	/**
	 * Logs an exception to external file
	 * 
	 * @param Exception|string $exception The exception
	 * @return void
	 */
	public static function log($exception)
	{
		$message = ($exception instanceof Exception) ? $exception->getTraceAsString() : (string) $exception;
		
		// Create a file log
		$file = APP_TEMP_DIR . DS . 'logs' . DS . APP_HOST_CONFIG . '_' . date('Y') . '_' . date('m') . '.log';
		$writer = new Zend_Log_Writer_Stream($file);
		$logger = new Zend_Log($writer);
		$logger->debug($message);
	}
}
