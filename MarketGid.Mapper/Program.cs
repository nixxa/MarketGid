using System;
using System.Linq;
using Mono.Options;
using System.Collections.Generic;
using System.Xml.Linq;
using System.Linq;
using Newtonsoft.Json;
using System.IO;
using System.Text;

namespace MarketGid.Mapper
{
	class MainClass
	{
		public static void Main (string[] args)
		{
			bool verbose = false;
			string sourceFilename = string.Empty;
			string objectsFilename = string.Empty;
			string edgesFilename = string.Empty;

			List<string> extra = null;

			var p = new OptionSet () {
				{ "s|source=", "source filename. Must be an SVG format", v => sourceFilename = v },
				{ "o|objects=", "output objects filename.", v => objectsFilename = v },
				{ "r|routes=", "output routes edges filename.", v => edgesFilename = v },
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

			if (!File.Exists (sourceFilename))
			{
				sourceFilename = AppDomain.CurrentDomain.BaseDirectory + @"\" + sourceFilename;
			}

			// загружаем SVG
			XDocument xdoc = XDocument.Load (sourceFilename);
			// находим все слои
			var layers = xdoc.Root.Descendants("{" + xdoc.Root.Name.NamespaceName + "}g").Where (t => t.Attribute ("{http://www.inkscape.org/namespaces/inkscape}groupmode").Value == "layer");
			List<PathData> list = new List<PathData> ();
			List<PathData> routes = new List<PathData> ();
			// обрабатываем слои
			foreach (var layer in layers)
			{
				var labelAttr = layer.Attribute ("{http://www.inkscape.org/namespaces/inkscape}label");
				if (labelAttr == null) continue;
				
				string objectName = labelAttr.Value;
				
				if (IgnoredElements.Contains(objectName)) continue;
				
				if (objectName.Equals(RoutesElement, StringComparison.InvariantCultureIgnoreCase))
				{
					foreach (var path in layer.Elements("{" + xdoc.Root.Name.NamespaceName + "}path"))
					{
						routes.Add(new PathData { path = path.Attribute ("d").Value });
					}
					continue;
				}
				
				var pathElem = layer.Element ("{" + xdoc.Root.Name.NamespaceName + "}path");
				if (pathElem == null) continue;
				
				string objectPath = pathElem.Attribute ("d").Value;
				list.Add (new PathData { name = objectName, path = objectPath });
			}

			string pathData = JsonConvert.SerializeObject (list, Formatting.Indented);
			pathData = "var PathData = " + pathData + ";";
			using (StreamWriter writer = new StreamWriter (objectsFilename, false, Encoding.UTF8))
			{
				writer.WriteLine (pathData);
			}
			
			pathData = JsonConvert.SerializeObject (routes, Formatting.Indented);
			pathData = "var EdgesData = " + pathData + ";";
			using (StreamWriter writer = new StreamWriter (edgesFilename, false, Encoding.UTF8))
			{
				writer.WriteLine (pathData);
			}
		}
		
		readonly static string[] IgnoredElements = new[] { "Стены" };
		readonly static string RoutesElement = "Маршруты";
	}

	class PathData 
	{
		public string path;
		public string name;
	}
}
