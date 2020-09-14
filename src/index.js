/**
 * Created by VicSolWang.
 * Date: 2020-07-08 17:24
 * Email: vic.sol.wang@gmail.com
 */

import './style.css';

/**
 * @fileoverview 百度地图的鼠标绘制工具，对外开放。
 * 允许用户在地图上点击完成鼠标绘制的功能。
 * 使用者可以自定义所绘制结果的相关样式，例如线宽、颜色、测线段距离、面积等等。
 * 主入口类是<a href="symbols/BMapLib.DrawingManager.html">DrawingManager</a>，
 * 基于Baidu Map API 1.4。
 *
 * @author Baidu Map Api Group
 * @version 1.4
 */

window.BMapLib = window.BMapLib || {};

/**
 * 定义常量, 绘制的模式
 * @final {Number} DrawingType
 */
var BMAP_DRAWING_MARKER = (window.BMAP_DRAWING_MARKER = 'marker'); // 鼠标画点模式
var BMAP_DRAWING_POLYLINE = (window.BMAP_DRAWING_POLYLINE = 'polyline'); // 鼠标画线模式
var BMAP_DRAWING_CIRCLE = (window.BMAP_DRAWING_CIRCLE = 'circle'); // 鼠标画圆模式
var BMAP_DRAWING_RECTANGLE = (window.BMAP_DRAWING_RECTANGLE = 'rectangle'); // 鼠标画矩形模式
var BMAP_DRAWING_POLYGON = (window.BMAP_DRAWING_POLYGON = 'polygon'); // 鼠标画多边形模式

/**
 * 声明baidu包
 */
var baidu = baidu || { guid: '$BAIDU$' };
const context = {};
(function () {
	// 一些页面级别唯一的属性，context[baidu.guid]上
	context[baidu.guid] = {};

	/**
	 * 将源对象的所有属性拷贝到目标对象中
	 * @name baidu.extend
	 * @function
	 * @grammar baidu.extend(target, source)
	 * @param {Object} target 目标对象
	 * @param {Object} source 源对象
	 * @returns {Object} 目标对象
	 */
	baidu.extend = function (target, source) {
		for (const p in source) {
			if (source.hasOwnProperty(p)) {
				target[p] = source[p];
			}
		}
		return target;
	};

	/**
	 * @ignore
	 * @namespace
	 * @baidu.lang 对语言层面的封装，包括类型判断、模块扩展、继承基类以及对象自定义事件的支持。
	 * @property guid 对象的唯一标识
	 */
	baidu.lang = baidu.lang || {};

	/**
	 * 返回一个当前页面的唯一标识字符串。
	 * @function
	 * @grammar baidu.lang.guid()
	 * @returns {String} 当前页面的唯一标识字符串
	 */
	baidu.lang.guid = function () {
		return `TANGRAM__${(context[baidu.guid]._counter++).toString(36)}`;
	};

	context[baidu.guid]._counter = context[baidu.guid]._counter || 1;

	/**
	 * 所有类的实例的容器
	 * key为每个实例的guid
	 */
	context[baidu.guid]._instances = context[baidu.guid]._instances || {};

	/**
	 * Tangram继承机制提供的一个基类，用户可以通过继承baidu.lang.Class来获取它的属性及方法。
	 * @function
	 * @name baidu.lang.Class
	 * @grammar baidu.lang.Class(guid)
	 * @param {string} guid 对象的唯一标识
	 * @meta standard
	 * @remark baidu.lang.Class和它的子类的实例均包含一个全局唯一的标识guid。
	 * guid是在构造函数中生成的，因此，继承自baidu.lang.Class的类应该直接或者间接调用它的构造函数。<br>
	 * baidu.lang.Class的构造函数中产生guid的方式可以保证guid的唯一性，及每个实例都有一个全局唯一的guid。
	 */
	baidu.lang.Class = function (guid) {
		this.guid = guid || baidu.lang.guid();
		context[baidu.guid]._instances[this.guid] = this;
	};

	context[baidu.guid]._instances = context[baidu.guid]._instances || {};

	/**
	 * 判断目标参数是否string类型或String对象
	 * @name baidu.lang.isString
	 * @function
	 * @grammar baidu.lang.isString(source)
	 * @param {Any} source 目标参数
	 * @shortcut isString
	 * @meta standard
	 *
	 * @returns {boolean} 类型判断结果
	 */
	baidu.lang.isString = function (source) {
		return Object.prototype.toString.call(source) === '[object String]';
	};

	/**
	 * 判断目标参数是否为function或Function实例
	 * @name baidu.lang.isFunction
	 * @function
	 * @grammar baidu.lang.isFunction(source)
	 * @param {Any} source 目标参数
	 * @returns {boolean} 类型判断结果
	 */
	baidu.lang.isFunction = function (source) {
		return Object.prototype.toString.call(source) === '[object Function]';
	};

	/**
	 * 重载了默认的toString方法，使得返回信息更加准确一些。
	 * @return {string} 对象的String表示形式
	 */
	baidu.lang.Class.prototype.toString = function () {
		return `[object ${this._className || 'Object'}]`;
	};

	/**
	 * 释放对象所持有的资源，主要是自定义事件。
	 * @name dispose
	 * @grammar obj.dispose()
	 */
	baidu.lang.Class.prototype.dispose = function () {
		delete context[baidu.guid]._instances[this.guid];
		for (const property in this) {
			if (!baidu.lang.isFunction(this[property])) {
				delete this[property];
			}
		}
		this.disposed = true;
	};

	/**
	 * 自定义的事件对象。
	 * @function
	 * @name baidu.lang.Event
	 * @grammar baidu.lang.Event(type[, target])
	 * @param {string} type  事件类型名称。为了方便区分事件和一个普通的方法，事件类型名称必须以"on"(小写)开头。
	 * @param {Object} [target]触发事件的对象
	 * @meta standard
	 * @remark 引入该模块，会自动为Class引入3个事件扩展方法：addEventListener、removeEventListener和dispatchEvent。
	 * @see baidu.lang.Class
	 */
	baidu.lang.Event = function (type, target) {
		this.type = type;
		this.returnValue = true;
		this.target = target || null;
		this.currentTarget = null;
	};

	/**
	 * 注册对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
	 * @grammar obj.addEventListener(type, handler[, key])
	 * @param   {string}   type         自定义事件的名称
	 * @param   {Function} handler      自定义事件被触发时应该调用的回调函数
	 * @param   {string}   [key]        为事件监听函数指定的名称，可在移除时使用。如果不提供，方法会默认为它生成一个全局唯一的key。
	 * @remark  事件类型区分大小写。如果自定义事件名称不是以小写"on"开头，该方法会给它加上"on"再进行判断，即"click"和"onclick"会被认为是同一种事件。
	 */
	baidu.lang.Class.prototype.addEventListener = function (
		type,
		handler,
		key,
	) {
		if (!baidu.lang.isFunction(handler)) {
			return;
		}
		if (!this.__listeners) {
			this.__listeners = {};
		}
		const t = this.__listeners;
		let id;
		if (typeof key === 'string' && key) {
			if (/[^\w-]/.test(key)) {
				throw new Error(`nonstandard key:${key}`);
			} else {
				handler.hashCode = key;
				id = key;
			}
		}
		if (type.indexOf('on') !== 0) {
			type = `on${type}`;
		}
		if (typeof t[type] !== 'object') {
			t[type] = {};
		}
		id = id || baidu.lang.guid();
		handler.hashCode = id;
		t[type][id] = handler;
	};

	/**
	 * 移除对象的事件监听器。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
	 * @grammar obj.removeEventListener(type, handler)
	 * @param {string}   type     事件类型
	 * @param {Function|string} handler  要移除的事件监听函数或者监听函数的key
	 * @remark  如果第二个参数handler没有被绑定到对应的自定义事件中，什么也不做。
	 */
	baidu.lang.Class.prototype.removeEventListener = function (type, handler) {
		if (baidu.lang.isFunction(handler)) {
			handler = handler.hashCode;
		} else if (!baidu.lang.isString(handler)) {
			return;
		}
		if (!this.__listeners) {
			this.__listeners = {};
		}
		if (type.indexOf('on') !== 0) {
			type = `on${type}`;
		}
		const t = this.__listeners;
		if (!t[type]) {
			return;
		}
		if (t[type][handler]) {
			delete t[type][handler];
		}
	};

	/**
	 * 派发自定义事件，使得绑定到自定义事件上面的函数都会被执行。引入baidu.lang.Event后，Class的子类实例才会获得该方法。
	 * @grammar obj.dispatchEvent(event, options)
	 * @param {baidu.lang.Event|String} event   Event对象，或事件名称(1.1.1起支持)
	 * @param {Object} options 扩展参数,所含属性键值会扩展到Event对象上(1.2起支持)
	 * @remark 处理会调用通过addEventListenr绑定的自定义事件回调函数之外，还会调用直接绑定到对象上面的自定义事件。
	 * 例如：<br>
	 * myobj.onMyEvent = function(){}<br>
	 * myobj.addEventListener("onMyEvent", function(){});
	 */
	baidu.lang.Class.prototype.dispatchEvent = function (event, options) {
		if (baidu.lang.isString(event)) {
			event = new baidu.lang.Event(event);
		}
		if (!this.__listeners) {
			this.__listeners = {};
		}
		options = options || {};
		for (const i in options) {
			event[i] = options[i];
		}
		const t = this.__listeners;
		let p = event.type;
		event.target = event.target || this;
		event.currentTarget = this;
		if (p.indexOf('on') !== 0) {
			p = `on${p}`;
		}
		if (baidu.lang.isFunction(this[p])) {
			this[p].apply(this, arguments);
		}
		if (typeof t[p] === 'object') {
			for (const i in t[p]) {
				t[p][i].apply(this, arguments);
			}
		}
		return event.returnValue;
	};

	/**
	 * 为类型构造器建立继承关系
	 * @name baidu.lang.inherits
	 * @function
	 * @grammar baidu.lang.inherits(subClass, superClass[, className])
	 * @param {Function} subClass 子类构造器
	 * @param {Function} superClass 父类构造器
	 * @param {string} className 类名标识
	 * @remark 使subClass继承superClass的prototype，
	 * 因此subClass的实例能够使用superClass的prototype中定义的所有属性和方法。<br>
	 * 这个函数实际上是建立了subClass和superClass的原型链集成，并对subClass进行了constructor修正。<br>
	 * <strong>注意：如果要继承构造函数，需要在subClass里面call一下，具体见下面的demo例子</strong>
	 * @shortcut inherits
	 * @meta standard
	 * @see baidu.lang.Class
	 */
	baidu.lang.inherits = function (subClass, superClass, className) {
		let key;
		const selfProps = subClass.prototype;
		const Clazz = function () {};
		Clazz.prototype = superClass.prototype;
		var proto = (subClass.prototype = new Clazz());
		for (key in selfProps) {
			proto[key] = selfProps[key];
		}
		subClass.prototype.constructor = subClass;
		subClass.superClass = superClass.prototype;
		if (typeof className === 'string') {
			proto._className = className;
		}
	};

	/**
	 * @ignore
	 * @namespace baidu.dom 操作dom的方法。
	 */
	baidu.dom = baidu.dom || {};

	/**
	 * 从文档中获取指定的DOM元素
	 *
	 * @param {string|HTMLElement} id 元素的id或DOM元素
	 * @meta standard
	 * @return {HTMLElement} DOM元素，如果不存在，返回null，如果参数不合法，直接返回参数
	 */
	baidu._g = baidu.dom._g = function (id) {
		if (baidu.lang.isString(id)) {
			return document.getElementById(id);
		}
		return id;
	};

	/**
	 * 从文档中获取指定的DOM元素
	 * @name baidu.dom.g
	 * @function
	 * @grammar baidu.dom.g(id)
	 * @param {string|HTMLElement} id 元素的id或DOM元素
	 * @meta standard
	 *
	 * @returns {HTMLElement|null} 获取的元素，查找不到时返回null,如果参数不合法，直接返回参数
	 */
	baidu.g = baidu.dom.g = function (id) {
		if (typeof id === 'string' || id instanceof String) {
			return document.getElementById(id);
		}
		if (
			id
			&& id.nodeName
			&& (Number(id.nodeType) === 1 || Number(id.nodeType) === 9)
		) {
			return id;
		}
		return null;
	};

	/**
	 * 在目标元素的指定位置插入HTML代码
	 * @name baidu.dom.insertHTML
	 * @function
	 * @grammar baidu.dom.insertHTML(element, position, html)
	 * @param {HTMLElement|string} element 目标元素或目标元素的id
	 * @param {string} position 插入html的位置信息，取值为beforeBegin,afterBegin,beforeEnd,afterEnd
	 * @param {string} html 要插入的html
	 * @remark
	 *
	 * 对于position参数，大小写不敏感<br>
	 * 此外，如果使用本函数插入带有script标签的HTML字符串，script标签对应的脚本将不会被执行。
	 *
	 * @shortcut insertHTML
	 * @meta standard
	 *
	 * @returns {HTMLElement} 目标元素
	 */
	baidu.insertHTML = baidu.dom.insertHTML = function (
		element,
		position,
		html,
	) {
		element = baidu.dom.g(element);
		let range;
		let begin;
		if (element.insertAdjacentHTML) {
			element.insertAdjacentHTML(position, html);
		} else {
			// 这里不做"undefined" != typeof(HTMLElement) && !window.opera判断，其它浏览器将出错？！
			// 但是其实做了判断，其它浏览器下等于这个函数就不能执行了
			range = element.ownerDocument.createRange();
			// FF下range的位置设置错误可能导致创建出来的fragment在插入dom树之后html结构乱掉
			// 改用range.insertNode来插入html, by wenyuxiang @ 2010-12-14.
			position = position.toUpperCase();
			if (position === 'AFTERBEGIN' || position === 'BEFOREEND') {
				range.selectNodeContents(element);
				range.collapse(position === 'AFTERBEGIN');
			} else {
				begin = position === 'BEFOREBEGIN';
				range[begin ? 'setStartBefore' : 'setEndAfter'](element);
				range.collapse(begin);
			}
			range.insertNode(range.createContextualFragment(html));
		}
		return element;
	};

	/**
	 * 为目标元素添加className
	 * @name baidu.dom.addClass
	 * @function
	 * @grammar baidu.dom.addClass(element, className)
	 * @param {HTMLElement|string} element 目标元素或目标元素的id
	 * @param {string} className 要添加的className，允许同时添加多个class，中间使用空白符分隔
	 * @remark
	 * 使用者应保证提供的className合法性，不应包含不合法字符，className合法字符参考：http://www.w3.org/TR/CSS2/syndata.html。
	 * @shortcut addClass
	 * @meta standard
	 *
	 * @returns {HTMLElement} 目标元素
	 */
	baidu.ac = baidu.dom.addClass = function (element, className) {
		element = baidu.dom.g(element);
		const classArray = className.split(/\s+/);
		let result = element.className;
		const classMatch = ` ${result} `;
		let i = 0;
		const l = classArray.length;
		for (; i < l; i += 1) {
			if (classMatch.indexOf(` ${classArray[i]} `) < 0) {
				result += (result ? ' ' : '') + classArray[i];
			}
		}
		element.className = result;
		return element;
	};

	/**
	 * @ignore
	 * @namespace baidu.event 屏蔽浏览器差异性的事件封装。
	 * @property target     事件的触发元素
	 * @property pageX      鼠标事件的鼠标x坐标
	 * @property pageY      鼠标事件的鼠标y坐标
	 * @property keyCode    键盘事件的键值
	 */
	baidu.event = baidu.event || {};

	/**
	 * 事件监听器的存储表
	 * @private
	 * @meta standard
	 */
	baidu.event._listeners = baidu.event._listeners || [];

	/**
	 * 为目标元素添加事件监听器
	 * @name baidu.event.on
	 * @function
	 * @grammar baidu.event.on(element, type, listener)
	 * @param {HTMLElement|string|window} element 目标元素或目标元素id
	 * @param {string} type 事件类型
	 * @param {Function} listener 需要添加的监听器
	 * @remark
	 *  1. 不支持跨浏览器的鼠标滚轮事件监听器添加<br>
	 *  2. 改方法不为监听器灌入事件对象，以防止跨iframe事件挂载的事件对象获取失败
	 * @shortcut on
	 * @meta standard
	 * @see baidu.event.un
	 *
	 * @returns {HTMLElement|window} 目标元素
	 */
	baidu.on = baidu.event.on = function (element, type, listener) {
		type = type.replace(/^on/i, '');
		element = baidu._g(element);
		let realListener = function (ev) {
			// 1. 这里不支持EventArgument,  原因是跨frame的事件挂载
			// 2. element是为了修正this
			listener.call(element, ev);
		};
		const lis = baidu.event._listeners;
		const filter = baidu.event._eventFilter;
		let afterFilter;
		let realType = type;
		type = type.toLowerCase();
		// filter过滤
		if (filter && filter[type]) {
			afterFilter = filter[type](element, type, realListener);
			realType = afterFilter.type;
			realListener = afterFilter.listener;
		}
		// 事件监听器挂载
		if (element.addEventListener) {
			element.addEventListener(realType, realListener, false);
		} else if (element.attachEvent) {
			element.attachEvent(`on${realType}`, realListener);
		}
		// 将监听器存储到数组中
		lis[lis.length] = [element, type, listener, realListener, realType];
		return element;
	};

	/**
	 * 为目标元素移除事件监听器
	 * @name baidu.event.un
	 * @function
	 * @grammar baidu.event.un(element, type, listener)
	 * @param {HTMLElement|string|window} element 目标元素或目标元素id
	 * @param {string} type 事件类型
	 * @param {Function} listener 需要移除的监听器
	 * @shortcut un
	 * @meta standard
	 * @returns {HTMLElement|window} 目标元素
	 */
	baidu.un = baidu.event.un = function (element, type, listener) {
		element = baidu._g(element);
		type = type.replace(/^on/i, '').toLowerCase();
		const lis = baidu.event._listeners;
		let len = lis.length;
		const isRemoveAll = !listener;
		let item;
		let realType;
		let realListener;
		// 如果将listener的结构改成json
		// 可以节省掉这个循环，优化性能
		// 但是由于un的使用频率并不高，同时在listener不多的时候
		// 遍历数组的性能消耗不会对代码产生影响
		// 暂不考虑此优化
		while (len--) {
			item = lis[len];
			// listener存在时，移除element的所有以listener监听的type类型事件
			// listener不存在时，移除element的所有type类型事件
			if (
				item[1] === type
				&& item[0] === element
				&& (isRemoveAll || item[2] === listener)
			) {
				const [, , , _realListener, _realType] = item;
				realType = _realType;
				realListener = _realListener;
				if (element.removeEventListener) {
					element.removeEventListener(realType, realListener, false);
				} else if (element.detachEvent) {
					element.detachEvent(`on${realType}`, realListener);
				}
				lis.splice(len, 1);
			}
		}
		return element;
	};

	/**
	 * 获取event事件,解决不同浏览器兼容问题
	 * @param {Event}
	 * @return {Event}
	 */
	baidu.getEvent = baidu.event.getEvent = function (event) {
		return window.event || event;
	};

	/**
	 * 获取event.target,解决不同浏览器兼容问题
	 * @param {Event}
	 * @return {Target}
	 */
	baidu.getTarget = baidu.event.getTarget = function (event) {
		const _event = baidu.getEvent(event);
		return _event.target || _event.srcElement;
	};

	/**
	 * 阻止事件的默认行为
	 * @name baidu.event.preventDefault
	 * @function
	 * @grammar baidu.event.preventDefault(event)
	 * @param {Event} event 事件对象
	 * @meta standard
	 */
	baidu.preventDefault = baidu.event.preventDefault = function (event) {
		const _event = baidu.getEvent(event);
		if (_event.preventDefault) {
			_event.preventDefault();
		} else {
			_event.returnValue = false;
		}
	};

	/**
	 * 停止事件冒泡传播
	 * @param {Event}
	 */
	baidu.stopBubble = baidu.event.stopBubble = function (event) {
		const _event = baidu.getEvent(event);
		if (_event.stopPropagation) {
			_event.stopPropagation();
		} else {
			_event.cancelBubble = true;
		}
	};

	baidu.browser = baidu.browser || {};

	if (/msie (\d+\.\d)/i.test(navigator.userAgent)) {
		// IE 8下，以documentMode为准
		// 在百度模板中，可能会有$，防止冲突，将$1 写成 \x241
		/**
		 * 判断是否为ie浏览器
		 * @property ie ie版本号
		 * @grammar baidu.browser.ie
		 * @meta standard
		 * @shortcut ie
		 * @see firefox,safari,chrome,maxthon
		 */
		baidu.browser.ie = baidu.ie = document.documentMode || +RegExp['\x241'];
	}
}());

/**
 * @exports DrawingManager as BMapLib.DrawingManager
 */
const DrawingManager = (window.BMapLib.DrawingManager = function (map, opts) {
	try {
		BMap;
	} catch (e) {
		throw Error('Baidu Map JS API is not ready yet!');
	}
	if (!map) {
		return;
	}
	instances.push(this);
	opts = opts || {};
	this._initialize(map, opts);
});

// 通过baidu.lang下的inherits方法，让DrawingManager继承baidu.lang.Class
baidu.lang.inherits(DrawingManager, baidu.lang.Class, 'DrawingManager');

/**
 * 开启地图的绘制模式
 *
 * @example <b>参考示例：</b><br />
 * myDrawingManagerObject.open();
 */
DrawingManager.prototype.open = function () {
	// 判断绘制状态是否已经开启
	if (this._isOpen === true) {
		return true;
	}
	closeInstanceExcept(this);
	this._open();
};

/**
 * 关闭地图的绘制状态
 *
 * @example <b>参考示例：</b><br />
 * myDrawingManagerObject.close();
 */
DrawingManager.prototype.close = function () {
	// 判断绘制状态是否已经开启
	if (this._isOpen === false) {
		return true;
	}
	const me = this;
	this._close();
	me._map.removeOverlay(tipLabel);
	setTimeout(() => {
		me._map.enableDoubleClickZoom();
	}, 2000);
};

/**
 * 设置当前的绘制模式，参数DrawingType，为5个可选常量:
 * <br/>BMAP_DRAWING_MARKER    画点
 * <br/>BMAP_DRAWING_CIRCLE    画圆
 * <br/>BMAP_DRAWING_POLYLINE  画线
 * <br/>BMAP_DRAWING_POLYGON   画多边形
 * <br/>BMAP_DRAWING_RECTANGLE 画矩形
 * @param {DrawingType} DrawingType
 * @return {Boolean}
 *
 * @example <b>参考示例：</b><br />
 * myDrawingManagerObject.setDrawingMode(BMAP_DRAWING_POLYLINE);
 */
DrawingManager.prototype.setDrawingMode = function (drawingType) {
	// 与当前模式不一样时候才进行重新绑定事件
	if (this._drawingType !== drawingType) {
		closeInstanceExcept(this);
		this._setDrawingMode(drawingType);
	}
};

/**
 * 获取当前的绘制模式
 * @return {DrawingType} 绘制的模式
 *
 * @example <b>参考示例：</b><br />
 * alert(myDrawingManagerObject.getDrawingMode());
 */
DrawingManager.prototype.getDrawingMode = function () {
	return this._drawingType;
};

/**
 * 打开距离或面积计算
 *
 * @example <b>参考示例：</b><br />
 * myDrawingManagerObject.enableCalculate();
 */
DrawingManager.prototype.enableCalculate = function () {
	this._enableCalculate = true;
	this._addGeoUtilsLibrary(); // 异步调用GeoUtils
};

/**
 * 关闭距离或面积计算
 *
 * @example <b>参考示例：</b><br />
 * myDrawingManagerObject.disableCalculate();
 */
DrawingManager.prototype.disableCalculate = function () {
	this._enableCalculate = false;
};

/**
 * 打开鼠标右键(ESC按键)取消绘制功能
 *
 * @example <b>参考示例：</b><br />
 * myDrawingManagerObject.enableRightCancel();
 */
DrawingManager.prototype.enableRightCancel = function () {
	this._enableRightCancel = true;
	// 若地图绘制状态已开启，直接添加监听
	if (this._isOpen === true && !this._rightCancelSwitch) {
		this._addRightCancelAction();
	}
};

/**
 * 关闭鼠标右键(ESC按键)取消绘制功能
 *
 * @example <b>参考示例：</b><br />
 * myDrawingManagerObject.disableRightCancel();
 */
DrawingManager.prototype.disableRightCancel = function () {
	this._enableRightCancel = false;
	// 若地图绘制状态已开启，直接取消监听
	if (this._isOpen === true && this._rightCancelSwitch) {
		this._removeRightCancelAction();
	}
};

/**
 * 判断点是否在绘制的图形中
 *
 * @example <b>参考示例：</b><br />
 * myDrawingManagerObject.isPointInOverlay(type, point, overlay);
 */
DrawingManager.prototype.isPointInOverlay = function (type, point, overlay) {
	let result = false;
	if (this._enableCalculate && BMapLib.GeoUtils) {
		switch (type) {
		case BMAP_DRAWING_CIRCLE:
			result = BMapLib.GeoUtils.isPointInCircle(point, overlay);
			break;
		case BMAP_DRAWING_POLYGON:
			result = BMapLib.GeoUtils.isPointInPolygon(point, overlay);
			break;
		case BMAP_DRAWING_RECTANGLE:
			result = BMapLib.GeoUtils.isPointInRect(
				point,
				overlay.getBounds(),
			);
			break;
		case BMAP_DRAWING_POLYLINE:
			result = BMapLib.GeoUtils.isPointOnPolyline(point, overlay);
			break;
		default:
			break;
		}
	}
	return result;
};

/**
 * 鼠标绘制完成后，派发总事件的接口
 * @name DrawingManager#overlaycomplete
 * @event
 * @param {Event Object} e 回调函数会返回event参数，包括以下返回值：
 * <br />{"<b>drawingMode</b> : {DrawingType} 当前的绘制模式
 * <br />"<b>overlay</b>：{Marker||Polyline||Polygon||Circle} 对应的绘制模式返回对应的覆盖物
 * <br />"<b>calculate</b>：{Number} 需要开启计算模式才会返回这个值，当绘制线的时候返回距离、绘制多边形、圆、矩形时候返回面积，单位为米，
 * <br />"<b>label</b>：{Label} 计算面积时候出现在Map上的Label对象
 *
 * @example <b>参考示例：</b>
 * myDrawingManagerObject.addEventListener("overlaycomplete", function(e) {
 *     alert(e.drawingMode);
 *     alert(e.overlay);
 *     alert(e.calculate);
 *     alert(e.label);
 * });
 */

/**
 * 绘制点完成后，派发的事件接口
 * @name DrawingManager#markercomplete
 * @event
 * @param {Marker} overlay 回调函数会返回相应的覆盖物，
 * <br />{"<b>overlay</b> : {Marker}
 *
 * @example <b>参考示例：</b>
 * myDrawingManagerObject.addEventListener("circlecomplete", function(e, overlay) {
 *     alert(overlay);
 * });
 */

/**
 * 绘制圆完成后，派发的事件接口
 * @name DrawingManager#circlecomplete
 * @event
 * @param {Circle} overlay 回调函数会返回相应的覆盖物，
 * <br />{"<b>overlay</b> : {Circle}
 */

/**
 * 绘制线完成后，派发的事件接口
 * @name DrawingManager#polylinecomplete
 * @event
 * @param {Polyline} overlay 回调函数会返回相应的覆盖物，
 * <br />{"<b>overlay</b> : {Polyline}
 */

/**
 * 绘制多边形完成后，派发的事件接口
 * @name DrawingManager#polygoncomplete
 * @event
 * @param {Polygon} overlay 回调函数会返回相应的覆盖物，
 * <br />{"<b>overlay</b> : {Polygon}
 */

/**
 * 绘制矩形完成后，派发的事件接口
 * @name DrawingManager#rectanglecomplete
 * @event
 * @param {Polygon} overlay 回调函数会返回相应的覆盖物，
 * <br />{"<b>overlay</b> : {Polygon}
 */

/**
 * 初始化状态
 * @param {Map} 地图实例
 * @param {Object} 参数
 */
DrawingManager.prototype._initialize = function (map, opts) {
	/**
	 * map对象
	 * @private
	 * @type {Map}
	 */
	this._map = map;

	/**
	 * 配置对象
	 * @private
	 * @type {Object}
	 */
	this._opts = opts;

	/**
	 * 当前的绘制模式, 默认是绘制点
	 * @private
	 * @type {DrawingType}
	 */
	this._drawingType = opts.drawingMode || BMAP_DRAWING_MARKER;

	/**
	 * 是否添加添加鼠标绘制工具栏面板
	 */
	if (opts.enableDrawingTool) {
		const drawingTool = new DrawingTool(this, opts.drawingToolOptions);
		this._drawingTool = drawingTool;
		map.addControl(drawingTool);
	}

	// 是否计算绘制出的面积
	if (opts.enableCalculate === true) {
		this.enableCalculate();
	} else {
		this.disableCalculate();
	}

	// 是否启用右键(ESC按键)取消绘制功能
	this._enableRightCancel = opts.enableRightCancel === true;
	// 右键(ESC按键)取消绘制回调
	this.rightCancelCallback = opts.rightCancelCallback;

	/**
	 * 是否已经开启了绘制状态
	 * @private
	 * @type {Boolean}
	 */
	this._isOpen = opts.isOpen === true;
	if (this._isOpen) {
		this._open();
	}
	this.markerOptions = opts.markerOptions || {};
	this.circleOptions = opts.circleOptions || {};
	this.polylineOptions = opts.polylineOptions || {};
	this.polygonOptions = opts.polygonOptions || {};
	this.rectangleOptions = opts.rectangleOptions || {};
	this.tipLabelOptions = opts.tipLabelOptions || {};
	this.calculateLabelOptions = opts.calculateLabelOptions || {};
	this.calculateDisplayOptions = opts.calculateDisplayOptions || {};

	// 地图缩放时，circle需要重新设置中心点坐标和半径
	if (window.resetCircleAfterZoomChange) {
		map.removeEventListener('zoomend', window.resetCircleAfterZoomChange);
	}
	window.resetCircleAfterZoomChange = (e) => {
		e.target
			.getOverlays()
			.filter((item) => item.realV)
			.forEach((item) => {
				const pixelCenter = map.pointToOverlayPixel(item.point);
				item.realV.setAttribute('cx', pixelCenter.x);
				item.realV.setAttribute('cy', pixelCenter.y);
				item.realV.setAttribute(
					'r',
					Math.round(this.getPixelRadius(item.point, item.endPoint)),
				);
			});
	};
	map.addEventListener('zoomend', window.resetCircleAfterZoomChange);
};

/**
 * 开启地图的绘制状态
 * @return {Boolean}，开启绘制状态成功，返回true；否则返回false。
 */
DrawingManager.prototype._open = function () {
	this._isOpen = true;
	// 添加遮罩，所有鼠标操作都在这个遮罩上完成
	if (!this._mask) {
		this._mask = new Mask();
	}
	this._map.addOverlay(this._mask);
	this._setDrawingMode(this._drawingType);

	if (this._enableRightCancel && !this._rightCancelSwitch) {
		this._addRightCancelAction();
	}
};

/**
 * 设置当前的绘制模式
 * @param {DrawingType}
 */
DrawingManager.prototype._setDrawingMode = function (drawingType) {
	this._drawingType = drawingType;

	/**
	 * 开启编辑状态时候才重新进行事件绑定
	 */
	if (this._isOpen) {
		// 清空之前的自定义事件
		this._mask.__listeners = {};
		switch (drawingType) {
		case BMAP_DRAWING_MARKER:
			this._bindMarker();
			break;
		case BMAP_DRAWING_CIRCLE:
			this._bindCircle();
			break;
		case BMAP_DRAWING_POLYLINE:
		case BMAP_DRAWING_POLYGON:
			this._bindPolylineOrPolygon();
			break;
		case BMAP_DRAWING_RECTANGLE:
			this._bindRectangle();
			break;
		default:
			break;
		}
	}

	/**
	 * 如果添加了工具栏，则也需要改变工具栏的样式
	 */
	if (this._drawingTool && this._isOpen) {
		this._drawingTool.setStyleByDrawingMode(drawingType);
	}
};

/**
 * 关闭地图的绘制状态
 * @return {Boolean}，关闭绘制状态成功，返回true；否则返回false。
 */
DrawingManager.prototype._close = function () {
	this._isOpen = false;
	if (this._mask) {
		this._mask.disableEdgeMove();
		this._map.removeOverlay(this._mask);
	}

	if (this._rightCancelSwitch) {
		this._removeRightCancelAction();
	}

	/**
	 * 如果添加了工具栏，则关闭时候将工具栏样式设置为拖拽地图
	 */
	if (this._drawingTool) {
		this._drawingTool.setStyleByDrawingMode('hander');
	}
};

/**
 * 添加对鼠标右键(ESC按键)取消绘制的监听
 */
DrawingManager.prototype._addRightCancelAction = function () {
	this._rightCancelSwitch = true;
	window.rightCancelAction = (e) => {
		if (Number(e.button) === 2 || Number(e.keyCode) === 27) {
			this.close();
			if (baidu.lang.isFunction(this.rightCancelCallback)) {
				this.rightCancelCallback();
			}
		}
	};
	// 监听键盘ESC按键按下后放开事件
	document.addEventListener('keyup', window.rightCancelAction);
	// 监听鼠标右键按下后放开事件
	document.addEventListener('mouseup', window.rightCancelAction);
};

/**
 * 移除对鼠标右键(ESC按键)取消绘制的监听
 */
DrawingManager.prototype._removeRightCancelAction = function () {
	this._rightCancelSwitch = false;
	if (window.rightCancelAction) {
		document.removeEventListener('keyup', window.rightCancelAction);
		document.removeEventListener('mouseup', window.rightCancelAction);
	}
};

/**
 * 绑定鼠标画点的事件
 */
DrawingManager.prototype._bindMarker = function () {
	const me = this;
	const map = this._map;
	const mask = this._mask;

	/**
	 * 鼠标点击的事件
	 */
	const clickAction = function (e) {
		// 往地图上添加marker
		const marker = new BMap.Marker(e.point, me.markerOptions);
		map.addOverlay(marker);
		me._dispatchOverlayComplete(marker);
	};
	mask.addEventListener('click', clickAction);
};

// 获取圆形覆盖物的像素半径（两点对应的像素坐标的距离）
DrawingManager.prototype.getPixelRadius = function (centerPoint, endPoint) {
	const centerPointPixel = this._map.pointToOverlayPixel(centerPoint);
	const endPointPixel = this._map.pointToOverlayPixel(endPoint);
	const distanceX = Math.abs(endPointPixel.x - centerPointPixel.x);
	const distanceY = Math.abs(endPointPixel.y - centerPointPixel.y);
	return Math.sqrt(distanceX ** 2 + distanceY ** 2);
};

var tipLabel = null; // 实时文字tip
var calculateLabel = null; // 实时文字计算
var calculateExtraLabel = null; // 实时额外文字计算

/**
 * 绑定鼠标画圆的事件
 */
DrawingManager.prototype._bindCircle = function () {
	const me = this;
	const map = this._map;
	const mask = this._mask;
	let circle = null;
	let centerPoint = null; // 圆的中心点

	/**
	 * 开始绘制圆形
	 */
	var startAction = function (e) {
		centerPoint = e.point;
		circle = new BMap.Circle(centerPoint, 0, {
			...me.circleOptions,
			...{ strokeOpacity: '0', fillOpacity: '0' },
		});
		map.addOverlay(circle);
		// 原有通过path画的圆设置为透明，通过插入svg的circle图形进行替代，解决画圆不规范的问题
		const pixelCenter = map.pointToOverlayPixel(e.point);
		const realCircle = document.createElementNS(
			'http://www.w3.org/2000/svg',
			'circle',
		);
		realCircle.setAttribute('stroke', circle.z.strokeColor);
		realCircle.setAttribute('fill', circle.z.fillColor);
		realCircle.setAttribute('stroke-width', circle.z.lc);
		realCircle.setAttribute(
			'stroke-opacity',
			me.circleOptions.strokeOpacity < 0
				|| me.circleOptions.strokeOpacity > 1
				? 0.65
				: me.circleOptions.strokeOpacity,
		);
		realCircle.setAttribute(
			'fill-opacity',
			me.circleOptions.fillOpacity < 0 || me.circleOptions.fillOpacity > 1
				? 0.65
				: me.circleOptions.fillOpacity,
		);
		realCircle.setAttribute(
			'stroke-dasharray',
			circle.z.strokeStyle === 'dashed' ? 6 : 0,
		);
		realCircle.setAttribute('cx', pixelCenter.x);
		realCircle.setAttribute('cy', pixelCenter.y);
		realCircle.setAttribute('r', 0);
		realCircle.setAttribute('style', 'cursor: pointer;user-select: none;');
		circle.V.setAttribute('style', 'visibility: hidden;');
		circle.V.parentNode.insertBefore(realCircle, circle.V);
		circle.realV = realCircle;
		mask.enableEdgeMove();
		mask.addEventListener('mousemove', moveAction);
		baidu.on(document, 'mouseup', endAction);
		if (me._enableRightCancel) {
			baidu.on(document, 'keyup', escCancelAction);
		}
	};

	/**
	 * 绘制圆形过程中，鼠标移动过程的事件
	 */
	var moveAction = function (e) {
		circle.endPoint = e.point;
		circle.setRadius(me._map.getDistance(centerPoint, e.point));
		circle.realV.setAttribute(
			'r',
			Math.round(me.getPixelRadius(centerPoint, e.point)),
		);
		map.removeOverlay(tipLabel);
		tipLabel = me._addLabel(
			'松开鼠标完成',
			me.tipLabelOptions,
			e.point,
			new BMap.Size(10, 10),
		);
		// 实时计算显示
		if (me.calculateDisplayOptions.isRealTime) {
			addCalculateLabel('move');
		}
	};

	/**
	 * 绘制圆形结束
	 */
	var endAction = function (e) {
		map.removeOverlay(tipLabel);
		centerPoint = null;
		mask.disableEdgeMove();
		mask.removeEventListener('mousedown', mousedownAction);
		mask.removeEventListener('mousemove', moveAction);
		mask.removeEventListener('mousemove', mousemoveAction);
		baidu.un(document, 'mouseup', endAction);
		baidu.un(document, 'keyup', escCancelAction);
		const removeAction = function (_e) {
			if (_e.target.realV) {
				_e.target.realV.remove();
			}
			circle.removeEventListener('remove', removeAction);
		};
		circle.addEventListener('remove', removeAction);
		if (
			me._enableRightCancel
			&& (Number(e.button) === 2 || Number(e.keyCode) === 27)
		) {
			map.removeOverlay(circle);
			map.removeOverlay(calculateLabel);
			return;
		}
		if (!me._isOpen) {
			return;
		}
		const calculate = addCalculateLabel('end');
		me._dispatchOverlayComplete(circle, calculate);
	};

	/**
	 * ESC按钮结束圆形绘制
	 */
	var escCancelAction = function (e) {
		if (Number(e.keyCode) === 27) {
			endAction(e);
		}
	};

	/**
	 * 鼠标点击起始点
	 */
	var mousedownAction = function (e) {
		baidu.preventDefault(e);
		baidu.stopBubble(e);
		if (Number(e.button) === 1 || Number(e.button) === 2) {
			return;
		}
		if (centerPoint == null) {
			startAction(e);
		}
	};

	/**
	 * 非绘制圆形过程中，鼠标移动过程的事件
	 */
	var mousemoveAction = function (e) {
		baidu.preventDefault(e);
		baidu.stopBubble(e);
		map.removeOverlay(tipLabel);
		tipLabel = me._addLabel(
			'按下确认中心点，拖拽确认半径',
			me.tipLabelOptions,
			e.point,
			new BMap.Size(10, 10),
		);
	};

	/**
	 * 添加显示所绘制图形的面积或者长度
	 */
	var addCalculateLabel = function (type) {
		let prefix;
		let content;
		let calculate;
		if (me._enableCalculate) {
			if (me.calculateDisplayOptions.circleDisplayType === 'area') {
				prefix =					me.calculateDisplayOptions.circleDisplayPrefix || '面积：';
				calculate = me._calculate(circle);
			} else {
				prefix =					me.calculateDisplayOptions.circleDisplayPrefix || '半径：';
				calculate = {
					data: circle.getRadius(),
				};
			}
			content = calculate.data;
			if (
				baidu.lang.isFunction(
					me.calculateDisplayOptions.circleDisplayFormat,
				)
			) {
				content = me.calculateDisplayOptions.circleDisplayFormat(
					content,
				);
			}
			map.removeOverlay(calculateLabel);
			// 取圆心与其正上方的圆上点连线逆时针旋转35度位置处圆上点作为label的定位点
			const pixelCenter = map.pointToOverlayPixel(circle.getCenter());
			const pixelRadius = circle.realV.getAttribute('r');
			const pixelLabelPoint = {
				x:
					pixelCenter.x
					- Math.sin(2 * Math.PI * (35 / 360)) * pixelRadius,
				y:
					pixelCenter.y
					- Math.cos(2 * Math.PI * (35 / 360)) * pixelRadius,
			};
			if (type === 'move') {
				calculateLabel = me._addLabel(
					`${prefix}${content}`,
					me.calculateLabelOptions,
					map.overlayPixelToPoint(pixelLabelPoint),
				);
				calculateLabel.setOffset(
					new BMap.Size(
						-calculateLabel.V.offsetWidth,
						-calculateLabel.V.offsetHeight,
					),
				);
				calculate.label = calculateLabel;
			} else {
				const endLabel = me._addLabel(
					`${prefix}${content}`,
					me.calculateLabelOptions,
					map.overlayPixelToPoint(pixelLabelPoint),
				);
				endLabel.setOffset(
					new BMap.Size(
						-endLabel.V.offsetWidth,
						-endLabel.V.offsetHeight,
					),
				);
				calculate.label = endLabel;
			}
		}
		return calculate;
	};

	mask.addEventListener('mousedown', mousedownAction);
	mask.addEventListener('mousemove', mousemoveAction);
};

/**
 * 画线和画多边形相似性比较大，公用一个方法
 */
DrawingManager.prototype._bindPolylineOrPolygon = function () {
	const me = this;
	const map = this._map;
	const mask = this._mask;
	const points = []; // 用户绘制的点
	let drawPoint = null; // 实际需要画在地图上的点
	let overlay = null;
	let isBinded = false;

	/**
	 * 鼠标点击的事件
	 */
	var startAction = function (e) {
		points.push(e.point);
		drawPoint = points.concat(points[points.length - 1]);
		if (points.length === 1) {
			if (me._drawingType === BMAP_DRAWING_POLYLINE) {
				overlay = new BMap.Polyline(drawPoint, me.polylineOptions);
			} else if (me._drawingType === BMAP_DRAWING_POLYGON) {
				overlay = new BMap.Polygon(drawPoint, me.polygonOptions);
			}
			map.addOverlay(overlay);
		} else {
			overlay.setPath(drawPoint);
		}
		if (!isBinded) {
			isBinded = true;
			mask.enableEdgeMove();
			mask.addEventListener('mousemove', moveAction);
			mask.addEventListener('dblclick', dblclickAction);
			if (me._enableRightCancel) {
				baidu.on(document, 'mouseup', rightCancelAction);
				baidu.on(document, 'keyup', rightCancelAction);
			}
		}
	};

	/**
	 * 鼠标移动过程的事件
	 */
	var moveAction = function (e) {
		overlay.setPositionAt(drawPoint.length - 1, e.point);
		map.removeOverlay(tipLabel);
		tipLabel = me._addLabel(
			`单击继续，双击完成${me._enableRightCancel ? '，右键取消' : ''}`,
			me.tipLabelOptions,
			e.point,
			new BMap.Size(10, 10),
		);
		// 实时计算显示
		if (me.calculateDisplayOptions.isRealTime) {
			addCalculateLabel('move');
		}
	};

	/**
	 * 鼠标双击的事件
	 */
	var dblclickAction = function (e) {
		baidu.stopBubble(e);
		isBinded = false;
		map.removeOverlay(tipLabel);
		mask.disableEdgeMove();
		mask.removeEventListener('mousedown', mousedownAction);
		mask.removeEventListener('mousemove', moveAction);
		mask.removeEventListener('mousemove', mousemoveAction);
		mask.removeEventListener('dblclick', dblclickAction);
		baidu.un(document, 'mouseup', rightCancelAction);
		baidu.un(document, 'keyup', rightCancelAction);
		if (baidu.ie <= 8) {
			// console.log(points);
		} else {
			points.pop();
		}
		overlay.setPath(points);
		if (
			me._enableRightCancel
			&& (Number(e.button) === 2 || Number(e.keyCode) === 27)
		) {
			map.removeOverlay(overlay);
			map.removeOverlay(calculateLabel);
		} else {
			const calculate = addCalculateLabel('end');
			me._dispatchOverlayComplete(overlay, calculate);
			me.close();
		}
		points.length = 0;
		drawPoint.length = 0;
	};

	/**
	 * 右键（ESC按键）结束绘制
	 */
	var rightCancelAction = function (e) {
		if (Number(e.button) === 2 || Number(e.keyCode) === 27) {
			dblclickAction(e);
		}
	};

	/**
	 * 鼠标点击起始点
	 */
	var mousedownAction = function (e) {
		baidu.preventDefault(e);
		baidu.stopBubble(e);
		if (Number(e.button) === 1 || Number(e.button) === 2) {
			return;
		}
		startAction(e);
	};

	/**
	 * 非绘制多边形过程中，鼠标移动过程的事件
	 */
	var mousemoveAction = function (e) {
		baidu.preventDefault(e);
		baidu.stopBubble(e);
		map.removeOverlay(tipLabel);
		tipLabel = me._addLabel(
			'单击确认起点',
			me.tipLabelOptions,
			e.point,
			new BMap.Size(10, 10),
		);
	};

	/**
	 * 添加显示所绘制图形的面积或者长度
	 */
	var addCalculateLabel = function (type) {
		let prefix;
		let content;
		let calculate;
		if (me._enableCalculate) {
			if (me._drawingType === BMAP_DRAWING_POLYGON) {
				prefix =					me.calculateDisplayOptions.polygonDisplayPrefix || '面积：';
				calculate = me._calculate(overlay);
				content = calculate.data;
				if (
					baidu.lang.isFunction(
						me.calculateDisplayOptions.polygonDisplayFormat,
					)
				) {
					content = me.calculateDisplayOptions.polygonDisplayFormat(
						content,
					);
				}
			} else {
				prefix =					me.calculateDisplayOptions.polylineDisplayPrefix
					|| '总长：';
				calculate = me._calculate(overlay);
				content = calculate.data;
				if (
					baidu.lang.isFunction(
						me.calculateDisplayOptions.polylineDisplayFormat,
					)
				) {
					content = me.calculateDisplayOptions.polylineDisplayFormat(
						content,
					);
				}
			}
			map.removeOverlay(calculateLabel);
			if (type === 'move') {
				calculateLabel = me._addLabel(
					`${prefix}${content}`,
					me.calculateLabelOptions,
					points[0],
				);
				calculateLabel.setOffset(
					new BMap.Size(0, -calculateLabel.V.offsetHeight - 5),
				);
				calculate.label = calculateLabel;
			} else {
				const endLabel = me._addLabel(
					`${prefix}${content}`,
					me.calculateLabelOptions,
					points[0],
				);
				endLabel.setOffset(
					new BMap.Size(0, -endLabel.V.offsetHeight - 5),
				);
				calculate.label = endLabel;
			}
		}
		return calculate;
	};

	mask.addEventListener('mousemove', mousemoveAction);
	mask.addEventListener('mousedown', mousedownAction);

	// 双击时候不放大地图级别
	mask.addEventListener('dblclick', (e) => {
		baidu.stopBubble(e);
	});
};

/**
 * 绑定鼠标画矩形的事件
 */
DrawingManager.prototype._bindRectangle = function () {
	const me = this;
	const map = this._map;
	const mask = this._mask;
	let polygon = null;
	let startPoint = null;

	/**
	 * 开始绘制矩形
	 */
	var startAction = function (e) {
		startPoint = e.point;
		const endPoint = startPoint;
		polygon = new BMap.Polygon(
			me._getRectanglePoint(startPoint, endPoint),
			me.rectangleOptions,
		);
		map.addOverlay(polygon);
		mask.enableEdgeMove();
		mask.addEventListener('mousemove', moveAction);
		baidu.on(document, 'mouseup', endAction);
		if (me._enableRightCancel) {
			baidu.on(document, 'keyup', escCancelAction);
		}
	};

	/**
	 * 绘制矩形过程中，鼠标移动过程的事件
	 */
	var moveAction = function (e) {
		polygon.setPath(me._getRectanglePoint(startPoint, e.point));
		map.removeOverlay(tipLabel);
		tipLabel = me._addLabel(
			'松开鼠标完成',
			me.tipLabelOptions,
			e.point,
			new BMap.Size(10, 10),
		);
		// 实时计算显示
		if (me.calculateDisplayOptions.isRealTime) {
			addCalculateLabel('move');
		}
	};

	/**
	 * 绘制矩形结束
	 */
	var endAction = function (e) {
		map.removeOverlay(tipLabel);
		startPoint = null;
		mask.disableEdgeMove();
		mask.removeEventListener('mousedown', mousedownAction);
		mask.removeEventListener('mousemove', moveAction);
		mask.removeEventListener('mousemove', mousemoveAction);
		baidu.un(document, 'mouseup', endAction);
		baidu.un(document, 'keyup', escCancelAction);
		if (
			me._enableRightCancel
			&& (Number(e.button) === 2 || Number(e.keyCode) === 27)
		) {
			map.removeOverlay(polygon);
			map.removeOverlay(calculateLabel);
			map.removeOverlay(calculateExtraLabel);
			return;
		}
		if (!me._isOpen) {
			return;
		}
		const calculate = addCalculateLabel('end');
		me._dispatchOverlayComplete(polygon, calculate);
	};

	/**
	 * ESC按钮结束矩形绘制
	 */
	var escCancelAction = function (e) {
		if (Number(e.keyCode) === 27) {
			endAction(e);
		}
	};

	/**
	 * 鼠标点击起始点
	 */
	var mousedownAction = function (e) {
		baidu.preventDefault(e);
		baidu.stopBubble(e);
		if (Number(e.button) === 1 || Number(e.button) === 2) {
			return;
		}
		if (startPoint == null) {
			startAction(e);
		}
	};

	/**
	 * 非绘制矩形过程中，鼠标移动过程的事件
	 */
	var mousemoveAction = function (e) {
		baidu.preventDefault(e);
		baidu.stopBubble(e);
		map.removeOverlay(tipLabel);
		tipLabel = me._addLabel(
			'按住确认起点，拖拽进行绘制',
			me.tipLabelOptions,
			e.point,
			new BMap.Size(10, 10),
		);
	};

	/**
	 * 添加显示所绘制图形的面积或者长度
	 */
	var addCalculateLabel = function (type) {
		let prefix;
		let content;
		let calculate;
		const points = polygon.getPath();
		if (me._enableCalculate) {
			if (me.calculateDisplayOptions.rectangleDisplayType === 'area') {
				prefix =					me.calculateDisplayOptions.rectangleDisplayPrefix
					|| '面积：';
				calculate = me._calculate(polygon);
				content = calculate.data;
				if (
					baidu.lang.isFunction(
						me.calculateDisplayOptions.rectangleDisplayFormat,
					)
				) {
					content = me.calculateDisplayOptions.rectangleDisplayFormat(
						content,
					);
				}
				map.removeOverlay(calculateLabel);
				if (type === 'move') {
					calculateLabel = me._addLabel(
						`${prefix}${content}`,
						me.calculateLabelOptions,
						points[0],
					);
					calculateLabel.setOffset(
						new BMap.Size(
							-calculateLabel.V.offsetWidth,
							-calculateLabel.V.offsetHeight,
						),
					);
					calculate.label = calculateLabel;
				} else {
					const endLabel = me._addLabel(
						`${prefix}${content}`,
						me.calculateLabelOptions,
						points[0],
					);
					endLabel.setOffset(
						new BMap.Size(
							-endLabel.V.offsetWidth,
							-endLabel.V.offsetHeight,
						),
					);
					calculate.label = endLabel;
				}
			} else {
				prefix =					me.calculateDisplayOptions.rectangleDisplayPrefix
					|| '边长：';
				const width = me._map.getDistance(points[0], points[1]);
				const height = me._map.getDistance(points[0], points[3]);
				calculate = {
					data: [width, height],
				};
				content = calculate.data;
				if (
					baidu.lang.isFunction(
						me.calculateDisplayOptions.rectangleDisplayFormat,
					)
				) {
					content = content.map((item) =>
						me.calculateDisplayOptions.rectangleDisplayFormat(item),
					);
				}
				map.removeOverlay(calculateLabel);
				map.removeOverlay(calculateExtraLabel);
				if (type === 'move') {
					calculateLabel = me._addLabel(
						`${prefix}${content[0]}`,
						me.calculateLabelOptions,
						points[0],
					);
					calculateExtraLabel = me._addLabel(
						`${prefix}${content[1]}`,
						me.calculateLabelOptions,
						points[1],
						new BMap.Size(5, 0),
					);
					calculateLabel.setOffset(
						new BMap.Size(0, -calculateLabel.V.offsetHeight - 5),
					);
					calculate.label = [calculateLabel, calculateExtraLabel];
				} else {
					const endLabel = me._addLabel(
						`${prefix}${content[0]}`,
						me.calculateLabelOptions,
						points[0],
					);
					const endExtraLabel = me._addLabel(
						`${prefix}${content[1]}`,
						me.calculateLabelOptions,
						points[1],
						new BMap.Size(5, 0),
					);
					endLabel.setOffset(
						new BMap.Size(0, -endLabel.V.offsetHeight - 5),
					);
					calculate.label = [endLabel, endExtraLabel];
				}
			}
		}
		return calculate;
	};

	mask.addEventListener('mousedown', mousedownAction);
	mask.addEventListener('mousemove', mousemoveAction);
};

/**
 * 计算所绘制图形的面积或者长度
 * @param {overlay} 覆盖物
 */
DrawingManager.prototype._calculate = function (overlay) {
	const result = {
		data: 0, // 计算出来的长度或面积
	};
	if (this._enableCalculate && BMapLib.GeoUtils) {
		const type = overlay.toString();
		// 不同覆盖物调用不同的计算方法
		switch (type) {
		case '[object Polyline]':
			result.data = BMapLib.GeoUtils.getPolylineDistance(overlay);
			break;
		case '[object Polygon]':
			result.data = BMapLib.GeoUtils.getPolygonArea(overlay);
			break;
		case '[object Circle]':
			result.data =					Math.PI * overlay.getRadius() * overlay.getRadius();
			break;
		default:
			break;
		}
		// 异常情况处理
		if (!result.data || result.data < 0) {
			result.data = 0;
		} else {
			// 保留2位小数位
			result.data = result.data.toFixed(2);
		}
	}
	return result;
};

/**
 * 开启测距、测面及判断点位置功能需要依赖于GeoUtils库
 * 所以这里判断用户是否已经加载,若未加载则用js动态加载
 */
DrawingManager.prototype._addGeoUtilsLibrary = function () {
	if (!window.BMapLib.GeoUtils) {
		const script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script.setAttribute(
			'src',
			'https://api.map.baidu.com/library/GeoUtils/1.2/src/GeoUtils_min.js',
		);
		document.body.appendChild(script);
	}
};

/**
 * 向地图中添加文本标注
 * @param {String}       显示内容
 * @param {LabelOptions} 样式
 * @param {Point}        地理位置
 * @param {Size}         位置偏移值
 */
DrawingManager.prototype._addLabel = function (
	content,
	options,
	point,
	offset,
) {
	const label = new BMap.Label(content, {
		position: point,
		offset,
	});
	if (options) {
		label.setStyle(options);
	}
	this._map.addOverlay(label);
	return label;
};

/**
 * 根据起终点获取矩形的四个顶点
 * @param {Point} 起点
 * @param {Point} 终点
 */
DrawingManager.prototype._getRectanglePoint = function (startPoint, endPoint) {
	return [
		new BMap.Point(startPoint.lng, startPoint.lat),
		new BMap.Point(endPoint.lng, startPoint.lat),
		new BMap.Point(endPoint.lng, endPoint.lat),
		new BMap.Point(startPoint.lng, endPoint.lat),
	];
};

/**
 * 派发事件
 */
DrawingManager.prototype._dispatchOverlayComplete = function (
	overlay,
	calculate,
) {
	const options = {
		overlay,
		drawingMode: this._drawingType,
	};
	if (calculate) {
		options.calculate = calculate.data || null;
		options.label = calculate.label || null;
	}
	this.dispatchEvent(`${this._drawingType}complete`, overlay);
	this.dispatchEvent('overlaycomplete', options);
};

/**
 * 创建遮罩对象
 */
function Mask() {
	/**
	 * 鼠标到地图边缘的时候是否自动平移地图
	 */
	if (!Mask.prototype.initialize) {
		initMask();
	}
	for (const pro in Mask.prototype) {
		this[pro] = Mask.prototype[pro];
	}
	this._enableEdgeMove = false;
}

function initMask() {
	Mask.prototype = new BMap.Overlay();

	/**
	 * 这里不使用api中的自定义事件，是为了更灵活使用
	 */
	Mask.prototype.dispatchEvent = baidu.lang.Class.prototype.dispatchEvent;
	Mask.prototype.addEventListener =		baidu.lang.Class.prototype.addEventListener;
	Mask.prototype.removeEventListener =		baidu.lang.Class.prototype.removeEventListener;
	Mask.prototype.initialize = function (map) {
		const me = this;
		this._map = map;
		var div = (this.container = document.createElement('div'));
		const size = this._map.getSize();
		div.style.cssText = `position:absolute;background:url(about:blank);cursor:crosshair;width:${size.width}px;height:${size.height}px`;
		this._map.addEventListener('resize', (e) => {
			me._adjustSize(e.size);
		});
		this._map.getPanes().floatPane.appendChild(div);
		this._bind();
		return div;
	};
	Mask.prototype.draw = function () {
		const map = this._map;
		const point = map.pixelToPoint(new BMap.Pixel(0, 0));
		const pixel = map.pointToOverlayPixel(point);
		this.container.style.left = `${pixel.x}px`;
		this.container.style.top = `${pixel.y}px`;
	};

	/**
	 * 开启鼠标到地图边缘，自动平移地图
	 */
	Mask.prototype.enableEdgeMove = function () {
		this._enableEdgeMove = true;
	};

	/**
	 * 关闭鼠标到地图边缘，自动平移地图
	 */
	Mask.prototype.disableEdgeMove = function () {
		clearInterval(this._edgeMoveTimer);
		this._enableEdgeMove = false;
	};

	/**
	 * 绑定事件,派发自定义事件
	 */
	Mask.prototype._bind = function () {
		const me = this;
		const { container } = this;
		let lastMousedownXY = null;
		let lastClickXY = null;

		/**
		 * 根据event对象获取鼠标的xy坐标对象
		 * @param {Event}
		 * @return {Object} {x:e.x, y:e.y}
		 */
		const getXYbyEvent = function (e) {
			return {
				x: e.clientX,
				y: e.clientY,
			};
		};

		const domEvent = function (e) {
			const { type } = e;
			e = baidu.getEvent(e);
			const point = me.getDrawPoint(e); // 当前鼠标所在点的地理坐标

			const dispatchEvent = function () {
				e.point = point;
				me.dispatchEvent(e);
			};
			if (type === 'mousedown') {
				lastMousedownXY = getXYbyEvent(e);
			}
			const nowXY = getXYbyEvent(e);
			// click经过一些特殊处理派发，其他同事件按正常的dom事件派发
			if (type === 'click') {
				// 鼠标点击过程不进行移动才派发click和dblclick
				if (
					Math.abs(nowXY.x - lastMousedownXY.x) < 5
					&& Math.abs(nowXY.y - lastMousedownXY.y) < 5
				) {
					if (
						!lastClickXY
						|| !(
							Math.abs(nowXY.x - lastClickXY.x) < 5
							&& Math.abs(nowXY.y - lastClickXY.y) < 5
						)
					) {
						dispatchEvent('click');
						lastClickXY = getXYbyEvent(e);
					} else {
						lastClickXY = null;
					}
				}
			} else {
				dispatchEvent(type);
			}
		};

		/**
		 * 将事件都遮罩层的事件都绑定到domEvent来处理
		 */
		const events = [
			'click',
			'mousedown',
			'mousemove',
			'mouseup',
			'dblclick',
		];
		let index = events.length;
		while (index--) {
			baidu.on(container, events[index], domEvent);
		}
		// 鼠标移动过程中，到地图边缘后自动平移地图
		baidu.on(container, 'mousemove', (e) => {
			if (me._enableEdgeMove) {
				me.mousemoveAction(e);
			}
		});
	};

	// 鼠标移动过程中，到地图边缘后自动平移地图
	Mask.prototype.mousemoveAction = function (e) {
		function getClientPosition(_e) {
			let { clientX, clientY } = _e;
			if (_e.changedTouches) {
				clientX = _e.changedTouches[0].clientX;
				clientY = _e.changedTouches[0].clientY;
			}
			return new BMap.Pixel(clientX, clientY);
		}
		const map = this._map;
		const me = this;
		let pixel = map.pointToPixel(this.getDrawPoint(e));
		const clientPos = getClientPosition(e);
		const offsetX = clientPos.x - pixel.x;
		const offsetY = clientPos.y - pixel.y;
		pixel = new BMap.Pixel(clientPos.x - offsetX, clientPos.y - offsetY);
		this._draggingMovePixel = pixel;
		// const point = map.pixelToPoint(pixel);
		// const eventObj = {
		// 	pixel,
		// 	point,
		// };
		// 拖拽到地图边缘移动地图
		this._panByX = this._panByY = 0;
		if (
			pixel.x <= 20
			|| pixel.x >= map.width - 20
			|| pixel.y <= 50
			|| pixel.y >= map.height - 10
		) {
			if (pixel.x <= 20) {
				this._panByX = 8;
			} else if (pixel.x >= map.width - 20) {
				this._panByX = -8;
			}
			if (pixel.y <= 50) {
				this._panByY = 8;
			} else if (pixel.y >= map.height - 10) {
				this._panByY = -8;
			}
			if (!this._edgeMoveTimer) {
				this._edgeMoveTimer = setInterval(() => {
					map.panBy(me._panByX, me._panByY, {
						noAnimation: true,
					});
				}, 30);
			}
		} else {
			if (this._edgeMoveTimer) {
				clearInterval(this._edgeMoveTimer);
				this._edgeMoveTimer = null;
			}
		}
	};

	/*
	 * 调整大小
	 * @param {Size}
	 */
	Mask.prototype._adjustSize = function (size) {
		this.container.style.width = `${size.width}px`;
		this.container.style.height = `${size.height}px`;
	};

	/**
	 * 获取当前绘制点的地理坐标
	 *
	 * @param {Event} e e对象
	 * @return Point对象的位置信息
	 */
	Mask.prototype.getDrawPoint = function (e) {
		const map = this._map;
		let trigger = baidu.getTarget(e);
		let x = e.offsetX || e.layerX || 0;
		let y = e.offsetY || e.layerY || 0;
		if (Number(trigger.nodeType) !== 1) {
			trigger = trigger.parentNode;
		}
		while (trigger && trigger != map.getContainer()) {
			if (
				!(
					trigger.clientWidth === 0
					&& trigger.clientHeight === 0
					&& trigger.offsetParent
					&& trigger.offsetParent.nodeName === 'TD'
				)
			) {
				x += trigger.offsetLeft || 0;
				y += trigger.offsetTop || 0;
			}
			trigger = trigger.offsetParent;
		}
		const pixel = new BMap.Pixel(x, y);
		return map.pixelToPoint(pixel);
	};
}

/**
 * 绘制工具面板，自定义控件
 */
function DrawingTool(drawingManager, drawingToolOptions) {
	if (!DrawingTool.prototype.initialize) {
		initDrawingTool();
	}
	for (const pro in DrawingTool.prototype) {
		this[pro] = DrawingTool.prototype[pro];
	}
	this.drawingManager = drawingManager;
	drawingToolOptions = this.drawingToolOptions = drawingToolOptions || {};
	// 默认停靠位置和偏移量
	this.defaultAnchor = BMAP_ANCHOR_TOP_LEFT;
	this.defaultOffset = new BMap.Size(10, 10);
	// 默认所有工具栏都显示
	this.defaultDrawingModes = [
		BMAP_DRAWING_MARKER,
		BMAP_DRAWING_CIRCLE,
		BMAP_DRAWING_POLYLINE,
		BMAP_DRAWING_POLYGON,
		BMAP_DRAWING_RECTANGLE,
	];
	// 工具栏可显示的绘制模式
	if (drawingToolOptions.drawingModes) {
		this.drawingModes = drawingToolOptions.drawingModes;
	} else {
		this.drawingModes = this.defaultDrawingModes;
	}
	// 用户设置停靠位置和偏移量
	if (drawingToolOptions.anchor) {
		this.setAnchor(drawingToolOptions.anchor);
	}
	if (drawingToolOptions.offset) {
		this.setOffset(drawingToolOptions.offset);
	}
}

function initDrawingTool() {
	// 通过JavaScript的prototype属性继承于BMap.Control
	DrawingTool.prototype = new BMap.Control();
	// 自定义控件必须实现自己的initialize方法,并且将控件的DOM元素返回
	// 在本方法中创建个div元素作为控件的容器,并将其添加到地图容器中
	DrawingTool.prototype.initialize = function (map) {
		// 创建一个DOM元素
		var container = (this.container = document.createElement('div'));
		container.className = 'BMapLib_Drawing';
		// 用来设置外层边框阴影
		var panel = (this.panel = document.createElement('div'));
		panel.className = 'BMapLib_Drawing_panel';
		if (this.drawingToolOptions && this.drawingToolOptions.scale) {
			this._setScale(this.drawingToolOptions.scale);
		}
		container.appendChild(panel);
		// 添加内容
		panel.innerHTML = this._generalHtml();
		// 绑定事件
		this._bind(panel);
		// 添加DOM元素到地图中
		map.getContainer().appendChild(container);
		// 将DOM元素返回
		return container;
	};

	// 生成工具栏的html元素
	DrawingTool.prototype._generalHtml = function () {
		// 鼠标经过工具栏上的提示信息
		const tips = {};
		tips['hander'] = '拖动地图';
		tips[BMAP_DRAWING_MARKER] = '画点';
		tips[BMAP_DRAWING_CIRCLE] = '画圆';
		tips[BMAP_DRAWING_POLYLINE] = '画折线';
		tips[BMAP_DRAWING_POLYGON] = '画多边形';
		tips[BMAP_DRAWING_RECTANGLE] = '画矩形';
		const getItem = function (className, drawingType) {
			return `<a class="${className}" drawingType="${drawingType}" href="javascript:void(0)" title="${tips[drawingType]}" onfocus="this.blur()"></a>`;
		};
		const html = [];
		html.push(getItem('BMapLib_box BMapLib_hander', 'hander'));
		for (let i = 0, len = this.drawingModes.length; i < len; i += 1) {
			let classStr = `BMapLib_box BMapLib_${this.drawingModes[i]}`;
			if (i === len - 1) {
				classStr += ' BMapLib_last';
			}
			html.push(getItem(classStr, this.drawingModes[i]));
		}
		return html.join('');
	};

	/**
	 * 设置工具栏的缩放比例
	 */
	DrawingTool.prototype._setScale = function (scale) {
		const width = 390;
		const height = 50;
		const ml = -parseInt((width - width * scale) / 2, 10);
		const mt = -parseInt((height - height * scale) / 2, 10);
		this.container.style.cssText = [
			`-moz-transform: scale(${scale});`,
			`-o-transform: scale(${scale});`,
			`-webkit-transform: scale(${scale});`,
			`transform: scale(${scale});`,
			`margin-left:${ml}px;`,
			`margin-top:${mt}px;`,
			'*margin-left:0px;', // ie6、7
			'*margin-top:0px;', // ie6、7
			'margin-left:0px\\0;', // ie8
			'margin-top:0px\\0;', // ie8
			// ie下使用滤镜
			'filter: progid:DXImageTransform.Microsoft.Matrix(',
			`M11=${scale},`,
			'M12=0,',
			'M21=0,',
			`M22=${scale},`,
			"SizingMethod='auto expand');",
		].join('');
	};

	// 绑定工具栏的事件
	DrawingTool.prototype._bind = function () {
		const me = this;
		baidu.on(this.panel, 'click', (e) => {
			const target = baidu.getTarget(e);
			const drawingType = target.getAttribute('drawingType');
			me.setStyleByDrawingMode(drawingType);
			me._bindEventByDraingMode(drawingType);
		});
	};

	// 设置工具栏当前选中的项样式
	DrawingTool.prototype.setStyleByDrawingMode = function (drawingType) {
		if (!drawingType) {
			return;
		}
		const boxs = this.panel.getElementsByTagName('a');
		for (let i = 0; i < boxs.length; i += 1) {
			const box = boxs[i];
			if (box.getAttribute('drawingType') == drawingType) {
				let classStr = `BMapLib_box BMapLib_${drawingType}_hover`;
				if (i === boxs.length - 1) {
					classStr += ' BMapLib_last';
				}
				box.className = classStr;
			} else {
				box.className = box.className.replace(/_hover/, '');
			}
		}
	};

	// 设置工具栏当前选中的项样式
	DrawingTool.prototype._bindEventByDraingMode = function (drawingType) {
		const { drawingManager } = this;
		// 点在拖拽地图的按钮上
		if (drawingType === 'hander') {
			drawingManager.close();
			drawingManager._map.enableDoubleClickZoom();
		} else {
			drawingManager.setDrawingMode(drawingType);
			drawingManager.open();
			drawingManager._map.disableDoubleClickZoom();
		}
	};
}

// 用来存储用户实例化出来的drawingmanager对象
var instances = [];

/*
 * 关闭其他实例的绘制模式
 * @param {DrawingManager} 当前的实例
 */
function closeInstanceExcept(instance) {
	let index = instances.length;
	while (index--) {
		if (instances[index] != instance) {
			instances[index].close();
		}
	}
}

export default DrawingManager;
