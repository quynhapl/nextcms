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
	"dojo/_base/lang",
	"dojo/_base/xhr",
	"dojo/aspect",
	"dojo/io-query",
	"dojo/json",
	"dojo/topic",
	"dojo/hash",
	"dojo/parser",
	"dijit/Menu",
	"dijit/MenuItem",
	"dijit/MenuSeparator",
	"dojox/string/sprintf",
	"core/js/base/controllers/ActionProvider",
	"core/js/base/controllers/Subscriber",
	"core/js/base/Encoder",
	"core/js/base/I18N",
	"core/js/base/views/Helper",
	"core/js/Constant",
	"core/js/controllers/TaskMediator"
], function(dojoDeclare, dojoLang, dojoXhr, dojoAspect, dojoIoQuery, dojoJson, dojoTopic) {
	return dojoDeclare("core.js.controllers.TaskController", null, {
		// _id: String
		_id: null,
		
		// _i18n: Object
		_i18n: null,
		
		// _helper: core.js.base.views.Helper
		_helper: null,
		
		// _taskToolbar: core.js.views.TaskToolbar
		_taskToolbar: null,
		
		// _taskGrid: core.js.views.TaskGrid
		_taskGrid: null,
		
		// _defaultCriteria: Object
		_defaultCriteria: {
			module: null
		},
		
		// _mediator: core.js.controllers.TaskMediator
		_mediator: new core.js.controllers.TaskMediator(),
		
		// _actionItems: Array
		//		Array of menu items that perform additional actions for a given task
		_actionItems: [],
		
		// TOPIC_GROUP: [const] String
		TOPIC_GROUP: "/core/js/controllers/TaskController",
		
		constructor: function(/*String*/ id) {
			this._id = id;
			
			core.js.base.I18N.requireLocalization("core/languages");
			this._i18n = core.js.base.I18N.getLocalization("core/languages");
			
			// Create helper instance
			this._helper = new core.js.base.views.Helper(id);
			this._helper.setLanguageData(this._i18n);
			
			core.js.base.controllers.Subscriber.unsubscribe(this.TOPIC_GROUP);
		},
		
		setTaskToolbar: function(/*core.js.views.TaskToolbar*/ toolbar) {
			// summary:
			//		Sets the task toolbar
			this._taskToolbar = toolbar;
			var self = this;
			
			// Refresh handler
			dojoAspect.after(toolbar, "onRefresh", dojoLang.hitch(this, "searchTasks"));
			
			// Module filter handler
			// DOJO LESSON: Pass the last parameter of dojoAspect.after to true,
			// so the advisory function can get the original parameters
			dojoAspect.after(toolbar, "onSelectModule", function(module) {
				self.searchTasks({
					module: module
				});
			}, true);
			
			return this;	// core.js.controllers.TaskController
		},
		
		setTaskGrid: function(/*core.js.views.TaskGrid*/ grid) {
			// summary:
			//		Sets the task grid
			var self = this;
			this._taskGrid = grid;
			this._mediator.setTaskGrid(grid);
			
			// Install task handler
			dojoAspect.after(grid, "onInstallTask", dojoLang.hitch(this, "installTask"), true);
			
			// Uninstall task handler
			dojoAspect.after(grid, "onUninstallTask", dojoLang.hitch(this, "uninstallTask"), true);
			
			// Configure task handler
			dojoAspect.after(grid, "onConfigTask", dojoLang.hitch(this, "configTask"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/task/config/onCancel", this, function() {
				this._helper.removePane();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/task/config/onStart", this, function() {
				this._helper.showStandby();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/task/config/onComplete", this, function(data) {
				this._helper.hideStandby();
				dojoTopic.publish("/app/global/notification", {
					message: dojox.string.sprintf(this._i18n.task.config[("APP_RESULT_OK" == data.result) ? "success" : "error"], data.name),
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
			});
			
			// Run task handler
			dojoAspect.after(grid, "onRunTask", dojoLang.hitch(this, "runTask"), true);
			
			// Schedule task handler
			dojoAspect.after(grid, "onScheduleTask", dojoLang.hitch(this, "scheduleTask"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/task/schedule/onCancel", this, function() {
				this._helper.removePane();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/task/schedule/onStart", this, function() {
				this._helper.showStandby();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/task/schedule/onComplete", this, function(data) {
				this._helper.hideStandby();
				dojoTopic.publish("/app/global/notification", {
					message: this._i18n.task.schedule[("APP_RESULT_OK" == data.result) ? "success" : "error"],
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
			});
			
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/task/config/onCancelAction", this, function() {
				this._helper.removePane();
			});
			dojoAspect.after(grid, "onRowContextMenu", function(item) {
				var menu = grid.getContextMenu();
				for (var i in self._actionItems) {
					menu.removeChild(self._actionItems[i]);
				}
				self._actionItems = [];
				
				if (item.actions[0]) {
					var actions = dojoJson.parse(item.actions[0]), languagePath, label, translationKeys;
					
					// Add a separator menu item
					var separator = new dijit.MenuSeparator();
					self._actionItems.push(separator);
					menu.addChild(separator);
					
					var module = item.module[0];
					require({
						paths: {
							module: core.js.Constant.ROOT_URL + "/modules/" + module
						}
					});
					languagePath = [ item.module[0], "tasks", item.name[0] ].join("/");
					core.js.base.I18N.requireLocalization(languagePath);
					label = core.js.base.I18N.getLocalization(languagePath);
					
					for (var action in actions) {
						translationKeys = actions[action].translationKey.split(".");
						for (var i in translationKeys) {
							label = label[translationKeys[i] + ""];
						}
						
						var menuItem = new dijit.MenuItem({
							label: label,
							disabled: !actions[action].allowed,
							onClick: function(e) {
								self.performAction(item, action);
							}
						});
						self._actionItems.push(menuItem);
						menu.addChild(menuItem);
					}
				}
			}, true);
			
			return this;	// core.js.controllers.TaskController
		},
		
		configTask: function(/*dojo.data.Item*/ item) {
			// summary:
			//		Configures the given task
			var params = {
				mod: item.module[0],
				name: item.name[0]
			};
			var url = core.js.base.controllers.ActionProvider.get("core_task_config").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showPane(url, {
				style: "width: 50%"
			});
		},
		
		initSearchCriteria: function(/*Object*/ criteria) {
			// summary:
			//		Inits with given criteria
			dojoLang.mixin(this._defaultCriteria, criteria);
			return this;	// core.js.controllers.TaskController
		},
		
		installTask: function(/*dojo.data.Item*/ item) {
			// summary:
			//		Installs given task item
			var self = this;
			dojoXhr.post({
				url: core.js.base.controllers.ActionProvider.get("core_task_install").url,
				content: {
					mod: item.module[0],
					name: item.name[0]
				},
				handleAs: "json",
				load: function(data) {
					dojoTopic.publish("/app/global/notification", {
						message: dojox.string.sprintf(self._i18n.task.install[("APP_RESULT_OK" == data.result) ? "success" : "error"], data.name),
						type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
					});
					if ("APP_RESULT_OK" == data.result) {
						self.searchTasks();
					}
				}
			});
		},
		
		runTask: function(/*dojo.data.Item*/ item) {
			// summary:
			//		Runs given task
			var self = this;
			this._helper.showStandby();
			dojoXhr.post({
				url: core.js.base.controllers.ActionProvider.get("core_task_run").url,
				content: {
					mod: item.module[0],
					name: item.name[0]
				},
				handleAs: "json",
				load: function(data) {
					self._helper.hideStandby();
					dojoTopic.publish("/app/global/notification", {
						message: dojox.string.sprintf(self._i18n.task.run[("APP_RESULT_OK" == data.result) ? "success" : "error"], data.name),
						type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
					});
					if ("APP_RESULT_OK" == data.result) {
						self.searchTasks();
					}
				}
			});
		},
		
		scheduleTask: function(/*dojo.data.Item*/ item) {
			// summary:
			//		Schedules given task
			var params = {
				mod: item.module[0],
				name: item.name[0]
			};
			var url = core.js.base.controllers.ActionProvider.get("core_task_schedule").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showPane(url, {
				style: "width: 50%"
			});
		},
		
		searchTasks: function(/*Object*/ criteria) {
			// summary:
			//		Searches for tasks
			dojoLang.mixin(this._defaultCriteria, criteria);
			
			var q   = core.js.base.Encoder.encode(this._defaultCriteria);
			var url = core.js.base.controllers.ActionProvider.get("core_task_list").url;
			dojo.hash("u=" + url + "/?q=" + q);
			
			var self = this;
			this._helper.showStandby();
			dojoXhr.post({
				url: url,
				content: {
					q: q,
					format: "json"
				},
				handleAs: "json",
				load: function(data) {
					self._helper.hideStandby();
					self._taskGrid.showTasks(data.data);
				}
			});
			
			return this;	// core.js.controllers.TaskController
		},
		
		uninstallTask: function(/*dojo.data.Item*/ item) {
			// summary:
			//		Uninstalls given task item
			var self = this;
			dojoXhr.post({
				url: core.js.base.controllers.ActionProvider.get("core_task_uninstall").url,
				content: {
					mod: item.module[0],
					name: item.name[0]
				},
				handleAs: "json",
				load: function(data) {
					dojoTopic.publish("/app/global/notification", {
						message: dojox.string.sprintf(self._i18n.task.uninstall[("APP_RESULT_OK" == data.result) ? "success" : "error"], data.name),
						type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
					});
					if ("APP_RESULT_OK" == data.result) {
						self.searchTasks();
					}
				}
			});
		},
		
		performAction: function(/*dojo.data.Item*/ item, /*String*/ action) {
			// summary:
			//		Performs an action to a given task
			var params = {
				_type: "task",
				_mod: item.module[0],
				_name: item.name[0],
				_method: action
			};
			var url = core.js.base.controllers.ActionProvider.get("core_extension_render").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showPane(url, {
				style: "width: 50%"
			});
		}
	});
});
