(function() {
    bililiteRange = function(el, debug) {
        var ret;
        if (debug) {
            ret = new NothingRange();
        } else if (document.selection) {
            ret = new IERange();
        } else if (window.getSelection && el.setSelectionRange) {
            ret = new InputRange();
        } else if (window.getSelection) {
            ret = new W3CRange();
        } else {
            ret = new NothingRange();
        }
        ret._el = el;
        ret._textProp = textProp(el);
        ret._bounds = [ 0, ret.length() ];
        return ret;
    };
    function textProp(el) {
        if (typeof el.value != "undefined") return "value";
        if (typeof el.text != "undefined") return "text";
        if (typeof el.textContent != "undefined") return "textContent";
        return "innerText";
    }
    function Range() {}
    Range.prototype = {
        length: function() {
            return this._el[this._textProp].replace(/\r/g, "").length;
        },
        bounds: function(s) {
            if (s === "all") {
                this._bounds = [ 0, this.length() ];
            } else if (s === "start") {
                this._bounds = [ 0, 0 ];
            } else if (s === "end") {
                this._bounds = [ this.length(), this.length() ];
            } else if (s === "selection") {
                this.bounds("all");
                this._bounds = this._nativeSelection();
            } else if (s) {
                this._bounds = s;
            } else {
                var b = [ Math.max(0, Math.min(this.length(), this._bounds[0])), Math.max(0, Math.min(this.length(), this._bounds[1])) ];
                return b;
            }
            return this;
        },
        select: function() {
            this._nativeSelect(this._nativeRange(this.bounds()));
            return this;
        },
        text: function(text, select) {
            if (arguments.length) {
                this._nativeSetText(text, this._nativeRange(this.bounds()));
                if (select == "start") {
                    this.bounds([ this._bounds[0], this._bounds[0] ]);
                    this.select();
                } else if (select == "end") {
                    this.bounds([ this._bounds[0] + text.length, this._bounds[0] + text.length ]);
                    this.select();
                } else if (select == "all") {
                    this.bounds([ this._bounds[0], this._bounds[0] + text.length ]);
                    this.select();
                }
                return this;
            } else {
                return this._nativeGetText(this._nativeRange(this.bounds()));
            }
        },
        insertEOL: function() {
            this._nativeEOL();
            this._bounds = [ this._bounds[0] + 1, this._bounds[0] + 1 ];
            return this;
        }
    };
    function IERange() {}
    IERange.prototype = new Range();
    IERange.prototype._nativeRange = function(bounds) {
        var rng;
        if (this._el.tagName == "INPUT") {
            rng = this._el.createTextRange();
        } else {
            rng = document.body.createTextRange();
            rng.moveToElementText(this._el);
        }
        if (bounds) {
            if (bounds[1] < 0) bounds[1] = 0;
            if (bounds[0] > this.length()) bounds[0] = this.length();
            if (bounds[1] < rng.text.replace(/\r/g, "").length) {
                rng.moveEnd("character", -1);
                rng.moveEnd("character", bounds[1] - rng.text.replace(/\r/g, "").length);
            }
            if (bounds[0] > 0) rng.moveStart("character", bounds[0]);
        }
        return rng;
    };
    IERange.prototype._nativeSelect = function(rng) {
        rng.select();
    };
    IERange.prototype._nativeSelection = function() {
        var rng = this._nativeRange();
        var len = this.length();
        if (document.selection.type != "Text") return [ len, len ];
        var sel = document.selection.createRange();
        try {
            return [ iestart(sel, rng), ieend(sel, rng) ];
        } catch (e) {
            return sel.parentElement().sourceIndex < this._el.sourceIndex ? [ 0, 0 ] : [ len, len ];
        }
    };
    IERange.prototype._nativeGetText = function(rng) {
        return rng.text.replace(/\r/g, "");
    };
    IERange.prototype._nativeSetText = function(text, rng) {
        rng.text = text;
    };
    IERange.prototype._nativeEOL = function() {
        if (typeof this._el.value != "undefined") {
            this.text("\n");
        } else {
            this._nativeRange(this.bounds()).pasteHTML("<br/>");
        }
    };
    function iestart(rng, constraint) {
        var len = constraint.text.replace(/\r/g, "").length;
        if (rng.compareEndPoints("StartToStart", constraint) <= 0) return 0;
        if (rng.compareEndPoints("StartToEnd", constraint) >= 0) return len;
        for (var i = 0; rng.compareEndPoints("StartToStart", constraint) > 0; ++i, rng.moveStart("character", -1)) ;
        return i;
    }
    function ieend(rng, constraint) {
        var len = constraint.text.replace(/\r/g, "").length;
        if (rng.compareEndPoints("EndToEnd", constraint) >= 0) return len;
        if (rng.compareEndPoints("EndToStart", constraint) <= 0) return 0;
        for (var i = 0; rng.compareEndPoints("EndToStart", constraint) > 0; ++i, rng.moveEnd("character", -1)) ;
        return i;
    }
    function InputRange() {}
    InputRange.prototype = new Range();
    InputRange.prototype._nativeRange = function(bounds) {
        return bounds || [ 0, this.length() ];
    };
    InputRange.prototype._nativeSelect = function(rng) {
        this._el.setSelectionRange(rng[0], rng[1]);
    };
    InputRange.prototype._nativeSelection = function() {
        return [ this._el.selectionStart, this._el.selectionEnd ];
    };
    InputRange.prototype._nativeGetText = function(rng) {
        return this._el.value.substring(rng[0], rng[1]);
    };
    InputRange.prototype._nativeSetText = function(text, rng) {
        var val = this._el.value;
        this._el.value = val.substring(0, rng[0]) + text + val.substring(rng[1]);
    };
    InputRange.prototype._nativeEOL = function() {
        this.text("\n");
    };
    function W3CRange() {}
    W3CRange.prototype = new Range();
    W3CRange.prototype._nativeRange = function(bounds) {
        var rng = document.createRange();
        rng.selectNodeContents(this._el);
        if (bounds) {
            w3cmoveBoundary(rng, bounds[0], true, this._el);
            rng.collapse(true);
            w3cmoveBoundary(rng, bounds[1] - bounds[0], false, this._el);
        }
        return rng;
    };
    W3CRange.prototype._nativeSelect = function(rng) {
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(rng);
    };
    W3CRange.prototype._nativeSelection = function() {
        var rng = this._nativeRange();
        if (window.getSelection().rangeCount == 0) return [ this.length(), this.length() ];
        var sel = window.getSelection().getRangeAt(0);
        return [ w3cstart(sel, rng), w3cend(sel, rng) ];
    };
    W3CRange.prototype._nativeGetText = function(rng) {
        return rng.toString();
    };
    W3CRange.prototype._nativeSetText = function(text, rng) {
        rng.deleteContents();
        rng.insertNode(document.createTextNode(text));
        this._el.normalize();
    };
    W3CRange.prototype._nativeEOL = function() {
        var rng = this._nativeRange(this.bounds());
        rng.deleteContents();
        var br = document.createElement("br");
        br.setAttribute("_moz_dirty", "");
        rng.insertNode(br);
        rng.insertNode(document.createTextNode("\n"));
        rng.collapse(false);
    };
    function nextnode(node, root) {
        if (node.firstChild) return node.firstChild;
        if (node.nextSibling) return node.nextSibling;
        if (node === root) return null;
        while (node.parentNode) {
            node = node.parentNode;
            if (node == root) return null;
            if (node.nextSibling) return node.nextSibling;
        }
        return null;
    }
    function w3cmoveBoundary(rng, n, bStart, el) {
        if (n <= 0) return;
        var node = rng[bStart ? "startContainer" : "endContainer"];
        if (node.nodeType == 3) {
            n += rng[bStart ? "startOffset" : "endOffset"];
        }
        while (node) {
            if (node.nodeType == 3) {
                if (n <= node.nodeValue.length) {
                    rng[bStart ? "setStart" : "setEnd"](node, n);
                    if (n == node.nodeValue.length) {
                        for (var next = nextnode(node, el); next && next.nodeType == 3 && next.nodeValue.length == 0; next = nextnode(next, el)) {
                            rng[bStart ? "setStartAfter" : "setEndAfter"](next);
                        }
                        if (next && next.nodeType == 1 && next.nodeName == "BR") rng[bStart ? "setStartAfter" : "setEndAfter"](next);
                    }
                    return;
                } else {
                    rng[bStart ? "setStartAfter" : "setEndAfter"](node);
                    n -= node.nodeValue.length;
                }
            }
            node = nextnode(node, el);
        }
    }
    var START_TO_START = 0;
    var START_TO_END = 1;
    var END_TO_END = 2;
    var END_TO_START = 3;
    function w3cstart(rng, constraint) {
        if (rng.compareBoundaryPoints(START_TO_START, constraint) <= 0) return 0;
        if (rng.compareBoundaryPoints(END_TO_START, constraint) >= 0) return constraint.toString().length;
        rng = rng.cloneRange();
        rng.setEnd(constraint.endContainer, constraint.endOffset);
        return constraint.toString().length - rng.toString().length;
    }
    function w3cend(rng, constraint) {
        if (rng.compareBoundaryPoints(END_TO_END, constraint) >= 0) return constraint.toString().length;
        if (rng.compareBoundaryPoints(START_TO_END, constraint) <= 0) return 0;
        rng = rng.cloneRange();
        rng.setStart(constraint.startContainer, constraint.startOffset);
        return rng.toString().length;
    }
    function NothingRange() {}
    NothingRange.prototype = new Range();
    NothingRange.prototype._nativeRange = function(bounds) {
        return bounds || [ 0, this.length() ];
    };
    NothingRange.prototype._nativeSelect = function(rng) {};
    NothingRange.prototype._nativeSelection = function() {
        return [ 0, 0 ];
    };
    NothingRange.prototype._nativeGetText = function(rng) {
        return this._el[this._textProp].substring(rng[0], rng[1]);
    };
    NothingRange.prototype._nativeSetText = function(text, rng) {
        var val = this._el[this._textProp];
        this._el[this._textProp] = val.substring(0, rng[0]) + text + val.substring(rng[1]);
    };
    NothingRange.prototype._nativeEOL = function() {
        this.text("\n");
    };
})();

(function($, undefined) {
    "use strict";
    var rkeyEvent = /^key/, rmouseEvent = /^(?:mouse|contextmenu)|click/, rdocument = /\[object (?:HTML)?Document\]/;
    function isDocument(ele) {
        return rdocument.test(Object.prototype.toString.call(ele));
    }
    function windowOfDocument(doc) {
        for (var i = 0; i < window.frames.length; i += 1) {
            if (window.frames[i].document === doc) {
                return window.frames[i];
            }
        }
        return window;
    }
    $.fn.simulate = function(type, options) {
        return this.each(function() {
            new $.simulate(this, type, options);
        });
    };
    $.simulate = function(elem, type, options) {
        var method = $.camelCase("simulate-" + type);
        this.target = elem;
        this.options = options || {};
        if (this[method]) {
            this[method]();
        } else {
            this.simulateEvent(elem, type, this.options);
        }
    };
    $.extend($.simulate, {
        keyCode: {
            BACKSPACE: 8,
            COMMA: 188,
            DELETE: 46,
            DOWN: 40,
            END: 35,
            ENTER: 13,
            ESCAPE: 27,
            HOME: 36,
            LEFT: 37,
            NUMPAD_ADD: 107,
            NUMPAD_DECIMAL: 110,
            NUMPAD_DIVIDE: 111,
            NUMPAD_ENTER: 108,
            NUMPAD_MULTIPLY: 106,
            NUMPAD_SUBTRACT: 109,
            PAGE_DOWN: 34,
            PAGE_UP: 33,
            PERIOD: 190,
            RIGHT: 39,
            SPACE: 32,
            TAB: 9,
            UP: 38
        },
        buttonCode: {
            LEFT: 0,
            MIDDLE: 1,
            RIGHT: 2
        }
    });
    $.extend($.simulate.prototype, {
        simulateEvent: function(elem, type, options) {
            var event = this.createEvent(type, options);
            this.dispatchEvent(elem, type, event, options);
        },
        createEvent: function(type, options) {
            if (rkeyEvent.test(type)) {
                return this.keyEvent(type, options);
            }
            if (rmouseEvent.test(type)) {
                return this.mouseEvent(type, options);
            }
        },
        mouseEvent: function(type, options) {
            var event, eventDoc, doc = isDocument(this.target) ? this.target : this.target.ownerDocument || document, docEle, body;
            options = $.extend({
                bubbles: true,
                cancelable: type !== "mousemove",
                view: windowOfDocument(doc),
                detail: 0,
                screenX: 0,
                screenY: 0,
                clientX: 1,
                clientY: 1,
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                button: 0,
                relatedTarget: undefined
            }, options);
            if (doc.createEvent) {
                event = doc.createEvent("MouseEvents");
                event.initMouseEvent(type, options.bubbles, options.cancelable, options.view, options.detail, options.screenX, options.screenY, options.clientX, options.clientY, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.button, options.relatedTarget || doc.body.parentNode);
                if (event.pageX === 0 && event.pageY === 0 && Object.defineProperty) {
                    eventDoc = isDocument(event.relatedTarget) ? event.relatedTarget : event.relatedTarget.ownerDocument || document;
                    docEle = eventDoc.documentElement;
                    body = eventDoc.body;
                    Object.defineProperty(event, "pageX", {
                        get: function() {
                            return options.clientX + (docEle && docEle.scrollLeft || body && body.scrollLeft || 0) - (docEle && docEle.clientLeft || body && body.clientLeft || 0);
                        }
                    });
                    Object.defineProperty(event, "pageY", {
                        get: function() {
                            return options.clientY + (docEle && docEle.scrollTop || body && body.scrollTop || 0) - (docEle && docEle.clientTop || body && body.clientTop || 0);
                        }
                    });
                }
            } else if (doc.createEventObject) {
                event = doc.createEventObject();
                $.extend(event, options);
                event.button = {
                    0: 1,
                    1: 4,
                    2: 2
                }[event.button] || event.button;
            }
            return event;
        },
        keyEvent: function(type, options) {
            var event, doc;
            options = $.extend({
                bubbles: true,
                cancelable: true,
                view: windowOfDocument(doc),
                ctrlKey: false,
                altKey: false,
                shiftKey: false,
                metaKey: false,
                keyCode: 0,
                charCode: undefined
            }, options);
            doc = isDocument(this.target) ? this.target : this.target.ownerDocument || document;
            if (doc.createEvent) {
                try {
                    event = doc.createEvent("KeyEvents");
                    event.initKeyEvent(type, options.bubbles, options.cancelable, options.view, options.ctrlKey, options.altKey, options.shiftKey, options.metaKey, options.keyCode, options.charCode);
                } catch (err) {
                    event = doc.createEvent("Events");
                    event.initEvent(type, options.bubbles, options.cancelable);
                    $.extend(event, {
                        view: options.view,
                        ctrlKey: options.ctrlKey,
                        altKey: options.altKey,
                        shiftKey: options.shiftKey,
                        metaKey: options.metaKey,
                        keyCode: options.keyCode,
                        charCode: options.charCode
                    });
                }
            } else if (doc.createEventObject) {
                event = doc.createEventObject();
                $.extend(event, options);
            }
            if (!!/msie [\w.]+/.exec(navigator.userAgent.toLowerCase()) || {}.toString.call(window.opera) === "[object Opera]") {
                event.keyCode = options.charCode > 0 ? options.charCode : options.keyCode;
                event.charCode = undefined;
            }
            return event;
        },
        dispatchEvent: function(elem, type, event, options) {
            if (options.jQueryTrigger === true) {
                $(elem).trigger($.extend({}, event, options, {
                    type: type
                }));
            } else if (elem.dispatchEvent) {
                elem.dispatchEvent(event);
            } else if (elem.fireEvent) {
                elem.fireEvent("on" + type, event);
            }
        },
        simulateFocus: function() {
            var focusinEvent, triggered = false, $element = $(this.target);
            function trigger() {
                triggered = true;
            }
            $element.bind("focus", trigger);
            $element[0].focus();
            if (!triggered) {
                focusinEvent = $.Event("focusin");
                focusinEvent.preventDefault();
                $element.trigger(focusinEvent);
                $element.triggerHandler("focus");
            }
            $element.unbind("focus", trigger);
        },
        simulateBlur: function() {
            var focusoutEvent, triggered = false, $element = $(this.target);
            function trigger() {
                triggered = true;
            }
            $element.bind("blur", trigger);
            $element[0].blur();
            setTimeout(function() {
                if ($element[0].ownerDocument.activeElement === $element[0]) {
                    $element[0].ownerDocument.body.focus();
                }
                if (!triggered) {
                    focusoutEvent = $.Event("focusout");
                    focusoutEvent.preventDefault();
                    $element.trigger(focusoutEvent);
                    $element.triggerHandler("blur");
                }
                $element.unbind("blur", trigger);
            }, 1);
        }
    });
    function findCenter(elem) {
        var offset, $document, $elem = $(elem);
        if (isDocument($elem[0])) {
            $document = $elem;
            offset = {
                left: 0,
                top: 0
            };
        } else {
            $document = $($elem[0].ownerDocument || document);
            offset = $elem.offset();
        }
        return {
            x: offset.left + $elem.outerWidth() / 2 - $document.scrollLeft(),
            y: offset.top + $elem.outerHeight() / 2 - $document.scrollTop()
        };
    }
    function findCorner(elem) {
        var offset, $document, $elem = $(elem);
        if (isDocument($elem[0])) {
            $document = $elem;
            offset = {
                left: 0,
                top: 0
            };
        } else {
            $document = $($elem[0].ownerDocument || document);
            offset = $elem.offset();
        }
        return {
            x: offset.left - document.scrollLeft(),
            y: offset.top - document.scrollTop()
        };
    }
    $.extend($.simulate.prototype, {
        simulateDrag: function() {
            var i = 0, target = this.target, options = this.options, center = options.handle === "corner" ? findCorner(target) : findCenter(target), x = Math.floor(center.x), y = Math.floor(center.y), coord = {
                clientX: x,
                clientY: y
            }, dx = options.dx || (options.x !== undefined ? options.x - x : 0), dy = options.dy || (options.y !== undefined ? options.y - y : 0), moves = options.moves || 3;
            this.simulateEvent(target, "mousedown", coord);
            for (;i < moves; i++) {
                x += dx / moves;
                y += dy / moves;
                coord = {
                    clientX: Math.round(x),
                    clientY: Math.round(y)
                };
                this.simulateEvent(target.ownerDocument, "mousemove", coord);
            }
            if ($.contains(document, target)) {
                this.simulateEvent(target, "mouseup", coord);
                this.simulateEvent(target, "click", coord);
            } else {
                this.simulateEvent(document, "mouseup", coord);
            }
        }
    });
})(jQuery);

(function($) {
    "use strict";
    var originalMouseEvent = $.simulate.prototype.mouseEvent, rdocument = /\[object (?:HTML)?Document\]/;
    $.simulate.prototype.mouseEvent = function(type, options) {
        if (options.pageX || options.pageY) {
            var doc = rdocument.test(Object.prototype.toString.call(this.target)) ? this.target : this.target.ownerDocument || document;
            options.clientX = (options.pageX || 0) - $(doc).scrollLeft();
            options.clientY = (options.pageY || 0) - $(doc).scrollTop();
        }
        return originalMouseEvent.apply(this, [ type, options ]);
    };
})(jQuery);

(function($, undefined) {
    "use strict";
    var SpecialKeyCodes = {
        SHIFT: 16,
        CONTROL: 17,
        ALTERNATIVE: 18,
        META: 91,
        LEFT_ARROW: 37,
        UP_ARROW: 38,
        RIGHT_ARROW: 39,
        DOWN_ARROW: 40,
        F1: 112,
        F2: 113,
        F3: 114,
        F4: 115,
        F5: 116,
        F6: 117,
        F7: 118,
        F8: 119,
        F9: 120,
        F10: 121,
        F11: 122,
        F12: 123,
        ENTER: 13,
        TABULATOR: 9,
        ESCAPE: 27,
        BACKSPACE: 8,
        INSERT: 45,
        DELETE: 46,
        HOME: 36,
        END: 35,
        PAGE_UP: 33,
        PAGE_DOWN: 34
    };
    SpecialKeyCodes.CTRL = SpecialKeyCodes.CONTROL;
    SpecialKeyCodes.ALT = SpecialKeyCodes.ALTERNATIVE;
    SpecialKeyCodes.COMMAND = SpecialKeyCodes.META;
    SpecialKeyCodes.TAB = SpecialKeyCodes.TABULATOR;
    SpecialKeyCodes.ESC = SpecialKeyCodes.ESCAPE;
    $.extend($.simulate.prototype, {
        simulateKeyCombo: function() {
            var $target = $(this.target), options = $.extend({
                combo: "",
                eventProps: {},
                eventsOnly: false
            }, this.options), combo = options.combo, comboSplit = combo.split(/(\+)/), plusExpected = false, holdKeys = [], i;
            if (combo.length === 0) {
                return;
            }
            comboSplit = $.grep(comboSplit, function(part) {
                return part !== "";
            });
            for (i = 0; i < comboSplit.length; i += 1) {
                var key = comboSplit[i], keyLowered = key.toLowerCase(), keySpecial = key.toUpperCase().replace("-", "_");
                if (plusExpected) {
                    if (key !== "+") {
                        throw 'Syntax error: expected "+"';
                    } else {
                        plusExpected = false;
                    }
                } else {
                    var keyCode;
                    if (key.length > 1) {
                        keyCode = SpecialKeyCodes[keySpecial];
                        if (keyCode === undefined) {
                            throw 'Syntax error: unknown special key "' + key + '" (forgot "+" between keys?)';
                        }
                        switch (keyCode) {
                          case SpecialKeyCodes.CONTROL:
                          case SpecialKeyCodes.ALT:
                          case SpecialKeyCodes.SHIFT:
                          case SpecialKeyCodes.META:
                            options.eventProps[keyLowered + "Key"] = true;
                            break;
                        }
                        holdKeys.unshift(keyCode);
                        options.eventProps.keyCode = keyCode;
                        options.eventProps.which = keyCode;
                        options.eventProps.charCode = 0;
                        $target.simulate("keydown", options.eventProps);
                    } else {
                        keyCode = $.simulate.prototype.simulateKeySequence.prototype.charToKeyCode(key);
                        holdKeys.unshift(keyCode);
                        options.eventProps.keyCode = keyCode;
                        options.eventProps.which = keyCode;
                        options.eventProps.charCode = undefined;
                        $target.simulate("keydown", options.eventProps);
                        if (options.eventProps.shiftKey) {
                            key = key.toUpperCase();
                        }
                        options.eventProps.keyCode = key.charCodeAt(0);
                        options.eventProps.charCode = options.eventProps.keyCode;
                        options.eventProps.which = options.eventProps.keyCode;
                        $target.simulate("keypress", options.eventProps);
                        if (options.eventsOnly !== true && !options.eventProps.ctrlKey && !options.eventProps.altKey && !options.eventProps.metaKey) {
                            $target.simulate("key-sequence", {
                                sequence: key,
                                triggerKeyEvents: false
                            });
                        }
                    }
                    plusExpected = true;
                }
            }
            if (!plusExpected) {
                throw 'Syntax error: expected key (trailing "+"?)';
            }
            options.eventProps.charCode = undefined;
            for (i = 0; i < holdKeys.length; i += 1) {
                options.eventProps.keyCode = holdKeys[i];
                options.eventProps.which = holdKeys[i];
                switch (options.eventProps.keyCode) {
                  case SpecialKeyCodes.ALT:
                    options.eventProps.altKey = false;
                    break;

                  case SpecialKeyCodes.SHIFT:
                    options.eventProps.shiftKey = false;
                    break;

                  case SpecialKeyCodes.CONTROL:
                    options.eventProps.ctrlKey = false;
                    break;

                  case SpecialKeyCodes.META:
                    options.eventProps.metaKey = false;
                    break;

                  default:
                    break;
                }
                $target.simulate("keyup", options.eventProps);
            }
        }
    });
})(jQuery);

(function($, undefined) {
    "use strict";
    $.simulate.prototype.quirks = $.simulate.prototype.quirks || {};
    $.extend($.simulate.prototype.quirks, {
        delayedSpacesInNonInputGlitchToEnd: undefined
    });
    $.extend($.simulate.prototype, {
        simulateKeySequence: function() {
            var target = this.target, $target = $(target), opts = $.extend({
                sequence: "",
                triggerKeyEvents: true,
                eventProps: {},
                delay: 0,
                callback: undefined
            }, this.options), sequence = opts.sequence;
            opts.delay = parseInt(opts.delay, 10);
            var localkeys = {};
            if ($.simulate.prototype.quirks.delayedSpacesInNonInputGlitchToEnd && !$target.is("input,textarea")) {
                $.extend(localkeys, {
                    " ": function(rng, s, opts) {
                        var internalOpts = $.extend({}, opts, {
                            triggerKeyEvents: false,
                            delay: 0,
                            callback: undefined
                        });
                        $.simulate.prototype.simulateKeySequence.defaults.simplechar(rng, " ", internalOpts);
                        $.simulate.prototype.simulateKeySequence.defaults["{leftarrow}"](rng, s, internalOpts);
                        $.simulate.prototype.simulateKeySequence.defaults.simplechar(rng, s, opts);
                        $.simulate.prototype.simulateKeySequence.defaults["{del}"](rng, s, internalOpts);
                    }
                });
            }
            $.extend(localkeys, opts, $target.data("simulate-keySequence"));
            var rng = $.data(target, "simulate-keySequence.selection");
            if (!rng) {
                rng = bililiteRange(target).bounds("selection");
                $.data(target, "simulate-keySequence.selection", rng);
                $target.bind("mouseup.simulate-keySequence", function() {
                    $.data(target, "simulate-keySequence.selection").bounds("selection");
                }).bind("keyup.simulate-keySequence", function(evt) {
                    if (evt.which === 9) {
                        $.data(target, "simulate-keySequence.selection").select();
                    } else {
                        $.data(target, "simulate-keySequence.selection").bounds("selection");
                    }
                });
            }
            $target.focus();
            if (typeof sequence === "undefined") {
                return;
            }
            sequence = sequence.replace(/\n/g, "{enter}");
            function sequenceFinished() {
                $target.trigger({
                    type: "simulate-keySequence",
                    sequence: sequence
                });
                if ($.isFunction(opts.callback)) {
                    opts.callback.apply(target, [ {
                        sequence: sequence
                    } ]);
                }
            }
            function processNextToken() {
                var timeElapsed = now() - lastTime;
                if (timeElapsed >= opts.delay) {
                    var match = tokenRegExp.exec(sequence);
                    if (match !== null) {
                        var s = match[0];
                        (localkeys[s] || $.simulate.prototype.simulateKeySequence.defaults[s] || $.simulate.prototype.simulateKeySequence.defaults.simplechar)(rng, s, opts);
                        setTimeout(processNextToken, opts.delay);
                    } else {
                        sequenceFinished();
                    }
                    lastTime = now();
                } else {
                    setTimeout(processNextToken, opts.delay - timeElapsed);
                }
            }
            if (!opts.delay || opts.delay <= 0) {
                sequence.replace(/\{[^}]*\}|[^{]+/g, function(s) {
                    (localkeys[s] || $.simulate.prototype.simulateKeySequence.defaults[s] || $.simulate.prototype.simulateKeySequence.defaults.simplechar)(rng, s, opts);
                });
                sequenceFinished();
            } else {
                var tokenRegExp = /\{[^}]*\}|[^{]/g;
                var now = Date.now || function() {
                    return new Date().getTime();
                }, lastTime = now();
                processNextToken();
            }
        }
    });
    $.extend($.simulate.prototype.simulateKeySequence.prototype, {
        IEKeyCodeTable: {
            33: 49,
            64: 50,
            35: 51,
            36: 52,
            37: 53,
            94: 54,
            38: 55,
            42: 56,
            40: 57,
            41: 48,
            59: 186,
            58: 186,
            61: 187,
            43: 187,
            44: 188,
            60: 188,
            45: 189,
            95: 189,
            46: 190,
            62: 190,
            47: 191,
            63: 191,
            96: 192,
            126: 192,
            91: 219,
            123: 219,
            92: 220,
            124: 220,
            93: 221,
            125: 221,
            39: 222,
            34: 222
        },
        charToKeyCode: function(character) {
            var specialKeyCodeTable = $.simulate.prototype.simulateKeySequence.prototype.IEKeyCodeTable;
            var charCode = character.charCodeAt(0);
            if (charCode >= 64 && charCode <= 90 || charCode >= 48 && charCode <= 57) {
                return charCode;
            } else if (charCode >= 97 && charCode <= 122) {
                return character.toUpperCase().charCodeAt(0);
            } else if (specialKeyCodeTable[charCode] !== undefined) {
                return specialKeyCodeTable[charCode];
            } else {
                return charCode;
            }
        }
    });
    $.simulate.prototype.simulateKeySequence.defaults = {
        simplechar: function(rng, s, opts) {
            rng.text(s, "end");
            if (opts.triggerKeyEvents) {
                for (var i = 0; i < s.length; i += 1) {
                    var charCode = s.charCodeAt(i);
                    var keyCode = $.simulate.prototype.simulateKeySequence.prototype.charToKeyCode(s.charAt(i));
                    $(rng._el).simulate("keydown", $.extend({}, opts.eventProps, {
                        keyCode: keyCode
                    }));
                    $(rng._el).simulate("keypress", $.extend({}, opts.eventProps, {
                        keyCode: charCode,
                        which: charCode,
                        charCode: charCode
                    }));
                    $(rng._el).simulate("keyup", $.extend({}, opts.eventProps, {
                        keyCode: keyCode
                    }));
                }
            }
        },
        "{{}": function(rng, s, opts) {
            $.simulate.prototype.simulateKeySequence.defaults.simplechar(rng, "{", opts);
        },
        "{enter}": function(rng, s, opts) {
            rng.insertEOL();
            rng.select();
            if (opts.triggerKeyEvents === true) {
                $(rng._el).simulate("keydown", $.extend({}, opts.eventProps, {
                    keyCode: 13
                }));
                $(rng._el).simulate("keypress", $.extend({}, opts.eventProps, {
                    keyCode: 13,
                    which: 13,
                    charCode: 13
                }));
                $(rng._el).simulate("keyup", $.extend({}, opts.eventProps, {
                    keyCode: 13
                }));
            }
        },
        "{backspace}": function(rng, s, opts) {
            var b = rng.bounds();
            if (b[0] === b[1]) {
                rng.bounds([ b[0] - 1, b[0] ]);
            }
            rng.text("", "end");
            if (opts.triggerKeyEvents === true) {
                $(rng._el).simulate("keydown", $.extend({}, opts.eventProps, {
                    keyCode: 8
                }));
                $(rng._el).simulate("keyup", $.extend({}, opts.eventProps, {
                    keyCode: 8
                }));
            }
        },
        "{del}": function(rng, s, opts) {
            var b = rng.bounds();
            if (b[0] === b[1]) {
                rng.bounds([ b[0], b[0] + 1 ]);
            }
            rng.text("", "end");
            if (opts.triggerKeyEvents === true) {
                $(rng._el).simulate("keydown", $.extend({}, opts.eventProps, {
                    keyCode: 46
                }));
                $(rng._el).simulate("keyup", $.extend({}, opts.eventProps, {
                    keyCode: 46
                }));
            }
        },
        "{rightarrow}": function(rng, s, opts) {
            var b = rng.bounds();
            if (b[0] === b[1]) {
                b[1] += 1;
            }
            rng.bounds([ b[1], b[1] ]).select();
            if (opts.triggerKeyEvents === true) {
                $(rng._el).simulate("keydown", $.extend({}, opts.eventProps, {
                    keyCode: 39
                }));
                $(rng._el).simulate("keyup", $.extend({}, opts.eventProps, {
                    keyCode: 39
                }));
            }
        },
        "{leftarrow}": function(rng, s, opts) {
            var b = rng.bounds();
            if (b[0] === b[1]) {
                b[0] -= 1;
            }
            rng.bounds([ b[0], b[0] ]).select();
            if (opts.triggerKeyEvents === true) {
                $(rng._el).simulate("keydown", $.extend({}, opts.eventProps, {
                    keyCode: 37
                }));
                $(rng._el).simulate("keyup", $.extend({}, opts.eventProps, {
                    keyCode: 37
                }));
            }
        },
        "{selectall}": function(rng) {
            rng.bounds("all").select();
        }
    };
    if ($.simulate.ext_disableQuirkDetection !== true) {
        $(document).ready(function() {
            var $testDiv = $("<div/>").css({
                height: 1,
                width: 1,
                position: "absolute",
                left: -1e3,
                top: -1e3
            }).appendTo("body");
            $testDiv.simulate("key-sequence", {
                sequence: "   ",
                delay: 1,
                callback: function() {
                    $.simulate.prototype.quirks.delayedSpacesInNonInputGlitchToEnd = $testDiv.text() === "   ";
                    $testDiv.remove();
                }
            });
        });
    }
})(jQuery);

(function($, undefined) {
    "use strict";
    $.fn.simulate = function(type, options) {
        switch (type) {
          case "drag":
          case "drop":
          case "drag-n-drop":
            var ele = this.first();
            new $.simulate(ele[0], type, options);
            return ele;

          default:
            return this.each(function() {
                new $.simulate(this, type, options);
            });
        }
    };
    var now = Date.now || function() {
        return new Date().getTime();
    };
    var rdocument = /\[object (?:HTML)?Document\]/;
    function isDocument(elem) {
        return rdocument.test(Object.prototype.toString.call($(elem)[0]));
    }
    function selectFirstMatch(array, check) {
        var i;
        if ($.isFunction(check)) {
            for (i = 0; i < array.length; i += 1) {
                if (check(array[i])) {
                    return array[i];
                }
            }
            return null;
        } else {
            for (i = 0; i < array.length; i += 1) {
                if (array[i]) {
                    return array[i];
                }
            }
            return null;
        }
    }
    function findCenter(elem) {
        var offset, $elem = $(elem);
        if (isDocument($elem[0])) {
            offset = {
                left: 0,
                top: 0
            };
        } else {
            offset = $elem.offset();
        }
        return {
            x: offset.left + $elem.outerWidth() / 2,
            y: offset.top + $elem.outerHeight() / 2
        };
    }
    function pageToClientPos(x, y, docRel) {
        var $document;
        if (isDocument(y)) {
            $document = $(y);
        } else {
            $document = $(docRel || document);
        }
        if (typeof x === "number" && typeof y === "number") {
            return {
                x: x - $document.scrollLeft(),
                y: y - $document.scrollTop()
            };
        } else if (typeof x === "object" && x.pageX && x.pageY) {
            return {
                clientX: x.pageX - $document.scrollLeft(),
                clientY: x.pageY - $document.scrollTop()
            };
        }
    }
    function elementAtPosition(x, y, docRel) {
        var doc;
        if (isDocument(y)) {
            doc = y;
        } else {
            doc = docRel || document;
        }
        if (!doc.elementFromPoint) {
            return null;
        }
        var clientX = x, clientY = y;
        if (typeof x === "object" && (x.clientX || x.clientY)) {
            clientX = x.clientX || 0;
            clientY = x.clientY || 0;
        }
        if (elementAtPosition.prototype.check) {
            var sl, ele;
            if ((sl = $(doc).scrollTop()) > 0) {
                ele = doc.elementFromPoint(0, sl + $(window).height() - 1);
                if (ele !== null && ele.tagName.toUpperCase() === "HTML") {
                    ele = null;
                }
                elementAtPosition.prototype.nativeUsesRelative = ele === null;
            } else if ((sl = $(doc).scrollLeft()) > 0) {
                ele = doc.elementFromPoint(sl + $(window).width() - 1, 0);
                if (ele !== null && ele.tagName.toUpperCase() === "HTML") {
                    ele = null;
                }
                elementAtPosition.prototype.nativeUsesRelative = ele === null;
            }
            elementAtPosition.prototype.check = sl <= 0;
        }
        if (!elementAtPosition.prototype.nativeUsesRelative) {
            clientX += $(doc).scrollLeft();
            clientY += $(doc).scrollTop();
        }
        return doc.elementFromPoint(clientX, clientY);
    }
    elementAtPosition.prototype.check = true;
    elementAtPosition.prototype.nativeUsesRelative = true;
    function dragFinished(ele, options) {
        var opts = options || {};
        $(ele).trigger({
            type: "simulate-drag"
        });
        if ($.isFunction(opts.callback)) {
            opts.callback.apply(ele);
        }
    }
    function interpolatedEvents(self, ele, start, drag, options) {
        var targetDoc = selectFirstMatch([ ele, ele.ownerDocument ], isDocument) || document, interpolOptions = options.interpolation, dragDistance = Math.sqrt(Math.pow(drag.dx, 2) + Math.pow(drag.dy, 2)), stepWidth, stepCount, stepVector;
        if (interpolOptions.stepWidth) {
            stepWidth = parseInt(interpolOptions.stepWidth, 10);
            stepCount = Math.floor(dragDistance / stepWidth) - 1;
            var stepScale = stepWidth / dragDistance;
            stepVector = {
                x: drag.dx * stepScale,
                y: drag.dy * stepScale
            };
        } else {
            stepCount = parseInt(interpolOptions.stepCount, 10);
            stepWidth = dragDistance / (stepCount + 1);
            stepVector = {
                x: drag.dx / (stepCount + 1),
                y: drag.dy / (stepCount + 1)
            };
        }
        var coords = $.extend({}, start);
        function interpolationStep() {
            coords.x += stepVector.x;
            coords.y += stepVector.y;
            var effectiveCoords = {
                pageX: coords.x,
                pageY: coords.y
            };
            if (interpolOptions.shaky && (interpolOptions.shaky === true || !isNaN(parseInt(interpolOptions.shaky, 10)))) {
                var amplitude = interpolOptions.shaky === true ? 1 : parseInt(interpolOptions.shaky, 10);
                effectiveCoords.pageX += Math.floor(Math.random() * (2 * amplitude + 1) - amplitude);
                effectiveCoords.pageY += Math.floor(Math.random() * (2 * amplitude + 1) - amplitude);
            }
            var clientCoord = pageToClientPos(effectiveCoords, targetDoc), eventTarget = elementAtPosition(clientCoord, targetDoc) || ele;
            self.simulateEvent(eventTarget, "mousemove", {
                pageX: Math.round(effectiveCoords.pageX),
                pageY: Math.round(effectiveCoords.pageY)
            });
        }
        var lastTime;
        function stepAndSleep() {
            var timeElapsed = now() - lastTime;
            if (timeElapsed >= stepDelay) {
                if (step < stepCount) {
                    interpolationStep();
                    step += 1;
                    lastTime = now();
                    setTimeout(stepAndSleep, stepDelay);
                } else {
                    var pageCoord = {
                        pageX: Math.round(start.x + drag.dx),
                        pageY: Math.round(start.y + drag.dy)
                    }, clientCoord = pageToClientPos(pageCoord, targetDoc), eventTarget = elementAtPosition(clientCoord, targetDoc) || ele;
                    self.simulateEvent(eventTarget, "mousemove", pageCoord);
                    dragFinished(ele, options);
                }
            } else {
                setTimeout(stepAndSleep, stepDelay - timeElapsed);
            }
        }
        if (!interpolOptions.stepDelay && !interpolOptions.duration || interpolOptions.stepDelay <= 0 && interpolOptions.duration <= 0) {
            for (var i = 0; i < stepCount; i += 1) {
                interpolationStep();
            }
            var pageCoord = {
                pageX: Math.round(start.x + drag.dx),
                pageY: Math.round(start.y + drag.dy)
            }, clientCoord = pageToClientPos(pageCoord, targetDoc), eventTarget = elementAtPosition(clientCoord, targetDoc) || ele;
            self.simulateEvent(eventTarget, "mousemove", pageCoord);
            dragFinished(ele, options);
        } else {
            var stepDelay = parseInt(interpolOptions.stepDelay, 10) || Math.ceil(parseInt(interpolOptions.duration, 10) / (stepCount + 1));
            var step = 0;
            lastTime = now();
            setTimeout(stepAndSleep, stepDelay);
        }
    }
    $.simulate.activeDrag = function() {
        if (!$.simulate._activeDrag) {
            return undefined;
        }
        return $.extend(true, {}, $.simulate._activeDrag);
    };
    $.extend($.simulate.prototype, {
        simulateDrag: function() {
            var self = this, ele = self.target, options = $.extend({
                dx: 0,
                dy: 0,
                dragTarget: undefined,
                clickToDrag: false,
                eventProps: {},
                interpolation: {
                    stepWidth: 0,
                    stepCount: 0,
                    stepDelay: 0,
                    duration: 0,
                    shaky: false
                },
                callback: undefined
            }, this.options);
            var start, continueDrag = $.simulate._activeDrag && $.simulate._activeDrag.dragElement === ele;
            if (continueDrag) {
                start = $.simulate._activeDrag.dragStart;
            } else {
                start = findCenter(ele);
            }
            var x = Math.round(start.x), y = Math.round(start.y), coord = {
                pageX: x,
                pageY: y
            }, dx, dy;
            if (options.dragTarget) {
                var end = findCenter(options.dragTarget);
                dx = Math.round(end.x - start.x);
                dy = Math.round(end.y - start.y);
            } else {
                dx = options.dx || 0;
                dy = options.dy || 0;
            }
            if (continueDrag) {
                $.simulate._activeDrag.dragDistance.x += dx;
                $.simulate._activeDrag.dragDistance.y += dy;
                coord = {
                    pageX: Math.round(x + $.simulate._activeDrag.dragDistance.x),
                    pageY: Math.round(y + $.simulate._activeDrag.dragDistance.y)
                };
            } else {
                if ($.simulate._activeDrag) {
                    $($.simulate._activeDrag.dragElement).simulate("drop");
                }
                $.extend(options.eventProps, coord);
                self.simulateEvent(ele, "mousedown", options.eventProps);
                if (options.clickToDrag === true) {
                    self.simulateEvent(ele, "mouseup", options.eventProps);
                    self.simulateEvent(ele, "click", options.eventProps);
                }
                $(ele).add(ele.ownerDocument).one("mouseup", function() {
                    $.simulate._activeDrag = undefined;
                });
                $.extend($.simulate, {
                    _activeDrag: {
                        dragElement: ele,
                        dragStart: {
                            x: x,
                            y: y
                        },
                        dragDistance: {
                            x: dx,
                            y: dy
                        }
                    }
                });
                coord = {
                    pageX: Math.round(x + dx),
                    pageY: Math.round(y + dy)
                };
            }
            if (dx !== 0 || dy !== 0) {
                if (options.interpolation && (options.interpolation.stepCount || options.interpolation.stepWidth)) {
                    interpolatedEvents(self, ele, {
                        x: x,
                        y: y
                    }, {
                        dx: dx,
                        dy: dy
                    }, options);
                } else {
                    var targetDoc = selectFirstMatch([ ele, ele.ownerDocument ], isDocument) || document, clientCoord = pageToClientPos(coord, targetDoc), eventTarget = elementAtPosition(clientCoord, targetDoc) || ele;
                    $.extend(options.eventProps, coord);
                    self.simulateEvent(eventTarget, "mousemove", options.eventProps);
                    dragFinished(ele, options);
                }
            } else {
                dragFinished(ele, options);
            }
        },
        simulateDrop: function() {
            var self = this, ele = this.target, activeDrag = $.simulate._activeDrag, options = $.extend({
                clickToDrop: false,
                eventProps: {},
                callback: undefined
            }, self.options), moveBeforeDrop = true, center = findCenter(ele), x = Math.round(center.x), y = Math.round(center.y), coord = {
                pageX: x,
                pageY: y
            }, targetDoc = (activeDrag ? selectFirstMatch([ activeDrag.dragElement, activeDrag.dragElement.ownerDocument ], isDocument) : selectFirstMatch([ ele, ele.ownerDocument ], isDocument)) || document, clientCoord = pageToClientPos(coord, targetDoc), eventTarget = elementAtPosition(clientCoord, targetDoc);
            if (activeDrag && (activeDrag.dragElement === ele || isDocument(ele))) {
                x = Math.round(activeDrag.dragStart.x + activeDrag.dragDistance.x);
                y = Math.round(activeDrag.dragStart.y + activeDrag.dragDistance.y);
                coord = {
                    pageX: x,
                    pageY: y
                };
                clientCoord = pageToClientPos(coord, targetDoc);
                eventTarget = elementAtPosition(clientCoord, targetDoc);
                moveBeforeDrop = false;
            }
            if (!eventTarget) {
                eventTarget = activeDrag ? activeDrag.dragElement : ele;
            }
            $.extend(options.eventProps, coord);
            if (moveBeforeDrop === true) {
                self.simulateEvent(eventTarget, "mousemove", options.eventProps);
            }
            if (options.clickToDrop) {
                self.simulateEvent(eventTarget, "mousedown", options.eventProps);
            }
            this.simulateEvent(eventTarget, "mouseup", options.eventProps);
            if (options.clickToDrop) {
                self.simulateEvent(eventTarget, "click", options.eventProps);
            }
            $.simulate._activeDrag = undefined;
            $(eventTarget).trigger({
                type: "simulate-drop"
            });
            if ($.isFunction(options.callback)) {
                options.callback.apply(eventTarget);
            }
        },
        simulateDragNDrop: function() {
            var self = this, ele = this.target, options = $.extend({
                dragTarget: undefined,
                dropTarget: undefined
            }, self.options), dropEle = (options.dragTarget || options.dx || options.dy ? options.dropTarget : ele) || ele;
            $(ele).simulate("drag", $.extend({}, options, {
                dragTarget: options.dragTarget || (options.dx || options.dy ? undefined : options.dropTarget),
                callback: function() {
                    $(dropEle).simulate("drop", options);
                }
            }));
        }
    });
})(jQuery);

/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license */
window.matchMedia || (window.matchMedia = function() {
    "use strict";
    var styleMedia = window.styleMedia || window.media;
    if (!styleMedia) {
        var style = document.createElement("style"), script = document.getElementsByTagName("script")[0], info = null;
        style.type = "text/css";
        style.id = "matchmediajs-test";
        script.parentNode.insertBefore(style, script);
        info = "getComputedStyle" in window && window.getComputedStyle(style, null) || style.currentStyle;
        styleMedia = {
            matchMedium: function(media) {
                var text = "@media " + media + "{ #matchmediajs-test { width: 1px; } }";
                if (style.styleSheet) {
                    style.styleSheet.cssText = text;
                } else {
                    style.textContent = text;
                }
                return info.width === "1px";
            }
        };
    }
    return function(media) {
        return {
            matches: styleMedia.matchMedium(media || "all"),
            media: media || "all"
        };
    };
}());

(function($) {
    "use strict";
    window.laybackTools = window.laybackTools || {};
    var ObjectWrapper = function(obj) {
        this.init = function(obj) {
            if (obj === undefined) {
                obj = {};
            }
            this._obj = obj;
            return this;
        };
        this.obj = function() {
            return this._obj;
        };
        this.get = function(key) {
            return this.obj()[key];
        };
        this.size = function() {
            var size = 0, key;
            for (key in this._obj) {
                if (this._obj.hasOwnProperty(key)) {
                    size++;
                }
            }
            return size;
        };
        this.add = function(value, key, overwrite) {
            overwrite = overwrite === undefined ? true : false;
            if (!key && key !== 0) {
                key = this.getNextFreeKey();
            }
            this._obj[key] = value;
            return this;
        };
        this.del = function(key) {
            delete this._obj[key];
        };
        this.getNextFreeKey = function() {
            return "_" + this.size();
        };
        this.extend = function() {
            var args = Array.prototype.slice.call(arguments);
            if (typeof args[0] === "boolean") {
                args.splice(1, 0, this.obj());
            } else {
                args.splice(0, 0, this.obj());
            }
            $.extend.apply($.extend, args);
            return this;
        };
        this.each = function() {
            var args = Array.prototype.slice.call(arguments);
            args.splice(0, 0, this.obj());
            $.each.apply($.each, args);
            return this;
        };
        this.init(obj);
    };
    window.laybackTools.objectWrapper = function(obj) {
        return new ObjectWrapper(obj);
    };
})(jQuery);

(function($) {
    "use strict";
    window.laybackTools = window.laybackTools || {};
    var StringWrapper = function(str) {
        this._str = str;
        this.dashToCamelCase = function() {
            return this._str.replace(/-(.)/g, function(match, group) {
                return group.toUpperCase();
            });
        };
    };
    window.laybackTools.stringWrapper = function(str) {
        return new StringWrapper(str);
    };
})(jQuery);

(function($, window) {
    "use strict";
    var _o = window.laybackTools.objectWrapper, _s = window.laybackTools.stringWrapper;
    var Layback = function() {
        if (arguments[0]) {
            if (typeof arguments[0] == "function") {
                return new Layback.Class(arguments[0]);
            }
            if (typeof arguments[0] == "object" && !arguments[1]) {
                return new Layback.Object(arguments[0]);
            }
            if (typeof arguments[0] == "object" && arguments[1]) {
                return new Layback.Object(arguments[0], arguments[1]);
            }
        }
        if (arguments[0] && arguments[1]) {
            return new Layback.ClassCreator(arguments[0], arguments[1]);
        }
        return Layback.Factory;
    };
    Layback.Class = function(classObject) {
        var _classObject = classObject, _classHandler = null;
        var This = this;
        function _getClassHandler() {
            if (!_classHandler) {
                _classHandler = new Layback.ClassHandler(This, _classObject);
            }
            return _classHandler;
        }
        this.make = function() {
            _getClassHandler().make();
            return this;
        };
        this.use = function(treatName, treatData) {
            _getClassHandler().addTreat(treatName, treatData);
            return this;
        };
        this.defaults = function(data) {
            _getClassHandler().setDefaults(data);
            return this;
        };
        this.getDefaults = function(data) {
            return _getClassHandler().getDefaults(data);
        };
        this.addInitMethod = function(initMethod) {
            _getClassHandler().addInitMethod(initMethod);
            return this;
        };
        this.addMethod = function(methodName, method, forced) {
            _getClassHandler().addMethod(methodName, method, forced);
            return this;
        };
        this.addClassMethod = function(methodName, method, forced) {
            _getClassHandler().addClassMethod(methodName, method, forced);
            return this;
        };
        if (_classObject.__layback) {
            return _classObject.__layback.laybackObject;
        }
        _getClassHandler();
    };
    Layback.ClassHandler = function(laybackClassObj, classObject) {
        var _laybackClassObj = laybackClassObj, _classObject = classObject;
        this.init = function() {
            var This = this;
            if (_classObject.__layback) {
                return this;
            }
            _classObject.__layback = {
                laybackObject: _laybackClassObj,
                defaultData: {},
                treats: {},
                initMethods: {},
                appliedTreats: {},
                methods: {},
                classMethods: {}
            };
            Layback.Factory.systemTreats().each(function(treatName, treatData) {
                This.addTreat(treatName, treatData);
            });
        };
        this.make = function() {
            var This = this;
            this.addClassMethod("layback", function() {
                return this.__layback.laybackObject;
            });
            this.addMethod("layback", function(options) {
                if (!this.__layback) {
                    return new Layback.Object(this, options);
                }
                return this.__layback.laybackObject;
            });
            _o(_classObject.__layback.treats).each(function(treatName, treatData) {
                This.applyTreat(treatName, treatData);
            });
        };
        this.addInitMethod = function(initMethod) {
            _o(_classObject.__layback.initMethods).add(initMethod);
        };
        this.addTreat = function(treatName, treatData) {
            _o(_classObject.__layback.treats).add(treatData, treatName);
        };
        this.applyTreat = function(treatName) {
            var TreatClass = Layback.Treats.getTreat(treatName);
            var treatData = _classObject.__layback.treats[treatName];
            _classObject.__layback.appliedTreats[treatName] = new TreatClass(_classObject, treatData);
        };
        this.setDefaults = function(data) {
            _classObject.__layback.defaultData = data;
        };
        this.getDefaults = function() {
            return _classObject.__layback.defaultData;
        };
        this.addMethod = function(methodName, method, forced) {
            forced = !!forced;
            if (!forced && (_classObject.prototype[methodName] || _classObject.__layback.methods[methodName])) {
                throw new Error("The method already exists! Try using some other name, or use the forced parameter!");
            }
            if (forced || !(_classObject.prototype[methodName] || _classObject.__layback.methods[methodName])) {
                _classObject.__layback.methods[methodName] = method;
                _classObject.prototype[methodName] = method;
            }
        };
        this.addClassMethod = function(methodName, method, forced) {
            forced = !!forced;
            if (!forced && (_classObject[methodName] || _classObject.__layback.classMethods[methodName])) {
                throw new Error("The method already exists! Try using some other name, or use the forced parameter!");
            }
            if (forced || !(_classObject[methodName] || _classObject.__layback.classMethods[methodName])) {
                _classObject.__layback.classMethods[methodName] = method;
                _classObject[methodName] = method;
            }
        };
        if (!_classObject.__layback) {
            this.init();
        }
    };
    Layback.ClassCreator = function(methodName, method) {
        window[methodName] = method;
        return new Layback.Class(window[methodName]);
    };
    Layback.Object = function(obj, options) {
        this.r = Math.random();
        var _obj = obj, _options = options || {}, _objectHandler = null;
        var This = this;
        function _getObjectHandler() {
            if (!_objectHandler) {
                _objectHandler = new Layback.ObjectHandler(This, _obj, _options);
            }
            return _objectHandler;
        }
        this.setOptions = function(options) {
            _getObjectHandler().setOptions(options);
            return this;
        };
        this.getOptions = function() {
            return _getObjectHandler().getOptions();
        };
        this.addNs = function(key, data, pattern) {
            _getObjectHandler().addNs(key, data, pattern);
            return this;
        };
        this.getNs = function(key) {
            return _getObjectHandler().getNs(key);
        };
        if (_obj.__layback) {
            return _obj.__layback.laybackObject;
        }
        _getObjectHandler();
    };
    Layback.ObjectHandler = function(laybackObjectObj, obj, options) {
        var _laybackObjectObj = laybackObjectObj, _obj = obj, _options = options || {};
        this.init = function() {
            _obj.__layback = {
                id: 0,
                laybackObject: _laybackObjectObj
            };
            Layback.Factory.objectPool().addObject(_obj);
            _o(_obj.constructor.__layback.initMethods).each(function(i, initMethod) {
                initMethod(_obj);
            });
        };
        this.setOptions = function(options) {
            _options = options;
        };
        this.getOptions = function() {
            return _options;
        };
        this.addNs = function(key, data, pattern) {
            data = data || {};
            var defaults = _obj.constructor.__layback.defaultData[key] || {};
            var keyInObj = "layback" + key.charAt(0).toUpperCase() + key.slice(1);
            _obj[keyInObj] = _obj[keyInObj] || {};
            var argData = {};
            if (_obj.laybackData && pattern) {
                var regExp = pattern instanceof RegExp && pattern || new RegExp(pattern.replace("*", "(.*)"));
                _o(_obj.laybackData).each(function(name, element) {
                    var matches = name.match(regExp);
                    if (matches) {
                        argData[matches[1].substring(0, 1).toLowerCase() + matches[1].substring(1)] = element;
                    }
                });
            }
            _obj[keyInObj] = $.extend(true, {}, defaults, _obj[keyInObj], argData, data);
        };
        this.getNs = function(key) {
            var keyInObj = "layback" + key.charAt(0).toUpperCase() + key.slice(1);
            _obj[keyInObj] = _obj[keyInObj] || {};
            return _obj[keyInObj];
        };
        if (!_obj.__layback) {
            this.init();
        }
    };
    Layback.Treats = function(pool) {
        return Layback.Treats._pool[pool];
    };
    $.extend(Layback.Treats, {
        _pool: {
            system: _o({}),
            user: _o({})
        },
        getTreats: function() {
            return $.extend({}, this._pool["system"].obj(), this._pool["user"].obj());
        },
        getTreat: function(treatName) {
            return this._pool["user"].get(treatName) || this._pool["system"].get(treatName);
        }
    });
    Layback.ObjectPool = {
        _pool: _o({}),
        getObjects: function() {
            return this._pool;
        },
        data: function() {
            return this._pool.obj();
        },
        addObject: function(obj) {
            this._pool.add(obj);
            obj.__layback.id = this._pool.size();
        },
        removeObject: function(obj) {
            if (!obj.__layback.id) {
                throw new Error("Object has No ID");
            } else {
                this._pool.del(obj.__layback.id);
            }
            return this;
        }
    };
    Layback.Factory = {
        _systemTreats: new Layback.Treats("system"),
        _userTreats: new Layback.Treats("user"),
        tools: function() {
            return window.laybackTools;
        },
        systemTreats: function() {
            return this._systemTreats;
        },
        treats: function() {
            return this._userTreats;
        },
        objectPool: function() {
            return Layback.ObjectPool;
        }
    };
    var layback = function() {
        function _layback(args) {
            return Layback.apply(this, args);
        }
        _layback.prototype = Layback.prototype;
        return new _layback(Array.prototype.slice.call(arguments));
    };
    window.layback = layback;
})(jQuery, window);

(function($) {
    "use strict";
    var _o = window.laybackTools.objectWrapper;
    var DataTreat = function(classObject) {
        layback(classObject).addMethod("set", function(key, value) {
            _o(this.laybackData).add(value, key);
            return this;
        }).addMethod("get", function(key, defaultValue) {
            return this.laybackData[key] !== undefined ? this.laybackData[key] : defaultValue;
        }).addInitMethod(function(obj) {
            var options = obj.layback().getOptions();
            obj.layback().addNs("data", options);
        });
    };
    layback().systemTreats().add(DataTreat, "data");
})($);

(function($) {
    "use strict";
    var _o = window.laybackTools.objectWrapper;
    var DomTreat = function(classObject) {
        layback(classObject).addInitMethod(function(obj) {
            obj.layback().addNs("dom", {}, "*Element");
        }).addMethod("dom", function() {
            var args = Array.prototype.slice.call(arguments);
            if (this.laybackDom[args[0]]) {
                args[0] = this.laybackDom[args[0]];
            }
            return $.apply($, args);
        }).addMethod("getElement", function() {
            return this.dom(this.get("element"));
        });
    };
    layback().systemTreats().add(DomTreat, "dom");
})($);

(function($) {
    "use strict";
    var _o = window.laybackTools.objectWrapper;
    var _s = window.laybackTools.stringWrapper;
    var EventTreat = function(classObject) {
        layback(classObject).addInitMethod(function(obj) {
            obj.layback().addNs("eventListeners").addNs("callbacks", {}, /on([A-Z].*)/);
            _o(obj.laybackCallbacks).each(function(evt, callback) {
                obj.observe(evt, callback);
            });
        }).addMethod("observe", function(evt, callback) {
            evt = _s(evt).dashToCamelCase();
            if (!this.laybackEventListeners[evt]) {
                this.laybackEventListeners[evt] = {};
            }
            _o(this.laybackEventListeners[evt]).add(callback);
            return this;
        }).addMethod("dispatch", function(evt, evtData) {
            evt = _s(evt).dashToCamelCase();
            if (this.laybackEventListeners[evt]) {
                var This = this;
                _o(this.laybackEventListeners[evt]).each(function(i, callback) {
                    var args = [ This, evtData, evt ];
                    callback.apply(callback, args);
                });
            }
            return this;
        });
    };
    layback().systemTreats().add(EventTreat, "event");
})($);

(function($) {
    "use strict";
    var _o = window.laybackTools.objectWrapper;
    var CollectionTreat = function(classObject) {
        var setItemCollectionPosition = function(item, pos) {
            item.__laybackCollectionPosition = pos;
        };
        var getItemCollectionPosition = function(item) {
            if (item instanceof jQuery) {
                return item[0].__laybackCollectionPosition;
            }
            return item.__laybackCollectionPosition;
        };
        var reIndexItems = function(obj) {
            var i = 0;
            _o(obj.laybackCollection.items).each(function(key, item) {
                setItemCollectionPosition(item, i);
                i++;
            });
        };
        layback(classObject).addInitMethod(function(obj) {
            obj.layback().addNs("collection", {
                items: []
            });
            reIndexItems(obj);
        }).addMethod("addCollectionItem", function(item) {
            var This = this;
            this.dispatch("collection-additem-before", item);
            if (item.constructor == Array || item instanceof jQuery) {
                $.each(item, function(k, val) {
                    This.addCollectionItem(val);
                });
            } else {
                setItemCollectionPosition(item, this.laybackCollection.items.length);
                this.laybackCollection.items.push(item);
            }
            this.dispatch("collection-additem-after", item);
            return this;
        }).addMethod("getCollectionItems", function() {
            return this.laybackCollection.items;
        }).addMethod("getCollectionItemPosition", function(item) {
            return getItemCollectionPosition(item);
        }).addMethod("getCollectionItem", function(index) {
            var itemarr = this.sliceCollectionItems(index, index + 1);
            if (itemarr.length) {
                return itemarr[0];
            }
            return false;
        }).addMethod("removeCollectionItem", function(item) {
            this.dispatch("collection-removeitem-before", item);
            if (typeof item == "number") {
                this.laybackCollection.items.splice(item, 1);
            }
            this.laybackCollection.items.splice(getItemCollectionPosition(item), 1);
            reIndexItems(this);
            this.dispatch("collection-removeitem-after", item);
            return this;
        }).addMethod("getCollectionSize", function() {
            return this.getCollectionItems().length;
        }).addMethod("setPagerLimit", function(limit) {
            this.set("pagerLimit", limit);
            return this;
        }).addMethod("getPageItems", function(page, func) {
            var limit = this.get("pagerLimit");
            return this.sliceCollectionItems(page * limit, (page + 1) * limit, func);
        }).addMethod("eachCollectionItems", function() {
            var args = Array.prototype.slice.call(arguments);
            args.splice(0, 0, this.getItems());
            $.each.apply($.each, args);
            return this;
        }).addMethod("grepCollectionItems", function() {
            var args = Array.prototype.slice.call(arguments);
            args.splice(0, 0, this.getCollectionItems());
            return $.grep.apply($.grep, args);
        }).addMethod("sliceCollectionItems", function(start, end, func) {
            var items = this.getCollectionItems().slice(0), slice = items.slice(start, end);
            if (func && typeof func === "function") {
                $.each(slice, func);
            }
            return slice;
        });
    };
    layback().treats().add(CollectionTreat, "collection");
})($);

(function($) {
    "use strict";
    var _o = window.laybackTools.objectWrapper;
    var JqPluginTreat = function(classObject, pluginName) {
        var _classObject = classObject, _pluginName = pluginName, This = this;
        This._lastReturnValue = null;
        layback(classObject).addClassMethod("getJqueryPluginObject", function(element) {
            return $(element).data(_pluginName + "-object");
        }).addClassMethod("getJqueryPluginObjects", function(element) {
            if ($(element).length < 2) {
                return [ this.getJqueryPluginObject(element) ];
            }
            var objects = [];
            var This = this;
            $(element).each(function() {
                objects.push(This.getJqueryPluginObject(element));
            });
            return objects;
        });
        if (!$.fn[pluginName]) {
            $.fn[pluginName] = function() {
                var _userArgs = $.makeArray(arguments);
                this.each(function() {
                    var pluginObject = $(this).data(pluginName + "-object");
                    if (!pluginObject) {
                        var userOptions = _userArgs[0] || {}, elementOptions = $(this).attr(pluginName + "-options");
                        if (elementOptions) {
                            elementOptions = eval("(" + elementOptions + ")");
                        } else {
                            elementOptions = {};
                        }
                        pluginObject = new classObject($.extend(true, {}, userOptions, elementOptions, {
                            element: $(this)
                        }));
                        $(this).data(pluginName + "-object", pluginObject);
                        return this;
                    } else {
                        var optionsCopy = _userArgs.slice(0), func = optionsCopy.shift();
                        This._lastReturnValue = pluginObject[func].apply(pluginObject, optionsCopy);
                    }
                });
            };
        }
    };
    layback().treats().add(JqPluginTreat, "jQuery-plugin");
})($);

(function($) {
    "use strict";
    var _o = window.laybackTools.objectWrapper;
    var ResponsiveTreat = function(classObject) {
        layback(classObject).addInitMethod(function(obj) {
            obj.layback().addNs("breakpoints");
            _o(obj.laybackBreakpoints).each(function(name, responderData) {
                if (responderData["data"]) {
                    obj.respondTo(name, function() {
                        this.laybackData = $.extend(this.laybackData, responderData["data"]);
                    });
                }
            });
            ResponsiveTreat.watchWindowSize();
        }).addMethod("respondTo", function(bpName, func) {
            ResponsiveTreat.addResponder(bpName, this, func);
        }).addMethod("getCurrentBreakPoint", function() {
            var currentBreakpoint = null, currentBreakpointVal = 0, firstBreakpoint = null, firstBreakpointVal = 1e6, This = this;
            _o(this.laybackBreakpoints).each(function(name, bpData) {
                if (firstBreakpointVal > bpData.width) {
                    firstBreakpointVal = bpData.width;
                    firstBreakpoint = name;
                }
                if (currentBreakpointVal < bpData.width && (!ResponsiveTreat.isMqSupported() || matchMedia(ResponsiveTreat.getMqString(bpData.width)).matches)) {
                    currentBreakpointVal = bpData.width;
                    currentBreakpoint = name;
                }
            });
            return currentBreakpointVal === 0 ? {
                name: firstBreakpoint,
                width: firstBreakpointVal
            } : {
                name: currentBreakpoint,
                width: currentBreakpointVal
            };
        });
    };
    ResponsiveTreat = $.extend(ResponsiveTreat, {
        _isMqSupported: null,
        _baseFontSize: null,
        _responders: _o({}),
        _windowSizeWatched: false,
        addResponder: function(name, obj, func) {
            var width = obj.laybackBreakpoints[name].width;
            this._responders.add({
                width: width,
                name: name,
                obj: obj,
                responderFunction: func
            });
        },
        isMqSupported: function() {
            if (this._isMqSupported === null) {
                this._isMqSupported = !!matchMedia("only all").matches;
            }
            return this._isMqSupported;
        },
        getBaseFontSize: function() {
            if (this._baseFontSize === null) {
                this._baseFontSize = parseFloat($("body").css("font-size"));
            }
            return this._baseFontSize;
        },
        getMqString: function(pixels) {
            return "(min-width: " + pixels / this.getBaseFontSize() + "em)";
        },
        respond: function() {
            this._responders.each(function(i, responderData) {
                if (responderData.width == responderData.obj.getCurrentBreakPoint().width) {
                    responderData.responderFunction.apply(responderData.obj);
                }
            });
        },
        watchWindowSize: function() {
            if (this._windowSizeWatched) {
                return;
            }
            this._windowSizeWatched = true;
            var This = this;
            jQuery(window).resize(function() {
                This.respond();
            }).resize();
        }
    });
    layback().treats().add(ResponsiveTreat, "respond");
})($);

(function($) {
    "use strict";
    var _o = window.laybackTools.objectWrapper, _s = window.laybackTools.stringWrapper;
    var SetGetTreat = function(classObject) {
        this._class = classObject;
        var This = this;
        this.createSetterMethod = function(obj, key) {
            var methodName = _s("set-" + key).dashToCamelCase();
            layback(This._class).addMethod(methodName, function(value) {
                return this.set(key, value);
            }, true);
        };
        this.createGetterMethod = function(obj, key) {
            var methodName = _s("get-" + key).dashToCamelCase();
            layback(This._class).addMethod(methodName, function(def) {
                return this.get(key, def);
            }, true);
        };
        layback(classObject).addInitMethod(function(obj) {
            $.each(obj.laybackData, function(key, value) {
                This.createGetterMethod(obj, key);
                This.createSetterMethod(obj, key);
            });
        });
    };
    layback().treats().add(SetGetTreat, "setget");
})($);

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