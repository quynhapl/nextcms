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
	"dojo/topic",
	"dojo/_base/lang",
	"dojo/_base/kernel",
	"dojo/_base/loader",
], function(dojoTopic, dojoLang, dojo) {
	dojo.provide("core.js.base.controllers.Subscriber");

	core.js.base.controllers.Subscriber.subscribe = function(/*String*/ group, /*String*/ topic, /*Object*/ context, /*Function*/ callback) {
		var handlers = core.js.base.controllers.Subscriber._handlers;
		if (!handlers[group]) {
			handlers[group] = {};
		}
		handlers[group][topic] = dojoTopic.subscribe(topic, dojoLang.hitch(context, callback));
		return handlers[group][topic];		// Object
	};
	
	core.js.base.controllers.Subscriber.unsubscribe = function(/*String*/ group, /*String?*/ topic) {
		var groupHandlers = core.js.base.controllers.Subscriber._handlers[group];
		if (groupHandlers) {
			if (topic) {
				groupHandlers[topic].remove();
			} else {
				for (var i in groupHandlers) {
					groupHandlers[i].remove();
				}
			}
		}
	};
	
	core.js.base.controllers.Subscriber.unsubscribeAll = function(/*String?*/ topic) {
		var handlers = core.js.base.controllers.Subscriber._handlers;
		for (var group in handlers) {
			if (topic) {
				handlers[group][topic].remove();
			} else {
				core.js.base.controllers.Subscriber.unsubscribe(handlers[group]);
			}
		}
	};
	
	core.js.base.controllers.Subscriber._handlers = {};
});
