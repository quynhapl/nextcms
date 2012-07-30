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
	"dojo/_base/lang",
	"dojo/_base/xhr",
	"dojo/aspect",
	"dojo/io-query",
	"dojo/topic",
	"dojo/hash",
	"dijit/registry",
	"core/js/base/controllers/ActionProvider",
	"core/js/base/controllers/Subscriber",
	"core/js/base/Encoder",
	"core/js/base/I18N",
	"core/js/base/views/Helper",
	"core/js/controllers/AccessLogMediator"
], function(dojoDeclare, dojoLang, dojoXhr, dojoAspect, dojoIoQuery, dojoTopic) {
	return dojoDeclare("core.js.controllers.AccessLogController", null, {
		// _id: String
		_id: null,
		
		// _i18n: Object
		_i18n: null,
		
		// _helper: core.js.base.views.Helper
		_helper: null,
		
		// _accessLogToolbar: core.js.views.AccessLogToolbar
		_accessLogToolbar: null,
		
		// _accessLogGrid: core.js.views.AccessLogGrid
		_accessLogGrid: null,
		
		// _paginatorContainer: String
		_paginatorContainer: null,
		
		// _defaultCriteria: Object
		_defaultCriteria: {
			page: 1,
			module: null,
			from_date: null,
			to_date: null,
			ip: null
		},
		
		// _mediator: core.js.controllers.AccessLogMediator
		_mediator: new core.js.controllers.AccessLogMediator(),
		
		// TOPIC_GROUP: [const] String
		TOPIC_GROUP: "/core/js/controllers/AccessLogController",
		
		constructor: function(/*String*/ id) {
			this._id = id;
			
			core.js.base.I18N.requireLocalization("core/languages");
			this._i18n = core.js.base.I18N.getLocalization("core/languages");
			
			// Create helper instance
			this._helper = new core.js.base.views.Helper(id);
			this._helper.setLanguageData(this._i18n);
			
			core.js.base.controllers.Subscriber.unsubscribe(this.TOPIC_GROUP);
		},
		
		setAccessLogToolbar: function(/*core.js.views.AccessLogToolbar*/ toolbar) {
			// summary:
			//		Sets the access log toolbar
			this._accessLogToolbar = toolbar;
			this._mediator.setAccessLogToolbar(toolbar);
			
			var that = this;
			// Refresh handler
			dojoAspect.after(toolbar, "onRefresh", dojoLang.hitch(this, "searchAccessLogs"));
			
			// Module filter handler
			dojoAspect.after(toolbar, "onSelectModule", function(module) {
				that.searchAccessLogs({
					module: module
				});
			}, true);
			
			// Search handler
			dojoAspect.after(toolbar, "onSearchAccessLogs", dojoLang.hitch(this, "searchAccessLogs"), true);
			
			return this;	// core.js.controllers.AccessLogController
		},
		
		setAccessLogGrid: function(/*core.js.views.AccessLogGrid*/ grid) {
			// summary:
			//		Sets the access logs grid
			this._accessLogGrid = grid;
			this._mediator.setAccessLogGrid(grid);
			
			var that = this;
			// Delete access log handler
			dojoAspect.after(grid, "onDeleteAccessLog", dojoLang.hitch(this, "deleteAccessLog"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/accesslog/delete/onCancel", this, function() {
				this._helper.closeDialog();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/accesslog/delete/onComplete", this, function(data) {
				this._helper.closeDialog();
				dojoTopic.publish("/app/global/notification", {
					message: this._i18n.accesslog["delete"][("APP_RESULT_OK" == data.result) ? "success" : "error"],
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
				
				if ("APP_RESULT_OK" == data.result) {
					this.searchAccessLogs();
				}
			});
			
			// View access log handler
			dojoAspect.after(grid, "onViewAccessLog", dojoLang.hitch(this, "viewAccessLog"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/accesslog/view/onCancel", this, function() {
				this._helper.removePane();
			});
			
			// Filter by IP handler
			dojoAspect.after(grid, "onFilterByIp", function(ipAddress) {
				that.searchAccessLogs({
					page: 1,
					ip: ipAddress
				});
			}, true);
			
			return this;	// core.js.controllers.AccessLogController
		},
		
		setAccessLogPaginator: function(/*String*/ paginatorContainer) {
			// summary:
			//		Sets the container of paginator
			this._paginatorContainer = paginatorContainer;
			
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/accesslog/list/onGotoPage", this, function(page) {
				this.searchAccessLogs({
					page: page
				});
			});
			
			return this;	// menu.js.controllers.MenuController
		},	
		
		deleteAccessLog: function(/*dojo.data.Item*/ item) {
			// summary:
			//		Deletes the given access log
			var params = {
				log_id: item.log_id[0]
			};
			var url = core.js.base.controllers.ActionProvider.get("core_accesslog_delete").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showDialog(url, {
				id: "coreAccesslogDeleteConfirmDialog",
				refreshOnShow: true,
				style: "width: 250px",
				title: this._i18n.accesslog["delete"].title
			});
		},
		
		initSearchCriteria: function(/*Object*/ criteria) {
			// summary:
			//		Inits with given criteria
			dojoLang.mixin(this._defaultCriteria, criteria);
			this._accessLogToolbar.initSearchCriteria(this._defaultCriteria);
			return this;	// core.js.controllers.AccessLogController
		},
		
		searchAccessLogs: function(/*Object*/ criteria) {
			// summary:
			//		Searches for access logs
			dojoLang.mixin(this._defaultCriteria, criteria);
			
			var q   = core.js.base.Encoder.encode(this._defaultCriteria);
			var url = core.js.base.controllers.ActionProvider.get("core_accesslog_list").url;
			dojo.hash("u=" + url + "/?q=" + q);
			
			var that = this;
			this._helper.showStandby();
			dojoXhr.post({
				url: url,
				content: {
					q: q,
					format: "json"
				},
				handleAs: "json",
				load: function(data) {
					that._helper.hideStandby();
					that._accessLogGrid.showAccessLogs(data.logs);
					
					// Update the paginator
					dijit.registry.byId(that._paginatorContainer).set("content", data.paginator);
				}
			});
			
			return this;	// core.js.controllers.AccessLogController
		},
		
		viewAccessLog: function(/*dojo.data.Item*/ item) {
			// summary:
			//		Views given access log item
			var params = {
				log_id: item.log_id[0]
			};
			var url = core.js.base.controllers.ActionProvider.get("core_accesslog_view").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showPane(url, {
				style: "width: 50%"
			});
		}
	});
});
