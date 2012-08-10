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
	return dojoDeclare("core.js.views.UserContextMenu", null, {
		// _contextMenu: dijit.Menu
		_contextMenu: null,
		
		// _i18n: Object
		_i18n: null,
		
		// _activateMenuItem: dijit.MenuItem
		_activateMenuItem: null,
		
		// _deleteMenuItem: dijit.MenuItem
		_deleteMenuItem: null,
		
		// _setPermissionMenuItem: dijit.MenuItem
		_setPermissionMenuItem: null,
		
		// _userItemView: core.js.views.UserItemView
		//		Current selected user item view
		_userItemView: null,
		
		constructor: function() {
			core.js.base.I18N.requireLocalization("core/languages");
			this._i18n = core.js.base.I18N.getLocalization("core/languages");
			
			this._createMenu();
		},
		
		setUserItemView: function(/*core.js.views.UserItemView*/ userItemView) {
			this._userItemView = userItemView;
			return this;	// core.js.views.UserContextMenu
		},

		show: function() {
			if (!this._userItemView) {
				return;
			}
			
			var that = this;
			// Get user object
			var user = this._userItemView.getUser();
			this._activateMenuItem.set("label", ("activated" == user.status) ? this._i18n.global._share.deactivateAction : this._i18n.global._share.activateAction)
								  .set("iconClass", "appIcon " + ("activated" == user.status ? "appDeactivateIcon" : "appActivateIcon"));
		
			this._contextMenu.bindDomNode(this._userItemView.getDomNode());
			
			// Extension point
			this.onContextMenu(this._userItemView);
		},
		
		_createMenu: function() {
			// summary:
			//		Creates the menu
			var that = this;
			
			this._contextMenu = new dijit.Menu({
				id: "core.js.views.UserContextMenu"
			});
			
			// Activate/deactivate item
			this._activateMenuItem = new dijit.MenuItem({
				label: this._i18n.global._share.activateAction,
				iconClass: "appIcon appActivateIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_user_activate").isAllowed,
				onClick: function() {
					that.onActivateUser(that._userItemView);
				}
			});
			this._contextMenu.addChild(this._activateMenuItem);
			
			// Edit menu item
			this._contextMenu.addChild(new dijit.MenuItem({
				label: this._i18n.global._share.editAction,
				iconClass: "appIcon coreEditUserIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_user_edit").isAllowed,
				onClick: function() {
					that.onEditUser(that._userItemView);
				}
			}));
			
			// Delete user
			this._deleteMenuItem = new dijit.MenuItem({
				label: this._i18n.global._share.deleteAction,
				iconClass: "appIcon appDeleteIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_user_delete").isAllowed,
				onClick: function() {
					that.onDeleteUser(that._userItemView);
				}
			});
			this._contextMenu.addChild(this._deleteMenuItem);
			
			this._contextMenu.addChild(new dijit.MenuSeparator());
			
			// Permission item
			this._setPermissionMenuItem = new dijit.MenuItem({
				label: this._i18n.rule._share.permissionAction,
				disabled: !core.js.base.controllers.ActionProvider.get("core_rule_user").isAllowed,
				onClick: function() {
					that.onSetUserPermissions(that._userItemView);
				}
			});
			this._contextMenu.addChild(this._setPermissionMenuItem);
		},
		
		////////// CONTROL STATE OF MENU ITEMS //////////
		
		allowToActivate: function(/*Boolean*/ isAllowed) {
			// summary:
			//		Allows/disallows to activate/deactivate the user
			isAllowed = isAllowed && core.js.base.controllers.ActionProvider.get("core_user_activate").isAllowed;
			this._activateMenuItem.set("disabled", !isAllowed);
			return this;	// core.js.views.UserContextMenu
		},
		
		allowToDelete: function(/*Boolean*/ isAllowed) {
			// summary:
			//		Allows/disallows to delete the user
			isAllowed = isAllowed && core.js.base.controllers.ActionProvider.get("core_user_delete").isAllowed;
			this._deleteMenuItem.set("disabled", !isAllowed);
			return this;	// core.js.views.UserContextMenu
		},
		
		allowToSetPermission: function(/*Boolean*/ isAllowed) {
			// summary:
			//		Allows/disallows to set permissions to the user
			isAllowed = isAllowed && core.js.base.controllers.ActionProvider.get("core_rule_user").isAllowed;
			this._setPermissionMenuItem.set("disabled", !isAllowed);
			return this;	// core.js.views.UserContextMenu
		},
		
		////////// CALLBACKS //////////
		
		onActivateUser: function(/*core.js.views.UserItemView*/ userItemView) {
			// summary: 
			//		This method is called when the "Activate" menu item is selected
			// userItemView:
			//		The selected user item
			// tags:
			//		callback
		},
		
		onContextMenu: function(/*core.js.views.UserItemView*/ userItemView) {
			// summary:
			//		Called when user right-click an user item
			// userItemView:
			//		The selected user item
			// tags:
			//		callback
		},
		
		onDeleteUser: function(/*core.js.views.UserItemView*/ userItemView) {
			// summary:
			//		This method is called when the "Delete" menu item is selected
			// userItemView:
			//		The selected user item
			// tags:
			//		callback
		},
		
		onEditUser: function(/*core.js.views.UserItemView*/ userItemView) {
			// summary:
			//		This method is called when the "Edit" menu item is selected
			// userItemView:
			//		The selected user item
			// tags:
			//		callback
		},
		
		onSetUserPermissions: function(/*core.js.views.UserItemView*/ userItemView) {
			// summary:
			//		This method is called when the "Set permissions" menu item is selected
			// roleItemView:
			//		The selected user item
			// tags:
			//		callback
		}
	});
});
