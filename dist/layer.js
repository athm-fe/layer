/*!
 * layer v0.2.0
 * (c) 2018 Autohome Inc.
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('jquery')) :
	typeof define === 'function' && define.amd ? define(['jquery'], factory) :
	(global.AutoFE = global.AutoFE || {}, global.AutoFE.Layer = factory(global.jQuery));
}(this, (function ($) { 'use strict';

$ = $ && $.hasOwnProperty('default') ? $['default'] : $;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

/**
 * ------------------------------------------------------------------------
 * Constants
 * ------------------------------------------------------------------------
 */

var NAME = 'layer';
var DATA_KEY = 'fe.layer';
var EVENT_KEY = '.' + DATA_KEY;
var DATA_API_KEY = '.data-api';
var JQUERY_NO_CONFLICT = $.fn[NAME];
var TRANSITION_DURATION = 300;
var BACKDROP_TRANSITION_DURATION = 150;
var ESCAPE_KEYCODE = 27;

var Event = {
  SHOW: 'show' + EVENT_KEY,
  SHOWN: 'shown' + EVENT_KEY,
  HIDE: 'hide' + EVENT_KEY,
  HIDDEN: 'hidden' + EVENT_KEY,
  RESIZE: 'resize' + EVENT_KEY,
  CLICK_DISMISS: 'click.dismiss' + EVENT_KEY,
  KEYDOWN_DISMISS: 'keydown.dismiss' + EVENT_KEY,
  CLICK_DATA_API: 'click' + EVENT_KEY + DATA_API_KEY
};

var Selector = {
  DATA_TOGGLE: '[data-toggle="layer"]',
  DATA_DISMISS: '[data-dismiss="layer"]'
};

/**
 * ------------------------------------------------------------------------
 * Class Definition
 * ------------------------------------------------------------------------
 */

function Layer(elem, options) {
  this.options = $.extend({}, Layer.Default, options);
  this.$elem = $(elem);
  this.$back = null;
  this.isShown = false;
  this.isFixed = true;

  this.$elem.css({ zIndex: 1001 });
}

Layer.Default = {
  keyboard: true, // ESC 快捷键关闭
  backdrop: true, // 遮罩层, true 有, false 无, 'lock' 点击遮罩层不关闭
  opacity: 0.5, // 遮罩层透明度
  show: true // 是否初始化时显示
};

Layer.prototype.toggle = function (relatedTarget) {
  return this.isShown ? this.hide() : this.show(relatedTarget);
};

Layer.prototype.show = function (relatedTarget) {
  var that = this;

  if (that.isShown) {
    return;
  }

  var showEvent = $.Event(Event.SHOW, {
    relatedTarget: relatedTarget
  });

  that.$elem.trigger(showEvent);

  if (that.isShown || showEvent.isDefaultPrevented()) {
    return;
  }

  that.isShown = true;

  this._adjust();

  that._setEscapeEvent();
  that._setResizeEvent();

  that.$elem.on(Event.CLICK_DISMISS, Selector.DATA_DISMISS, $.proxy(that.hide, that));

  that._setBackdrop(function () {
    that.$elem.css({ display: 'block' });

    var shownEvent = $.Event(Event.SHOWN, {
      relatedTarget: relatedTarget
    });

    that.$elem.trigger(shownEvent);

    that._effect('fadeIn');
  });
};

Layer.prototype.hide = function (e) {
  var that = this;

  if (e) {
    e.preventDefault();
  }

  if (!that.isShown) {
    return;
  }

  var hideEvent = $.Event(Event.HIDE);

  that.$elem.trigger(hideEvent);

  if (!that.isShown || hideEvent.isDefaultPrevented()) {
    return;
  }

  that.isShown = false;

  that._setEscapeEvent();
  that._setResizeEvent();

  that.$elem.off(Event.CLICK_DISMISS);

  that._effect('fadeOut', function () {
    that.$elem.css({ display: 'none' });
    that._setBackdrop();
    that.$elem.trigger(Event.HIDDEN);
  });
};

Layer.prototype.handleUpdate = function () {
  this._adjust();
};

Layer.prototype._adjust = function () {
  var viewWidth = $(window).width();
  var viewHeight = $(window).height();
  var width = this.$elem.outerWidth();
  var height = this.$elem.outerHeight();

  var cssMap = {
    left: (viewWidth - width) / 2
  };

  if (height > viewHeight) {
    this.isFixed = false;
  } else {
    this.isFixed = true;
  }

  if (this.isFixed) {
    cssMap.position = 'fixed';
    cssMap.top = (viewHeight - height) / 2;
  } else {
    cssMap.position = 'absolute';
    cssMap.top = $(window).scrollTop();
  }

  this.$elem.css(cssMap);
};

Layer.prototype._setEscapeEvent = function () {
  var that = this;

  if (!that.options.keyboard) {
    return;
  }

  if (that.isShown) {
    $(document).on(Event.KEYDOWN_DISMISS, function (e) {
      if (e.which === ESCAPE_KEYCODE) {
        e.preventDefault();
        that.hide();
      }
    });
  } else {
    $(document).off(Event.KEYDOWN_DISMISS);
  }
};

Layer.prototype._setResizeEvent = function () {
  if (this.isShown) {
    $(window).on(Event.RESIZE, $.proxy(this.handleUpdate, this));
  } else {
    $(window).off(Event.RESIZE);
  }
};

Layer.prototype._setBackdrop = function (callback) {
  var that = this;
  var opt = that.options;
  var speed = BACKDROP_TRANSITION_DURATION;
  var back = '<div style="position:fixed;top:0;right:0;bottom:0;left:0;z-index:1000;background:#000;opacity:0;"></div>';

  if (opt.backdrop) {
    if (that.isShown) {
      that.$back = $(back).appendTo(document.body);

      if (opt.backdrop !== 'lock') {
        that.$back.on(Event.CLICK_DISMISS, $.proxy(that.hide, that));
      }

      that.$back.animate({ opacity: opt.opacity }, speed, callback);
    } else {
      that.$back && that.$back.animate({ opacity: 0 }, speed, function () {
        // Destroy backdrop
        that.$back.off(Event.CLICK_DISMISS);
        that.$back.remove();
        that.$back = null;

        callback && callback();
      });
    }
  } else if (callback) {
    callback();
  }
};

Layer.prototype._effect = function (name, callback) {
  var speed = TRANSITION_DURATION;

  switch (name) {
    case 'fadeIn':
      this.$elem.stop(true).css({
        marginTop: -30,
        opacity: 0
      }).animate({
        marginTop: 0,
        opacity: 1
      }, speed, callback);
      break;
    case 'fadeOut':
      this.$elem.stop(true).animate({
        marginTop: -30,
        opacity: 0
      }, speed, callback);
      break;
  }
};

/**
 * ------------------------------------------------------------------------
 * Plugin Definition
 * ------------------------------------------------------------------------
 */

function Plugin(config, relatedTarget) {
  return this.each(function () {
    var $this = $(this);
    var data = $this.data(DATA_KEY);
    var _config = $.extend({}, Layer.Default, $this.data(), (typeof config === 'undefined' ? 'undefined' : _typeof(config)) === 'object' && config);

    if (!data) {
      data = new Layer(this, _config);
      $this.data(DATA_KEY, data);
    }

    if (typeof config === 'string') {
      if (typeof data[config] === 'undefined') {
        throw new TypeError('No method named "' + config + '"');
      }
      data[config](relatedTarget);
    } else if (_config.show) {
      data.show(relatedTarget);
    }
  });
}

/**
 * ------------------------------------------------------------------------
 * Data Api implementation
 * ------------------------------------------------------------------------
 */

$(document).on(Event.CLICK_DATA_API, Selector.DATA_TOGGLE, function (e) {
  var $this = $(this);
  var $target = $($this.attr('data-target'));

  var config = $target.data(DATA_KEY) ? 'toggle' : $.extend({}, $target.data(), $this.data());

  if (this.tagName === 'A' || this.tagName === 'AREA') {
    e.preventDefault();
  }

  Plugin.call($target, config, this);
});

/**
 * ------------------------------------------------------------------------
 * jQuery
 * ------------------------------------------------------------------------
 */

$.fn[NAME] = Plugin;
$.fn[NAME].Constructor = Layer;
$.fn[NAME].noConflict = function () {
  $.fn[NAME] = JQUERY_NO_CONFLICT;
  return Plugin;
};

return Layer;

})));
