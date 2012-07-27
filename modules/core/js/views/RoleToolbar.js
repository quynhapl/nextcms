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
	"dojo/parser",
	"dijit/form/Button",
	"dijit/form/TextBox",
	"dijit/Toolbar",
	"dijit/ToolbarSeparator",
	"core/js/base/controllers/ActionProvider",
	"core/js/base/I18N"
], function(dojoDeclare) {
	return dojoDeclare("core.js.views.RoleToolbar", null, {
		// _toolbar: dijit.Toolbar
		_toolbar: null,
		
		// _i18n: Object
		_i18n: null,
		
		// _searchTextBox: dijit.form.TextBox
		_searchTextBox: null,
		
		// _refreshButton: dijit.form.Button
		_refreshButton: null,
		
		constructor: function(/*String*/ id) {
			this._toolbar = new dijit.Toolbar({}, id);
			
			core.js.base.I18N.requireLocalization("core/languages");
			this._i18n = core.js.base.I18N.getLocalization("core/languages");
		
			// Add toolbar items
			var that = this;
			this._toolbar.addChild(new dijit.form.Button({
				label: this._i18n.role.list.addRoleButton,
				showLabel: false,
				iconClass: "appIcon coreAddRoleIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_role_add").isAllowed,
				onClick: function(e) {
					that.onAddRole();
				}
			}));
			
			// "Refresh" button
			this._refreshButton = new dijit.form.Button({
				label: this._i18n.global._share.refreshAction,
				showLabel: false,
				iconClass: "appIcon appRefreshIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_role_list").isAllowed,
				onClick: function(e) {
					that.onRefresh();
				}
			});
			this._toolbar.addChild(this._refreshButton);
			
			this._toolbar.addChild(new dijit.ToolbarSeparator());
			
			// Search control
			this._searchTextBox = new dijit.form.TextBox({
				style: "width: 100px",
				placeHolder: this._i18n.role.list.searchRoleHelp
			});
			this._toolbar.addChild(this._searchTextBox);
			this._toolbar.addChild(new dijit.form.Button({
				label: this._i18n.global._share.searchAction,
				showLabel: false,
				iconClass: "appIcon appSearchIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_role_list").isAllowed,
				onClick: function(e) {
					var name = that._searchTextBox.get("value");
					that.onSearchRole(name);
				}
			}));
		},
		
		////////// CALLBACKS //////////
		
		onAddRole: function() {
			// summary:
			//		This method is called when the adding role button is clicked
			// tags:
			//		callback
		},
		
		onRefresh: function() {
			// summary:
			//		Reloads the list of roles
			// tags:
			//		callback
		},
		
		onSearchRole: function(/*String*/ name) {
			// summary:
			//		Searches for roles by name
			// tags:
			//		callback
		}
	});
});
