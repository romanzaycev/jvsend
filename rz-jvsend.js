/**
 * @name     Jivosite simple send
 * @author   Roman Zaycev
 * @version  1.0.0
 *
 *	JVSend.on('enabled', function(){
 *		console.log('JIVOSITE LOADED');
 *	});
 *
 *	JVSend.send('Message for manager');
 */
 
;(function(w){
	var config = {
		outerId		: 'jivo_outer_body',
		chatifId	: 'jivo_chat_iframe',
		jvCallback	: 'jivo_onLoadCallback',
		imTextarea	: 'message'
	};

	var listeners = {
		'enabled'		: [],
		'alreadyEnabled': [],
		'ready'			: []
	};
	
	var DOMready = function(handler){
		var called = false;
		
		function ready(){
			if(called){
				return;
			}
			called = true
			handler();
		}

		if(document.addEventListener){
			document.addEventListener(
				"DOMContentLoaded",
				function(){
					ready()
				},
				false
			);
		}else if(document.attachEvent){
			if(document.documentElement.doScroll && window == window.top){
				function tryScroll(){
					if(called){
						return;
					}
					if(!document.body){
						return;
					}
					try{
						document.documentElement.doScroll("left");
						ready();
					}catch(e){
						setTimeout(tryScroll, 0);
					}
				}
				tryScroll();
			}

			document.attachEvent("onreadystatechange", function(){
				if(document.readyState === "complete"){
					ready();
				}
			});
		}

		if(window.addEventListener){
			window.addEventListener('load', ready, false)
		}else if(window.attachEvent){
			window.attachEvent('onload', ready)
		}
	}
	
	if(w.hasOwnProperty(config.jvCallback)){
		throw new Error('JVSend: \'jivo_onLoadCallback\' is already defined');
	}else{
		w[config.jvCallback] = function(){
			trigger('enabled');
		}
	}
	
	DOMready(function(){
		if(w.hasOwnProperty('parent')){
			if(w.parent.document.getElementById(config.outerId)){
				trigger('enabled');
			}
		}
	});
	
	var on = function(eventType, eventHandler){
		if(listeners.hasOwnProperty(eventType) && typeof eventHandler == 'function'){
			listeners[eventType].push(eventHandler);
		}
	}
	
	var trigger = function(eventType, args){
		if(listeners.hasOwnProperty(eventType)){
			listeners[eventType].forEach(function(handler){
				handler.apply(this, args);
			});
		}
	}
	
	var unbind = function(eventType, eventHandler){
		if(listeners.hasOwnProperty(eventType) && typeof eventHandler == 'function'){
			listeners[eventType].forEach(function(handler, handlerIndex){
				if(handler === eventHandler){
					delete(listeners[eventType][handlerIndex]);
				}
			});
		}
	}
	
	var ready	= false,
		loaded	= false,
		hApi,
		hIm;
	var waitForReady = function(){
		loaded = true;
		if(w.parent.document.getElementById(config.outerId)){
			trigger('alreadyEnabled');
			
			var	cw = w.parent.document.getElementById(config.chatifId).contentWindow,
				JIVO_HACK_API = hApi = cw.Jivo,
				JIVO_HACK_IM	= hIm = cw.document;
			
			ready = true;
			trigger('ready', [JIVO_HACK_API, JIVO_HACK_IM]);
		}
	}
	
	on('enabled', waitForReady);
	
	var load = function(){
		var f = function(){
			setTimeout(function(){
				w.jivo_api.open();
			}, 1);
			
			var waitJivoAsyncEnable = function(callback){
				if(typeof callback == 'function'){
					var fn = function(){
						if(w.document.getElementById(config.chatifId)){
							clearInterval(iAsyncLoadWatcher);
							callback();
						}
					}
					var iAsyncLoadWatcher = setInterval(fn, 1);
				}
			}
			
			waitJivoAsyncEnable(function(){
				var i = w.document.getElementById(config.chatifId);
				var iw = i.contentWindow;
				var timer = setInterval(function(){
					if(typeof iw.Jivo != 'undefined'){
						clearInterval(timer);
						hApi = iw.Jivo; hIm = iw.document;
						trigger('ready', [hApi, hIm]);
						ready = true;
					}
				}, 10);
			});
		}
		if(loaded){
			f();
		}else{
			on('enabled', f);
		}
	}
	
	var JVSend = function(){
		var self = this;
		
		this.on = function(eventType, eventHandler){
			return on(eventType, eventHandler);
		};
		
		this.send = function(message){
			var s = function(a, d){
				w.jivo_api.open();
				if(w.jivo_config.chat_mode == 'online'){
					setTimeout(function(){
						a.Online.Controller.sendMessage(message);
					}, 300);
				}else{
					d.getElementById(config.imTextarea).value = message;
				}
			}
			
			if(ready == true){
				s(hApi, hIm);
			}else{
				on('ready', s);
				load();
			}
		}
	};
	
	w.JVSend = new JVSend;
})(window);
