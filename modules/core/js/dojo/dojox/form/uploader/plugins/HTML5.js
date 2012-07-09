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
 * @version		2012-07-09
 */

/**
 * This hack fixes the issue that HTML5 uploader does NOT work on Firefox 4+
 */
dojo.require("dojox.form.uploader.plugins.HTML5");

dojo.provide("core.js.dojo.dojox.form.uploader.plugins.HTML5");

dojo.declare("core.js.dojo.dojox.form.uploader.plugins.HTML5", dojox.form.uploader.plugins.HTML5, {
	uploadWithFormData: function(/*Object*/ data) {
		if(!this.getUrl()){
			return;
		}

		var fd = new FormData();
		dojo.forEach(this.inputNode.files, function(f, i){
			fd.append(this.name + "s[]", f);
		}, this);

		if (data) {
			// HACK: http://bugs.dojotoolkit.org/changeset/25634/dojo
			if (dojo.isFF) {
				for(var nm in data[0]){
					fd.append(nm, data[0][nm]);
				}
			} else {
				// ORIGINAL BY DOJO
				for(var nm in data){
					fd.append(nm, data[nm]);
				}
			}
		}

		var xhr = this.createXhr();
		xhr.send(fd);
	}
});

dojox.form.addUploaderPlugin(core.js.dojo.dojox.form.uploader.plugins.HTML5);
