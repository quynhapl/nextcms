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
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/dom-construct",
	"dojo/query",
	"dijit/registry",
	"core/js/views/RoleItemView"
], function(dojoDeclare, dojoDom, dojoDomAttr, dojoDomConstruct) {
	return dojoDeclare("core.js.views.RoleListView", null, {
		// _id: String
		//		Id of the DomNode
		_id: null,
		
		// _domNode: DomNode
		//		The DomNode of role list
		_domNode: null,
		
		// _roleIdViewHash: Object
		_roleIdViewHash: {},

		constructor: function(/*String*/ id) {
			this._id	  = id;
			this._domNode = dojoDom.byId(id);
			
			this._init();
		},
		
		_init: function() {
			// Loop over the list of child nodes
			// There is other approach. Use delegate() methods, we can set these 
			// handlers for all available and future nodes (like live() method in jQuery)
			//		dojo.addOnLoad(function() {
			// 			dojo.query("#" + this._id)
			//				.delegate(".coreRoleItem", "oncontextmenu", function(e) {...})
			//				.delegate(".coreRoleItem", "onmousedown", function(e) {...})
			//				.delegate(".coreRoleItem", "onclick", function(e) {...});
			//		});
			var that = this;
			dojo.query(".coreRoleItem", this._id).forEach(function(node, index, arr) {
				var roleItemView = new core.js.views.RoleItemView(node, that);
				that._roleIdViewHash[roleItemView.getRole().role_id + ""] = roleItemView;
			});
		},
		
		getDomNode: function() {
			return this._domNode;	// DomNode
		},
		
		setContent: function(/*String*/ html) {
			dijit.registry.byId(this._id).set("content", html);
			this._init();
		},
		
		addRoleItem: function(/*String*/ itemHtml) {
			// summary:
			//		This method is used when adding new role item to the list without refreshing the list.
			//		It is not used at the moment.
			// DOJO LESSON: I want to update the HTML content of node, but I will lost all the event handlers 
			// for role item, such as the context menu. The following methods do not help:
			// 1)	this._domNode.innerHTML += itemHtml;
			//		dojo.parser.parse(this._id);
			// 2) 	dijit.byId(this._id).setContent(dijit.byId(this._id).attr("content") + itemHtml);
			// 3) Also, there is not outterHTML attribute:
			//		var node = dojo.create("li", { outterHTML: itemHtml }, this._id, "last");
			
			// This is best way
			var div	= dojoDomConstruct.create("div", {
				innerHTML: itemHtml,
				style: "display: 'none'"
			}, dojo.body());
			
			var roleNode = dojo.query(".coreRoleItem", div)[0];
			dojoDomConstruct.place(dojoDomAttr.get(roleNode, "id"), this._id, "last");
			dojoDomConstruct.destroy(div);
			
			var roleItemView = new core.js.views.RoleItemView(roleNode, this);
			roleItemView.init();
			
			return roleItemView;	// core.js.views.RoleItemView
		},
		
		getRoleItemView: function(/*String*/ roleId) {
			// summary:
			//		Returns the role item view by given role's Id
			if (!this._roleIdViewHash[roleId + ""]) {
				return null;	// null
			}
			return this._roleIdViewHash[roleId + ""];	// core.js.view.RoleItemView
		},
		
		removeRoleItem: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		Removes an item from list
			var roleId = roleItemView.getRole().role_id;
			if (this._roleIdViewHash[roleId + ""]) {
				delete this._roleIdViewHash[roleId + ""];
			}
			dojoDomConstruct.destroy(roleItemView.getDomNode());
		},
		
		increaseUserCounter: function(/*String*/ roleId, /*Integer*/ increasingNumber) {
			if (!this._roleIdViewHash[roleId + ""]) {
				return;
			}
			var roleItemView = this._roleIdViewHash[roleId + ""];
			roleItemView.increaseUserCounter(increasingNumber);
		},
		
		////////// CALLBACKS //////////
		
		onClickRole: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		Called when user click a role item
			// roleItemView:
			//		The selected role item
			// tags:
			//		callback
		},
		
		onDropUsers: function(/*core.js.views.RoleItemView*/ roleItemView, /*DomNode[]*/ userNodes) {
			// tags:
			//		callback
		},
		
		onMouseDown: function(/*core.js.views.RoleItemView*/ roleItemView) {
			// summary:
			//		Called when user right-click a role item
			// roleItemView:
			//		The selected role item
			// tags:
			//		callback
		}
	});
});
