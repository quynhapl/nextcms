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
	"dojo/dom-class",
	"dojo/on",
	"dojo/NodeList-dom",
	"dojo/query"
], function(dojoDeclare, dojoDom, dojoDomAttr, dojoDomClass, dojoOn) {
	return dojoDeclare("core.js.views.UserStatusListView", null, {
		// _id: String
		_id: null,
		
		// _domNode: DomNode
		_domNode: null,
		
		constructor: function(/*String*/ id) {
			this._id	  = id;
			this._domNode = dojoDom.byId(id);
			
			this._init();
		},

		_init: function() {
			var that = this;
			dojo.query(".coreStatusLabel", this._domNode).forEach(function(node, index, attr) {
				dojoOn(node, "click", function(e) {
					dojo.query(".coreStatusItemSelected", that._domNode).removeClass("coreStatusItemSelected");
					dojoDomClass.add(node.parentNode, "coreStatusItemSelected");
					
					var status = dojoDomAttr.get(this, "data-app-status");
					if ("" == status) {
						status = null;
					}
					that.onStatusSelected(status);
				});
			});
			
			// Allow to drag and drop articles to the status item to update status
			if (core.js.base.controllers.ActionProvider.get("core_user_activate").isAllowed) {
				dojo.query("li", this._domNode).forEach(function(node) {
					var statusNode = dojo.query("a.coreStatusLabel", node)[0];
					var status	   = dojoDomAttr.get(statusNode, "data-app-status");
					
					if (status != "") {
						new dojo.dnd.Target(node, {
							accept: ["coreUserItemDnd"],
							onDropExternal: function(source, nodes, copy) {
								that.onUpdateStatus(status, nodes);
							}
						});
					}
				});
			}
		},
		
		increaseUserCounter: function(/*String*/ status, /*Integer*/ increasingNumber) {
			this._updateUserCounter(status, increasingNumber);
			
			// Update the counter of "View all" node
			this._updateUserCounter("", increasingNumber);
		},
		
		_updateUserCounter: function(/*String*/ status, /*Integer*/ increasingNumber) {
			var statusItemNodes = dojo.query('.coreStatusLabel[data-app-status="' + status + '"]', this._domNode);
			if (statusItemNodes.length > 0) {
				var counterNode = dojo.query(".coreStatusUserCounter", statusItemNodes[0].parentNode)[0];
				var numUsers	= parseInt(counterNode.innerHTML);
				counterNode.innerHTML = numUsers + increasingNumber;
			}
		},
		
		////////// CALLBACKS //////////
		
		onStatusSelected: function(/*String?*/ status) {
			// tags:
			//		callback
		},
		
		onUpdateStatus: function(/*String*/ status, /*DomNode[]*/ userNodes) {
			// tags:
			//		callback
		}
	});
});
