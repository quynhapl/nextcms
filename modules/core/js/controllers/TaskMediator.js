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
 * @version		2012-07-26
 */

define([
	"dojo/_base/declare",
	"dojo/aspect"
], function(dojoDeclare, dojoAspect) {
	return dojoDeclare("core.js.controllers.TaskMediator", null, {
		// _taskGrid: core.js.views.TaskGrid
		_taskGrid: null,
		
		setTaskGrid: function(/*core.js.views.TaskGrid*/ grid) {
			// summary:
			//		Sets the task grid
			this._taskGrid = grid;
			
			dojoAspect.after(grid, "onRowContextMenu", function(item) {
				var isInstalled = item.is_installed[0]; 
				if (isInstalled) {
					grid.allowToUninstall(true);
				} else {
					grid.allowToInstall(true);
				}
				grid.allowToConfig(isInstalled && item.is_configuable[0])
					.allowToSchedule(isInstalled);
			}, true);
		}
	});
});
