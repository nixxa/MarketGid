/// <reference path="_references.js" />
/// <reference path="kineticjs-4.6.0.js" />

// width: 910, height: 820

var Map = {

	/**
	 * Settings object
	 */
	Settings: {
		globalScale: 1.5,
		x: 0,
		y: 0,
		kioskPointRadius: 5,
		kioskPointColor: 'black',
		kioskPointBgColor: 'white',
		activeObjectBgColor: '#F87E0F',
		activeObjectOpacity: 1,
		inactiveObjectBgColor: '#eee',
		inactiveObjectOpacity: 0.4,
		pathColor: '#5735FF',
		pathOpacity: 0.75,
		pathWidth: 8
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
		Map.setupTooltip();

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
				stroke: 'black',
				strokeWidth: 1,
				id: id
			});
			Map.Objects[id] = {
				path: pathObject,
				color: null
			};
		}
	},

	setupTooltip: function () {
		Map.startObject = new Kinetic.Circle({
			fill: Map.Settings.kioskPointBgColor,
			stroke: Map.Settings.kioskPointColor,
			strokeWidth: 1,
			x: Map.Settings.x,
			y: Map.Settings.y,
			radius: Map.Settings.kioskPointRadius,
			shadowOffset: 3,
			shadowColor: 'black',
			shadowBlur: 6,
			shadowOpacity: 0.5
		});

		Map.tooltip = new Kinetic.Label({
			x: Map.Settings.x,
			y: Map.Settings.y,
			opacity: 0.75
		});

		Map.tooltip.add(new Kinetic.Tag({
			fill: 'black',
			pointerDirection: 'down',
			pointerWidth: 10,
			pointerHeight: 10,
			lineJoin: 'round',
			shadowColor: 'black',
			shadowBlur: 10,
			shadowOffset: 10,
			shadowOpacity: 0.5
		}));
      
		Map.tooltip.add(new Kinetic.Text({
			text: 'Вы здесь',
			fontFamily: 'Calibri',
			fontSize: 18,
			padding: 5,
			fill: 'white'
		}));
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
		imgObj.src = '/Content/maps/map.png';
	},

	drawObjects: function () {
		for (t in Map.Objects) {
			var path = Map.Objects[t].path;
			Map.mapLayer.add(path);

			(function (path) {
				path.on('click', function () {
					path.setFill(Map.Settings.activeObjectBgColor);
					path.setStroke('black');
					path.setStrokeWidth(1);
					path.setOpacity(Map.Settings.activeObjectOpacity);
					path.setShadowColor('black');
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

					// create path line and finish circle
					Map.navLayer.add(new Kinetic.Line({
						points: points,
						stroke: Map.Settings.pathColor,
						strokeWidth: Map.Settings.pathWidth,
						lineJoin: 'round',
						lineCap: 'round',
						opacity: Map.Settings.pathOpacity,
						shadowOffset: 3,
						shadowColor: 'black',
						shadowBlur: 6,
						shadowOpacity: 0.5
					}));
					Map.navLayer.add(new Kinetic.Circle({
						x: points[0],
						y: points[1],
						radius: Map.Settings.kioskPointRadius,
						fill: Map.Settings.kioskPointBgColor,
						stroke: Map.Settings.kioskPointColor,
						strokeWidth: 1,
						shadowOffset: 3,
						shadowColor: 'black',
						shadowBlur: 6,
						shadowOpacity: 0.5
					}));
					Map.setupTooltip();
					Map.navLayer.add(Map.startObject);
					Map.navLayer.add(Map.tooltip);

					Map.stage.add(Map.navLayer);

					Map.mapLayer.drawScene();
				});
			})(path);
		}

		Map.navLayer.add(Map.startObject);
		Map.navLayer.add(Map.tooltip);
	}
}