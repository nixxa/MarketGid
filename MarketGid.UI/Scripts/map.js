/// <reference path="_references.js" />
/// <reference path="kineticjs-4.6.0.js" />

// width: 910, height: 820

var Map = {

	/**
	 * Settings object
	 */
	Settings: {
		// масштаб
		globalScale: 1.5,
		// координаты киоска
		x: 0,
		y: 0,
		// фоновое изображение
		backgroundImage: '/Content/maps/map.png',
		kioskPointRadius: 5,
		kioskPointColor: 'black',
		kioskPointBgColor: 'white',
		// цвет активного объекта
		activeObjectBgColor: '#F87E0F',
		// прозрачность активного объекта
		activeObjectOpacity: 1,
		// цвет неактивного объекта
		inactiveObjectBgColor: '#eee',
		// прозрачность неактивного объекта
		inactiveObjectOpacity: 0.4,
		// цвет маршрута
		pathColor: '#5735FF',
		// прозрачность проложенного маршрута
		pathOpacity: 0.75,
		// цвет проложенного маршрута
		pathWidth: 8,
		// цвет всех границ объектов
		borderColor: 'black',
		// цвет всех теней
		shadowColor: 'black'
	},

	Objects: {},
	stage: null,
	mapLayer: null,
	navLayer: null,
	backgroundLayer: null,
	tooltip: null,
	selectedObject: null,
	route: null,
	startObject: null,

	/**
	 * Init map and draw objects
	 */
	init: function (options) {
		if (options != undefined) {
			if (options.x != undefined) {
				Map.Settings.x = options.x * Map.Settings.globalScale;
			}
			if (options.y != undefined) {
				Map.Settings.y = options.y * Map.Settings.globalScale;
			}
		}

		Map.setupObjects();

		Graph.init(options);

		// init kinetic stage
		Map.stage = new Kinetic.Stage({
			container: 'map',
			width: 910,
			height: 820,
			draggable: true
		});

		Map.backgroundLayer = new Kinetic.Layer({
			scale: Map.Settings.globalScale
		});

		Map.mapLayer = new Kinetic.Layer({
			scale: Map.Settings.globalScale
		});

		Map.navLayer = new Kinetic.Layer({
			scale: Map.Settings.globalScale
		});

		Map.drawBackground();
		Map.drawObjects();

		Map.stage.add(Map.backgroundLayer);
		Map.stage.add(Map.mapLayer);
		Map.stage.add(Map.navLayer);

		//Map.stage._mousemove = function () {};
	},

	/**
	 * Load objects data and create Kinetic.Path objects
	 */
	setupObjects: function () {
		for (id in PathData) {
			var pathObject = new Kinetic.Path({
				scale: Map.Settings.globalScale,
				data: PathData[id].path,
				fill: Map.Settings.inactiveObjectBgColor,
				opacity: Map.Settings.inactiveObjectOpacity,
				stroke: Map.Settings.borderColor,
				strokeWidth: 1,
				id: id
			});
			Map.Objects[id] = {
				path: pathObject,
				name: PathData[id].name,
				color: null
			};
		}

		Map.startObject = new Kinetic.Circle({
			fill: Map.Settings.kioskPointBgColor,
			stroke: Map.Settings.kioskPointColor,
			strokeWidth: 1,
			x: Map.Settings.x,
			y: Map.Settings.y,
			radius: Map.Settings.kioskPointRadius,
			shadowOffset: 3,
			shadowColor: Map.Settings.shadowColor,
			shadowBlur: 6,
			shadowOpacity: 0.5
		});
	},

	setupTooltip: function (options) {
		if (options == undefined) {
			options = { x: Map.Settings.x, y: Map.Settings.y, pointerDirection: 'down' };
		}
		if (options.pointerDirection == undefined) {
			options.pointerDirection = 'down';
		}
		if (options.bgColor == undefined) {
			options.bgColor = 'black';
		}

		var tooltip = new Kinetic.Label({
			x: options.x,
			y: options.y,
			opacity: 0.75
		});

		tooltip.add(new Kinetic.Tag({
			fill: options.bgColor,
			pointerDirection: options.pointerDirection,
			pointerWidth: 10,
			pointerHeight: 10,
			lineJoin: 'round',
			shadowColor: 'black',
			shadowBlur: 10,
			shadowOffset: 10,
			shadowOpacity: 0.5
		}));
      
		tooltip.add(new Kinetic.Text({
			text: options.text,
			fontFamily: 'Calibri',
			fontSize: 18,
			padding: 5,
			fill: 'white'
		}));
		return tooltip;
	},

	/**
	 * Draw background image
	 */
	drawBackground: function () {
		var imgObj = new Image();
		imgObj.onload = function () {
			var img = new Kinetic.Image({
				image: imgObj,
				scale: Map.Settings.globalScale
			});
			Map.backgroundLayer.add(img);
			Map.backgroundLayer.draw();
		};
		imgObj.src = Map.Settings.backgroundImage;
	},

	/**
	 * Отображает все объекты на карте
	 */
	drawObjects: function () {
		for (t in Map.Objects) {
			var path = Map.Objects[t].path;
			path.on ('mousedown', Map.showPath);
			Map.mapLayer.add(path);
		}

		Map.navLayer.add(Map.startObject);

		var tooltip = Map.setupTooltip({ x: Map.Settings.x, y: Map.Settings.y, text: 'Вы здесь' });
		Map.navLayer.add(tooltip);
	},

	/**
	 * Отображает путь к именованному объекту
	 */
	navigateTo: function (objectName) {
		var mapObject = null;

		for (var key in Map.Objects) {
			if (Map.Objects[key].name == objectName) {
				mapObject = Map.Objects[key];
				break;
			}
		}

		if (mapObject != null) {
			Map.showPath({ targetNode: mapObject.path });
		}
	},

	showPath: function (evt) {
		var path = evt.targetNode;
		path.setFill(Map.Settings.activeObjectBgColor);
		path.setStroke(Map.Settings.borderColor);
		path.setStrokeWidth(1);
		path.setOpacity(Map.Settings.activeObjectOpacity);
		path.setShadowColor(Map.Settings.shadowColor);
		path.setShadowBlur(10);
		path.setShadowOffset(10);
		path.setShadowOpacity(0.5);

		if (Map.selectedObject == null) {
			Map.selectedObject = path;
		} else if (Map.selectedObject != path) {
			Map.selectedObject.setFill(Map.Settings.inactiveObjectBgColor);
			Map.selectedObject.setStrokeWidth(1);
			Map.selectedObject.setOpacity(Map.Settings.inactiveObjectOpacity);
			Map.selectedObject.setShadowOffset(0);
			Map.selectedObject.setShadowOpacity(0);
			Map.selectedObject.setShadowBlur(0);
			Map.selectedObject = path;
		}

		// clear navLayer
		Map.stage.remove(Map.navLayer);
		Map.navLayer.removeChildren();

		// get path points
		var points = Graph.navigateTo(path);

		var x = points[points.length-2];
		var y = points[points.length-1];

		// create path line and finish circle
		Map.navLayer.add(new Kinetic.Line({
			points: points,
			stroke: Map.Settings.pathColor,
			strokeWidth: Map.Settings.pathWidth,
			lineJoin: 'round',
			lineCap: 'round',
			opacity: Map.Settings.pathOpacity,
			shadowOffset: 3,
			shadowColor: Map.Settings.shadowColor,
			shadowBlur: 6,
			shadowOpacity: 0.5
		}));
		Map.navLayer.add(new Kinetic.Circle({
			x: x,
			y: y,
			radius: Map.Settings.kioskPointRadius,
			fill: Map.Settings.kioskPointBgColor,
			stroke: Map.Settings.kioskPointColor,
			strokeWidth: 1,
			shadowOffset: 3,
			shadowColor: Map.Settings.borderColor,
			shadowBlur: 6,
			shadowOpacity: 0.5
		}));
		
		// setup start point tooltip
		Map.navLayer.add(Map.startObject);

		var rect = { x1: x - 150 / 2, y1: y + 10, x2: x + 150/2, y2: y + 30, d: 'down' };
		if (Map.checkCollide(points, rect)) {
			Map.navLayer.add(Map.setupTooltip({ x: Map.Settings.x, y: Map.Settings.y, text: 'Вы здесь', pointerDirection: 'up', bgColor: 'black' }));
		} else {
			Map.navLayer.add(Map.setupTooltip({ x: Map.Settings.x, y: Map.Settings.y, text: 'Вы здесь', pointerDirection: 'down', bgColor: 'black' }));
		}

		// setup end point tooltip
		var mapObject = null;
		var text = 'Искомый объект';
		for (var key in Map.Objects) {
			if (Map.Objects[key].path == path) {
				mapObject = Map.Objects[key];
				break;
			}
		}
		if (mapObject != null) text = mapObject.name;
		rect = { x1: x - 250 / 2, y1: y + 10, x2: x + 250/2, y2: y + 30, d: 'down' };
		if (Map.checkCollide(points, rect)) {
			Map.navLayer.add(Map.setupTooltip({ x: x, y: y, text: text, pointerDirection: 'down', bgColor: 'black' }));
		} else {
			Map.navLayer.add(Map.setupTooltip({ x: x, y: y, text: text, pointerDirection: 'up', bgColor: 'black' }));
		}

		// show navLayer
		Map.stage.add(Map.navLayer);

		Map.mapLayer.drawScene();		
	},

	checkCollide: function (points, object) {
		var collide = false;
		for (var i = 0; i < points.length; ) {
			if (points[i] >= object.x1 && points[i] <= object.x2 && points[i+1] >= object.y1 && points[i+1] <= object.y2)
			{
				collide = true;
				break;
			}
			i = i + 2;
		}
		return collide;
	}
}