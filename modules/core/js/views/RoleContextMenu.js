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
 * @version		2012-08-10
 */

define([
	"dojo/_base/declare",
	"dojo/parser",
	"dijit/Menu",
	"dijit/MenuItem",
	"dijit/MenuSeparator",
	"core/js/base/controllers/ActionProvider",
	"core/js/base/I18N"
], function(dojoDeclare) {
	return dojoDeclare("core.js.views.RoleContextMenu", null, {
		// _contextMenu: dijit.Menu
		//		The context menu for each role item
		_contextMenu: null,
		
		// _i18n: Object
		_i18n: null,
		
		// _deleteMenuItem: dijit.MenuItem
		_deleteMenuItem: null,
		
		// _renameMenuItem: dijit.MenuItem
		_renameMenuItem: null,
		
		// _lockMenuItem: dijit.MenuItem
		_lockMenuItem: null,
		
		// _setPermissionMenuItem: dijit.MenuItem
		_setPermissionMenuItem: null,
		
		// _roleItemView: core.js.views.RoleItemView
		_roleItemView: null,
		
		constructor: function() {
			core.js.base.I18N.requireLocalization("core/languages");
			this._i18n = core.js.base.I18N.getLocalization("core/languages");
			
			this._createMenu();
		},
		
		_createMenu: function() {
			// summary:
			//		Creates the menu
			var that = this;
			
			this._contextMenu = new dijit.Menu({
				id: "core.js.views.RoleItemView"
			});
			
			// "Delete" menu item
			this._deleteMenuItem = new dijit.MenuItem({
				label: this._i18n.global._share.deleteAction,
				iconClass: "appIcon appDeleteIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_role_delete").isAllowed,
				onClick: function() {
					that.onDeleteRole(that._roleItemView);
				}
			});
			this._contextMenu.addChild(this._deleteMenuItem);
			
			// "Rename" item
			this._renameMenuItem = new dijit.MenuItem({
				label: this._i18n.global._share.renameAction,
				iconClass: "appIcon appRenameIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_role_rename").isAllowed,
				onClick: function() {
					that.onRenameRole(that._roleItemView);
				}
			});
			this._contextMenu.addChild(this._renameMenuItem);
			
			// "Lock" item
			this._lockMenuItem = new dijit.MenuItem({
				label: this._i18n.global._share.lockAction,
				iconClass: "appIcon appUnlockIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_role_lock").isAllowed,
				onClick: function() {
					that.onLockRole(that._roleItemView);
				}
			});
			this._contextMenu.addChild(this._lockMenuItem);
			
			this._contextMenu.addChild(new dijit.MenuSeparator());
			
			// Permission item
			this._setPermissionMenuItem = new dijit.MenuItem({
				label: this._i18n.rule._share.permissionAction,
				disabled: !core.js.base.controllers.ActionProvider.get("core_rule_role").isAllowed,
				onClick: function() {
					that.onSetRolePermissions(that._roleItemView);
				}
			});
			this._contextMenu.addChild(this._setPermissionMenuItem);
		},
		
		setRoleItemView: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		Sets the current role item view
			this._roleItemView = roleItemView;
			return this;	// core.js.views.RoleContextMenu
		},

		show: function() {
			// summary:
			//		Show menu context for selected role item
			if (!this._roleItemView) {
				return;
			}
			var that = this;
			
			// Get the role object that the role item handles
			var role = this._roleItemView.getRole();
			this._lockMenuItem.set("label", role.locked ? this._i18n.global._share.unlockAction : this._i18n.global._share.lockAction);
			
			this._contextMenu.bindDomNode(this._roleItemView.getDomNode());
			
			// Extension point
			this.onContextMenu(this._roleItemView);
		},
		
		////////// CONTROL STATE OF MENU ITEMS //////////
		
		allowToDelete: function(/*Boolean*/ isAllowed) {
			// summary:
			//		Allows/disallows to delete the role
			isAllowed = isAllowed && core.js.base.controllers.ActionProvider.get("core_role_delete").isAllowed;
			this._deleteMenuItem.set("disabled", !isAllowed);
			return this;	// core.js.views.RoleContextMenu
		},
		
		allowToLock: function(/*Boolean*/ isAllowed) {
			// summary:
			//		Allows/disallows to lock the role
			isAllowed = isAllowed && core.js.base.controllers.ActionProvider.get("core_role_lock").isAllowed;
			this._lockMenuItem.set("disabled", !isAllowed);
			return this;	// core.js.views.RoleContextMenu
		},
		
		allowToSetPermission: function(/*Boolean*/ isAllowed) {
			// summary:
			//		Allows/disallows to set permissions to role
			isAllowed = isAllowed && core.js.base.controllers.ActionProvider.get("core_rule_role").isAllowed;
			this._setPermissionMenuItem.set("disabled", !isAllowed);
			return this;	// core.js.views.RoleContextMenu
		},
		
		////////// CALLBACKS //////////
		
		onContextMenu: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		Called when user right-click a role item
			// roleItemView:
			//		The selected role item
			// tags:
			//		callback
		},
		
		onDeleteRole: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		This method is called when the "Delete" menu item is selected
			// roleItemView:
			//		The selected role item
			// tags:
			//		callback
		},
		
		onLockRole: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		This method is called when the "Lock" menu item is selected
			// roleItemView:
			//		The selected role item
			// tags:
			//		callback
		},
		
		onRenameRoleClick: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		This method is called when the "Rename" menu item is selected
			// roleItemView:
			//		The selected role item
			// tags:
			//		callback
		},
		
		onSetRolePermissions: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		This method is called when the "Set permissions" menu item is selected
			// roleItemView:
			//		The selected role item
			// tags:
			//		callback
		}
	});
});
