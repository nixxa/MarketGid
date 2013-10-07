using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Xml.Linq;

using MarketGid.Core.Models;
using Mono.Options;
using Newtonsoft.Json;

namespace MarketGid.Mapper
{
	/// <summary>
	/// Утилита для формирования файлов данных с объектами и маршрутами
	/// </summary>
	class MainClass
	{
		/// <summary>
		/// Создает файлы
		/// </summary>
		/// <param name="args">Аргументы командной строки</param>
		public static void Main (string[] args)
		{
			bool verbose = false;
			bool fixTranslate = false;
			
			string sourceMapsFilenames = string.Empty;
			string sourceObjectsFilename = string.Empty;
			
			string[] excludedNames = new string[0];
			
			string outObjectsFilename = "paths.js";
			string outEdgesFilename = "edges.js";
			string outMapsFilename = "maps.js";

			List<string> extra = null;

			var p = new OptionSet () {
				{ "sm|sourcemaps=", "source maps filenames, comma separated. All must be an SVG format", v => sourceMapsFilenames = v },
				{ "so|sourceobjects=", "source objects filename. Must be in JSON format", v => sourceObjectsFilename = v },
				{ "o|objects=", "output objects filename.", v => outObjectsFilename = v },
				{ "r|routes=", "output routes edges filename.", v => outEdgesFilename = v },
				{ "m|maps=", "output maps filename.", v => outMapsFilename = v },
				{ "v", "verbose output", v => verbose = (v != null) },
				{ "f|fix", "fix transform='translate(x,y)' layer attribute", v => fixTranslate = (v != null) },
				{ "e|exclude", "exclude layer with specified names (comma separated)", v => excludedNames = v.Split(',') }
			};

			try
			{
				extra = p.Parse (args);
			}
			catch (OptionException e) 
			{
				Console.WriteLine (e.Message);
				return;
			}
			
			// load objects
			MapObject[] mapObjects = null;
			if (!File.Exists(sourceObjectsFilename)) 
			{
				sourceObjectsFilename = AppDomain.CurrentDomain.BaseDirectory + @"\" + sourceObjectsFilename;
				if (!File.Exists(sourceObjectsFilename))
				{
					Console.WriteLine("Source objects JSON data not found");
					//return;
				}
				else
				{
					using (var reader = new StreamReader (sourceObjectsFilename))
					{
						string data = reader.ReadToEnd ();
						data = Regex.Replace(data, "(.*)//(.*)\n", "$1/*$2*/\n");
						mapObjects = JsonConvert.DeserializeObject<MapObject[]> (data);
					}
				}
			}
			else
			{
				using (var reader = new StreamReader (sourceObjectsFilename))
				{
					string data = reader.ReadToEnd ();
					data = Regex.Replace(data, "(.*)//(.*)\n", "$1/*$2*/\n");
					mapObjects = JsonConvert.DeserializeObject<MapObject[]> (data);
				}				
			}
			
			string[] filenames = sourceMapsFilenames.Split(',');
			List<PathData> list = new List<PathData> ();
			List<PathData> routes = new List<PathData> ();
			List<MapData> maps = new List<MapData> ();

			for (int i = 0; i < filenames.Length; i++)
			{
				if (!File.Exists (filenames[i]))
				{
					filenames[i] = AppDomain.CurrentDomain.BaseDirectory + @"\" + filenames[i];
				}
				FileInfo fInfo = new FileInfo(filenames[i]);
				string mapName = fInfo.Name.Split('.')[0];
	
				// загружаем SVG
				XDocument xdoc = XDocument.Load (filenames[i]);
				// находим фоновое изображение
				var imageNode = xdoc.Root.Element("{" + xdoc.Root.Name.NamespaceName + "}image");
				if (imageNode != null)
				{
					var hrefAttr = imageNode.Attribute("{http://www.w3.org/1999/xlink}href");
					if (hrefAttr != null)
					{
						maps.Add(new MapData { name = mapName, backgroundImage = "/Content/maps/" + hrefAttr.Value });
					}
				}
				
				// находим все слои
				var layers = xdoc.Root.Descendants("{" + xdoc.Root.Name.NamespaceName + "}g").Where (t => t.Attribute ("{http://www.inkscape.org/namespaces/inkscape}groupmode").Value == "layer");
				// обрабатываем слои
				foreach (var layer in layers)
				{
					var labelAttr = layer.Attribute ("{http://www.inkscape.org/namespaces/inkscape}label");
					if (labelAttr == null) continue;
					
					var transformAttr = layer.Attribute("transform");
					MatrixTransform transform = null;
					if (transformAttr != null && fixTranslate)
					{
						transform = MatrixTransform.Parse (transformAttr.Value);
					}
					
					string objectName = labelAttr.Value;
					
					if (excludedNames.Any(s => objectName.IndexOf(s) > 0)) continue;
					
					// добавляем в маршруты
					if (objectName.Equals(RoutesElement, StringComparison.InvariantCultureIgnoreCase))
					{
						foreach (var path in layer.Elements("{" + xdoc.Root.Name.NamespaceName + "}path"))
						{
							string pathD = path.Attribute ("d").Value;
							PathData route = new PathData { path = pathD, map = mapName };
							if (transform != null)
								route.matrix = transform.ToString ();
							routes.Add(route);
						}
						continue;
					}
					
					// добавляем в объекты
					MapObject mapObject = (mapObjects != null)
						? mapObjects.FirstOrDefault(m => string.Equals(m.Name, objectName, StringComparison.InvariantCultureIgnoreCase))
						: null;

					List<PathData> paths = CreatePaths(layer, transform);
					paths.ForEach(data => {
	                 	data.name = objectName;
	                 	data.map = mapName;
	                 	data.objectId = (mapObject != null ? mapObject.Id : 0);
	                 });
					list.AddRange(paths);
					
					List<PathData> texts = CreateTexts(layer, transform);
					texts.ForEach(data => {
					    data.name = objectName;
					    data.map = mapName;
					    data.objectId = (mapObject != null ? mapObject.Id : 0);
					});
					list.AddRange(texts);
				}
			}

			// создаем файл с объектами
			string pathData = JsonConvert.SerializeObject (list, Formatting.Indented);
			pathData = "var PathData = " + pathData + ";";
			using (StreamWriter writer = new StreamWriter (outObjectsFilename, false, Encoding.UTF8))
			{
				writer.WriteLine (pathData);
			}
			
			// создаем файл с маршрутами
			pathData = JsonConvert.SerializeObject (routes, Formatting.Indented);
			pathData = "var EdgesData = " + pathData + ";";
			using (StreamWriter writer = new StreamWriter (outEdgesFilename, false, Encoding.UTF8))
			{
				writer.WriteLine (pathData);
			}
			
			// создаем файл с описанием карт
			if (!string.IsNullOrWhiteSpace(outMapsFilename))
			{
				pathData = JsonConvert.SerializeObject (maps, Formatting.Indented);
				pathData = "var MapsData = " + pathData + ";";
				using (StreamWriter writer = new StreamWriter (outMapsFilename, false, Encoding.UTF8))
				{
					writer.WriteLine (pathData);
				}
			}
		}
		
		static PathData CreatePathData(XElement pathElem, MatrixTransform parentTransform)
		{
			if (pathElem == null) return null;

			string objectPath = pathElem.Attribute ("d").Value;
			var transformAttr = pathElem.Attribute ("transform");
			MatrixTransform transform = null;
			if (transformAttr != null)
			{
				transform = MatrixTransform.Parse (transformAttr.Value);
				if (parentTransform != null)
					transform = parentTransform.Multiply (transform);
			}
			else 
			{
				transform = parentTransform;
			}

			PathData pathData = new PathData { path = objectPath };
			var attr = pathElem.Attribute ("style");
			if (attr != null && !string.IsNullOrWhiteSpace(attr.Value))
			{
				// парсим стили объекта
				string[] rawStyles = attr.Value.Split(';');
				foreach (var rawStyle in rawStyles)
				{
					string name = rawStyle.Split(':')[0];
					string val = rawStyle.Split(':')[1];
					switch (name)
					{
					case "fill":
						pathData.bgColor = val;
						break;
					case "fill-opacity":
						pathData.opacity = Convert.ToDouble (val, CultureInfo.InvariantCulture);
						break;
					case "stroke":
						pathData.borderColor = val;
						break;
					case "stroke-width":
						pathData.borderWidth = Convert.ToDouble (val.Replace ("px", ""), CultureInfo.InvariantCulture);
						break;
					case "stroke-linejoin":
						pathData.borderJoin = val;
						break;
					}
				}
			}
			if (transform != null)
			{
				//pathData.matrix = transform.ToString ();
				transform.Apply(pathData);
			}
			
			return pathData;
		}
		
		static List<PathData> CreatePaths(XElement layer, MatrixTransform transform)
		{
			var pathElems = layer.Elements ("{" + layer.Name.NamespaceName + "}path");
			if (pathElems == null || !pathElems.Any()) return new List<PathData> ();
			
			List<PathData> list = new List<PathData> ();
			foreach (var pathElem in pathElems)
			{
				PathData pathData = CreatePathData(pathElem, transform);
				list.Add(pathData);
			}
			return list;
		}
		
		static List<PathData> CreateTextData(XElement textElem, MatrixTransform parentTransform)
		{
			if (textElem == null) return null;
			
			var globalData = new PathData();
			XAttribute attr = textElem.Attribute ("style");
			if (attr != null && !string.IsNullOrWhiteSpace(attr.Value))
			{
				// парсим стили объекта
				string[] rawStyles = attr.Value.Split(';');
				foreach (var rawStyle in rawStyles)
				{
					string name = rawStyle.Split(':')[0];
					string val = rawStyle.Split(':')[1];
					if (rawStyle.StartsWith("fill:")) globalData.color = val;
					if (rawStyle.StartsWith("fill-opacity:")) globalData.opacity = Convert.ToDouble(val, CultureInfo.InvariantCulture);
					if (rawStyle.StartsWith("font-size:")) globalData.fontSize = Convert.ToDouble(val.Replace("px",""), CultureInfo.InvariantCulture);
					if (rawStyle.StartsWith("font-family:")) globalData.fontFamily = val;
					if (rawStyle.StartsWith("font-weight:")) globalData.fontWeight = val;
				}
			}
			
			MatrixTransform transform = null;
			if (textElem.Attribute ("transform") != null)
			{
				transform = MatrixTransform.Parse (textElem.Attribute ("transform").Value);
				if (parentTransform != null)
					transform = parentTransform.Multiply (transform);
			}
			else
			{
				transform = parentTransform;
			}
			//if (transform != null)
			//	globalData.matrix = transform.ToString ();
			
			List<PathData> list = new List<PathData>();
			foreach (var spanElem in textElem.Elements ("{" + textElem.Name.NamespaceName + "}tspan"))
			{
				PathData pathData = globalData.Clone();
				attr = spanElem.Attribute ("x");
				pathData.x = Convert.ToDouble (attr.Value.Replace("px",""), CultureInfo.InvariantCulture);
				attr = spanElem.Attribute ("y");
				pathData.y = Convert.ToDouble (attr.Value.Replace("px",""), CultureInfo.InvariantCulture);
				pathData.text = spanElem.Value;
				
				if (transform != null)
					transform.Apply(pathData);
				
				list.Add(pathData);
			}
			
			return list;
		}
		
		static List<PathData> CreateTexts(XElement layer, MatrixTransform parentTransform)
		{
			var textElems = layer.Elements ("{" + layer.Name.NamespaceName + "}text");
			if (textElems == null || !textElems.Any()) return new List<PathData> ();
			
			List<PathData> list = new List<PathData> ();
			foreach (var textElem in textElems)
			{
				List<PathData> pathData = CreateTextData(textElem, parentTransform);
				list.AddRange(pathData);
			}
			return list;
		}
		
		readonly static string RoutesElement = "Маршруты";
	}

	class PathData 
	{
		public string path;
		public string name;
		public string map;
		public long objectId;
		public string bgColor;
		public double opacity = 1.0;
		public string borderColor;
		public double borderWidth;
		public string borderJoin;
		
		public string text;
		public double x;
		public double y;
		public double angle;
		public double scaleX;
		public double scaleY;
		public double fontSize;
		public string fontFamily;
		public string fontWeight;
		public string color;
		public string matrix;
		
		public PathData Clone()
		{
			return (PathData) this.MemberwiseClone();
		}
	}
	
	class MapData
	{
		public string name;
		public string backgroundImage;
	}

	class MatrixTransform
	{
		double A;
		double B;
		double C;
		double D;
		double E;
		double F;

		public static MatrixTransform Parse(string value)
		{
			try
			{
				string[] vals;
				if (value.StartsWith ("matrix"))
				{
					vals = value.Substring ("matrix".Length + 1, value.Length - 2 - "matrix".Length).Split (',');
					return new MatrixTransform { 
						A = double.Parse(vals[0], CultureInfo.InvariantCulture),
						B = double.Parse(vals[1], CultureInfo.InvariantCulture),
						C = double.Parse(vals[2], CultureInfo.InvariantCulture),
						D = double.Parse(vals[3], CultureInfo.InvariantCulture),
						E = double.Parse(vals[4], CultureInfo.InvariantCulture),
						F = double.Parse(vals[5], CultureInfo.InvariantCulture)
					};
				}
				if (value.StartsWith ("translate"))
				{
					vals = value.Substring ("translate".Length + 1, value.Length - 2 - "translate".Length).Split (',');
					return new MatrixTransform { 
						A = 1, B = 0, C = 0, D = 1, E = double.Parse(vals[0], CultureInfo.InvariantCulture), F = double.Parse(vals[1], CultureInfo.InvariantCulture)
					};
				}
				if (value.StartsWith ("scale"))
				{
					vals = value.Substring ("scale".Length + 1, value.Length - 2 - "scale".Length).Split (',');
					return new MatrixTransform { 
						A = double.Parse(vals[0], CultureInfo.InvariantCulture), B = 0, C = 0, D = double.Parse(vals[1], CultureInfo.InvariantCulture), E = 0, F = 0
					};
				}
				if (value.StartsWith ("rotate"))
				{
					vals = value.Substring ("rotate".Length + 1, value.Length - 2 - "rotate".Length).Split (',');
					double angle = double.Parse (vals [0], CultureInfo.InvariantCulture);
					return new MatrixTransform {
						A = Math.Cos(angle),
						B = Math.Sin(angle),
						C = -Math.Sin(angle),
						D = Math.Cos(angle),
						E = 0,
						F = 0
					};
				}
				return null;
			}
			catch (Exception e) {
				Console.WriteLine ("Error in value: '" + value + "':\n" + e.ToString ());
				throw;
			}
		}

		public MatrixTransform Multiply(MatrixTransform matrix)
		{
			if (matrix == null)
				return this;
			/*
			 * "matrix("+(a1*a2+c1*b2)+","+
				      (b1*a2+d1*b2)+","+
				      (a1*c2+c1*d2)+","+
				      (b1*c2+d1*d2)+","+
				      (a1*e2+c1*g2+e1)+","+
				      (b1*e2+d1*g2+g1)+")"
			 */
			return new MatrixTransform { 
				A = this.A * matrix.A + this.C * matrix.B,
				B = this.B * matrix.A + this.D * matrix.B,
				C = this.A * matrix.C + this.C * matrix.D,
				D = this.B * matrix.C + this.D * matrix.D,
				E = this.A * matrix.E + this.C * matrix.F + this.E,
				F = this.B * matrix.E + this.D * matrix.F + this.F
			};
		}

		public void Apply(PathData pathData)
		{
			if (pathData.path != null)
				ApplyToPath(pathData);
			else
				ApplyToText(pathData);
		}
		
		public void ApplyToPath(PathData pathData)
		{
			string result = "";
			bool needApply = false;
			bool isAbsolute = false;
			string[] path = pathData.path.Split(' ');
			for (int i = 0; i < path.Length; i++)
			{
				string[] coords = path[i].Split(',');
				if (coords.Length == 1)
				{
					// это команда
					if (coords[0].ToUpper() == coords[0])
					{
						// с абсолютными координатами
						needApply = true;
						isAbsolute = true;
					}
					else if (coords[0] == "m")
					{
						needApply = true;
						isAbsolute = false;
					}
					result += coords[0] + " ";
				}
				else
				{
					if (needApply)
					{
						double x = double.Parse(coords[0], CultureInfo.InvariantCulture);
						double y = double.Parse(coords[1], CultureInfo.InvariantCulture);
						result += (x * A + y * C + E).ToString().Replace(',','.') + ",";
						result += (x * B + y * D + F).ToString().Replace(',','.') + " ";
						needApply = isAbsolute;
					}
					else
					{
						result += coords[0] + ",";
						result += coords[1] + " ";
					}
				}
			}
			pathData.path = result;
		}
		
		public void ApplyToText(PathData pathData)
		{
			double delta = 0.01;
			double x = pathData.x;
			double y = pathData.y;
			pathData.x = (x * A + y * C + E);
			pathData.y = (x * B + y * D + F);
			// если A == 0 или D == 0, то значит угол 90 либо -90
			if (Math.Abs (A - 0.0) <= delta || Math.Abs (D - 0.0) <= delta)
			{
				if (B < 0)
				{
					pathData.angle = -90;
				}
				else
				{
					pathData.angle = 90;
				}
				// переставляем местами, потому что scale выполняется до rotate, значит scaleX - это по высоте
				pathData.scaleY = -C / Math.Sin (pathData.angle * Math.PI/180);
				pathData.scaleX = B / Math.Sin (pathData.angle * Math.PI/180);
			}
			else
			{
				pathData.angle = Math.Atan (-C/A) * 180 / Math.PI;
				// если угол поворота больше нуля, то считаем через синус угла
				if (Math.Abs (pathData.angle - 0.0) >= delta)
				{
					pathData.scaleX = -C / Math.Sin (pathData.angle * Math.PI / 180);
					pathData.scaleY = B / Math.Sin (pathData.angle * Math.PI / 180);
				}
				else
				{
					pathData.scaleX = A / Math.Cos (pathData.angle * Math.PI / 180);
					pathData.scaleY = D / Math.Cos (pathData.angle * Math.PI / 180);
				}
			}			

			// учитываем тот факт, что в svg координаты текста - это координаты baseline текста,
			// а в canvas - нижний левый угол ограничивающего прямоугольника)
			if (Math.Abs(pathData.angle - 0) <= delta)
			{
				pathData.y -= pathData.fontSize * 0.8;
			}
			else if ((Math.Abs(pathData.angle) - 90.0) <= delta)
			{
				if (pathData.angle > 0)
				{
					pathData.x += pathData.fontSize * 0.8;
				}
				else
				{
					pathData.x -= pathData.fontSize * 0.8;
				}
			}
			else
			{
				if (pathData.angle > 0)
				{
					pathData.x += pathData.fontSize * Math.Sin(pathData.angle);
					pathData.y += pathData.fontSize * Math.Cos(pathData.angle);
				}
				else
				{
					pathData.x -= pathData.fontSize * Math.Sin(pathData.angle);
					pathData.y -= pathData.fontSize * Math.Cos(pathData.angle);
				}
			}
		}
		
		public override string ToString()
		{
			return string.Format ("matrix({0},{1},{2},{3},{4},{5})", 
			                      A.ToString().Replace(',','.'), 
			                      B.ToString().Replace(',','.'), 
			                      C.ToString().Replace(',','.'), 
			                      D.ToString().Replace(',','.'), 
			                      E.ToString().Replace(',','.'), 
			                      F.ToString().Replace(',','.'));
		}
	}
}
