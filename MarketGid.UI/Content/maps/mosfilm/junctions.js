// junctions.js

var JunctionData = [
	{
		id: 1,
		"x": 1497,
		"y": 774,
		"name": "Переход",
		"from": "mosfilm-1",
		title: " к клавному корпусу",
		connectedTo: [15]
	},
	{
		id: 2,
		"x": 886,
		"y": 624,
		"name": "Переход",
		"from": "mosfilm-1",
		"to": "mosfilm-2-3",
		title: " к клавному корпусу",
		connectedTo: [9]
	},
	{
		id: 3,
		"x": 1344,
		"y": 392,
		"name": "Переход",
		"from": "mosfilm-1",
		"to": "mosfilm-3-1",
		title: " к клавному корпусу",
		connectedTo: [24]
	},
	{
		id: 4,
		"x": 1532,
		"y": 407,
		"name": "Переход",
		"from": "mosfilm-1",
		"to": "mosfilm-27-1",
		title: " к клавному корпусу",
		connectedTo: [21]
	},
	{
		id: 5,
		"x": 1462,
		"y": 1025,
		"name": "Переход",
		"from": "mosfilm-1",
		"to": "mosfilm-20-1",
		title: " к клавному корпусу",
		connectedTo: [25]
	},
	{
		id: 6,
		"x": 1859,
		"y": 1035,
		"name": "Переход",
		"from": "mosfilm-1",
		"to": "mosfilm-18-1",
		title: " к клавному корпусу",
		connectedTo: [18]
	},
	{
		id: 7,
		"x": 1295,
		"y": 623,
		"name": "Переход",
		"from": "mosfilm-1",
		"to": "mosfilm-5-3",
		title: " к клавному корпусу",
		connectedTo: [10]
	},
	{
		id: 8,
		"x": 1376,
		"y": 526,
		"name": "Переход",
		"from": "mosfilm-1",
		"to": "mosfilm-6-1",
		title: " к клавному корпусу",
		connectedTo: [11]
	},
	{
		id: 9,
		"x": 897,
		"y": 2967,
		"name": "Переход",
		"from": "mosfilm-2-3",
		"to": "mosfilm-1",
		title: " к стр. 2 этаж 3",
		connectedTo: [2]
	},
	{
		id: 10,
		"x": 286,
		"y": 1398,
		"name": "Переход",
		"from": "mosfilm-5-3",
		"to": "mosfilm-1",
		title: " к стр. 5 этаж 3",
		connectedTo: [7]
	},
	{
		id: 11,
		"x": 725,
		"y": 110,
		"name": "Переход",
		"from": "mosfilm-6-1",
		"to": "mosfilm-1",
		title: " к стр. 6 этаж 1",
		connectedTo: [8]
	},
	{
		id: 12,
		"x": 808,
		"y": 207,
		"name": "Переход",
		"from": "mosfilm-6-1",
		"to": "mosfilm-6-2",
		title: " к стр. 6 этаж 1",
		connectedTo: [13]
	},
	{
		id: 13,
		"x": 810,
		"y": 206,
		"name": "Переход",
		"from": "mosfilm-6-2",
		"to": "mosfilm-6-1",
		title: " к стр. 6 этаж 2",
		connectedTo: [12]
	},
	{
		id: 14,
		"x": 94,
		"y": 268,
		"name": "Переход",
		"from": "mosfilm-6-2",
		"to": "mosfilm-5-3",
		connectedTo: []
	},
	{
		id: 15,
		"x": 38,
		"y": 376,
		"name": "Переход",
		"from": "mosfilm-7-1",
		"to": "mosfilm-1",
		title: " к стр. 7 этаж 1",
		connectedTo: [1]
	},
	{
		id: 16,
		"x": 926,
		"y": 577,
		"name": "Переход",
		"from": "mosfilm-7-1",
		"to": "mosfilm-7-2",
		title: " к стр. 7 этаж 1",
		connectedTo: [17]
	},
	{
		id: 17,
		"x": 1260,
		"y": 761,
		"name": "Переход",
		"from": "mosfilm-7-2",
		"to": "mosfilm-7-1",
		title: " к стр. 7 этаж 2",
		connectedTo: [16]
	},
	{
		id: 18,
		"x": 580,
		"y": 144,
		"name": "Переход",
		"from": "mosfilm-18-1",
		"to": "mosfilm-1",
		title: " к стр. 18 этаж 1",
		connectedTo: [6]
	},
	{
		id: 19,
		"x": 557,
		"y": 220,
		"name": "Переход",
		"from": "mosfilm-18-1",
		"to": "mosfilm-18-2",
		title: " к стр. 18 этаж 1",
		connectedTo: [20]
	},
	{
		id: 20,
		"x": 504,
		"y": 220,
		"name": "Переход",
		"from": "mosfilm-18-2",
		"to": "mosfilm-18-1",
		title: " к стр. 18 этаж 2",
		connectedTo: [19]
	},
	{
		id: 21,
		"x": 695,
		"y": 661,
		"name": "Переход",
		"from": "mosfilm-27-1",
		"to": "mosfilm-1",
		title: " к стр. 27 этаж 1",
		connectedTo: [4]
	},
	{
		id: 22,
		"x": 619,
		"y": 649,
		"name": "Переход",
		"from": "mosfilm-27-1",
		"to": "mosfilm-27-2",
		title: " к стр. 27 этаж 1",
		connectedTo: [23]
	},
	{
		id: 23,
		"x": 600,
		"y": 650,
		"name": "Переход",
		"from": "mosfilm-27-2",
		"to": "mosfilm-27-1",
		title: " к стр. 27 этаж 2",
		connectedTo: [22]
	},
	{
		id: 24,
		"x": 745,
		"y": 1092,
		"name": "Переход",
		"from": "mosfilm-3-1",
		"to": "mosfilm-1",
		title: " к стр. 3 этаж 1",
		connectedTo: [3]
	},
	{
		id: 25,
		"x": 462,
		"y": 106,
		"name": "Переход",
		"from": "mosfilm-20-1",
		"to": "mosfilm-1",
		title: " к стр. 20 этаж 1",
		connectedTo: [5]
	}
];