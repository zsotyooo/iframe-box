'use strict';

/*
Feature: Iframe sandbox
*/
describe('Iframe sandbox', function() {

	/*
	Scenario: I can create an iframe
	 */
	context('I can create an iframe', function() {
		describe('When I create an instance with iframeId', function() {
			var mySandbox;
			before(function() {
				mySandbox = new IBox({iframeId: 'testIframe'});
			});
			after(function() {
				mySandbox.destroy();
			});
			it('it should create an iframe with the given id', function() {
				expect($('#testIframe').is('iframe')).to.be.true;
				expect(mySandbox.getIframe().is('iframe')).to.be.true;
			});
			it('it should create an iframe with the given id by calling the create method', function() {
				expect(mySandbox.create('testIframe2').getIframe().is('iframe')).to.be.true;
				expect($('#testIframe2').is('iframe')).to.be.true;
			});
		});

		describe('When I create an instance without an id', function() {
			var mySandbox;
			before(function() {
				mySandbox = new IBox();
			});
			after(function() {
				mySandbox.destroy();
			});
			it('it should create an iframe with a generated id', function() {
				expect(mySandbox.getIframe().is('iframe')).to.be.true;
				expect(mySandbox.getIframe().attr('id')).not.to.be.null;
			});
			it('it should create an iframe with a generated id by calling the create method without arguments', function(){
				expect(mySandbox.create().getIframe().is('iframe')).to.be.true;
				expect(mySandbox.create().getIframe().attr('id')).not.to.be.null;
			});
		});

		describe('When i create a new iframe', function() {
			var mySandbox;
			before(function() {
				mySandbox = new IBox({iframeId: 'testIframe'});
				mySandbox.create('newTestIframe');
			});
			after(function() {
				mySandbox.destroy();
			});
			it('it should remove the previous one', function() {
				expect($('#testIframe').get()).to.be.empty;
			});
		});
	});

	/*
	Scenario: I can visit a page
	 */
	context('I can visit a page', function() {
		describe('When I visit a page', function() {
			var mySandbox;
			before(function(done) {
				mySandbox = new IBox({iframeId: 'testIframe'});
				mySandbox.visitPage('test.html', done);
			});
			after(function() {
				mySandbox.destroy();
			});
			it('it is loaded', function() {
				var text = $('div#message', mySandbox.document()).text();
				expect(text).to.be.eql('Test page loaded');
			});
			it('i can use the $ method reaching the elements inside the iframe', function() {
				expect(mySandbox.$('div#message').get()).not.to.be.empty;
			});
			it('i can access the javascript objects', function() {
				expect(mySandbox.getVar('test')).to.be.eql('something');
			});
		});
	});
});