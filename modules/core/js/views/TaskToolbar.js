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
	"dijit/form/DropDownButton",
	"dijit/Menu",
	"dijit/MenuItem",
	"dijit/MenuSeparator",
	"dijit/Toolbar",
	"dijit/ToolbarSeparator",
	"core/js/base/controllers/ActionProvider",
	"core/js/base/I18N"
], function(dojoDeclare) {
	return dojoDeclare("core.js.views.TaskToolbar", null, {
		// _id: String
		_id: null,

		// _i18n: Object
		_i18n: null,
		
		// _moduleDropDownButton: dijit.form.DropDownButton
		_moduleDropDownButton: null,
		
		// _modules: Array
		_modules: [],
		
		constructor: function(/*String*/ id) {
			this._id = id;
			
			core.js.base.I18N.requireLocalization("core/languages");
			this._i18n = core.js.base.I18N.getLocalization("core/languages");
		},
		
		setModules: function(/*Array*/ modules) {
			// summary:
			//		Sets array of modules
			this._modules = modules;
			return this;	// core.js.views.TaskToolbar
		},
		
		show: function() {
			// summary:
			//		Shows the toolbar
			var that = this;
			var toolbar = new dijit.Toolbar({}, this._id);
			
			// "Refresh" button
			this._refreshButton = new dijit.form.Button({
				label: this._i18n.global._share.refreshAction,
				showLabel: false,
				iconClass: "appIcon appRefreshIcon",
				disabled: !core.js.base.controllers.ActionProvider.get("core_task_list").isAllowed,
				onClick: function(e) {
					that.onRefresh();
				}
			});
			toolbar.addChild(this._refreshButton);
			
			if (this._modules.length > 0) {
				// Add a module filter
				var modulesMenu = new dijit.Menu();
				modulesMenu.addChild(new dijit.MenuItem({
					label: this._i18n.task.list.allModules,
					onClick: function(e) {
						that._moduleDropDownButton.set("label", this.label);
						that.onSelectModule(null);
					}
				}));
				modulesMenu.addChild(new dijit.MenuSeparator());
				
				for (var i in this._modules) {
					modulesMenu.addChild(new dijit.MenuItem({
						appModule: this._modules[i].name,
						label: this._modules[i].title,
						onClick: function(e) {
							that._moduleDropDownButton.set("label", this.get("label"));
							that.onSelectModule(this.get("appModule"));
						}
					}));
				}
				toolbar.addChild(new dijit.ToolbarSeparator());
				this._moduleDropDownButton = new dijit.form.DropDownButton({
					label: this._i18n.task.list.allModules,
					showLabel: true,
					dropDown: modulesMenu
				});
				toolbar.addChild(this._moduleDropDownButton);
			}
		},
		
		////////// CALLBACKS //////////
		
		onRefresh: function() {
			// summary:
			//		Reloads the list of tasks
			// tags:
			//		callback
		},
		
		onSelectModule: function(/*String?*/ module) {
			// summary:
			//		Loads the list of tasks in given module
			// tags:
			//		callback
		}
	});
});
