var supportsPositionFixed = (function() {
    var w   = window,
        ua  = navigator.userAgent,
        ret = true;

    // Black list the following User Agents
    if (
        // IE less than 7.0
    (/MSIE (\d+\.\d+);/i.test(ua) && RegExp.$1 < 7)          ||
        // iOS less than 5
    (/OS [2-4]_\d(_\d)? like Mac OS X/i.test(ua))            ||
        // Android less than 3
    (/Android ([0-9]+)/i.test(ua) && RegExp.$1 < 3)          ||
        // Windows Phone less than 8
    (/Windows Phone OS ([0-9])+/i.test(ua) && RegExp.$1 < 8) ||
        // Opera Mini
    (w.operamini && ({}).toString.call( w.operamini ) === "[object OperaMini]") ||
        // Kindle Fire
    (/Kindle Fire/i.test(ua) || /Silk\//i.test(ua)) ||
        // Nokia Symbian, Opera Mobile, wOS
    (/Symbian/i.test(ua)) || (/Opera Mobi/i.test(ua)) || (/wOSBrowser/i.test(ua)) ||
        // Firefox Mobile less than 6
    (/Fennec\/([0-9]+)/i.test(ua) && RegExp.$1 < 6)
    // Optionally add additional browsers/devices here . . .
    ){
        ret = false;
    }
    return ret;
})();;+function(context){
    function PubSub() {
        this.topics_ = {};

    }
    PubSub.attach = function(obj) {
        var pubSub = new PubSub();

        obj.pub = bind(pubSub, pub);
        obj.sub = bind(pubSub, sub);
        obj.unsub = bind(pubSub, unsub);
        
        return pubSub;
    };
    PubSub.prototype.sub = sub;
    PubSub.prototype.pub = pub;
    PubSub.prototype.unsub = unsub;
    PubSub.prototype.cleanup = cleanup;
    PubSub.prototype.getPublicApi = getPublicApi;

    function bind(obj, method) {
        return function() {
            var args = Array(arguments.length);
            for (var i = args.length - 1; i >= 0; --i) {
                args[i] = arguments[i];
            }
            return method.apply(obj, args);
        };
    }
    function cleanup() {
        delete this.topics_;
    }
    function getPublicApi() {
        return {
            pub: bind(this, pub),
            sub: bind(this, sub),
            unsub: bind(this, unsub)
        };
    }
    function sub(topic, handler) {
        if (!this.topics_.hasOwnProperty(topic)) {
            this.topics_[topic] = [handler];
        } else {
            this.topics_[topic].push(handler);
        }
        return this;
    }
    function unsub(topic, handler) {
        var subscribers;

        if (!this.topics_.hasOwnProperty(topic)) {
            return this;
        } else {
            subscribers = this.topics_[topic];
            for (var i = subscribers.length - 1; i >= 0; --i) {
                if (subscribers[i] === handler) {
                    subscribers.splice(i, 1);
                    break;
                }
            }
        }

        return this;
    }
    function pub(topic, data) {
        var subscribers;
        
        if (this.topics_.hasOwnProperty(topic)) {
            subscribers = this.topics_[topic];
            for (var i = 0, ilim = subscribers.length; i < ilim; ++i) {
                subscribers[i](data);
            }
        }

        return this;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = exports = PubSub;
    } else if (typeof define === 'function' && define.amd) {
        define(function(){
            return Pubsub;
        });
    } else {
        context.PubSub = PubSub;
    }
}(this);(function(window) {
    window.viewport = {};

    window.viewport.getVisualHeight = function () {
        return window.innerHeight != null ? window.innerHeight : document.documentElement.clientHeight;
    };

    window.viewport.getVisualWidth = function () {
        return window.innerWidth != null ? window.innerWidth : document.documentElement.clientWidth;
    };
    
    window.viewport.getLayoutWidth = function() {
        return $(document).width();
    };

    window.viewport.getLayoutHeight = function() {
        return $(document).height();
    };
})(this);;+function(context){
    //END OF PROLOG

    var PubSub = context.PubSub,
        viewport = context.viewport,
        $ = context.$,
        globalInstanceId = 1;

    var defaults,
        $body,
        $window;
    
    function Overlay(options) {
        this._id = globalInstanceId++;
        this._clients = [];
        
        PubSub.attach(this);

        this._options = $.extend({}, defaults, options || {});

        $body = $body || $('body');
        $window = $window || $(window);
        
        this._createNode();
        
        var that = this;
        $window.on('resize', function(e){
            that.updateSize();
        });
    }
    Overlay.prototype.getNode = function() {
        return this._$overlay;
    };
    Overlay.prototype._createNode = function() {
        this._isShown = false;
        this._zIndex = this._options.zIndex;
        
        this._$overlay = $('<div/>')
            .css({
                top: 0,
                left: 0,
                width: '100%',
                position: 'absolute',
                zIndex: this._zIndex,
                background: '#000',
                opacity: 0.7
            })
            .prop('id', this._options.prefix + this._id)
            .appendTo($body);
    };
    Overlay.prototype.setZindex = function(zIndex) {
        this._$overlay.css('z-index', zIndex);
        this._zIndex = zIndex;

        this.pub('afterSetZindex');
    };
    Overlay.prototype._getHighestZindex = function() {
        var i,
            zMax;
        if (this._clients.length === 0) {
            return this._zIndex;
        }
        i = this._clients.length - 1;
        zMax = this._clients[i][1];
        for (--i; i >= 0; --i) {
            if (this._clients[i][1] > zMax) {
                zMax = this._clients[i][1];
            }
        }
        return zMax;
    };
    Overlay.prototype._removeClient = function(clientId) {
        var i = this._clients.length,
            newZindex;
        while (--i >= 0) {
            if (this._clients[i][0] === clientId) {
                this._clients.splice(i--, 1);
            }
        }
        newZindex = this._getHighestZindex();
        if (newZindex !== this._zIndex) {
            this.setZindex(newZindex);
            return true;
        } else {
            return false;
        }
    };
    Overlay.prototype._addClient = function(clientId, zIndex) {
        var newZindex,
            zIndexGiven = zIndex != null;
        this._clients.push([clientId, zIndexGiven ? zIndex : this._zIndex]);
        if (!zIndexGiven) {
            return false;
        }
        newZindex = this._getHighestZindex();
        if (newZindex !== this._zIndex) {
            this.setZindex(newZindex);
            return true;
        } else {
            return false;
        }
    };
    Overlay.prototype.show = function(clientId, zIndex){
        var zIndexUpdated = this._addClient(clientId, zIndex);
        
        if (this._isShown && !zIndexUpdated) {
            return;
        }
        
        this.updateSize(true);
        this._$overlay.show();
        this._isShown = true;

        this.pub('afterShow');
    };
    Overlay.prototype.hide = function(clientId){
        this._removeClient(clientId);

        if (!this._isShown || this._clients.length !== 0) {
            return;
        }
        this._$overlay.hide();
        this._isShown = false;

        this.pub('afterHide');
    };
    Overlay.prototype.updateSize = function(force){
        if (!force && !this._isShown) {
            return;
        }
        
        this._$overlay.hide();
            
        var width = Math.max(viewport.getLayoutWidth(), viewport.getVisualWidth()),
            height = Math.max(viewport.getLayoutHeight(), viewport.getVisualHeight());
        
        this._$overlay
            .css({
                width: width + 'px',
                height: height + 'px'
            })
            .show();
        
        this.pub('afterUpdateSize');
    };
    Overlay.prototype.cleanup = function(){
        if (!this._$overlay) {
            return;
        }
        
        this._$overlay.remove();
        this._$overlay = null;
        this._isShown = false;
        this._clients = null;

        this.pub('afterCleanup');
    };
    
    defaults = {
        prefix: 'overlay',
        zIndex: 99999
    };

    context.Overlay = Overlay;
}(this);
;+function(context){
    //END OF PROLOG

    var PubSub = context.PubSub,
        Overlay = context.Overlay,
        $ = context.$,
        fixedSupported = context.supportsPositionFixed,
        globalInstanceId = 1,
        baseZindex = 99999,
        instancesInUse = 0,
        maxZindex = baseZindex,
        defaults,
        $body, //cached jquery-ed DOM body node
        $window, //cached jquery-ed window object
        overlay; //overlay instance, shared among all popup instances
    
    //constants
    var KEYCODE_ESC = 27;
        
    function Popup($content, options) {
        PubSub.attach(this);

        this._options = $.extend({}, defaults, options || {});
        
        $body = $body || $('body');
        $window = $window || $(window);
        
        this._$content = $($content);
        this._$widget = null;
        this._opened = false;
        this._id = globalInstanceId++;
        maxZindex += this._options.modal ? 2 : 1;
        this._zIndex = maxZindex;
        this._closing = false;

        ++instancesInUse;
        
        var self = this;
        this
            .sub('resize', function(){
                self._setSize();
            })
            .sub('cmd', function(cmd){
                if (cmd === 'close') {
                    self.close();
                } else if (cmd.indexOf('pub-') === 0) {
                    var pubTopic = cmd.substr(4);
                    self.pub(pubTopic);
                } else {
                    
                }
            });
        
        $(document).on('keydown.' + this._options.namespace + this._id, function(e) {
            if (e.keyCode == KEYCODE_ESC) {
                e.preventDefault();
                self.close();
            }
        });
        
        $(window).resize(function(){
            overlay.updateSize();
            self.center();
        });
        
        this._bindCmds();
        this._render();
    }
    Popup.setBaseZindex = function(zIndex) {
        baseZindex = zIndex;
        if (instancesInUse === 0) {
            maxZindex = baseZindex;
        }
    };
    Popup.prototype._bindCmds = function() {
        var self = this;
        
        this._$content
            .find('*')
            .each(function(){
                var $this = $(this),
                    cmds = $this.data(self._options.namespace + 'Cmd');
                
                if (!cmds) {
                    return;
                }
    
                cmds = cmds
                    .replace(/^\s+|\s+$/g, '')
                    .split(/\s*,\s*/); 
                
                $this.on('click', function(e){
                    e.preventDefault();
                    
                    for (var i = 0, ilim = cmds.length; i < ilim; ++i) {
                        self.pub('cmd', cmds[i]);
                    }
                });
            });
    };
    Popup.prototype._setSize = function() {
        var width,
            height;
        
        this._$widget.css({
            width: this._options.width == null ? 'auto' : this._options.width,
            height: 'auto'
        });
        
        this._width = Math.floor(this._$widget.width());
        this._height = Math.floor(this._$widget.height());
        
        this._$widget.css({
            width: this._width + 'px'
            //TODO: research if we really need setting particular height
            //height: this._height + 'px'
        });
    };
    Popup.prototype.open = function() {
        var self = this;
        
        if (this._opened) {
            return;
        }
        
        this.pub('open');
        this._$widget.show();
        this.center();
        if (this._options.modal) {
            if (!overlay) overlay = new Overlay();
            //TODO: remove after testing
            window.overlay = overlay;
            
            this._showOverlay();
            
            //TODO: probably, replace per-instance overlay.on with one shared handler
            //TODO: remove dependency on private _$overlay field!
            overlay._$overlay.on('click.' + this._options.namespace + this._id, function(e){
                e.preventDefault();
                self.close();
            });
        }

        this._opened = true;
    };
    Popup.prototype._showOverlay = function() {
        overlay.show(this._options.namespace + this._id, this._zIndex - 1);
    };
    Popup.prototype._hideOverlay = function() {
        overlay.hide(this._options.namespace + this._id);
    };
    Popup.prototype.close = function() {
        if (!this._opened || this._closing) {
            return;
        }
        this._closing = true;

        //TODO: remove dependency on private _$overlay field!
        overlay._$overlay.off('click.' + this._options.namespace + this._id);
        
        if (this._options.modal) {
            this._hideOverlay();
        }
        this.pub('close');
        this._$widget.hide();
        
        this._opened = false;

        this._closing = false;
    };
    Popup.prototype.cleanup = function() {
        this.pub('cleanup');
        this.close();
        
        this._$widget
            .off('.' + this._options.namespace + this._id)
            .detach()
            .remove();

        $(document)
            .unbind('keydown.' + this._options.namespace + this._id);
        
        delete this._$content;
        delete this._$widget;
        delete this._options;

        if (--instancesInUse === 0) {
            maxZindex = baseZindex;
        } else if (this._zIndex === maxZindex) {
            --maxZindex;
        }
    };
    Popup.prototype.center = function() {
        var $window = $(window),
            left,
            top,
            css;

        var viewportWidth = viewport.getVisualWidth(),
            viewportHeight = viewport.getVisualHeight(),
            scrollLeft = $(window).scrollLeft(),
            scrollTop = $(window).scrollTop();

        var higherHeight = this._height > viewportHeight,
            higherWidth = this._width > viewportWidth;

        if (higherWidth || higherHeight || !fixedSupported) {
            css = {
                position: 'absolute',
                margin: 0
            };
            if (higherWidth) {
                css.left = scrollLeft + 'px';
            } else {
                css.left = Math.floor(viewportWidth / 2 - this._width / 2 + scrollLeft) + 'px';
            }
            if (higherHeight) {
                css.top = scrollTop + 'px';
            } else {
                css.top = Math.floor(viewportHeight / 2 - this._height / 2 + scrollTop) + 'px';
            }
        } else {
            css = {
                position: 'fixed',
                left: '50%',
                top: '50%',
                margin: (-this._height / 2) + 'px 0 0 ' + (-this._width / 2) + 'px'
            };
        }
        
        this._$widget.css(css);
    };
    Popup.prototype._render = function() {
        var o = this._options,
            self = this;
        
        this._$widget = $('<div style="position: absolute; display: block; z-index: ' + this._zIndex + ';"/>')
            .addClass('popup')
            .append(this._$content)
            .on('close.' + this._options.namespace + this._id, function(e){
                e.stopPropagation();
                self.close();
            })
            .on('cleanup.' + this._options.namespace + this._id, function(e){
                e.stopPropagation();
                self.cleanup();
            });

        $body.append(this._$widget);
        this._setSize();
        this._$widget.hide();
    };
    Popup.prototype.getNode = function() {
        return this._$widget;
    };
    Popup.defaults = defaults = {
        namespace: 'popup'
    };

    context.Popup = Popup;
}(this);
;+function(context){
    //END OF PROLOG

    var Popup = context.Popup,
        $ = context.$;

    var defaults;
    
    function extend(Child, Parent) {
        function dummy(){}
        dummy.prototype = Parent.prototype;
        Child.prototype = new dummy;
        Child.prototype.constructor = Parent;
        Child.prototype.__superclass__ = Parent;
    }
    
    extend(Alert, Popup);
    function Alert(title, message, okText, options) {
        this._options = $.extend({}, defaults, options || {});
        okText = okText == null ? 'Ок' : okText;
        this._$content = this._createContent(title, message, okText);

        Popup.call(this, this._$content, this._options);
        
        if (this._options.autoOpen) {
            this.open();
        }
    }
    
    Alert.prototype._createContent = function(title, message, okText) {
        var o = this._options,
            buttonClass,
            html;
        
        buttonClass = o.cssPrefix + '-popup__button';
        if (o.buttonModifier) {
            buttonClass += ' ' + buttonClass + o.buttonModifier;
        }
            
        html =
            '<div class="' + o.cssPrefix + '-popup">' +
                '<a tabindex="2" class="' + o.cssPrefix + '-popup__close" href="#" title="Закрыть" data-' + o.namespace + '-cmd="close"></a>' +
                ((title != null) ? '<div class="' + o.cssPrefix + '-popup__title">' + title + '</div>' : '') +
                ((message != null) ? '<p class="' + o.cssPrefix + '-popup__content">' + message + '</p>' : '') +
                ( o.hideButton ? '' : (
                '<div class="' + o.cssPrefix + '-popup__buttons">' +
                    '<input tabindex="1" class="' + buttonClass + '" type="submit" value="' + okText + '" data-' + o.namespace + '-cmd="close">' +
                '</div>'
                )) +
            '</div>';
        return $(html);
    };
    
    Alert.defaults = defaults = {
        namespace: 'alert',
        modal: true,
        autoOpen: true,
        cssPrefix: 'b-toru',
        buttonModifier: '',
        hideButton: false
    };

    context.Alert = Alert;
}(this);
;+function(context){
    //END OF PROLOG

    var Popup = context.Popup,
        $ = context.$;

    var defaults;

    function extend(Child, Parent) {
        function dummy(){}
        dummy.prototype = Parent.prototype;
        Child.prototype = new dummy;
        Child.prototype.constructor = Parent;
        Child.prototype.__superclass__ = Parent;
    }

    extend(Confirm, Popup);
    function Confirm(title, message, okText, cancelText, options) {
        if (options == null) {
            if (okText != null && typeof okText !== 'string') {
                options = okText;
                okText = void(0);
            } else if (cancelText != null && typeof cancelText !== 'string') {
                options = cancelText;
                cancelText = void(0);
            }
        }
        this._options = $.extend({}, defaults, options || {});
        okText = okText == null ? 'Ок' : okText;
        cancelText = cancelText == null ? 'Отмена' : cancelText;
        this._$content = this._createContent(title, message, okText, cancelText);
        
        Popup.call(this, this._$content, this._options);

        var that = this;
        this
            .sub('close', function(){
                if (!that.result) {
                    that.pub('cancel');
                }
            })
            .sub('cancel', function(){
                that.result = 'cancel';
                that.close();
            })
            .sub('ok', function(){
                that.result = 'ok';
                that.close();
            });
        
        if (this._options.autoOpen) {
            this.open();
        }
    }
    Confirm.prototype.close = function() {
        Popup.prototype.close.call(this);
        this.result = null;
    };
    Confirm.prototype._createContent = function(title, message, okText, cancelText) {
        var o = this._options,
            buttonClass,
            okButtonClass,
            cancelButtonClass,
            html;

        buttonClass = o.cssPrefix + '-popup__button';
        okButtonClass = cancelButtonClass = buttonClass;

        okButtonClass += ' ' + buttonClass + '_ok';
        if (o.okButtonModifier) {
            okButtonClass += ' ' + buttonClass + o.okButtonModifier;
        }

        cancelButtonClass += ' ' + buttonClass + '_cancel';
        if (o.cancelButtonModifier) {
            cancelButtonClass += ' ' + buttonClass + o.cancelButtonModifier;
        }

        html = '<div class="' + o.cssPrefix + '-popup">' +
                   '<a tabindex="-1" class="' + o.cssPrefix + '-popup__close" href="#" title="Закрыть" data-' + o.namespace + '-cmd="pub-cancel"></a>' +
                   ((title != null) ? '<div class="' + o.cssPrefix + '-popup__title">' + title + '</div>' : '') +
                   ((message != null) ? '<p class="' + o.cssPrefix + '-popup__content">' + message + '</p>' : '') +
                   '<div class="' + o.cssPrefix + '-popup__buttons ' + o.cssPrefix + '-popup__buttons_tuple">' +
                       '<input tabindex="1" class="' + cancelButtonClass + '" type="submit" value="' + cancelText + '" data-' + o.namespace + '-cmd="pub-cancel">' +
                       '<input tabindex="2" class="' + okButtonClass + '" type="submit" value="' + okText + '" data-' + o.namespace + '-cmd="pub-ok">' +
                   '</div>' +
               '</div>';
        return $(html);
    };

    Confirm.defaults = defaults = {
        namespace: 'confirm',
        modal: true,
        autoOpen: true,
        cssPrefix: 'b-toru',
        okButtonModifier: '_mood_negative',
        cancelButtonModifier: '_mood_neutral'
    };

    context.Confirm = Confirm;
}(this);