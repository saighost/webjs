(function($){
	var web = {
			getRouters : {},
			config: {},
			host: location.origin
		},
		ie,
		cache = {},
		timeout = {};
	if (/MSIE ([^;]+)/.test(navigator.userAgent;)) ie = parseFloat(RegExp['$1']);
	$.getScript('https://raw.github.com/janl/mustache.js/master/mustache.js', function () {	
		$.mustache = Mustache.to_html;
	});
	web.conn = function (host) {
		this.host = host;
		if (this.host[this.host.length - 1] !== '/') this.host += '/';
		return this;
	};
	web.getData = function (action, options, tmplName, callback) {
		if (cache[action] !== undefined || sessionStorage[action] !== undefined) {
			if (new Date().getTime() - timeout[action] <= 300000) {
				callback(cache[action]);
			} else {
				var origin = this.host + action;
				if (ie !== undefined || ie < 9) {
					options.render = 1;
					options.tmpl = tmplName;
					$.get(origin, options, function (data) {
						callback(data);
						timeout[action] = new Date().getTime();
						cache[action] = data;
					});
				} else {
					$.get(origin, options, function (data) {
						$.get(this.host + this.config.tmplDir + '/' + tmplName + '.html')
						callback(JSON.parse(data));
						if (sessionStorage) sessionStorage[action] = data;
					}, 'json');
				}
			}
		} else {
			var origin = this.host + action;
			if (ie !== undefined || ie < 9) {
				options.render = 1;
				options.tmpl = tmplName;
				$.get(origin, options, function (data) {
					callback(data);
					timeout[action] = new Date().getTime();
					cache[action] = data;
				});
			} else {
				$.get(origin, options, function (data) {
					$.get(this.host + this.config.tmplDir + '/' + tmplName + '.html')
					callback(JSON.parse(data));
					if (sessionStorage) sessionStorage[action] = data;
				}, 'json');
			}
		}
		return this;
	};
	web.get = function (_getRouter) {
		for (var key in _getRouter) this.getRouter[key] = _getRouter[key];
		return this;
	};
	web.set = function (key, value) {
		this.config[key] = value;
		return this;
	};
	function parseQS() {
		var qss = {},
			qs = (location.search > 0 ? location.search.substring(1) : ""),
			items = qs.split('&'),
			item = null;
		for (var i = 0;i < items.length;i++) {
			item = items[i].split('=');
			qss[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
		}
		web.qs = qss;
	}
	function getHandler() {
		for (var key in web.getRouters) {
			if (location.pathname.substring(1) == key) web.getRouters[key](web.qs);
		} 
	}
	praseQS();
	getHandler();
	window.onpopstate = function (e) {
		praseQS();
		getHandler();
	}
})(jQuery);