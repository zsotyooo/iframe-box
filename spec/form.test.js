'use strict';

/*
Feature: Iframe sandbox
*/
describe('Form', function() {

	/*
	Scenario: I can get a form inside my sandbox
	 */
	context('I can get a form inside my sandbox', function() {
		describe('When I call getForm() on my sandbox object', function() {
			var mySandbox, form;
			before(function(done) {
				mySandbox = new IBox({iframeId: 'testIframe'});
				mySandbox.visitPage('form.html', done);
			});
			after(function() {
				mySandbox.destroy();
			});

			it('it should get me the form', function() {
				form = mySandbox.getForm('#testform');
				expect(form.form().get()).not.to.be.empty;
			});
		});
	});

	/*
	Scenario: I populate my form
	 */
	context('I populate my form', function() {
		describe('When I call populate() on my form object', function() {
			var mySandbox, form;
			before(function(done) {
				mySandbox = new IBox({iframeId: 'testIframe'});
				mySandbox.visitPage('form.html', function(){
					form = mySandbox.getForm('#testform');
					form.populate(
						{
							text: 'test value'
						}
					);
					done();
				});
			});
			after(function() {
				mySandbox.destroy();
			});

			it('it should be able to populate my form', function() {
				expect(form.getFormElement('input[name="text"]').val()).to.be.eql('test value');
			});
		});
	});

	/*
	Scenario: I can get form elements of my form
	 */
	context('I can get form elements of my form', function() {
		describe('When I call getFormElement(selector) on my form object', function() {
			var mySandbox, form;
			before(function(done) {
				mySandbox = new IBox({iframeId: 'testIframe'});
				mySandbox.visitPage('form.html', function(){
					form = mySandbox.getForm('#testform');
					form.getFormElement('input[name="text"]')
					.simulate(
						'key-sequence',
						{
							sequence: 'test value',
							callback: function() {
								done();			
							}
						}
					);
				});
			});
			after(function() {
				mySandbox.destroy();
			});

			it('it should get me the form element(s) matching the selector', function() {
				expect(form.getFormElement('input[name="text"]').get()).not.to.be.empty;
			});

			it('it should be able to simulate events on my element', function() {
				expect(form.getFormElement('input[name="text"]').val()).to.be.eql('test value');
			});
		});
	});
});