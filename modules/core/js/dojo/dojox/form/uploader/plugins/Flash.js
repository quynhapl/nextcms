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
 * @version		2012-07-10
 */

/**
 * This hack fixes the issue that Flash uploader does NOT work on IE9
 */
dojo.require("dojox.form.uploader.plugins.Flash");

dojo.provide("core.js.dojo.dojox.form.uploader.plugins.Flash");

dojo.declare("core.js.dojo.dojox.form.uploader.plugins.Flash", dojox.form.uploader.plugins.Flash, {
	_fileComplete: function(dataArray) {
		this.onFileComplete(dataArray);
	},
	
	onFileComplete: function(dataArray) {
		// summary:
		//		This method is called after a file is uploaded completely.
	},
	
	_setUrlAttr: function(/*String*/ url) {
		// I need to rebuild the embed flash when set new upload URL
		if (this.inputNode && this.url && url && this.url != url) {
			this.url = url;
			var node = this.inputNode;
			var handler = dojo.connect(this, "onLoad", this, function() {
				dojo.destroy(node);
				dojo.disconnect(handler);
			});
			this._createFlashUploader();
		} else {
			this.inherited(arguments);
		}
	},
	
	_connectFlash: function() {
		this._cons = [];

		if (this._subs == null) {
			this._subs = [];
			
			var doSub = dojo.hitch(this, function(s, funcStr) {
				this._subs.push(dojo.subscribe(this.id + s, this, funcStr));
			});
	
			doSub("/filesSelected", "_change");
			doSub("/filesUploaded", "_complete");
			doSub("/filesProgress", "_progress");
			doSub("/filesError", "_error");
			doSub("/filesCanceled", "onCancel");
			doSub("/stageBlur", "_onFlashBlur");
			
			// NEW METHOD:
			doSub("/fileComplete", "_fileComplete");
		}
		
		var cs = dojo.hitch(this, function(s, nm) {
			this._cons.push(dojo.subscribe(this.id + s, this, function(evt){
				this.button._cssMouseEvent({
					type: nm
				});
			}));
		});
		cs("/up", "mouseup");
		cs("/down", "mousedown");
		cs("/over", "mouseover");
		cs("/out", "mouseout");

		this.connect(this.domNode, "focus", function() {
			// HACK: http://bugs.dojotoolkit.org/ticket/14150
			if (!this.flashMovie) {
				return;
			}
			// ORIGINAL BY DOJO
			this.flashMovie.focus();
			this.flashMovie.doFocus();
		});
		if (this.tabIndex >= 0) {
			dojo.attr(this.domNode, "tabIndex", this.tabIndex);
		}
	},
	
	destroy: function(/*Boolean*/ preserveDom) {
		// summary:
		//		Destroy the widget
		//		I need to unsubscribe all handlers
		this.inherited(arguments);
		dojo.forEach(this._subs, function(s) {
			dojo.unsubscribe(s);
		});
		dojo.forEach(this._cons, function(s) {
			dojo.unsubscribe(s);
		});
	}
});

dojox.form.addUploaderPlugin(core.js.dojo.dojox.form.uploader.plugins.Flash);
