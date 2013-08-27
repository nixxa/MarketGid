/// <reference path="jquery-1.9.1.js" />
/// <reference path="kineticjs-4.6.0.js" />
/// <reference path="paths.js" />

// width: 910, height: 820

var Map = {

	/**
	 * Settings object
	 */
	Settings: {
		globalScale: 1.5
	},

	Objects: {},

	stage: null,
	mapLayer: null,
	topLayer: null,
	backgroundLayer: null,
	startObject: null,
	tooltip: null,
	selectedObject: null,
	route: null,

	/**
	 * Init map and draw objects
	 */
	init: function () {
		Map.setupObjects();
		Map.setupTooltip();

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

		//Map.topLayer = new Kinetic.Layer({
		//	scale: Map.Settings.globalScale
		//});

		Map.drawBackground();
		Map.drawObjects();

		Map.stage.add(Map.backgroundLayer);
		Map.stage.add(Map.mapLayer);
		//Map.stage.add(Map.topLayer);

		Map.mapLayer.draw();
	},

	/**
	 * Load objects data and create Kinetic.Path objects
	 */
	setupObjects: function () {
		for (id in PathData) {
			if (id == 'Kiosk') {
				Map.startObject = new Kinetic.Path({
					scale: Map.Settings.globalScale,
					data: PathData[id].path,
					id: id
				});
				continue;
			}
			var pathObject = new Kinetic.Path({
				scale: Map.Settings.globalScale,
				data: PathData[id].path,
				fill: '#808080',
				opacity: 0.4,
				stroke: 'black',
				strokeWidth: 1,
				id: id
			});
			Map.Objects[id] = {
				path: pathObject,
				color: null
			};
		}

		Map.Objects['Kiosk'] = {
			path: new Kinetic.Circle({
				fill: 'white',
				stroke: 'black',
				strokeWidth: 1,
				x: Map.startObject.dataArray[0].points[0] * Map.Settings.globalScale,
				y: Map.startObject.dataArray[0].points[1] * Map.Settings.globalScale,
				radius: 5
			})
		};
	},

	setupTooltip: function () {
		Map.tooltip = new Kinetic.Label({
			x: Map.startObject.dataArray[0].points[0] * Map.Settings.globalScale,
			y: Map.startObject.dataArray[0].points[1] * Map.Settings.globalScale,
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
					path.setFill('#eee');
					path.setOpacity(0.3);

					if (Map.selectedObject == null) {
						Map.selectedObject = path;
					} else if (Map.selectedObject != path) {
						Map.selectedObject.setFill('#808080');
						Map.selectedObject.setOpacity(0.4);
						Map.selectedObject = path;
					}

					if (Map.route != null) {
						Map.route.remove();
						Map.route = null;
					}

					//var points = [];
					//points = points.concat(Map.startObject.dataArray[0].points);
					//points = points.concat(path.dataArray[0].points);

					//var box = Map.getPoints(path);

					//Map.route = new Kinetic.Line({
					//	stroke: 'black',
					//	strokeWidth: 2,
					//	lineCap: 'round',
					//	lineJoin: 'round',
					//	points: points,
					//	scale: Map.Settings.globalScale
					//});
					//Map.mapLayer.add(Map.route);

					Map.mapLayer.draw();
				});
			})(path);
		}

		Map.mapLayer.add(Map.tooltip);
	},

	min: function (shapePoints) {
		var xcoords = [];
		var ycoords = [];
		for (var p in shapePoints)
		{
			if (shapePoints[p].points.length == 0) continue;
			xcoords = xcoords.concat(shapePoints[p].points[0]);
			ycoords = ycoords.concat(shapePoints[p].points[1]);
		}
		return { x: Math.min.apply(null, xcoords), y: Math.min.apply(null, ycoords) };
	},

	max: function (shapePoints) {
		var xcoords = [];
		var ycoords = [];
		for (var p in shapePoints)
		{
			if (shapePoints[p].points.length == 0) continue;
			xcoords = xcoords.concat(shapePoints[p].points[0]);
			ycoords = ycoords.concat(shapePoints[p].points[1]);
		}
		return { x: Math.max.apply(null, xcoords), y: Math.max.apply(null, ycoords) };
	},

	getPoints: function (path) {
		var points = [];
		for (var p in path.dataArray)
		{
			if (path.dataArray[p].points.length == 0) continue;
			points = points.concat({ x: path.dataArray[p].points[0], y: path.dataArray[p].points[1] });
		}
		return points;
	},

	getIntersectPoint: function (box, line) {
		
	}
}