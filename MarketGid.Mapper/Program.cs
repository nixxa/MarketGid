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
					decimal shiftX = 0;
					decimal shiftY = 0;
					string attrArgs = string.Empty;
					if (transformAttr != null && fixTranslate)
					{
						if (transformAttr.Value.Contains("translate"))
						{
							shiftX = ParseTransform(transformAttr).X;
							shiftY = ParseTransform(transformAttr).Y;
						}
					}
					
					string objectName = labelAttr.Value;
					
					if (excludedNames.Any(s => objectName.IndexOf(s) > 0)) continue;
					
					// добавляем в маршруты
					if (objectName.Equals(RoutesElement, StringComparison.InvariantCultureIgnoreCase))
					{
						foreach (var path in layer.Elements("{" + xdoc.Root.Name.NamespaceName + "}path"))
						{
							string pathD = path.Attribute ("d").Value;
							if (fixTranslate && (shiftX > 0 || shiftY > 0))
							{
								pathD = TranslatePath(pathD, shiftX, shiftY);
							}
							routes.Add(new PathData { path = pathD, map = mapName });
						}
						continue;
					}
					
					
					// добавляем в объекты
					MapObject mapObject = (mapObjects != null)
						? mapObjects.FirstOrDefault(m => string.Equals(m.Name, objectName, StringComparison.InvariantCultureIgnoreCase))
						: null;

					List<PathData> paths = CreatePaths(layer, shiftX, shiftY);
					paths.ForEach(data => {
	                 	data.name = objectName;
	                 	data.map = mapName;
	                 	data.objectId = (mapObject != null ? mapObject.Id : 0);
	                 });
					list.AddRange(paths);
					
					List<PathData> texts = CreateTexts(layer, shiftX, shiftY);
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
		
		static dynamic ParseTransform(XAttribute attr)
		{
			if (!attr.Value.StartsWith("translate")) return new { X = 0, Y = 0 };
			int start = attr.Value.IndexOf("(");
			int end = attr.Value.IndexOf(")");
			int length = end - start;
			string attrArgs = attr.Value.Substring(attr.Value.IndexOf("(") + 1, length - 1);
			
			return new {
				X = Convert.ToDecimal(attrArgs.Split(',')[0].Trim(), CultureInfo.InvariantCulture),
				Y = Convert.ToDecimal(attrArgs.Split(',')[1].Trim(), CultureInfo.InvariantCulture)
			};
		}
		
		static string TranslatePath(string pathD, decimal shiftX, decimal shiftY)
		{
			int start = pathD.StartsWith("m") ? 2 : 0; // relative moveto
			if (start > 0)
			{
				int end = pathD.IndexOf(" ", start);
				int length = end - start;
				string attrArgs = pathD.Substring(start, length);
				decimal newX = Convert.ToDecimal(attrArgs.Split(',')[0].Trim(), CultureInfo.InvariantCulture) + shiftX;
				decimal newY = Convert.ToDecimal(attrArgs.Split(',')[1].Trim(), CultureInfo.InvariantCulture) + shiftY;
				
				pathD = pathD.Substring(0, start) + newX.ToString().Replace(',','.') + "," + newY.ToString().Replace(',','.') + " " + pathD.Substring(end + 1);
			}
			
			start = pathD.IndexOf("L "); // absolute lineto
			if (start > 0)
			{
				int end = pathD.IndexOf(" ", start+2);
				int length = end - start - 2;
				string args = pathD.Substring(start + 2, length);
				decimal newX = Convert.ToDecimal(args.Split(',')[0].Trim(), CultureInfo.InvariantCulture) + shiftX;
				decimal newY = Convert.ToDecimal(args.Split(',')[1].Trim(), CultureInfo.InvariantCulture) + shiftY;
				
				pathD = pathD.Substring(0, start) + "L " + newX.ToString().Replace(',','.') + "," + newY.ToString().Replace(',','.') + " " + pathD.Substring(end + 1);
			}
			
			return pathD;
		}
		
		static PathData CreatePathData(XElement pathElem, decimal shiftX, decimal shiftY)
		{
			if (pathElem == null) return null;

			string objectPath = pathElem.Attribute ("d").Value;
			var transformAttr = pathElem.Attribute ("transform");
			if (transformAttr != null)
			{
				shiftX += ParseTransform(transformAttr).X;
				shiftY += ParseTransform(transformAttr).Y;
			}
			if (shiftX > 0 || shiftY > 0)
			{
				objectPath = TranslatePath(objectPath, shiftX, shiftY);
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
					if (rawStyle.StartsWith("fill:")) pathData.bgColor = val;
					if (rawStyle.StartsWith("fill-opacity:")) pathData.opacity = Convert.ToDouble(val, CultureInfo.InvariantCulture);
					if (rawStyle.StartsWith("stroke:")) pathData.borderColor = val;
					if (rawStyle.StartsWith("stroke-width:")) pathData.borderWidth = Convert.ToDouble(val.Replace("px",""), CultureInfo.InvariantCulture);
					if (rawStyle.StartsWith("stroke-linejoin:")) pathData.borderJoin = val;
				}
			}
			
			return pathData;
		}
		
		static List<PathData> CreatePaths(XElement layer, decimal shiftX, decimal shiftY)
		{
			var pathElems = layer.Elements ("{" + layer.Name.NamespaceName + "}path");
			if (pathElems == null || !pathElems.Any()) return new List<PathData> ();
			
			List<PathData> list = new List<PathData> ();
			foreach (var pathElem in pathElems)
			{
				PathData pathData = CreatePathData(pathElem, shiftX, shiftY);
				list.Add(pathData);
			}
			return list;
		}
		
		static List<PathData> CreateTextData(XElement textElem, decimal shiftX, decimal shiftY)
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
			if (textElem.Attribute ("transform") != null && textElem.Attribute ("transform").Value.StartsWith("matrix"))
			{
				var val = textElem.Attribute ("transform").Value;
				globalData.matrix = val.Substring (7, val.Length - 8);
			}
			
			List<PathData> list = new List<PathData>();
			foreach (var spanElem in textElem.Elements ("{" + textElem.Name.NamespaceName + "}tspan"))
			{
				PathData pathData = globalData.Clone();
				attr = spanElem.Attribute ("x");
				pathData.x = shiftX > 0 ? Convert.ToDouble(attr.Value.Replace("px",""), CultureInfo.InvariantCulture) + Convert.ToDouble(shiftX) : Convert.ToDouble(attr.Value.Replace("px",""), CultureInfo.InvariantCulture);
				attr = spanElem.Attribute ("y");
				pathData.y = shiftY > 0 ? Convert.ToDouble(attr.Value.Replace("px",""), CultureInfo.InvariantCulture) + Convert.ToDouble(shiftY) : Convert.ToDouble(attr.Value.Replace("px",""), CultureInfo.InvariantCulture);
				pathData.text = spanElem.Value;
				list.Add(pathData);
			}
			
			return list;
		}
		
		static List<PathData> CreateTexts(XElement layer, decimal shiftX, decimal shiftY)
		{
			var textElems = layer.Elements ("{" + layer.Name.NamespaceName + "}text");
			if (textElems == null || !textElems.Any()) return new List<PathData> ();
			
			List<PathData> list = new List<PathData> ();
			foreach (var textElem in textElems)
			{
				List<PathData> pathData = CreateTextData(textElem, shiftX, shiftY);
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
}
