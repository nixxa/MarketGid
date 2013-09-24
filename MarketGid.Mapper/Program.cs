using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Xml.Linq;

using MarketGid.Core.Models;
using Mono.Options;
using Newtonsoft.Json;
using System.Text.RegularExpressions;

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
			string sourceMapsFilenames = string.Empty;
			string sourceObjectsFilename = string.Empty;
			
			string outObjectsFilename = string.Empty;
			string outEdgesFilename = string.Empty;
			string outMapsFilename = string.Empty;

			List<string> extra = null;

			var p = new OptionSet () {
				{ "sm|sourcemaps=", "source maps filenames, comma separated. All must be an SVG format", v => sourceMapsFilenames = v },
				{ "so|sourceobjects=", "source objects filename. Must be in JSON format", v => sourceObjectsFilename = v },
				{ "o|objects=", "output objects filename.", v => outObjectsFilename = v },
				{ "r|routes=", "output routes edges filename.", v => outEdgesFilename = v },
				{ "m|maps=", "output maps filename.", v => outMapsFilename = v },
				{ "v", "verbose output", v => verbose = (v != null) }
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
					return;
				}
			}
			using (var reader = new StreamReader (sourceObjectsFilename))
			{
				string data = reader.ReadToEnd ();
				data = Regex.Replace(data, "(.*)//(.*)\n", "$1/*$2*/\n");
				mapObjects = JsonConvert.DeserializeObject<MapObject[]> (data);
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
					
					string objectName = labelAttr.Value;
					
					if (IgnoredElements.Any(s => objectName.IndexOf(s) > 0)) continue;
					
					// добавляем в маршруты
					if (objectName.Equals(RoutesElement, StringComparison.InvariantCultureIgnoreCase))
					{
						foreach (var path in layer.Elements("{" + xdoc.Root.Name.NamespaceName + "}path"))
						{
							routes.Add(new PathData { path = path.Attribute ("d").Value, map = mapName });
						}
						continue;
					}
					
					var pathElem = layer.Element ("{" + xdoc.Root.Name.NamespaceName + "}path");
					if (pathElem == null) continue;
					
					// добавляем в объекты
					string objectPath = pathElem.Attribute ("d").Value;
					var mapObject = mapObjects.FirstOrDefault(m => string.Equals(m.Name, objectName, StringComparison.InvariantCultureIgnoreCase));
					list.Add (new PathData 
					{ 
						name = objectName, 
						path = objectPath, 
						map = mapName, 
						objectId = (mapObject != null ? mapObject.Id : 0) 
					});
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
			pathData = JsonConvert.SerializeObject (maps, Formatting.Indented);
			pathData = "var MapsData = " + pathData + ";";
			using (StreamWriter writer = new StreamWriter (outMapsFilename, false, Encoding.UTF8))
			{
				writer.WriteLine (pathData);
			}
		}
		
		readonly static string[] IgnoredElements = new[] { "Стены", "Лифт", "Эскалатор" };
		readonly static string RoutesElement = "Маршруты";
	}

	class PathData 
	{
		public string path;
		public string name;
		public string map;
		public long objectId;
	}
	
	class MapData
	{
		public string name;
		public string backgroundImage;
	}
}
