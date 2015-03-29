var IBoxForm = function (iBox, selector) {
	this.layback({element: selector, box: iBox});
};
(function($, IBoxForm) {
	var lb = layback(IBoxForm)
		.use('setget')
		.make();

	lb.addMethod('form', function(){
		return this.getBox().$(this.get('element'));
	});

	lb.addMethod('getFormElement', function(selector){
		return $(selector, this.form());
	});

	lb.addMethod('populate', function(){
		return this.form().populate.apply(this.form(), Array.prototype.slice.call(arguments));
	});
})(jQuery, IBoxForm);