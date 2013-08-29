/// <reference path="_references.js" />

var Graph = {

    /**
    * Settings
    */
    Settings: {
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
    * Inialize object
    */
    init: function (options) {
        if (options != undefined) {
            if (options.x != undefined) {
                Graph.Settings.start.x = options.x * Map.Settings.globalScale;
            }
            if (options.y != undefined) {
                Graph.Settings.start.y = options.y * Map.Settings.globalScale;
            }
        }

        // init edges & vertexes
        for (var i = 0; i < EdgeData.length; i++) {
            var edge = EdgeData[i];
            var path = new Kinetic.Path({
                data: edge.path,
                scale: Map.Settings.globalScale
            });
            var begin = new Point(
				path.dataArray[0].points[0] * Map.Settings.globalScale,
				path.dataArray[0].points[1] * Map.Settings.globalScale
			);
            var end = new Point(
				path.dataArray[1].points[0] * Map.Settings.globalScale,
				path.dataArray[1].points[1] * Map.Settings.globalScale
			);

            var g = new Edge(begin, end, null);
            Graph.Edges.push(g);

            g.beginVertex = Graph.connectVertex(begin, g);
            g.endVertex = Graph.connectVertex(end, g);
        }

        Graph.StartVertex = Graph.findVertex(Graph.Settings.start);
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

    findVertex: function (point) {
        for (var i = 0; i < Graph.Vertexes.length; i++) {
            var vertex = Graph.Vertexes[i];
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
    navigateTo: function (target) {
        // find target vertex
        var targetVertex = null;
        var minimalPath = 10000000;
        for (var i = 0; i < Graph.Vertexes.length; i++) {
            var point = Graph.Vertexes[i].position;
            var pathLength = 0;
            for (var k = 0; k < target.dataArray.length; k++) {
                var p = target.dataArray[k].points;
                if (p.length == 0) continue;
                pathLength = pathLength + Graph.getDistance(point, { x: p[0] * Map.Settings.globalScale, y: p[1] * Map.Settings.globalScale });
            }
            if (pathLength < minimalPath) {
                minimalPath = pathLength;
                targetVertex = Graph.Vertexes[i];
            }
        }
        var currentVertex = Graph.StartVertex;
        // build path from StartVertex to targetVertex
        var allPaths = [];
        var path = [];
        var visited = [];
        Graph.findTarget(currentVertex, targetVertex, path, visited);
        path.push(currentVertex);
        //while (Graph.findTarget(currentVertex, targetVertex, path, visited)) {
        //    path.push(currentVertex);
        //    allPaths.push({ p: path, l: Graph.length(path) });
        //    path = [];
        //}
        //var minLength = 10000000;
        //for (var i = 0; i < allPaths.length; i++) {
        //    if (allPaths[i].l < minLength) {
        //        minLength = allPaths[i].l;
        //        path = allPaths[i].p;
        //    }
        //}
        // show path
        var points = [];
        for (var i = 0; i < path.length; i++) {
            //points = points.concat(path[i].shape.attrs.points);
            points = points.concat([path[i].position.x, path[i].position.y]);
        }
        points = Graph.distinct(points);
        return points;
    },

    findTarget: function (sourceVertex, targetVertex, path, visited) {
        if (sourceVertex == targetVertex) {
            path.push(targetVertex);
            return true;
        }
        visited.push(sourceVertex);
        for (var i = 0; i < sourceVertex.outgoingEdges.length; i++) {
            var edge = sourceVertex.outgoingEdges[i];
            var vertex = edge.endVertex;
            if (vertex == sourceVertex) {
                vertex = edge.beginVertex;
            }
            if (vertex == targetVertex) {
                path.push(vertex);
                //path.push(edge);
                return true;
            }
            if (indexOf.call(visited, vertex) >= 0) {
                continue;
            }
            if (Graph.findTarget(vertex, targetVertex, path, visited)) {
                //path.push(edge);
                path.push(vertex);
                return true;
            }
        }
        return false;
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
    * Подсчитывает длину маршрута
    */
    length: function (path) {
        var length = 0;
        for (var i = 0; i < path.length - 1; i++) {
            length = length + Graph.getDistance(path[i].position, path[i + 1].position);
        }
        return length;
    }
};

function Point(x, y) {
	this.x = x;
	this.y = y;
};

function Edge(begin, end, shape) {
	this.weight = 1;
	this.begin = begin;
	this.end = end;
	this.beginVertex = null;
	this.endVertex = null;
	this.shape = shape;
};

function Vertex() {
	this.position = null;
	this.incomingEdges = [];
	this.outgoingEdges = [];
	this.shape = null;
};

var indexOf = function(needle) {
    if(typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                if(this[i] === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle);
};