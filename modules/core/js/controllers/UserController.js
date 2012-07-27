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
	"dojo/_base/lang",
	"dojo/_base/xhr",
	"dojo/aspect",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/io-query",
	"dojo/topic",
	"dojo/hash",
	"dojo/NodeList-dom",
	"dojo/parser",
	"dojo/query",
	"dijit/form/TextBox",
	"dijit/InlineEditBox",
	"dojox/string/sprintf",
	"core/js/base/controllers/ActionProvider",
	"core/js/base/controllers/Subscriber",
	"core/js/base/Encoder",
	"core/js/base/I18N",
	"core/js/base/views/Helper",
	"core/js/controllers/UserMediator"
], function(dojoDeclare, dojoLang, dojoXhr, dojoAspect, dojoDomAttr, dojoDomClass, dojoIoQuery, dojoTopic) {
	return dojoDeclare("core.js.controllers.UserController", null, {
		// _id: String
		_id: null,
		
		// _i18n: Object
		_i18n: null,
		
		// _helper: core.js.base.views.Helper
		_helper: null,
		
		// _userMediator: core.js.controllers.UserMediator
		_userMediator: new core.js.controllers.UserMediator(),
		
		// TOPIC_GROUP: [const] String
		TOPIC_GROUP: "/core/js/controllers/UserController",
		
		constructor: function(/*String*/ id) {
			this._id = id;
			
			core.js.base.I18N.requireLocalization("core/languages");
			this._i18n = core.js.base.I18N.getLocalization("core/languages");
			
			// Create helper instance
			this._helper = new core.js.base.views.Helper(id);
			this._helper.setLanguageData(this._i18n);
			
			core.js.base.controllers.Subscriber.unsubscribe(this.TOPIC_GROUP);
		},
		
		////////// MANAGE ROLES //////////
		
		// _roleToolbar: core.js.views.RoleToolbar
		_roleToolbar: null,
		
		// _roleListView: core.js.views.RoleListView
		_roleListView: null,
		
		// _roleContextMenu: core.js.views.RoleContextMenu
		//		The context menu for each role item
		_roleContextMenu: null,
		
		// _roleSearchCriteria: Object
		_roleSearchCriteria: {
			page: 1,
			name: null,
			active_role_id: null
		},
		
		setRoleToolbar: function(/*core.js.views.RoleToolbar*/ roleToolbar) {
			// summary:
			//		Sets the role toolbar
			this._roleToolbar = roleToolbar;
			
			var that = this;
			// Add role handler
			dojoAspect.after(roleToolbar, "onAddRole", dojoLang.hitch(this, "addRole"));
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/role/add/onCancel", this, function() {
				this._helper.closeDialog();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/role/add/onComplete", this, function(data) {
				dojoTopic.publish("/app/global/notification", {
					message: this._i18n.role.add[("APP_RESULT_OK" == data.result) ? "success" : "error"],
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
				
				if ("APP_RESULT_OK" == data.result) {
					this.searchRoles();
				}
			});
			
			// Refresh handler
			dojoAspect.after(roleToolbar, "onRefresh", dojoLang.hitch(this, "searchRoles"));
			
			// Search handler
			dojoAspect.after(roleToolbar, "onSearchRole", function(name) {
				that.searchRoles({
					name: name
				});
			}, true);
			
			return this;	// core.js.controllers.UserController
		},
		
		setRoleListView: function(/*core.js.views.RoleListView*/ roleListView) {
			// summary:
			//		Sets the roles list view
			this._roleListView = roleListView;
			
			var that = this;
			// Show context menu
			dojoAspect.after(roleListView, "onMouseDown", function(roleItemView) {
				if (that._roleContextMenu) {
					that._roleContextMenu.show(roleItemView);
				}
			}, true);
			
			// Click role item handler
			dojoAspect.after(roleListView, "onClickRole", function(roleItemView) {
				// Add CSS class to identify the selected item in the role list view
				dojo.query(".coreRoleItemSelected", roleListView.getDomNode()).removeClass("coreRoleItemSelected");
				dojo.query(roleItemView.getDomNode()).addClass("coreRoleItemSelected");
				
				var roleId = roleItemView.getRole().role_id;
				that.searchUsers({
					role_id: roleId,
					page: 1,
					keyword: null
				});
			}, true);
			
			// Paging handler
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/role/list/onGotoPage", this, function(page) {
				this.searchRoles({
					page: page
				});
			});
			
			// View all handler
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/role/list/onViewAll", this, function(node) {
				dojo.query(".coreRoleItemSelected", roleListView.getDomNode()).removeClass("coreRoleItemSelected");
				dojoDomClass.add(node, "coreRoleItemSelected");
				this.searchUsers({
					role_id: null
				});
			});
			
			// Update users counter after creating new user
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/add/onSuccess", this, function(data) {
				roleListView.increaseUserCounter(data.role_id, 1);
			});
			// after changing user's role
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/edit/onSuccess", this, function(data) {
				if (data.new_role_id != data.old_role_id) {
					roleListView.increaseUserCounter(data.old_role_id, -1);
					roleListView.increaseUserCounter(data.new_role_id, 1);
				}
			});
			// after removing user
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/delete/onSuccess", this, function(data) {
				roleListView.increaseUserCounter(data.role_id, -1);
			});
			// after moving user
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/move/onSuccess", this, function(data) {
				if (data.new_role_id != data.old_role_id) {
					roleListView.increaseUserCounter(data.old_role_id, -1);
					roleListView.increaseUserCounter(data.new_role_id, 1);
				}
			});
			
			// Dnd handler
			dojoAspect.after(roleListView, "onDropUsers", dojoLang.hitch(this, "moveUsers"), true);
			
			return this;	// core.js.controllers.UserController
		},
		
		setRoleContextMenu: function(/*core.js.views.RoleContextMenu*/ roleContextMenu) {
			// summary:
			//		Sets the role's context menu
			this._roleContextMenu = roleContextMenu;
			this._userMediator.setRoleContextMenu(roleContextMenu);
			
			// Delete handler
			dojoAspect.after(roleContextMenu, "onDeleteRole", dojoLang.hitch(this, "deleteRole"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/role/delete/onCancel", this, function() {
				this._helper.closeDialog();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/role/delete/onComplete", this, function(data) {
				this._helper.closeDialog();
				dojoTopic.publish("/app/global/notification", {
					message: this._i18n.role["delete"][("APP_RESULT_OK" == data.result) ? "success" : "error"],
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
				
				this.searchRoles();
			});
			
			// Rename handler
			dojoAspect.after(roleContextMenu, "onRenameRole", dojoLang.hitch(this, "renameRole"), true);
			
			// Lock handler
			dojoAspect.after(roleContextMenu, "onLockRole", dojoLang.hitch(this, "lockRole"), true);
			
			// Set permissions handler
			dojoAspect.after(roleContextMenu, "onSetRolePermissions", dojoLang.hitch(this, "setRolePermissions"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/rule/role/onCancel", this, function() {
				this._helper.removePane();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/rule/role/onComplete", this, function(data) {
				this._helper.removePane();
				dojoTopic.publish("/app/global/notification", {
					message: this._i18n.rule.role[("APP_RESULT_OK" == data.result) ? "success" : "error"],
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
			});
			
			return this;	// core.js.controllers.UserController
		},
		
		addRole: function() {
			// summary:
			//		Shows a dialog for adding new role
			var url = core.js.base.controllers.ActionProvider.get("core_role_add").url;
			this._helper.showDialog(url, {
				title: this._i18n.role.add.title,
				style: "width: 250px",
				refreshOnShow: true
			});
		},
		
		deleteRole: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		Deletes a role
			// roleItemView:
			//		The selected role item
			var params = {
				role_id: roleItemView.getRole().role_id
			};
			var url = core.js.base.controllers.ActionProvider.get("core_role_delete").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showDialog(url, {
				id: "coreRoleDeleteConfirmDialog",
				refreshOnShow: true,
				style: "width: 250px",
				title: this._i18n.role["delete"].title
			});
		},
		
		lockRole: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		Locks role
			// roleItemView:
			//		The selected role item
			var roleId = roleItemView.getRole().role_id;
			var locked = roleItemView.getRole().locked;
			var that   = this;
			dojoXhr.post({
				url: core.js.base.controllers.ActionProvider.get("core_role_lock").url,
				content: {
					role_id: roleId
				},
				handleAs: "json",
				load: function(data) {
					var message = ("APP_RESULT_OK" == data.result) ? (locked ? "unlockSuccess" : "lockSuccess") : (locked ? "unlockError" : "lockError");
					dojoTopic.publish("/app/global/notification", {
						message: that._i18n.role.lock[message],
						type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
					});
					
					if ("APP_RESULT_OK" == data.result) {
						roleItemView.getRole().locked = !locked;
					}
				}
			});
		},
		
		renameRole: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		Renames a role
			// roleItemView:
			//		The selected role item
			var that   = this;
			var roleId = roleItemView.getRole().role_id;

			// Create InlineEditBox element
			if (!roleItemView.nameEditBox) {
				roleItemView.nameEditBox = new dijit.InlineEditBox({
					editor: "dijit.form.TextBox",
					autoSave: true,
					disabled: false,
					editorParams: {
						required: true
					},
					onChange: function(newName) {
						this.set("disabled", true);
		
						// I can get the roleNode as follow:
						//		var roleNode = editBox.displayNode.parentNode;
						if (newName != "") {
							dojoXhr.post({
								url: core.js.base.controllers.ActionProvider.get("core_role_rename").url,
								content: {
									role_id: roleId,
									name: newName
								},
								handleAs: "json",
								load: function(data) {
									dojoTopic.publish("/app/global/notification", {
										message: that._i18n.role.rename[("APP_RESULT_OK" == data.result) ? "success" : "error"],
										type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
									});
								}
							});
						}
					}, 
					onCancel: function() {
						this.set("disabled", true);
					}
				}, roleItemView.getRoleNameNode());
			}
			roleItemView.nameEditBox.set("disabled", false);
			roleItemView.nameEditBox.startup();
			roleItemView.nameEditBox.edit();
		},
		
		searchRoles: function(/*Object*/ criteria) {
			// summary:
			//		Searches for roles
			this._helper.closeDialog();
			
			var that = this;
			dojoLang.mixin(this._roleSearchCriteria, criteria);
			var q = core.js.base.Encoder.encode(this._roleSearchCriteria);
			
			this._helper.showStandby();
			dojoXhr.post({
				url: core.js.base.controllers.ActionProvider.get("core_role_list").url,
				content: {
					q: q
				},
				load: function(data) {
					that._helper.hideStandby();
					that._roleListView.setContent(data);
				}
			});
		},
		
		setRolePermissions: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		Manages role's permissions
			// roleItemView:
			//		The selected role item
			var params = {
				role_id: roleItemView.getRole().role_id
			};
			var url = core.js.base.controllers.ActionProvider.get("core_rule_role").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showPane(url);
		},

		////////// MANAGE USERS //////////

		// _userToolbar: core.js.views.UserToolbar
		_userToolbar: null,
		
		// _userListView: core.js.views.UserListView
		_userListView: null,
		
		// _userContextMenu: core.js.views.UserContextMenu
		//		The context menu for each selected user
		_userContextMenu: null,
		
		// _searchCriteria: Object
		//	The search conditions including the following keys:
		//		- role_id: If of role that user belong to
		//		- keyword
		//		- page: Current index of page
		//		- per_page: The number of users per page
		//		- status
		_userSearchCriteria: {
			role_id: null,
			keyword: null,
			page: 1,
			per_page: 20,
			status: null
		},
		
		setUserListView: function(/*core.js.views.UserListView*/ userListView) {
			// summary:
			//		Sets the users list view
			this._userListView = userListView;
			
			var that = this;
			// Show the context menu when right-clicking on each user item
			dojoAspect.after(userListView, "onMouseDown", function(userItemView) {
				if (that._userContextMenu) {
					that._userContextMenu.show(userItemView);
				}
			}, true);
			
			// Update avatar handler
			dojoAspect.after(userListView, "onDropAvatar", dojoLang.hitch(this, "updateAvatar"), true);
			
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/list/onGotoPage", this, function(page) {
				this.searchUsers({
					page: page
				});
			});
			
			// Refresh list of users after creating new user
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/add/onSuccess", this, function(data) {
				this.searchUsers();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/delete/onSuccess", this, function(data) {
				// FIXME: Remove the user item without reloading
				this.searchUsers();
			});
			
			return this;	// core.js.controllers.UserController
		},
		
		setUserToolbar: function(/*core.js.views.UserToolbar*/ userToolbar) {
			// summary:
			//		Sets the user toolbar
			this._userToolbar = userToolbar;
			
			var that = this;
			// Add user handler
			dojoAspect.after(userToolbar, "onAddUser", dojoLang.hitch(this, "addUser"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/add/onCancel", this, function() {
				this._helper.removePane();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/add/onComplete", this, function(data) {
				this._helper.removePane();
				dojoTopic.publish("/app/global/notification", {
					message: this._i18n.user.add[("APP_RESULT_OK" == data.result) ? "success" : "error"],
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
				
				if ("APP_RESULT_OK" == data.result) {
					dojoTopic.publish("/app/core/user/add/onSuccess", data);
				}
			});
			
			// Refresh handler
			dojoAspect.after(userToolbar, "onRefresh", dojoLang.hitch(this, "searchUsers"));
			
			// Update page size handler
			dojoAspect.after(userToolbar, "onUpdatePageSize", function(perPage) {
				that.searchUsers({
					page: 1,
					per_page: perPage
				});
			}, true);
			
			// Search handler
			dojoAspect.after(userToolbar, "onSearchUser", function(keyword) {
				that.searchUsers({
					page: 1,
					keyword: keyword
				});
			}, true);
			
			return this;	// core.js.controllers.UserController
		},
		
		setUserContextMenu: function(/*core.js.views.UserContextMenu*/ userContextMenu) {
			// summary:
			//		Sets the user's context menu
			
			// Listen on context menu events
			// DOJO LESSON: Using the dojoAspect.after, all the events of the view
			// can be handled in a flexible way. 
			// The views do NOT need to care how their events can be handled and who are handlers.
			// Compare this with the old approaching:
			// - Attach a controller instance in view object:
			//		dojo.declare("core.js.views.UserContextMenu", null, {
			//			_controller: null,
			//			constructor: function(/*core.js.controllers.UserController*/ controller) {
			//				this._controller = controller;
			//			),
			//			...
			// - And use the controller instance to handle the events:
			//			...
			//			show: function(/*core.js.views.UserItemView*/ userItemView) {
			//				var that = this;
			//				this._contextMenu.addChild(new dijit.MenuItem({
			//					onClick: function() {
			//						that._controller.activateUser(userItemView);
			//					}
			//				});
			//			}
			//		});
			this._userContextMenu = userContextMenu;
			
			// It is possible to control menu items after showing the menu item
			this._userMediator.setUserContextMenu(userContextMenu);
			
			// Activate handler
			dojoAspect.after(userContextMenu, "onActivateUser", dojoLang.hitch(this, "activateUser"), true);
			
			// Edit handler
			dojoAspect.after(userContextMenu, "onEditUser", dojoLang.hitch(this, "editUser"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/edit/onCancel", this, function() {
				this._helper.removePane();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/edit/onComplete", this, function(data) {
				this._helper.removePane();
				dojoTopic.publish("/app/global/notification", {
					message: this._i18n.user.edit[("APP_RESULT_OK" == data.result) ? "success" : "error"],
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
				
				if ("APP_RESULT_OK" == data.result) {
					dojoTopic.publish("/app/core/user/edit/onSuccess", data);
					this.searchUsers();
				}
			});
			
			// Delete handler
			dojoAspect.after(userContextMenu, "onDeleteUser", dojoLang.hitch(this, "deleteUser"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/delete/onCancel", this, function() {
				this._helper.closeDialog();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/delete/onComplete", this, function(data) {
				this._helper.closeDialog();
				dojoTopic.publish("/app/global/notification", {
					message: this._i18n.user["delete"][("APP_RESULT_OK" == data.result) ? "success" : "error"],
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
				
				if ("APP_RESULT_OK" == data.result) {
					dojoTopic.publish("/app/core/user/delete/onSuccess", data);
				}
			});
			
			// Set permissions handler
			dojoAspect.after(userContextMenu, "onSetUserPermissions", dojoLang.hitch(this, "setUsersPermissions"), true);
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/rule/user/onCancel", this, function() {
				this._helper.removePane();
			});
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/rule/user/onComplete", this, function(data) {
				this._helper.removePane();
				dojoTopic.publish("/app/global/notification", {
					message: this._i18n.rule.user[("APP_RESULT_OK" == data.result) ? "success" : "error"],
					type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
				});
			});
			
			return this;	// core.js.controllers.UserController
		},
		
		initSearchCriteria: function(/*Object*/ criteria) {
			// summary:
			//		Inits the controls based on given criteria
			dojoLang.mixin(this._userSearchCriteria, criteria);
			this._userToolbar.initSearchCriteria(this._userSearchCriteria);
		},
		
		activateUser: function(/*core.js.views.UserItemView*/ userItemView) {
			// summary:
			//		Activates or deactivates user
			// userItemView:
			//		The selected user item
			var userId = userItemView.getUser().user_id;
			var status = userItemView.getUser().status;
			
			var that   = this;
			dojoXhr.post({
				url: core.js.base.controllers.ActionProvider.get("core_user_activate").url,
				content: {
					user_id: userId
				},
				handleAs: "json",
				load: function(data) {
					var message = ("APP_RESULT_OK" == data.result) 
								? (status == "activated" ? "deactivateSuccess" : "activateSuccess")
								: (status == "activated" ? "deactivateError" : "activateError");
					dojoTopic.publish("/app/global/notification", {
						message: that._i18n.user.activate[message],
						type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
					});
					
					if ("APP_RESULT_OK" == data.result) {
						var newStatus = (status == "activated") ? "not_activated" : "activated";
						userItemView.getUser().status = newStatus;
						
						if (that._userSearchCriteria.status) {
							that._userListView.removeUserItemView(userItemView);
						}
						
						dojoTopic.publish("/app/core/user/activate/onSuccess", {
							oldStatus: status,
							newStatus: newStatus
						});
					}
				}
			});
		},
		
		addUser: function() {
			// summary:
			//		Adds new user
			var url = core.js.base.controllers.ActionProvider.get("core_user_add").url;
			this._helper.showPane(url);
		},
		
		deleteUser: function(/*core.js.views.UserItemView*/ userItemView) {
			// summary:
			//		Deletes given user
			// userItemView:
			//		The selected user item
			var params = {
				user_id: userItemView.getUser().user_id
			};
			var url = core.js.base.controllers.ActionProvider.get("core_user_delete").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showDialog(url, {
				id: "coreUserDeleteConfirmDialog",
				title: this._i18n.user["delete"].title,
				style: "width: 250px",
				refreshOnShow: true
			});
		},
		
		editUser: function(/*core.js.views.UserItemView*/ userItemView) {
			// summary:
			//		Edits user's information
			// userItemView:
			//		The selected user item
			var params = {
				user_id: userItemView.getUser().user_id
			};
			var url = core.js.base.controllers.ActionProvider.get("core_user_edit").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showPane(url);
		},
		
		searchUsers: function(/*Object*/ criteria) {
			// summary:
			//		Searches for users
			var that = this;
			
			// DOJO LESSON: How I love dojoLang.mixin
			dojoLang.mixin(this._userSearchCriteria, criteria);
			
			var q   = core.js.base.Encoder.encode(this._userSearchCriteria);
			var url = core.js.base.controllers.ActionProvider.get("core_user_list").url;
			dojo.hash("u=" + url + "/?q=" + q);
			
			this._helper.showStandby();
			dojoXhr.post({
				url: url,
				content: {
					q: q,
					format: "html"
				},
				load: function(data) {
					that._helper.hideStandby();
					that._userListView.setContent(data);
				}
			});
		},
		
		setUsersPermissions: function(/*core.js.views.UserItemView*/ userItemView) {
			// summary:
			//		Manages user's permissions
			// userItemView:
			//		The selected user item
			var params = {
				user_id: userItemView.getUser().user_id
			};
			var url = core.js.base.controllers.ActionProvider.get("core_rule_user").url + "?" + dojoIoQuery.objectToQuery(params);
			this._helper.showPane(url);
		},
		
		updateAvatar: function(/*core.js.views.UserItemView*/ userItemView, /*String*/ avatarUrl) {
			// summary:
			//		Updates user's avatar
			var that = this;
			dojoXhr.post({
				url: core.js.base.controllers.ActionProvider.get("core_user_avatar").url,
				content: {
					user_id: userItemView.getUser().user_id,
					url: avatarUrl
				},
				handleAs: "json",
				load: function(data) {
					dojoTopic.publish("/app/global/notification", {
						message: that._i18n.user.avatar[("APP_RESULT_OK" == data.result) ? "success" : "error"],
						type: ("APP_RESULT_OK" == data.result) ? "message" : "error"
					});
					if ("APP_RESULT_OK" == data.result) {
						userItemView.updateAvatar(avatarUrl);
					}
				}
			});
		},
		
		////////// STATUS FILTER //////////
		
		// _statusListView: core.js.views.StatusListView
		_statusListView: null,
		
		setStatusListView: function(/*core.js.views.StatusListView*/ statusListView) {
			// summary:
			//		Sets the status list view
			this._statusListView = statusListView;
			
			var that = this;
			// Filter users by status
			dojoAspect.after(statusListView, "onStatusSelected", function(status) {
				that.searchUsers({
					status: status
				});
			}, true);
			
			// Update users counter after creating new user
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/add/onSuccess", this, function(data) {
				statusListView.increaseUserCounter(data.status, 1);
			});
			// after updating user's status
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/activate/onSuccess", this, function(data) {
				statusListView.increaseUserCounter(data.oldStatus, -1);
				statusListView.increaseUserCounter(data.newStatus, 1);
			});
			// after removing user
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/app/core/user/delete/onSuccess", this, function(data) {
				statusListView.increaseUserCounter(data.status, -1);
			});
			
			dojoAspect.after(statusListView, "onUpdateStatus", dojoLang.hitch(this, "updateStatus"), true);
			
			return this;	// core.js.controllers.UserController
		},
		
		updateStatus: function(/*String*/ status, /*DomNode[]*/ userNodes) {
			// summary:
			//		Called when moving user items to a status item
			if (this._userSearchCriteria.status == status) {
				return;
			}
			
			this._helper.showStandby();
			while (userNodes.length > 0) {
				var user = core.js.base.Encoder.decode(dojoDomAttr.get(userNodes[0], "data-app-entity-props"));
				var userItemView = this._userListView.getUserItemView(user.user_id);
				if (userItemView && user.status) {
					if (userItemView.getUser().status != status) {
						this.activateUser(userItemView);
					}
				}
				userNodes.splice(0, 1);
			}
			
			if (userNodes.length == 0) {
				this._helper.hideStandby();
			}
		},
		
		////////// HANDLE TOPICS //////////
		
		moveUsers: function(/*core.js.views.RoleItemView*/ roleItemView, /*DomNode[]*/ userNodes) {
			// summary:
			//		Use when moving an user to another group
			var role		= roleItemView.getRole();
			
			// Get name of target role
			// FIXME: Move this method to core.js.views.RoleItemView class to get the role description
			var newRoleName = dojo.query(".coreRoleLabel", roleItemView.getDomNode())[0].innerHTML;
			
			var that = this;
			var url  = core.js.base.controllers.ActionProvider.get("core_user_move").url;
			
			this._helper.showStandby();
			while (userNodes.length > 0) {
				var userNode = userNodes[0];
				var user	 = core.js.base.Encoder.decode(dojoDomAttr.attr(userNode, "data-app-entity-props"));
				
				if (user.role_id != role.role_id) {
					dojoXhr.post({
						url: url,
						content: {
							user_id: user.user_id,
							role_id: role.role_id
						},
						handleAs: "json",
						load: function(data) {
							if ("APP_RESULT_OK" == data.result) {
								dojoTopic.publish("/app/global/notification", {
									message: dojox.string.sprintf(that._i18n.user.move.success, user.user_name, newRoleName),
									type: "message"
								});
								
								// Remove user item from the list
								if (that._userSearchCriteria.role_id && that._userSearchCriteria.role_id != data.new_role_id) {
									that._userListView.removeUserItemView(data.user_id);
								}
								
								dojoTopic.publish("/app/core/user/move/onSuccess", data);
							}
						}
					});
				}
				
				userNodes.splice(0, 1);
			}
			
			if (userNodes.length == 0) {
				this._helper.hideStandby();
			}
		}
	});
});
