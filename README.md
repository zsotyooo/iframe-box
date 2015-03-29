# Iframe-box
Iframe box is a small javascript tool created for testing user interfaces in Iframes.
You can easily access any kind of information inside the Iframe.
In addition You can manipulate forms, and form elements.

[![NPM](https://nodei.co/npm/iframe-box.png)](https://nodei.co/npm/iframe-box/)

## Using the Iframe box object
### Creating an Iframe box
```javascript
// simple usage by using the default settings, and generated id
var testBox = new IBox;
// setting a base url, and id
var testBox = new IBox({
    baseUrl: 'tests/sandboxes',
    iframeId: 'testIframe'
});
// or:
testBox.setBaseUrl('tests/sandboxes');
```
### Removing it
```javascript
var testBox = new IBox;
testBox.destroy();
// or:
testBox.setBaseUrl('tests/sandboxes');
```
### Loading a page
```javascript
var testBox = new IBox;
// test.html is relative to the base URL
// Note the asynchronous behaviour
testBox.visitPage('test.html', callback);
```

### Accessing objects inside the Iframe
```javascript
var testBox = new IBox;
testBox.visitPage('test.html', function() {
    // the document object
    testBox.document();
    // the window object
    testBox.window();
    // DOM elements
    testBox.$('.test-element');
    $('.test-element', testBox.document());
    // javascript objects
    testBox.getVar('testObject');
    testBox.window().testObject;
});
```

### Simulating events on the elements
For more info go to: [jquery-simulate-ext github page](https://github.com/j-ulrich/jquery-simulate-ext "jquery-simulate-ext github page")
```javascript
var testBox = new IBox;
testBox.visitPage('test.html', function() {
    testBox.$('.test-element').simulate('mouseover');
});
```

## Using froms inside the Iframe
### Getting a form object, and using it
```javascript
var testBox = new IBox;
testBox.visitPage('test.html', function() {
    var form = testBox.getForm('form#testform');
    // getting the form element (jQuery)
    form.form();
    // getting form elements inside the form (jQuery)
    form.getFormElement('input[name="something"]');
    // simulating user input on this element jQuery.simulate
    form.getFormElement('input[name="something"]')
        .simulate(
    		'key-sequence',
    		{
    			sequence: 'test value'
    		}
    	);
});
```

### Populating a from
For more info go to: [Dave Stuart's jQuery populate
documantation](http://davestewart.io/plugins/jquery/jquery-populate/ "Dave Stuart's jQuery populate
documantation")
```javascript
var testBox = new IBox;
testBox.visitPage('test.html', function() {
    // it uses jQuery.populate
    testBox.getForm('form#testform')
        .populate({
            something: 'test value'
        });
});
```

# Using it in tests
In these examaples I'm using [Mocha](http://mochajs.org/ "Mocha"), with [Chai](chaijs.com "Chai") assertion tool, and [Testem](https://github.com/airportyh/testem "Testem") as the test runner, but feel free to use it with your preferred testing tools.
## Installation and setup
### Installation
Assuming that you are already using **Node package manager (npm)**.
```cli
npm install iframe-box --save-dev
```

### Setting it up
#### In testem.json
Assuming that you functional (BDD) tests are in the spec folder, and you are not already using jQuery.

In this example we are testing in chrome stabile, and firefox stabile only.
```json
{
  "framework": "mocha+chai",
  "src_files": [
    "node_modules/jquery/dist/jquery.js",
    "spec/setup.js",
    "node_modules/iframe-box/iframe-box.js",
    "spec/*.test.js"
  ],
  "launch_in_dev": [
    "chrome",
    "firefox"
  ]
}
```
#### In setup.js
Here we set up mocha, chai expect, and the default base URL for our iframe.
In this example the static HTML files are loacted in the `spec/sandboxes` folder (it's `test/sandboxes` by default).
```javacript
var expect = chai.expect;
mocha.setup('bdd');
var IBox_Defaults = {
	baseUrl: "spec/sandboxes"
};
```

#### In package.json
I usually to add a script into my package json to be able to quickly start testem by `npm test`.
```json
{
    // ...
    "scripts": {
        "test": "./node_modules/.bin/testem"
    }
}
```

### Using iframe-box in the tests
You can use the Iframes always assyncronously. The more advanced testing frameworks such as Mocha or Jasmine provide assyncronous testing.

In the examples I am using the `before`, or `beforeAll` hooks, with a `promise` object (`done`).

#### Simple usage
```javascript
// ...
var testBox;
before(function(done) {
	testBox = new IBox;
	testBox.visitPage('test.html', done);
});
after(function() {
	testBox.destroy();
});

it ('it has a body', function() {
    expect(testBox.$('body').length).to.be.eql(1);
});

it ('it uses jQuery', function() {
    expect(testBox.getVar('jQuery')).not.to.be.undefined;
});
```

#### Using the forms in test

In these examples we are validating numbers, and an email address.

```javascript
// ...
var testBox;
before(function(done) {
	testBox.visitPage('form.html', function(){
        testBox = new IBox({iframeId: 'testIframe'});
        form = testBox.getForm('#testform');
        form.populate({
            number1: 3,
            number2: 'Asd'
        });
        // Calling done explicit
        done();
    });
});
after(function() {
	testBox.destroy();
});

it ('it validates the number to be OK', function() {
    expect(form.getFormElement('input[name="number1"]').hasClass('validation-passed')).to.be.true;
});
it ('it validates the string to be worng', function() {
    expect(form.getFormElement('input[name="number2"]').hasClass('validation-error')).to.be.true;
});
```
```javascript
// ...
var testBox;
before(function(done) {
	testBox.visitPage('form.html', function(){
        testBox = new IBox({iframeId: 'testIframe'});
        form = testBox.getForm('#testform');
        form.getFormElement('input[name="email"]')
        .simulate(
            'key-sequence',
            {
                sequence: 'dummy@example.com',
                callback: function() {
                    // Calling done explicit, once the key sequence applied
                    done();			
                }
            }
        );
    });
});
after(function() {
	testBox.destroy();
});

it ('it validates the email to be OK', function() {
    expect(form.getFormElement('input[name="email"]').hasClass('validation-passed')).to.be.true;
});
```

# Downloads
#### Standalone version (all dependencies, but jQuery included): 
* [Minified](https://github.com/zsotyooo/iframe-box/blob/master/iframe-box.min.js "Minified version")
* [Full](https://github.com/zsotyooo/iframe-box/blob/master/iframe-box.js "Full version")

#### Stripped version (no dependencies included):
* [Minified](https://github.com/zsotyooo/iframe-box/blob/master/iframe-box.only.min.js "Minified version")
* [Full](https://github.com/zsotyooo/iframe-box/blob/master/iframe-box.only.js "Full version")

##### If you are using the stripped version you will have to include all the dependencies yourself.
* [Layback.js](https://github.com/zsotyooo/layback.js "layback.js")
* [Dave Stuart's jQuery populate](http://davestewart.io/plugins/jquery/jquery-populate/ "Dave Stuart's jQuery populate")
* [J Ulrich's jquery-simulate-ext](https://github.com/j-ulrich/jquery-simulate-ext "J Ulrich's jquery-simulate-ext")

#### Credits:
* Dave Stuart for jQuery populate
* J Ulrich for the extended simulate plugin
* And all the folks who love javascript, TDD, BDD, and open source ;)

#### Wanna contribute?
* Create bug tickets!
* Just fork and make pull requests!
* But first check out [Layback.js](https://github.com/zsotyooo/layback.js "layback.js") to understand how it works.