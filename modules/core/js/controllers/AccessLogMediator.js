/**
 * NextCMS
 * 
 * @author		Nguyen Huu Phuoc <thenextcms@gmail.com>
 * @copyright	Copyright (c) 2011 - 2012, Nguyen Huu Phuoc
 * @license		http://nextcms.org/license.txt	(GNU GPL version 2 or later)
 * @link		http://nextcms.org
 * @category	modules
 * @package		core
 * @subpackage	js
 * @since		1.0
 * @version		2012-07-30
 */

define([
	"dojo/_base/declare",
	"dojo/aspect"
], function(dojoDeclare, dojoAspect) {
	return dojoDeclare("core.js.controllers.AccessLogMediator", null, {
		// _accessLogToolbar: core.js.views.AccessLogToolbar
		_accessLogToolbar: null,
		
		// _accessLogGrid: core.js.views.AccessLogGrid
		_accessLogGrid: null,
		
		setAccessLogToolbar: function(/*core.js.views.AccessLogToolbar*/ toolbar) {
			// summary:
			//		Sets the access log toolbar
			this._accessLogToolbar = toolbar;
		},
		
		setAccessLogGrid: function(/*core.js.views.AccessLogGrid*/ grid) {
			// summary:
			//		Sets the access logs grid
			this._accessLogGrid = grid;
			
			var that = this;
			// Filter by IP handler
			dojoAspect.after(grid, "onFilterByIp", function(ipAddress) {
				if (that._accessLogToolbar) {
					that._accessLogToolbar.initSearchCriteria({
						ip: ipAddress
					});
				}
			}, true);
		}
	});
});
