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
 * @version		2012-07-27
 */

define([
	"dojo/_base/declare",
	"dojo/aspect"
], function(dojoDeclare, dojoAspect) {
	return dojoDeclare("core.js.controllers.UserMediator", null, {
		// _roleContextMenu: core.js.views.RoleContextMenu
		_roleContextMenu: null,
		
		// _userContextMenu: core.js.views.UserContextMenu
		_userContextMenu: null,
		
		setRoleContextMenu: function(/*core.js.views.RoleContextMenu*/ roleContextMenu) {
			// summary:
			//		Sets the role's context menu
			this._roleContextMenu = roleContextMenu;
			
			dojoAspect.after(roleContextMenu, "onContextMenu", function(roleItemView) {
				var role	   = roleItemView.getRole();
				var isRootRole = "admin" == role.name;
				
				// Do not allow to delete root role or a role which have user(s)
				roleContextMenu.allowToDelete(0 == role.num_users && !isRootRole)
							   .allowToLock(!isRootRole)
							   .allowToSetPermission(!role.locked && !isRootRole);
			}, true);
		},
		
		setUserContextMenu: function(/*core.js.views.UserContextMenu*/ userContextMenu) {
			// summary:
			//		Sets the user's context menu
			this._userContextMenu = userContextMenu;
			
			dojoAspect.after(userContextMenu, "onContextMenu", function(userItemView) {
				var isRootUser = "admin" == userItemView.getUser().user_name;
				
				// Do not allow to activate, delete and set permission root user
				userContextMenu.allowToActivate(!isRootUser)
							   .allowToDelete(!isRootUser)
							   .allowToSetPermission(!isRootUser);
			}, true);
		}
	});
});
