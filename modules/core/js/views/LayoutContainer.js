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
 * @version		2012-07-25
 */

define([
    "dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/xhr",
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/io-query",
	"dojo/json",
	"dojo/on",
	"dojo/topic",
	"dojo/dnd/Source",
	"dojo/NodeList-traverse",
	"dojo/parser",
	"dojo/query",
	"dijit/form/CheckBox",
	"dijit/layout/BorderContainer",
	"dijit/layout/ContentPane",
	"dijit/layout/TabContainer",
	"dijit/registry",
	"dojox/layout/ContentPane",
	"dojox/layout/GridContainer",
	"dojox/mdnd/adapter/DndFromDojo",		// DOJO LESSON: Include this to allow drag and drop elements to a grid container
	"dojox/mdnd/AreaManager",
	"dojox/widget/Portlet",
	"core/js/base/controllers/ActionProvider",
	"core/js/base/controllers/Subscriber",
	"core/js/base/Encoder",
	"core/js/base/I18N",
	"core/js/LayoutConstant",
	"core/js/views/LayoutContainerManager",
	"core/js/views/LayoutPortlet"
], function(dojoArray, dojoDeclare, dojoLang, dojoXhr, dojoDom, dojoDomAttr, dojoDomClass, dojoDomConstruct, dojoDomStyle, dojoIoQuery, dojoJson, dojoOn, dojoTopic) {
	return dojoDeclare("core.js.views.LayoutContainer", null, {
		// _id: String
		_id: null,
		
		// _i18n: Object
		_i18n: null,
		
		// _acceptLayoutContainerClasses: String
		_acceptLayoutContainerClasses: [ "coreHooksLayoutItemDnd" ],
		
		// _acceptWidgetClasses: String
		_acceptWidgetClasses: [ "coreHooksLayoutWidgetDnd", "dojox.widget.Portlet", "dijit.layout.TabContainer", "dijit.layout.ContentPane" ],
		
		// _dndSources: Object
		_dndSources: {},
		
		// _defaultRegions: Object
		_defaultRegions: {
			top: "height: 20%",
			left: "width: 20%",
			center: "width: 60%",
			right: "width: 20%",
			bottom: "height: 20%"
		},
		
		// _selectedContainer: dijit.layout.BorderContainer
		_selectedContainer: null,
		
		// _layoutData: Object
		_layoutData: null,
		
		// _showPortletOutput: Boolean
		_showPortletOutput: true,
		
		// TOPIC_GROUP: [const] String
		TOPIC_GROUP: "/core/js/views/LayoutContainer",
		
		constructor: function(/*String*/ id) {
			this._id = id;
			// The "appLayoutContainer" class is used to find the container node
			dojoDomClass.add(id, "appLayoutContainer");
			
			core.js.base.controllers.Subscriber.unsubscribe(this.TOPIC_GROUP);
			
			core.js.base.I18N.requireLocalization("core/languages");
			this._i18n = core.js.base.I18N.getLocalization("core/languages");
			
			// Registry the container, so I can get it later
			core.js.views.LayoutContainerManager.add(this);
		},
		
		getId: function() {
			// summary:
			//		Gets the container Id
			return this._id;	// String
		},
		
		setShowPortletOutput: function(/*Boolean*/ showPortletOutput) {
			// summary:
			//		Indicates the portlet's ouput will be shown or not
			// showPortletOutput:
			//		If TRUE, shows the portlet's output
			this._showPortletOutput = showPortletOutput;
			return this;	// core.js.views.LayoutContainer
		},
		
		////////// MANAGE BORDER CONTAINERS //////////
		
		addBorderContainer: function(/*dijit.layout.BorderContainer*/ container, /*String*/ region) {
			// summary:
			//		Adds border container to selected border container
			// container:
			//		The selected container
			// region:
			//		The position the new container will be placed.
			//		Can be "top", "bottom", "left", "right" or "center"
			var regions		= {};
			regions[region]	= this._defaultRegions[region];
			
			// Check if there is border container at the "center" region
			var children = container.getChildren();
			var found    = false;
			if (children) {
				for (var i in children) {
					if ("center" == children[i].region) {
						found = true;
						break;
					}
				}
			}
			
			// There is not "center" region, I have to add new "center" container
			if (!found) {
				regions["center"] = this._defaultRegions["center"];
			}
			
			return this.addBorderContainers(container, regions)[region];	// dijit.layout.BorderContainer
		},
		
		addBorderContainers: function(/*dijit.layout.BorderContainer*/ container, /*Array*/ regions) {
			// summary:
			//		Adds multiple border containers in various region to given container
			// container:
			//		The selected container
			// regions:
			//		Array of regions. Each region can be "top", "bottom", "left", "right" or "center"
			if (!dojoLang.isObject(regions) || regions.length == 0) {
				return;
			}
			
			// Remove border from the container
			dojoDomStyle.set(container.domNode, "border", "none");
			dojoDomClass.remove(container.domNode, "appLayoutBorderContainer");
			
			var children = {};
			
			var self = this;
			for (var region in regions) {
				var regionStyle = regions[region] || this._defaultRegions[region];
				var childContainer = new dijit.layout.BorderContainer({
					region: region,
					style: regionStyle,
					splitter: true,
					gutters: true,
					"class": "appLayoutBorderContainer",
					_data: {
						"region": region,
						style: regionStyle
					}
				});
				container.addChild(childContainer);
				children[region] = childContainer;
				
				// Allow to drag the container and drop to the child container
				// FIXME: It does not work smoothly
				var dndSource = new dojo.dnd.Source(childContainer.domNode, {
					isSource: false,
					accept: this._acceptLayoutContainerClasses,
					onDropExternal: function(source, nodes, copy) {
						var regions = core.js.base.Encoder.decode(dojoDomAttr.get(source.node, "data-app-entity-props"));
						self.addBorderContainers(dijit.registry.byNode(this.node), regions);
					}
				});
				this._dndSources[childContainer.id] = dndSource;
			}
			
			// Since Dojo does not support nested targets,
			// I have to destroy Source object associating parent container
			this._disableDnd(container);
			
			dojoTopic.publish("/app/core/views/LayoutContainer/addBorderContainers_" + this._id, {
				container: container,
				regions: regions,
				children: children
			});
			
			// Return the array of child containers
			return children;	// dijit.layout.BorderContainer[]
		},
		
		deleteBorderContainer: function(/*dijit.layout.BorderContainer*/ container) {
			// summary:
			//		Deletes given border container
			// container:
			//		The selected container to delete
			// Delete the Dnd object
			if (this._dndSources[container.id]) {
				this._dndSources[container.id].destroy();
			}
			
			var parent = dijit.registry.byNode(container.domNode.parentNode); 
			if (parent) {
				parent.removeChild(container);
			}
			container.destroyRecursive();
			
			// Add border to the parent container if it has no children
			if (parent.getChildren().length == 0) {
				dojoDomClass.add(parent.domNode, "appLayoutBorderContainer");
			}
			
			dojoTopic.publish("/app/core/views/LayoutContainer/deleteBorderContainer_" + this._id, container);
		},
		
		setLayoutDesign: function(/*dijit.layout.BorderContainer*/ container, /*String*/ design) {
			// summary:
			//		Sets the type of layout design to given border container
			// container:
			//		The border container
			// design:
			//		Can be "headline" or "sidebar"
			if (container instanceof dijit.layout.BorderContainer) {
				container.set("design", design);
				container.layout();
			}
		},
		
		////////// MANAGE GRID CONTAINERS //////////	
		
		addGridContainer: function(/*dijit.layout.BorderContainer|dijit.layout.TabContainer*/ container, /*Object?*/ settings) {
			// summary:
			//		Adds a grid container to given border or tab container
			// container:
			//		The selected border container
			// settings:
			//		The grid container settings, which are defined by dojox.layout.GridContainer
			settings = dojoLang.mixin({
				region: "center",
				nbZones: 1,
				hasResizableColumns: true,
				// doLayout: false,
				// Note that the 'dndType' attributes are the same as those in the 
				// 'acceptTypes' attribute of the GridContainer.
				// These do NOT have to match to the widget type name.
				acceptTypes: this._acceptWidgetClasses,
				style: "height: 100%; width: 100%",
				title: this._i18n.page._share.title,
				"class": "appLayoutGridContainer"
			}, settings);
			var gridContainer = new dojox.layout.GridContainer(settings);
			container.addChild(gridContainer);
			container.resize();
			
			// Disable DnD operations of the border container
			this._disableDnd(container);
			
			dojoTopic.publish("/app/core/views/LayoutContainer/addGridContainer_" + this._id, {
				container: container,
				settings: settings,
				grid: gridContainer
			});
			
			return gridContainer;	// dojox.layout.GridContainer
		},
		
		deleteGridContainer: function(/*dojox.layout.GridContainer*/ container) {
			// summary:
			//		Deletes given grid container
			// container:
			//		The selected container to delete
			var parent = container.getParent();
			if ((parent instanceof dijit.layout.BorderContainer) || (parent instanceof dijit.layout.TabContainer)) {
				parent.removeChild(container);
				container.destroyRecursive();
				
				dojoTopic.publish("/app/core/views/LayoutContainer/deleteGridContainer_" + this._id, container);
			}
		},
		
		setGridColumns: function(/*dojox.layout.GridContainer*/ container, /*Integer*/ numColumns) {
			// summary:
			//		Sets the number of columns to given grid container
			// container:
			//		The selected grid container
			// numColumns:
			//		The number of columns
			if (container instanceof dojox.layout.GridContainer) {
				container.setColumns(numColumns);
				container.resize();
			}
		},	
		
		////////// MANAGE TAB CONTAINERS //////////
		
		activateTabContainer: function(/*dojox.layout.GridContainer*/ container) {
			// summary:
			//		Activates given grid container. Set it as the selected among of tabs
			//		that belong to the same tab container
			// Get the tab container
			var tabContainer = container.getParent();
			if (tabContainer instanceof dijit.layout.TabContainer) {
				tabContainer.selectChild(container);
				tabContainer.set("appSelectedIndex", tabContainer.getIndexOfChild(container));
				
				dojoTopic.publish("/app/core/views/LayoutContainer/activateTabContainer_" + this._id, {
					container: container,
					tabContainer: tabContainer
				});
			}
		},
		
		addTabContainer: function(/*dijit.layout.BorderContainer|dojox.layout.GridContainer*/ container, /*Integer?*/ zoneIndex, /*Integer?*/ portletIndex) {
			// summary:
			//		Adds tab container to given border container or zone in a grid container
			var tabContainer = null;
			switch (true) {
				case (container instanceof dijit.layout.BorderContainer):
					// Don't add tab container if the border container has children
					var children = container.getChildren();
					if (!children || children.length == 0) {
						var tabContainer = new dijit.layout.TabContainer({
							region: "center"
						});
						container.addChild(tabContainer);
						container.resize();
					}
					break;
				case (container instanceof dojox.layout.GridContainer):
					var width = parseInt(dojoDomStyle.get(container.domNode, "width"));
					width = width / container.get("nbZones");
		
					var tabContainer = new dijit.layout.TabContainer({
						style: "height: 150px; width: " + width + "px",
						dndType: "dijit.layout.TabContainer"
					});
					container.addChild(tabContainer, zoneIndex, portletIndex);
					container.resize();
		
					dojoOn(container, "setColumns", function(numColumns) {
						var width = parseInt(dojoDomStyle.get(container.domNode, "width")) / numColumns;
						dojoDomStyle.set(tabContainer.domNode, "width", width + "px");
					});
					break;
			}
			
			if (tabContainer) {
				dojoDomClass.add(tabContainer.domNode, core.js.LayoutConstant.PORTLET_CONTAINER_CLASS);
				tabContainer.set("indices", {
					grid: container,
					zoneIndex: zoneIndex,
					portletIndex: portletIndex
				});
				
				dojoTopic.publish("/app/core/views/LayoutContainer/addTabContainer_" + this._id, {
					container: container,
					tabContainer: tabContainer,
					zoneIndex: zoneIndex,
					portletIndex: portletIndex
				});
			}
			
			return tabContainer;	// dijit.layout.TabContainer
		},	
		
		deleteTabContainer: function(/*dijit.layout.TabContainer*/ container) {
			// summary:
			//		Deletes given tab container
			if (!container || !(container instanceof dijit.layout.TabContainer)) {
				return;
			}
			var parent = container.getParent();
			if ((parent instanceof dijit.layout.BorderContainer) || (parent instanceof dojox.layout.GridContainer)) {
				parent.removeChild(container);
				container.destroyRecursive();
				dojoTopic.publish("/app/core/views/LayoutContainer/deleteTabContainer_" + this._id, container);
			}
		},
		
		////////// MANAGE MAIN CONTENT CONTAINER //////////
		
		addMainContentPane: function(/*dijit.layout.BorderContainer|dojox.layout.GridContainer*/ container, /*Integer?*/ zoneIndex, /*Integer?*/ portletIndex) {
			// summary:
			//		Adds a pane that shows the main content
			// container:
			//		The border or grid container instance
			// zoneIndex:
			//		Index of zone that the main content pane will be added to
			// portletIndex:
			//		Index of main content container in zone
			var pane = new dijit.layout.ContentPane({
				region: "center",
				style: "height: 150px; width: 97%; position: relative",
				content: '<div class="appCenter"><div>' + this._i18n.page._share.mainContent + "</div></div>"
			});
			switch (true) {
				case (container instanceof dijit.layout.BorderContainer):
					// Don't add main content pane if the border container has children
					var children = container.getChildren();
					if (!children || children.length == 0) {
						container.addChild(pane);
					}
					break;
				case (container instanceof dojox.layout.GridContainer):
					pane.set("dndType", "dijit.layout.ContentPane");
					container.addChild(pane, zoneIndex, portletIndex);
					break;
			}
			
			dojoDomClass.add(pane.domNode, ["appBorderContainer", "appMainContentPane", core.js.LayoutConstant.PORTLET_CONTAINER_CLASS]);
			
			// Because dijit.layout.ContentPane does not have the getParent() method,
			// I have to set the parent to get it later when removing the pane from its container
			pane.set("appParent", container);
			
			pane.set("indices", {
				grid: container,
				zoneIndex: zoneIndex,
				portletIndex: portletIndex
			});
			
			dojoTopic.publish("/app/core/views/LayoutContainer/addMainContentPane_" + this._id, {
				container: container,
				contentPane: pane,
				zoneIndex: zoneIndex,
				portletIndex: portletIndex
			});
			
			return pane;	// dijit.layout.ContentPane
		},
		
		deleteMainContentPane: function() {
			// summary:
			//		Deletes main content pane
			var pane = this.getMainContentPane();
			if (pane) {
				// Get the parent container via "appParent" attribute which is set
				// in the addMainContentPane() method
				var parent = pane.get("appParent");
				parent.removeChild(pane);
				pane.destroyRecursive();
				
				dojoTopic.publish("/app/core/views/LayoutContainer/deleteMainContentPane_" + this._id, pane);
			}
		},
		
		getMainContentPane: function() {
			// summary:
			//		Gets the main content pane
			var nodes = dojo.query(".appMainContentPane", this._id);
			return (nodes.length == 0) ? null : dijit.registry.byNode(nodes[0]); // dijit.layout.ContentPane
		},
		
		////////// MANAGE PORTLETS //////////
		
		addPortlet: function(/*dojox.layout.GridContainer|DomNode*/ container, /*Object*/ widget, /*Integer*/ zoneIndex, /*Integer*/ portletIndex, /*Boolean*/ showSettings) {
			// summary:
			//		Adds portlet to given grid container
			// container:
			//		Grid container
			// widget:
			//		The widget data, consists of the following keys:
			//		- title
			//		- module
			//		- name
			//		- params: Array of widget's parameters in pairs of name: value
			// zoneIndex:
			//		Index of zone that the portlet will be added to
			// portletIndex:
			//		Index of portlet in zone
			// showSettings:
			//		If TRUE, shows the portlet's settings
			var url	= core.js.base.controllers.ActionProvider.get("core_extension_render").url, params;
			
			// Create new portlet widget
			var portlet = new core.js.views.LayoutPortlet({
				title: widget.title,
				closable : true,
				dndType: "dojox.widget.Portlet",
				loadingMessage: "<div style='text-align: center'><span class='dijitContentPaneLoading'>" + this._i18n.global._share.loadingAction + "</span></div>",
				_widget: widget		// To get the widget data later
			});
			portlet.startup();
			
			switch (true) {
				case (container instanceof dojox.layout.GridContainer):
					container.addChild(portlet, zoneIndex, portletIndex);
					break;
				case (container instanceof HTMLDivElement):
					portlet.placeAt(container);
					break;
				default:
					break;
			}
			
			dojoDomClass.add(portlet.domNode, core.js.LayoutConstant.PORTLET_CONTAINER_CLASS);
			portlet.set("indices", {
				grid: container,
				zoneIndex: zoneIndex,
				portletIndex: portletIndex
			});
			
			// Portlet settings
			var portletSettings = new dojox.widget.PortletSettings({});
			dojoDomAttr.set(portletSettings.domNode, "_display", "none");
			var pane = new dojox.layout.ContentPane({
				region: "center",
				loadingMessage: "<div style='text-align: center'><span class='dijitContentPaneLoading'>" + this._i18n.global._share.loadingAction + "</span></div>"
			}).placeAt(portletSettings.domNode);
			portletSettings.addChild(pane);
			
			var self = this;
			dojoOn(portletSettings, "toggle", function() {
				var display = dojoDomStyle.get(portletSettings.domNode, "display");
				if ("block" == display) {
					pane.set("preload", true);
					
					// The parameters to build the URL which renders the widget's configuration
					params = {
						_type: "widget",
						_mod: widget.module,
						_name: widget.name,
						_method: "config",
						_ajax: true,
						noTheming: true,	// See Core_Base_Extension::PARAM_NO_THEMING
					};
					
					// The following approach cannot work if the widget.params contains
					// at least one parameter that is too long.
					// It makes the request URI too long
					//		pane.set("href", url + "?" + dojoIoQuery.objectToQuery(dojoLang.mixin(params, widget.params)));
					//		var self = this;
					//		dojoOn(pane, "downloadEnd", function() {
					//			dojoTopic.publish("/app/global/onLoadComplete", [ url ]);
					// 			// Fix the issue: If there are tab containers side the pane
					//			// the portlet does not show the content of selected tab
					// 			// until I click on a tab title
					//			self._activateTabInsidePortlet(pane);
					//
					//			// Init the config fields if their values are defined
					//			self._loadWidgetParams(pane, widget);
					//		});
					dojoXhr.post({
						url: url,
						content: dojoLang.mixin(params, widget.params),
						load: function(data) {
							pane.set("content", data);
							dojoTopic.publish("/app/global/onLoadComplete", url);
							self._activateTabInsidePortlet(pane);
							self._loadWidgetParams(pane, widget);
						}
					});
					
					pane.set("appPortlet", portlet);
					
					// Don't reload at the next time
					pane.set("preload", false);
				}
			});
			
			if (this._showPortletOutput) {
				// The parameters to build the URL which renders the widget
				params = {
					_type: "widget",
					_mod: widget.module,
					_name: widget.name,
					_method: "show",
					_ajax: true
				};
				
				// Does not work if widget.params contains a parameter that is too long 
				portlet.set("href", url + "?" + dojoIoQuery.objectToQuery(dojoLang.mixin(params, widget.params)));
		 		dojoOn(portlet, "downloadend", function() {
					if (showSettings) {
		 				// Add the portlet settings
						self.addChild(portletSettings);
						portletSettings.toggle();
					}
				});
				/*
				dojoXhr.post({
					url: url,
					content: dojoLang.mixin(params, widget.params),
					load: function(data) {
						porlet.set("content", data);
						if (showSettings) {
							porlet.addChild(portletSettings);
							portletSettings.toggle();
						}
					}
				});
				*/
			} else if (showSettings) {
				// Hide the container showing widget output
				dojoDomStyle.set(portlet.containerNode, "display", "none");
				
				portlet.addChild(portletSettings);
				portletSettings.toggle();
			}
			
			// Remove the portlet if user click on the Close (x) icon
			dojoOn(portlet, "close", function() {
				dojoTopic.publish("/app/core/views/LayoutContainer/closePortlet_" + self._id, {
					container: container,
					portlet: portlet,
					widget: widget,
					zone_index: zoneIndex,
					portlet_index: portletIndex
				});
				container.removeChild(portlet);
				portlet.destroyRecursive();
			});
			
			dojoTopic.publish("/app/core/views/LayoutContainer/addPortlet_" + this._id, {
				container: container,
				portlet: portlet,
				widget: widget,
				zone_index: zoneIndex,
				portlet_index: portletIndex
			});
			
			return portlet;		// core.js.views.LayoutPortlet
		},
		
		_activateTabInsidePortlet: function(/*dojox.layout.ContentPane*/ pane) {
			// summary:
			//		Activate the tab that is set as selected
			dojo.query(".dijitTabContainer", pane.domNode).forEach(function(node) {
				var tabContainer = dijit.registry.byNode(node);
				if (tabContainer) {
					// Get the tab that is set as selected
					var children	= tabContainer.getChildren();
					var selectedTab = null;
					if (children && children.length > 0) {
						for (var i in children) {
							if (children[i].selected) {
								selectedTab = children[i];
								break;
							}
						}
						// If there is no tab that is set as selected one,
						// the first tab will be choosen
						if (selectedTab == null) {
							selectedTab = children[0];
						}
						tabContainer.selectChild(selectedTab);
						dojoDomClass.remove(selectedTab.domNode, "dijitHidden");
						dojoDomClass.add(selectedTab.domNode, "dijitVisible");
					}
				}
			});
		},
		
		collapsePortlets: function(/*dijit.layout.BorderContainer|dojox.layout.GridContainer|dijit.layout.TabContainer|HTMLElement|core.js.views.LayoutPortlet*/ container, /*Boolean*/ collapsed) {
			// summary:
			//		Collapse or expands all portlets in the given container
			// container:
			//		The container, which can be a border/grid container, a grid zone, or a portlet
			// collapsed:
			//		If true, collapses all portlets. If false, expands all portlets.
			var self = this;
			switch (true) {
				case (container instanceof dijit.layout.BorderContainer):
				case (container instanceof dojox.layout.GridContainer):
				case (container instanceof dijit.layout.TabContainer):
					dojoArray.forEach(container.getChildren(), function(child) {
						self.collapsePortlets(child, collapsed);
					});
					break;
				case (container instanceof HTMLElement):
					dojo.query(".dojoxPortlet", container).forEach(function(portletNode) {
						var portlet = dijit.registry.byNode(portletNode);
						self.collapsePortlets(portlet, collapsed);
					});
					break;
				case (container instanceof core.js.views.LayoutPortlet):
					container.set("open", !collapsed);
					break;
				default:
					break;
			}
		},
		
		movePortlet: function(/*core.js.views.LayoutPortlet*/ portlet, /*Object*/ source, /*Object*/ target) {
			// summary:
			//		Moves portlet to other position/zone/grid
			// portlet:
			//		The portlet
			// source:
			//		Defines the position of portlet before moving.
			//		Contains the members: grid, zoneIndex, portletIndex
			// target:
			//		Defines the position of portlet after moving.
			//		Contains the members: grid, zoneIndex, portletIndex
			source.grid.removeChild(portlet);
			target.grid.addChild(portlet, target.zoneIndex, target.portletIndex);
			portlet.set("indices", target);
			
			// Reinit the TinyMCE editors if they exist
			var self = this;
			dojo.query("textarea." + core.js.LayoutConstant.WIDGET_INPUT_TINYMCE_CLASS, portlet.domNode).forEach(function(textarea) {
				var textareaId = dojoDomAttr.get(textarea, "id");
				self._removeTinyMCE(textareaId);
				self._addTinyMCE(textareaId);
			});
		},
		
		_disableDnd: function(/*dijit.layout.BorderContainer*/ container) {
			// summary:
			//		Disables dragging and dropping on the given border container
			// container:
			//		The border container
			var dndSource = this._dndSources[container.id];
			if (dndSource) {
				dojoDomClass.remove(container.domNode, ["dojoDndSource", "dojoDndTarget", "dojoDndContainer"]);
				dndSource.isSource = true;
				dndSource.checkAcceptance = function(source, nodes) {
					return false;
				};
				
				// FIXME: Cannot use dndSource.destroy();
				// delete this._dndSources[container.id];
				// dndSource.destroy();
			}
		},
		
		// The TinyMCE editors might be placed inside widgets and they might be
		// dragged and dropped between zone/grid.
		// The following methods are used to reinitialize the WYSIWYG editors because the
		// web browsers can not keep the state of iframes if they are moved
		
		// _isFirefox: bool
		_isFirefox: /Firefox/.test(navigator.userAgent),
		
		_removeTinyMCE: function(/*String*/ textareaId) {
			// summary:
			//		Removes a TinyMCE editor
			if (this._isFirefox) {
				var editor = tinyMCE.getInstanceById(textareaId);
				// Remove the editor
//				tinyMCE.remove(editor);
				// TinyMCE uses a SPAN tag with id of textareaId_parent to contain editor iframe
				dojo.query("#" + textareaId + "_parent").orphan();
				// Show the textarea
				dojoDomStyle.set(textareaId, "display", "block");
			} else {
				// Does not work on Firefox 10, 11
				tinyMCE.execCommand("mceFocus", false, textareaId);
				tinyMCE.execCommand("mceRemoveControl", false, textareaId);
			}
		},
		
		_addTinyMCE: function(/*String*/ textareaId) {
			// summary:
			//		Reattaches a TinyMCE editor
			if (this._isFirefox) {
				var editor = tinyMCE.getInstanceById(textareaId);
				if (editor) {
					var settings = editor.settings;
					settings.setup = function(ed) {
						ed.onChange.add(function(ed, l) {
							dojo.query("#" + ed.id)[0].innerHTML = l.content;
						});
						ed.onInit.add(function(ed) {
							// Allow to drop image, video, etc. to the editor
							core.js.base.dnd.TargetManager.getInstance().deleteTarget(ed.id + "_parent");
							dojoTopic.publish("/app/global/onLoadComplete");
						});
					};
					tinyMCE.init(settings);
				}
			} else {
				// Does not work on Firefox 10, 11
				tinyMCE.execCommand("mceAddControl", false, textareaId);
				
				// Allow to drop image, video, etc. to the editor
				core.js.base.dnd.TargetManager.getInstance().deleteTarget(textareaId + "_parent");
				dojoTopic.publish("/app/global/onLoadComplete");
			}
		},
		
		////////// SWITCH TO EDIT MODE //////////
		
		switchToEditMode: function() {
			// summary:
			//		Switches to edit mode
			// Enable Dnd
			this._dndSources = {};
			this._enableLayoutDnd();
			this._enableWidgetDnd();
			
			// Remove child widgets
			dojoArray.forEach(dijit.registry.byId(this._id).getChildren(), function(widget) {
				widget.destroyRecursive();
			});
			dojoDom.byId(this._id).innerHTML = "";
			dojoDomClass.remove(this._id, "appContentPane");
			
			if (this._layoutData == null) {
				return;
			}
			
			// Set properties to root container
			if (this._layoutData.properties) {
				this.setProperties(dijit.registry.byId(this._id), this._layoutData.properties);
			}
			
			for (var i in this._layoutData.containers) {
				this._toEditMode(dijit.registry.byId(this._id), this._layoutData.containers[i]);	
			}
		},
		
		_toEditMode: function(/*dijit.layout.BorderContainer|dojox.layout.GridContainer|HTMLElement|core.js.views.LayoutPortlet*/ container, /*Object*/ layout) {
			// summary:
			//		Switches to edit mode
			// container:
			//		Can be the border container, the grid container, the grid zone or the portlet
			// layout:
			//		The container data
			switch (layout.cls) {
				case "dijit.layout.BorderContainer":
					var regions = {};
					regions[layout.region] = layout.style;
					var borderContainer = this.addBorderContainers(container, regions)[layout.region];
					this.setProperties(borderContainer, layout.properties);
					for (var i in layout.containers) {
						this._toEditMode(borderContainer, layout.containers[i]);
					}
					break;
				case "dojox.layout.GridContainer":
					var gridContainer = this.addGridContainer(container, { nbZones: layout.numZones });
					this.setProperties(gridContainer, layout.properties);
					
					for (var i in layout.containers) {
						this._toEditMode(gridContainer, dojoLang.mixin({
											zoneIndex: i	// To get the zone index later
										}, layout.containers[i]));
					}
					break;
				case "dijit.layout.TabContainer":
					var tabContainer = this.addTabContainer(container, layout.zoneIndex);
					if (tabContainer) {
						this.setProperties(tabContainer, layout.properties);
						for (var i in layout.containers) {
							this._toEditMode(tabContainer, layout.containers[i]);
						}
						
						// Activate tab
						if (layout.selectedIndex) {
							var children = tabContainer.getChildren();
							if (layout.selectedIndex >= 0 && layout.selectedIndex < children.length) {
								this.activateTabContainer(children[layout.selectedIndex]);
							}
						}
					}
					break;
				case "gridContainerZone":
					// Set properties to zone
					var zones = dojo.query(".gridContainerZone", container.domNode);
					if (zones[layout.zoneIndex]) {
						// I can get the zone index (layout.zoneIndex) which was set eariler
						this.setProperties(zones[layout.zoneIndex], layout.properties);
					}
					
					for (var i in layout.containers) {
						this._toEditMode(container, layout.containers[i]);
					}
					break;
				case "core.js.views.LayoutPortlet":
					var portlet = this.addPortlet(container, layout.widget, layout.zoneIndex, layout.portletIndex, true);
					this.setProperties(portlet, layout.properties);
					if (layout.filters) {
						this.setFilters(portlet, layout.filters);
					}
					break;
				case "dijit.layout.ContentPane":
					var pane = this.addMainContentPane(container, layout.zoneIndex, layout.portletIndex);
					this.setProperties(pane, layout.properties);
					if (layout.filters) {
						this.setFilters(pane, layout.filters);
					}
					break;
				default:
					// Do nothing
					break;
			}
		},
		
		_enableLayoutDnd: function() {
			// summary:
			//		Enables drag-and-drop. Allows user to drag the layout container
			//		and drop to the root container
			var self = this;
			var dndSource = new dojo.dnd.Source(dojoDom.byId(this._id), {
				isSource: false,
				accept: this._acceptLayoutContainerClasses,
				onDropExternal: function(source, nodes, copy) {
					var type = dojoDomAttr.get(source.node, "data-app-dndtype");
					
					switch (type) {
						case "layout":
							var data = core.js.base.Encoder.decode(dojoDomAttr.get(source.node, "data-app-entity-props"));
							self.addBorderContainers(dijit.registry.byId(self._id), data);
							break;
						case "widget":
							break;
						default:
							break;
					}
				}
			});
			this._dndSources[this._id] = dndSource;
		},
		
		_enableWidgetDnd: function() {
			// summary:
			//		Enables drag-and-drop. Allows user to drag the widget and drop
			//		to the root container
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/dnd/drop/after", this, function(source, nodes, copy, target, dropIndex) {
				if (dojoArray.indexOf(this._acceptWidgetClasses, dojoDomAttr.get(nodes[0], "dndtype")) == -1) {
					return;
				}
				
				var widget = core.js.base.Encoder.decode(dojoDomAttr.get(nodes[0], "data-app-entity-props"));
				// Define the grid container and the zone index
				// target is a zone (TD element)
				var gridContainer = dijit.registry.getEnclosingWidget(target);
				var zoneIndex	  = dojoArray.indexOf(dojo.query(".gridContainerZone", target.parentNode), target);

				// Add portlet to the grid container
				var numPortlets = dojo.query("." + core.js.LayoutConstant.PORTLET_CONTAINER_CLASS, target).length;
				var portlet		= this.addPortlet(gridContainer, widget, zoneIndex, (dropIndex == -1) ? numPortlets : dropIndex, true);
				
				// dojox.mdnd.areaManager().addDragItem(target, portlet.domNode, dropIndex);
			});
			
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/dojox/mdnd/adapter/dndToDojo/drop", this, function(node, target, type) {
			});
			
			var self = this;
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/dojox/mdnd/drag/start", this, function(node, sourceArea, sourceDropIndex) {
				// This method will be called when dragging portlets in a grid container
				var portlet = dijit.registry.byNode(node);
				if (!portlet) {
					return;
				}
				if (!(portlet instanceof core.js.views.LayoutPortlet)
					&& !(portlet instanceof dijit.layout.TabContainer)
					&& !(portlet instanceof dijit.layout.ContentPane))
				{
					return;
				}
				dojo.query("textarea." + core.js.LayoutConstant.WIDGET_INPUT_TINYMCE_CLASS, node).forEach(function(textarea) {
					var textareaId = dojoDomAttr.get(textarea, "id");
					self._removeTinyMCE(textareaId);
				});
			});
			
			core.js.base.controllers.Subscriber.subscribe(this.TOPIC_GROUP, "/dojox/mdnd/drop", this, function(node, targetArea, indexChild) {
				// This method will be called after dropping portlets in a grid container
				var portlet = dijit.registry.byNode(node);
				if (!portlet) {
					return;
				}
				if (!(portlet instanceof core.js.views.LayoutPortlet)
					&& !(portlet instanceof dijit.layout.TabContainer)
					&& !(portlet instanceof dijit.layout.ContentPane))
				{
					return;
				}
				dojo.query("textarea." + core.js.LayoutConstant.WIDGET_INPUT_TINYMCE_CLASS, node).forEach(function(textarea) {
					var textareaId = dojoDomAttr.get(textarea, "id");
					self._addTinyMCE(textareaId);
				});
				
				// Get the current of zone index
				var currPortletIndices = this._getPortletIndices(portlet);
				
				// Compare it with the old one (which was set in the addPortlet() and addTabContainer() methods)
				var oldPortletIndices  = portlet.get("indices");
				
				if (currPortletIndices.grid.id != oldPortletIndices.grid.id
					|| currPortletIndices.zoneIndex != oldPortletIndices.zoneIndex
					|| currPortletIndices.portletIndex != oldPortletIndices.portletIndex)
				{
					// The portlet was moved to other position
					portlet.set("indices", currPortletIndices);
					
					dojoTopic.publish("/app/core/views/LayoutContainer/movePortlet_" + this._id, {
						portlet: portlet,
						source: oldPortletIndices,
						target: currPortletIndices
					});
				}
			});
		},
		
		_getPortletIndices: function(/*core.js.views.LayoutPortlet*/ portlet) {
			// summary:
			//		Gets the index of zone that the portlet belongs to, and the index of portlet
			//		in the zone
			// portlet:
			//		The portlet instance
			// Get the zone node
			var zoneNode	  = dojo.query(portlet.domNode).closest(".gridContainerZone")[0];
			var gridNode	  = dojo.query(zoneNode).closest(".gridContainer")[0];
			var gridContainer = dijit.registry.byNode(gridNode);
			var zoneIndex	  = dojoArray.indexOf(dojo.query("> .gridContainerZone", gridContainer.gridNode), zoneNode);
			var portletIndex  = dojoArray.indexOf(dojo.query("> ." + core.js.LayoutConstant.PORTLET_CONTAINER_CLASS, zoneNode), portlet.domNode);
			
			return {
				grid: dijit.registry.byNode(gridNode),
				zoneIndex: zoneIndex,
				portletIndex: portletIndex
			};		// Object
		},
		
		////////// SWITCH TO VIEW MODE //////////
		
		switchToViewMode: function() {
			// summary:
			//		Switches to view mode. Show the layout including the border, grid containers and portlets
			if (this._layoutData == null) {
				return;
			}
			// Disable Dnd
			this._disableLayoutDnd();
			this._disableWidgetDnd();
			this._dndSources = {};
			
			// Remove child widgets
			dojoArray.forEach(dijit.registry.byId(this._id).getChildren(), function(widget) {
				widget.destroyRecursive();
			});
			dojoDom.byId(this._id).innerHTML = "";
			dojoDomClass.remove(this._id, "appLayoutBorderContainer");
			
			// A BorderContainer has to have at least one pane inside it
			var contentPane = new dijit.layout.ContentPane({
				region: "center",
				style: {
					height: "100%",
					width: "100%"
				},
				"class": "appContentPane"
			});
			dijit.registry.byId(this._id).addChild(contentPane);
			
			this._toViewMode(this._layoutData, contentPane.domNode);
		},
		
		_toViewMode: function(/*Object*/ layout, /*DomNode*/ parent) {
			// summary:
			//		Switches to view mode
			// layout:
			//		Container's data, which is generated by _getContainerData() method
			// parent:
			//		DomNode of parent container
			switch (layout.cls) {
				case "dijit.layout.BorderContainer":
					var container = dojoDomConstruct.create("div", {}, parent);
					switch (layout.region) {
						case "top":
							break;
						case "left":
							dojoDomConstruct.create("div", {
								className: "appLeft",
								style: layout.style
							}, container);
							break;
						case "center":
							dojoDomConstruct.create("div", {
								className: "appLeft",
								style: layout.style
							}, container);
							break;
						case "right":
							dojoDomConstruct.create("div", {
								className: "appRight",
								style: layout.style
							}, container);
							break;
						case "bottom":
							dojoDomConstruct.create("div", {
								style: {
									clear: "both"
								}
							}, container);
							dojoDomConstruct.create("div", {
								style: layout.style
							}, container);
							break;
						default:
							break;
					}
					for (var i in layout.containers) {
						this._toViewMode(layout.containers[i], container);
					}
					break;
				case "dojox.layout.GridContainer":
					var container = dojoDomConstruct.create("div", {
						nbZones: layout.numZones
					}, parent);
					
					// Create div to contain zones
					var zones = [];
					for (var i = 0; i < layout.numZones; i++) {
						var width = 100 / layout.numZones;
						var child = dojoDomConstruct.create("div", {
							className: "appLeft",
							style: {
								width: width + "%"
							}
						}, container);
						
						var zone = dojoDomConstruct.create("div", {
							className: "coreLayoutZoneContainer",
							style: {
								margin: "0 4px"
							}
						}, child);
						
						zones.push(zone);
					}
					// Add clear div
					dojoDomConstruct.create("div", {
						style: {
							clear: "both"
						}
					}, container);
					
					for (var i in layout.containers) {
						this._toViewMode(layout.containers[i], zones[i]);
					}
					break;
				case "gridContainerZone":
					for (var i in layout.containers) {
						this._toViewMode(layout.containers[i], parent);
					}
					break;
				case "dijit.layout.TabContainer":
					// TODO: Show a tab container in view mode
					break;
				case "core.js.views.LayoutPortlet":
					var portletIndex = layout.portletIndex ? layout.portletIndex : 0;
					this.addPortlet(parent, layout.widget, layout.zoneIndex, portletIndex, false);
					break;
				case "dijit.layout.ContentPane":
					break;
				default:
					break;
			}
		},
		
		_disableLayoutDnd: function() {
			// summary:
			//		Disables the drag-and-drop. User cannot drag the layout
			//		container to the root container
			this._disableDnd(dijit.registry.byId(this._id));
		},
		
		_disableWidgetDnd: function() {
			// summary:
			//		Disables the drag-and-drop. User cannot drag the widgets
			//		to the root container
			core.js.base.controllers.Subscriber.unsubscribe(this.TOPIC_GROUP);
		},
		
		////////// GET DATA //////////
		
		getHtmlData: function() {
			// summary:
			//		Returns the data combined by data of all portlets
			// description:
			//		In some cases, such as creating new article, I want to get entire HTML data
			//		for searching later.
			return this._getHtmlData(dijit.registry.byId(this._id));		// String
		},
		
		_getHtmlData: function(/*dijit.layout.BorderContainer|dojox.layout.GridContainer|core.js.views.LayoutPortlet*/ container) {
			var self = this;
			var html = "";
			
			switch (true) {
				case (container instanceof dijit.layout.BorderContainer):
					// Do nothing
					break;
				case (container instanceof dojox.layout.GridContainer):
					// Do nothing
					break;
				case (container instanceof dijit.layout.TabContainer):
					// Do nothing
					break;
				case (container instanceof core.js.views.LayoutPortlet):
					// If the widget use TinyMCE editor, returns the HTML content of the editor
					var textareas = dojo.query("textarea." + core.js.LayoutConstant.WIDGET_INPUT_TINYMCE_CLASS, container.domNode);
					if (textareas.length > 0) {
						dojoArray.forEach(textareas, function(textarea) {
							var textareaId = dojoDomAttr.get(textarea, "id");
							html += tinyMCE.getInstanceById(textareaId).getContent();
						});
					} else {
						var data = container._widget;
						data.params = this._getWidgetParams(container);
						html += "[app:widget data='" + dojoJson.stringify(data) + "'][/app:widget]";
					}
					break;
				case (container instanceof dijit.layout.ContentPane):
					// Do nothing
					break;
				default:
					break;
			}
			
			dojoArray.forEach(container.getChildren(), function(child) {
				if ((child instanceof dijit.layout.BorderContainer) || (child instanceof dijit.layout.TabContainer) 
					|| (child instanceof dojox.layout.GridContainer) || (child instanceof core.js.views.LayoutPortlet)
					|| (child instanceof dijit.layout.ContentPane)) 
				{
					var childContent = self._getHtmlData(child);
					if (childContent != "") {
						html += childContent + "\n";
					}
				}
			});
			
			return html;	// String
		},
		
		getLayoutData: function() {
			// summary:
			//		Gets the layout data
			return this._getContainerData(dijit.registry.byId(this._id));	// Object
		},
		
		setLayoutData: function(/*Object*/ layoutData) {
			// summary:
			//		Sets the layout data
			// layoutData:
			//		The layout data
			this._layoutData = layoutData;
			dojoTopic.publish("/app/core/views/LayoutContainer/setLayoutData_" + this._id, layoutData);
		},
		
		_getContainerData: function(/*dijit.layout.BorderContainer|dojox.layout.GridContainer|dijit.layout.TabContainer|HTMLDivElement|core.js.views.LayoutPortlet*/ container) {
			// summary:
			//		Gets container's data
			// container:
			//		The container, which can be a border/grid container, a grid zone, or a portlet
			var self = this;
			var data = {
				containers: [],
				properties: this.getProperties(container)
			};
			
			switch (true) {
				case (container instanceof dijit.layout.BorderContainer):
					data.cls = "dijit.layout.BorderContainer";
					if (container._data == null) {
						var props	= dojoJson.parse("{" + dojoDomAttr.get(container.domNode, "data-dojo-props") + "}");
						data.region = props.region;
						data.style  = props.style || "";
					} else {
						data.region = container._data.region;
						data.style  = container._data.style;
					}
					
					dojoArray.forEach(container.getChildren(), function(child) {
						data.containers.push(self._getContainerData(child));
					});
					break;
				
				case (container instanceof dojox.layout.GridContainer):
					data.cls	  = "dojox.layout.GridContainer";
					data.numZones = container.nbZones;
					
					// Get the list of zones (columns)
					dojo.query("> .gridContainerZone", container.gridNode).forEach(function(zone, index) {
						data.containers.push(self._getContainerData(zone));
					});
					break;
				
				case (container instanceof dijit.layout.TabContainer):
					data.cls = "dijit.layout.TabContainer";
					if (container.get("appSelectedIndex")) {
						data.selectedIndex = container.get("appSelectedIndex");
					}
					
					var parent = container.getParent();
					if (parent instanceof dojox.layout.GridContainer) {
						var zoneNode	  = dojo.query(container.domNode).closest(".gridContainerZone")[0];
						var zones		  = dojo.query("> .gridContainerZone", parent.gridNode);
						data.numZones	  = zones.length;
						data.zoneIndex	  = dojoArray.indexOf(zones, zoneNode);
						var portlets	  = dojo.query("> ." + core.js.LayoutConstant.PORTLET_CONTAINER_CLASS, zoneNode);
						data.numPortlets  = portlets.length;
						data.portletIndex = dojoArray.indexOf(portlets, container.domNode); 
					}
					
					dojoArray.forEach(container.getChildren(), function(child) {
						data.containers.push(self._getContainerData(child));
					});
					break;
				
				case (container instanceof HTMLElement):
					// In this case, container is a zone of grid container
					var gridNode	  = dojo.query(container).closest(".gridContainer")[0];
					var gridContainer = dijit.registry.byNode(gridNode);
					var zones		  = dojo.query("> .gridContainerZone", gridContainer.gridNode);
					data.cls		  = "gridContainerZone";
					data.numZones	  = zones.length;
					data.zoneIndex	  = dojoArray.indexOf(zones, container); 
					
					// Get the list of portlets or tab containers
					dojo.query("> ." + core.js.LayoutConstant.PORTLET_CONTAINER_CLASS, container).forEach(function(portletNode, index) {
						var portlet = dijit.registry.byNode(portletNode);
						data.containers.push(self._getContainerData(portlet));
					});
					break;
				
				case (container instanceof core.js.views.LayoutPortlet):
					var zoneNode	   = container.domNode.parentNode;
					var zones		   = dojo.query("> .gridContainerZone", zoneNode.parentNode);
					var portlets	   = dojo.query("> ." + core.js.LayoutConstant.PORTLET_CONTAINER_CLASS, zoneNode);
					data.cls		   = "core.js.views.LayoutPortlet";
					data.numZones      = zones.length;
					data.zoneIndex	   = dojoArray.indexOf(zones, zoneNode);
					data.numPortlets   = portlets.length;
					data.portletIndex  = dojoArray.indexOf(portlets, container.domNode);
					data.widget		   = container._widget;
					data.widget.params = this._getWidgetParams(container);
					
					var filters = this.getFilters(container);
					if (filters) {
						data.filters = filters;
					}
					break;
				
				case (container instanceof dijit.layout.ContentPane):
					data.cls = "dijit.layout.ContentPane";
					// The "appParent" attribute is set in the addMainContentPane() method
					var parent = container.get("appParent");
					if (parent && (parent instanceof dojox.layout.GridContainer)) {
						// The main content pane is placed in a grid zone
						var zoneNode	   = container.domNode.parentNode;
						var zones		   = dojo.query("> .gridContainerZone", zoneNode.parentNode);
						var portlets	   = dojo.query("> ." + core.js.LayoutConstant.PORTLET_CONTAINER_CLASS, zoneNode);
						data.numZones	   = zones.length;
						data.zoneIndex	   = dojoArray.indexOf(zones, zoneNode);
						data.numPortlets   = portlets.length;
						data.portletIndex  = dojoArray.indexOf(portlets, container.domNode);
					}
					var filters = this.getFilters(container);
					if (filters) {
						data.filters = filters;
					}
					break;
				
				default:
					break;
			}
			
			return data;	// Object
		},
		
		_getWidgetParams: function(/*core.js.views.LayoutPortlet*/ portlet) {
			// summary:
			//		Gets the widget params of a portlet
			// portlet:
			//		The portlet
			var params = {};
			var self = this;
			
			dojo.query("." + core.js.LayoutConstant.WIDGET_INPUT_CLASS, portlet.domNode).forEach(function(inputNode) {
				var widget = dijit.registry.byNode(inputNode), name = null, value;
				switch (true) {
					case (widget instanceof dijit.form.CheckBox):
					case (widget instanceof dijit.form.RadioButton):
						if (widget.get("checked")) {
							name  = widget.get("appWidgetInputName");
							value = widget.value;
						}
						break;
					case (widget instanceof dijit._Widget):
						name  = widget.get("appWidgetInputName");
						value = widget.get("value");
						break;
					case (inputNode.tagName == "TEXTAREA"):
						name  = dojoDomAttr.get(inputNode, "appWidgetInputName");
						value = dojo.hasClass(inputNode, core.js.LayoutConstant.WIDGET_INPUT_TINYMCE_CLASS)
								? tinyMCE.getInstanceById(dojoDomAttr.get(inputNode, "id")).getContent()
								: inputNode.innerHTML;
						break;
					case (dojoDomAttr.get(inputNode, "type") == "hidden"):
						// Hidden element
						name  = dojoDomAttr.get(inputNode, "appWidgetInputName") || dojoDomAttr.get(inputNode, "name");
						value = dojoDomAttr.get(inputNode, "value");
						break;
					default:
						break;
				}
				
				if (name) {
					// Check if the name ends with []
					if (name.substr(name.length - 2, 2) == "[]") {
						if (!params[name]) {
							params[name] = [];
						}
						params[name].push(value);
					} else {
						params[name] = value;
					}
				}
			});
			// console.log(dojoJson.stringify(params));
			return params;		// Object
		},
		
		_loadWidgetParams: function(/*dojox.layout.ContentPane*/ pane, /*Object*/ widget) {
			// summary:
			//		Loads the widget's paramteres to the portlet setting pane
			// pane:
			//		The pane shows portlet's settings
			// widget:
			//		The widget data. The widget's parameters are passed as widget.params
			// Get the portlet
			var portlet   = pane.get("appPortlet");
			var portletId = portlet.id;
			
			var self = this, name;
			dojo.query("." + core.js.LayoutConstant.WIDGET_INPUT_CLASS, pane.domNode).forEach(function(node) {
				var dijitWidget = dijit.registry.byNode(node);
				
				// Set value for all Dijit widgets
				if (dijitWidget) {
					// Add the portlet Id to the beginning of name of widget input elements
					// to make sure that there is no elements which belong to different portlets
					// but have the same "name" attribute
					name = String(dijitWidget.get("name"));
					dijitWidget.set("appWidgetInputName", name);
					dijitWidget.set("name", portletId + "___" + name);
					
					if ((dijitWidget instanceof dijit.form.CheckBox) || (dijitWidget instanceof dijit.form.RadioButton)) {
						dojoDomAttr.set(dijitWidget.focusNode, "name", portletId + "___" + name);
					}
					
					if (widget.params && widget.params[name]) {
						switch (true) {
							case (dijitWidget instanceof dijit.form.CheckBox):
							case (dijitWidget instanceof dijit.form.RadioButton):
								// Set "checked" attribute
								dijitWidget.set("checked", dijitWidget.value == widget.params[name]);
								break;
							default:
								dijitWidget.set("value", widget.params[name]);
								break;
						}
					}
				}
				// Set value for HTML elements (such as textarea using WYSIWYG editor instead of Dijit widget)
				else {
					name = dojoDomAttr.get(node, "name");
					dojoDomAttr.set(node, "appWidgetInputName", name);
					dojoDomAttr.set(node, "name", portletId + "___" + name);
					
					if (name && widget.params && widget.params[name]) {
						var params = widget.params[name], value = null;
						
						if (name.substr(name.length - 2, 2) == "[]") {
							value = params[0];
							params.splice(0, 1);
						} else {
							value = params;
						}
						
						// Set the value for node
						switch (true) {
							case (node.tagName == "TEXTAREA"):
								if (!dojoDomAttr.get(node, "innerHTML")) {
									dojoDomAttr.set(node, "innerHTML", value);
								}
								break;
							case (dojoDomAttr.get(node, "type") == "hidden"):
								// I have to check if the element is set value
								// (maybe its value is set by the widget's configuration script)
								if (!dojoDomAttr.get(node, "value")) {
									dojoDomAttr.set(node, "value", value);
								}
								break;
							default:
								break;
						}
					}
				}
			});
		},
		
		////////// MANAGE CONTAINER PROPERTIES //////////
		
		setProperties: function(/*dijit.layout.BorderContainer|dojox.layout.GridContainer|HTMLElement|core.js.views.LayoutPortlet*/ container, /*Object*/ properties) {
			// summary:
			//		Sets properties to given container
			// container:
			//		The container, which can be a border/grid container, a grid zone, or a portlet
			// properties:
			//		Properties of container
			switch (true) {
				case (container instanceof dijit.layout.BorderContainer):
				case (container instanceof dojox.layout.GridContainer):
				case (container instanceof dijit.layout.TabContainer):	
				case (container instanceof core.js.views.LayoutPortlet):
				case (container instanceof dijit.layout.ContentPane):
					container.set("__properties", properties);
					if (properties && properties.title) {
						container.set("title", properties.title);
					}
					break;
				case (container instanceof HTMLElement):
					dojoDomAttr.set(container, "__properties", dojoJson.stringify(properties));
					break;
				default:
					break;
			}
			
			dojoTopic.publish("/app/core/views/LayoutContainer/setProperties_" + this._id, {
				container: container,
				properties: properties
			});
		},
		
		getProperties: function(/*dijit.layout.BorderContainer|dojox.layout.GridContainer|HTMLElement|core.js.views.LayoutPortlet*/ container) {
			// summary:
			//		Gets properties of given container
			// container:
			//		The container, which can be a border/grid container, a grid zone, or a portlet
			var defaultProperties = {
				title: "",
				id: "",
				css_class: "",
				css_style: ""
			};
			switch (true) {
				case (container instanceof dijit.layout.BorderContainer):
				case (container instanceof dojox.layout.GridContainer):
				case (container instanceof dijit.layout.TabContainer):	
				case (container instanceof core.js.views.LayoutPortlet):
				case (container instanceof dijit.layout.ContentPane):
					var props = container.get("__properties");
					return props ? props : defaultProperties;	// Object
					break;
				case (container instanceof HTMLElement):
					var props = dojoDomAttr.get(container, "__properties");
					return props ? dojoJson.parse(props) : defaultProperties;	// Object
					break;
				default:
					return {};	// Object
					break;
			}
		},
		
		setFilters: function(/*core.js.views.LayoutPortlet|dijit.layout.ContentPane*/ portlet, /*String[]*/ filters) {
			// summary:
			//		Sets filters to given portlet
			// portlet:
			//		The portlet instance
			// filters:
			//		Array of filters
			portlet.set("appFilters", filters);
			
			dojoTopic.publish("/app/core/views/LayoutContainer/setFilters_" + this._id, {
				portlet: portlet,
				filters: filters
			});
		},
		
		getFilters: function(/*core.js.views.LayoutPortlet|dijit.layout.ContentPane*/ portlet) {
			// summary:
			//		Gets list of filters which are set to given portlet
			// portlet:
			//		The portlet instance
			return portlet.get("appFilters");	// String[]
		}
	});
});
