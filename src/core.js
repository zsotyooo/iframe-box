var IBox = function(options) {
	    this.layback(options);
	    this.create();
	},
	IBox_Defaults = IBox_Defaults || {};

(function($, IBox, IBox_Defaults) {
	IBox._iframeCounter = 0;
	lb = layback(IBox)
	.defaults({
	    data: $.extend({
			    	baseUrl: "test/sandboxes",
			    	pageUrl: null,
			    	iframeId: null,
			    	iframe: null,
			    	document: null,
			    	window: null
			    },
			    IBox_Defaults
		    )
	})
	.use('setget') 
	.make();

	lb.addClassMethod('getNextIframeId', function(iframeId){
		return 'iboxIframe' + IBox._iframeCounter++;
	});

	lb.addMethod('destroy', function(){
		var iframe = this.getIframe(); 
		if (iframe) {
			iframe.remove();
		}
		return this;
	});

	lb.addMethod('create', function(iframeId) {
		this.destroy();

		this.setIframeId(iframeId || this.getIframeId() || IBox.getNextIframeId());

		this.dispatch('create-before');

		iframeId = this.getIframeId();

		var iframe = $('<iframe id="' + iframeId + '"></iframe>');
		
		iframe.appendTo($('body'));
		this.setIframe(iframe);

		this.dispatch('create-after');

		return this;
	});

	lb.addMethod('createPageUrl', function(page) {
		if (page.indexOf('http://') === 0 || page.indexOf('https://') === 0 || page.indexOf('//') === 0) {
			return page;
		}
		return this.getBaseUrl() + '/' + page;
	});

	lb.addMethod('visitPage', function(page, done) {
		var This = this;

		this.setPageUrl(this.createPageUrl(page));

		this.dispatch('page-visit-before');

		this.getIframe().attr('src', this.getPageUrl());
		
		this.getIframe().load(function(){
			This.setDocument(this.contentDocument);
			This.setWindow(this.contentWindow);
			
			setTimeout(function(){
				if (done) {
					done();
				}
				This.dispatch('page-visit-after');
			}, 1000);
		});
		
		return this;
	});

	lb.addMethod('isOnPage', function(page) {
		return this.getIframe().attr('src') == this.createPageUrl(page);
	});

	lb.addMethod('document', function(page, done) {
		return this.getDocument();
	});

	lb.addMethod('window', function(page, done) {
		return this.getWindow();
	});

	lb.addMethod('$', function(selector) {
		return $(selector, this.document());
	});

	lb.addMethod('getVar', function(varname) {
		return this.window()[varname];
	});

	lb.addMethod('getForm', function(selector) {
		return new IBoxForm(this, selector);
	});
})(jQuery, IBox, IBox_Defaults);