/// <reference path="_references.js" />

var Graph = {

    /**
    * Settings
    */
    Settings: {
		globalScale: 1.2,
        delta: 5,
        vertexRadius: 5,
        color: '#5735FF',
        opacity: 0.75,
        edgeWidth: 8,
        start: new Point(0, 0)
    },

    /**
    * Graph edges
    */
    Edges: [],
    /**
    * Graph vertexes
    */
    Vertexes: [],

    /**
    * Start point of path
    */
    StartVertex: null,

	/**
	 * Map names
	 */
	MapNames: [],

    /**
    * Inialize object
    */
    init: function (options) {
        if (options != undefined) {
			if (options.globalScale != undefined) {
				Graph.Settings.globalScale = options.globalScale;
			}
            if (options.x != undefined) {
                Graph.Settings.start.x = options.x * Graph.Settings.globalScale;
            }
            if (options.y != undefined) {
                Graph.Settings.start.y = options.y * Graph.Settings.globalScale;
            }
        }

        // init edges & vertexes
        for (var i = 0; i < EdgesData.length; i++) {
            var edge = EdgesData[i];
            var path = new Kinetic.Path({
                data: edge.path,
                scale: Graph.Settings.globalScale
            });
            var begin = new Point(
				path.dataArray[0].points[0] * Graph.Settings.globalScale,
				path.dataArray[0].points[1] * Graph.Settings.globalScale
			);
            var end = new Point(
				path.dataArray[1].points[0] * Graph.Settings.globalScale,
				path.dataArray[1].points[1] * Graph.Settings.globalScale
			);

            var g = new Edge(begin, end, null, edge.map);
			g.length = Graph.getDistance(begin, end);
            Graph.Edges.push(g);

            g.beginVertex = Graph.connectVertex(begin, g);
            g.endVertex = Graph.connectVertex(end, g);

			if (Graph.MapNames.indexOf(edge.map) < 0) {
				Graph.MapNames.push(edge.map);
			}
        }

        Graph.StartVertex = Graph.findVertex(Graph.Settings.start);

		// соединяем вместе карты маршрутов разных этажей через точки пересечения (лифты, эскалаторы, лестницы)
		for (var j = 0; j < JunctionData.length; j++) {
			var liftPoint = new Point(JunctionData[j].x, JunctionData[j].y);
			var junctions = [];
			for (var i = 0; i < Graph.MapNames.length; i++) {
				var liftVertex = Graph.findVertex(liftPoint, Graph.MapNames[i]);
				if (liftVertex == null) {
					continue;
				}
				for (var k = 0; k < junctions.length; k++) {
					junctions[k].incomingEdges = junctions[k].incomingEdges.concat(liftVertex.incomingEdges);
					junctions[k].outgoingEdges = junctions[k].outgoingEdges.concat(liftVertex.outgoingEdges);
				}
				junctions.push(liftVertex);
				
				if (junctions.length > 0) {
					liftVertex.incomingEdges = junctions[0].incomingEdges;
					liftVertex.outgoingEdges = junctions[0].outgoingEdges;
				}
			}
		}
    },

	/**
	 * Очищает массивы верщин и граней
	 */
	clear: function () {
		Graph.Edges = [];
		Graph.Vertexes = [];
	},

    connectVertex: function (point, edge) {
        var vertex = Graph.findVertex(point);
        if (vertex == null) {
            vertex = Graph.createVertex(point, edge);
            Graph.Vertexes.push(vertex);
        } else {
            vertex.incomingEdges.push(edge);
            vertex.outgoingEdges.push(edge);
        }
        return vertex;
    },

    findVertex: function (point, mapName) {
        for (var i = 0; i < Graph.Vertexes.length; i++) {
            var vertex = Graph.Vertexes[i];
			if (mapName != undefined && mapName != '' && vertex.mapName != mapName) {
				continue;
			}
            if (Math.abs(vertex.position.x - point.x) <= Graph.Settings.delta && Math.abs(vertex.position.y - point.y) <= Graph.Settings.delta) {
                return vertex;
            }
        }
        return null;
    },

    createVertex: function (point, edge) {
        var vertex = new Vertex();
        vertex.position = point;
        vertex.incomingEdges.push(edge);
        vertex.outgoingEdges.push(edge);
		vertex.mapName = edge.mapName;
        return vertex;
    },

    /**
    * Draw all vertexes & edges
    */
    draw: function (layer) {
        for (var i = 0; i < Graph.Vertexes.length; i++) {
            var vertex = Graph.Vertexes[i];
            var point = Graph.Settings.start;
            if (Math.abs(vertex.position.x - point.x) <= Graph.Settings.delta && Math.abs(vertex.position.y - point.y) <= Graph.Settings.delta) {
                continue;
            }
            if (vertex.shape == null) {
                vertex.shape = new Kinetic.Circle({
                    x: vertex.position.x,
                    y: vertex.position.y,
                    radius: Graph.Settings.vertexRadius,
                    fill: Graph.Settings.color,
                    opacity: Graph.Settings.opacity
                });
            }
            layer.add(vertex.shape);
        }
        for (var i = 0; i < Graph.Edges.length; i++) {
            var edge = Graph.Edges[i];
            if (edge.shape == null) {
                var shape = new Kinetic.Line({
                    points: [edge.begin.x, edge.begin.y, edge.end.x, edge.end.y],
                    stroke: Graph.Settings.color,
                    strokeWidth: Graph.Settings.edgeWidth,
                    lineJoin: 'round',
                    lineCap: 'round',
                    opacity: Graph.Settings.opacity
                });

                (function (shape) {
                    shape.on('click', function () {
                        console.log('begin: ' + shape.attrs.points[0] + ' end: ' + shape.attrs.points[1]);
                    });
                })(shape);

                edge.shape = shape;
            }
            layer.add(edge.shape);
        }
    },

    /**
    * Draw path to target shape
    */
    navigateTo: function (target, mapName) {
        // Ищем вершину, расстояние от которой до всех точек фигуры target будет минимальным
        var targetVertex = null;
        var minimalPath = 10000000;
        for (var i = 0; i < Graph.Vertexes.length; i++) {
			// пропускаем вершины с других карт
			if (Graph.Vertexes[i].mapName != mapName) {
				continue;
			}
            var point = Graph.Vertexes[i].position;
            var pathLength = 0;
            for (var k = 0; k < target.dataArray.length; k++) {
                var p = target.dataArray[k].points;
                if (p.length == 0) continue;
                pathLength = pathLength + Graph.getDistance(point, { x: p[0] * Graph.Settings.globalScale, y: p[1] * Graph.Settings.globalScale });
            }
            if (pathLength < minimalPath) {
                minimalPath = pathLength;
                targetVertex = Graph.Vertexes[i];
            }
        }
        var currentVertex = Graph.StartVertex;

        // build path from StartVertex to targetVertex
		var map = { };
		for (var i = 0; i < Graph.Vertexes.length; i++) {
			var vertex = Graph.Vertexes[i];
			map[vertex.id] = {};
			for (var k = 0; k < vertex.outgoingEdges.length; k++) {
				var endVertex = vertex.outgoingEdges[k].endVertex;
				if (vertex == endVertex) {
					endVertex = vertex.outgoingEdges[k].beginVertex;
				}
				map[vertex.id][endVertex.id] = vertex.outgoingEdges[k].length;
			}
		}

		// find shortest path
		var graphd = new GraphD(map);
		var vertexes = graphd.findShortestPath(currentVertex.id, targetVertex.id);

		// fill array of vertexes
		var path = [];
		for (var i = 0; i < vertexes.length; i++) {
			path.push(Graph.findVertexById(vertexes[i]));
		}

        // show path
        var points = [];
        for (var i = 0; i < path.length; i++) {
            points = points.concat([path[i].position.x, path[i].position.y]);
        }
        points = Graph.distinct(points);
        return points;
    },

    /**
    * Удаляет из массива близкие по координатам точки
    */
    distinct: function (array) {
        if (array.length == 0) return array;
        var values = [];
        for (var i = 0; i < array.length; i++) {
            var current = array[i];
            var exists = false;
            for (var k = 0; k < values.length; k++) {
                if (Math.abs(current.x - values[k].x) <= Graph.Settings.delta && Math.abs(current.y - values[k].y) <= Graph.Settings.delta) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                values.push(current);
            }
        }
        return values;
    },

    /**
    * Возвращает расстояние между двумя точками
    */
    getDistance: function (left, right) {
        return Math.sqrt(Math.pow(Math.abs(left.x - right.x), 2) + Math.pow(Math.abs(left.y - right.y), 2));
    },

	/**
	 * Возвращает вершину по ее ID
	 */
	findVertexById: function (vertexId) {
		for (var i = 0; i < Graph.Vertexes.length; i++) {
			if (Graph.Vertexes[i].id == vertexId) return Graph.Vertexes[i];
		}
		return null;
	}
};

function Point(x, y) {
	this.x = x;
	this.y = y;
};

function Edge(begin, end, shape, mapName) {
	this.weight = 1;
	this.begin = begin;
	this.end = end;
	this.beginVertex = null;
	this.endVertex = null;
	this.shape = shape;
	this.length = 0;
	this.mapName = mapName;
};

function Vertex() {
	this.id = 'v' + Graph.Vertexes.length;
	this.position = null;
	this.incomingEdges = [];
	this.outgoingEdges = [];
	this.shape = null;
	this.mapName = '';
};

//var indexOf = function(needle) {
//    if(typeof Array.prototype.indexOf === 'function') {
//        indexOf = Array.prototype.indexOf;
//    } else {
//        indexOf = function(needle) {
//            var i = -1, index = -1;

//            for(i = 0; i < this.length; i++) {
//                if(this[i] === needle) {
//                    index = i;
//                    break;
//                }
//            }

//            return index;
//        };
//    }

//    return indexOf.call(this, needle);
//};

/**
 * Алгоритм Дейкстры
 */
var GraphD = (function (undefined) {

	var extractKeys = function (obj) {
		var keys = [], key;
		for (key in obj) {
		    Object.prototype.hasOwnProperty.call(obj,key) && keys.push(key);
		}
		return keys;
	}

	var sorter = function (a, b) {
		return parseFloat (a) - parseFloat (b);
	}

	var findPaths = function (map, start, end, infinity) {
		infinity = infinity || Infinity;

		var costs = {},
		    open = {'0': [start]},
		    predecessors = {},
		    keys;

		var addToOpen = function (cost, vertex) {
			var key = "" + cost;
			if (!open[key]) open[key] = [];
			open[key].push(vertex);
		}

		costs[start] = 0;

		while (open) {
			if(!(keys = extractKeys(open)).length) break;

			keys.sort(sorter);

			var key = keys[0],
			    bucket = open[key],
			    node = bucket.shift(),
			    currentCost = parseFloat(key),
			    adjacentNodes = map[node] || {};

			if (!bucket.length) delete open[key];

			for (var vertex in adjacentNodes) {
			    if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
					var cost = adjacentNodes[vertex],
					    totalCost = cost + currentCost,
					    vertexCost = costs[vertex];

					if ((vertexCost === undefined) || (vertexCost > totalCost)) {
						costs[vertex] = totalCost;
						addToOpen(totalCost, vertex);
						predecessors[vertex] = node;
					}
				}
			}
		}

		if (costs[end] === undefined) {
			return null;
		} else {
			return predecessors;
		}

	}

	var extractShortest = function (predecessors, end) {
		var nodes = [],
		    u = end;

		while (u) {
			nodes.push(u);
			predecessor = predecessors[u];
			u = predecessors[u];
		}

		nodes.reverse();
		return nodes;
	}

	var findShortestPath = function (map, nodes) {
		var start = nodes.shift(),
		    end,
		    predecessors,
		    path = [],
		    shortest;

		while (nodes.length) {
			end = nodes.shift();
			predecessors = findPaths(map, start, end);

			if (predecessors) {
				shortest = extractShortest(predecessors, end);
				if (nodes.length) {
					path.push.apply(path, shortest.slice(0, -1));
				} else {
					return path.concat(shortest);
				}
			} else {
				return null;
			}

			start = end;
		}
	}

	var toArray = function (list, offset) {
		try {
			return Array.prototype.slice.call(list, offset);
		} catch (e) {
			var a = [];
			for (var i = offset || 0, l = list.length; i < l; ++i) {
				a.push(list[i]);
			}
			return a;
		}
	}

	var GraphD = function (map) {
		this.map = map;
	}

	GraphD.prototype.findShortestPath = function (start, end) {
		if (Object.prototype.toString.call(start) === '[object Array]') {
			return findShortestPath(this.map, start);
		} else if (arguments.length === 2) {
			return findShortestPath(this.map, [start, end]);
		} else {
			return findShortestPath(this.map, toArray(arguments));
		}
	}

	GraphD.findShortestPath = function (map, start, end) {
		if (Object.prototype.toString.call(start) === '[object Array]') {
			return findShortestPath(map, start);
		} else if (arguments.length === 3) {
			return findShortestPath(map, [start, end]);
		} else {
			return findShortestPath(map, toArray(arguments, 1));
		}
	}

	return GraphD;

})();