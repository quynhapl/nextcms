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
 * @subpackage	widgets
 * @since		1.0
 * @version		2012-06-26
 */

defined('APP_VALID_REQUEST') || die('You cannot access the script directly.');

class Util_Widgets_Twitter_Helper extends Zend_View_Helper_Abstract
{
	/**
	 * Gets the view helper instance
	 * 
	 * @return Util_Widgets_Twitter_Helper
	 */
	public function helper()
	{
		return $this;
	}
	
	/**
	 * Formats the message's content
	 * 
	 * @param string $content The message's content
	 * @return string
	 */
	public function formatText($content)
	{
		$searchFor = array(
			'/(([[:alnum:]]+:\/\/)|www\.)([^[:space:]]*)([[:alnum:]#?\/&=])/i',	// link
			'/(([a-z0-9_]|\-|\.)+@([^[:space:]]*)([[:alnum:]-]))/i',			// mailto
			'/@([a-z0-9_]*)?/i',		// Twitter user
			'/#([a-z0-9_]*)?/i',		// tag
		);
		$replaceWith = array(
			'<a href="$1$3$4" target="_blank">$1$3$4</a>',
			'<a href="mailto:$1">$1</a>',
			'<a href="http://twitter.com/$1" target="_blank">@$1</a>',
			'<a href="http://twitter.com/search?q=#$1" target="_blank">#$1</a>',
		);
		
		return preg_replace($searchFor, $replaceWith, $content);
	}
	
	/**
	 * @var array
	 */
	private $_diffFormat = null;
	
	/**
	 * Formats the sent date of message
	 * 
	 * @param string $sentDate The message's sent date, in the format of
	 * Wed, 02 Nov 2011 09:16:26 +0000
	 * @return string
	 */
	public function formatTime($sentDate)
	{
		if ($this->_diffFormat == null) {
			$this->_diffFormat = array(
				'DAY'			=> $this->view->translator()->_('show.daysAgo'),
				'DAY_HOUR'		=> $this->view->translator()->_('show.daysHoursAgo'),
				'HOUR'			=> $this->view->translator()->_('show.hoursAgo'),
				'HOUR_MINUTE'   => $this->view->translator()->_('show.hoursMinutesAgo'),
				'MINUTE'		=> $this->view->translator()->_('show.minutesAgo'),
				'MINUTE_SECOND' => $this->view->translator()->_('show.minutesSecondsAgo'),
				'SECOND'		=> $this->view->translator()->_('show.secondsAgo'),
			);
		}
		$timestamp = strtotime($sentDate);
		return $this->view->dateFormatter()->diff($timestamp, $this->_diffFormat);
	}
}
