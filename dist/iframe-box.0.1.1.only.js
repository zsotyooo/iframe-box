jQuery.fn.populate = function(obj, options) {
    function parseJSON(obj, path) {
        path = path || "";
        if (obj == undefined) {} else if (obj.constructor == Object) {
            for (var prop in obj) {
                var name = path + (path == "" ? prop : "[" + prop + "]");
                parseJSON(obj[prop], name);
            }
        } else if (obj.constructor == Array) {
            for (var i = 0; i < obj.length; i++) {
                var index = options.useIndices ? i : "";
                index = options.phpNaming ? "[" + index + "]" : index;
                var name = path + index;
                parseJSON(obj[i], name);
            }
        } else {
            if (arr[path] == undefined) {
                arr[path] = obj;
            } else if (arr[path].constructor != Array) {
                arr[path] = [ arr[path], obj ];
            } else {
                arr[path].push(obj);
            }
        }
    }
    function debug(str) {
        if (window.console && console.log) {
            console.log(str);
        }
    }
    function getElementName(name) {
        if (!options.phpNaming) {
            name = name.replace(/\[\]$/, "");
        }
        return name;
    }
    function populateElement(parentElement, name, value) {
        var selector = options.identifier == "id" ? "#" + name : "[" + options.identifier + '="' + name + '"]';
        var element = jQuery(selector, parentElement);
        value = value.toString();
        value = value == "null" ? "" : value;
        element.html(value);
    }
    function populateFormElement(form, name, value) {
        var name = getElementName(name);
        var element = form[name];
        if (element == undefined) {
            element = jQuery("#" + name, form);
            if (element) {
                element.html(value);
                return true;
            }
            if (options.debug) {
                debug("No such element as " + name);
            }
            return false;
        }
        if (options.debug) {
            _populate.elements.push(element);
        }
        elements = element.type == undefined && element.length ? element : [ element ];
        for (var e = 0; e < elements.length; e++) {
            var element = elements[e];
            if (!element || typeof element == "undefined" || typeof element == "function") {
                continue;
            }
            switch (element.type || element.tagName) {
              case "radio":
                element.checked = element.value != "" && value.toString() == element.value;

              case "checkbox":
                var values = value.constructor == Array ? value : [ value ];
                for (var j = 0; j < values.length; j++) {
                    element.checked |= element.value == values[j];
                }
                break;

              case "select-multiple":
                var values = value.constructor == Array ? value : [ value ];
                for (var i = 0; i < element.options.length; i++) {
                    for (var j = 0; j < values.length; j++) {
                        element.options[i].selected |= element.options[i].value == values[j];
                    }
                }
                break;

              case "select":
              case "select-one":
                element.value = value.toString() || value;
                break;

              case "text":
              case "button":
              case "textarea":
              case "submit":
              default:
                value = value == null ? "" : value;
                element.value = value;
            }
        }
    }
    if (obj === undefined) {
        return this;
    }
    var options = jQuery.extend({
        phpNaming: true,
        phpIndices: false,
        resetForm: true,
        identifier: "id",
        debug: false
    }, options);
    if (options.phpIndices) {
        options.phpNaming = true;
    }
    var arr = [];
    parseJSON(obj);
    if (options.debug) {
        _populate = {
            arr: arr,
            obj: obj,
            elements: []
        };
    }
    this.each(function() {
        var tagName = this.tagName.toLowerCase();
        var method = tagName == "form" ? populateFormElement : populateElement;
        if (tagName == "form" && options.resetForm) {
            this.reset();
        }
        for (var i in arr) {
            method(this, i, arr[i]);
        }
    });
    return this;
};

var IBoxForm = function(iBox, selector) {
    this.layback({
        element: selector,
        box: iBox
    });
};

(function($, IBoxForm) {
    var lb = layback(IBoxForm).use("setget").make();
    lb.addMethod("form", function() {
        return this.getBox().$(this.get("element"));
    });
    lb.addMethod("getFormElement", function(selector) {
        return $(selector, this.form());
    });
    lb.addMethod("populate", function() {
        return this.form().populate.apply(this.form(), Array.prototype.slice.call(arguments));
    });
})(jQuery, IBoxForm);

var IBox = function(options) {
    this.layback(options);
    this.create();
}, IBox_Defaults = IBox_Defaults || {};

(function($, IBox, IBox_Defaults) {
    IBox._iframeCounter = 0;
    lb = layback(IBox).defaults({
        data: $.extend({
            baseUrl: "test/sandboxes",
            pageUrl: null,
            iframeId: null,
            iframe: null,
            document: null,
            window: null
        }, IBox_Defaults)
    }).use("setget").make();
    lb.addClassMethod("getNextIframeId", function(iframeId) {
        return "iboxIframe" + IBox._iframeCounter++;
    });
    lb.addMethod("destroy", function() {
        var iframe = this.getIframe();
        if (iframe) {
            iframe.remove();
        }
        return this;
    });
    lb.addMethod("create", function(iframeId) {
        this.destroy();
        this.setIframeId(iframeId || this.getIframeId() || IBox.getNextIframeId());
        this.dispatch("create-before");
        iframeId = this.getIframeId();
        var iframe = $('<iframe id="' + iframeId + '"></iframe>');
        iframe.appendTo($("body"));
        this.setIframe(iframe);
        this.dispatch("create-after");
        return this;
    });
    lb.addMethod("createPageUrl", function(page) {
        if (page.indexOf("http://") === 0 || page.indexOf("https://") === 0 || page.indexOf("//") === 0) {
            return page;
        }
        return this.getBaseUrl() + "/" + page;
    });
    lb.addMethod("visitPage", function(page, done) {
        var This = this;
        this.setPageUrl(this.createPageUrl(page));
        this.dispatch("page-visit-before");
        this.getIframe().attr("src", this.getPageUrl());
        this.getIframe().load(function() {
            This.setDocument(this.contentDocument);
            This.setWindow(this.contentWindow);
            setTimeout(function() {
                if (done) {
                    done();
                }
                This.dispatch("page-visit-after");
            }, 1e3);
        });
        return this;
    });
    lb.addMethod("isOnPage", function(page) {
        return this.getIframe().attr("src") == this.createPageUrl(page);
    });
    lb.addMethod("document", function(page, done) {
        return this.getDocument();
    });
    lb.addMethod("window", function(page, done) {
        return this.getWindow();
    });
    lb.addMethod("$", function(selector) {
        return $(selector, this.document());
    });
    lb.addMethod("getVar", function(varname) {
        return this.window()[varname];
    });
    lb.addMethod("getForm", function(selector) {
        return new IBoxForm(this, selector);
    });
})(jQuery, IBox, IBox_Defaults);