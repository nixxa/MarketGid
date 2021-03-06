using System;
using System.Data;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;
using System.IO;
using Newtonsoft.Json;
using System.Text.RegularExpressions;
using MarketGid.Core.Models;
using NLog;
using System.Configuration;

namespace MarketGid.Core
{
	public class FileUnitOfWork : IUnitOfWork
	{
		static FileUnitOfWork() 
		{
			string basePath = AppDomain.CurrentDomain.BaseDirectory;
			string themePath = basePath + "App_Data" + Path.DirectorySeparatorChar;

			lock (_objects)
			{
				try
				{
					InitObjects (themePath, _objects);
				}
				catch (Exception ex)
				{
					Logger.Error (ex.ToString ());
				}
			}

			// configure watcher
			_watcher.Changed += HandleChanged;
			_watcher.NotifyFilter = NotifyFilters.Size | NotifyFilters.LastWrite | NotifyFilters.FileName;
			_watcher.Path = themePath;
			_watcher.Filter = "*.config";
			_watcher.EnableRaisingEvents = true;
		}

		#region IUnitOfWork implementation

		public IQueryable<T> Query<T> () where T : class
		{
			lock (_objects)
			{
				if (!_objects.ContainsKey (typeof(T)))
					return (new T[0]).AsQueryable ();
				var collection = _objects [typeof(T)];
				return collection.OfType<T> ().AsQueryable ();
			}
		}

		public IUnitOfWork BeginTransaction (IsolationLevel level = IsolationLevel.ReadCommitted)
		{
			throw new NotImplementedException ();
		}

		public void Commit ()
		{
			throw new NotImplementedException ();
		}

		public void Rollback ()
		{
			throw new NotImplementedException ();
		}

		public void SaveOrUpdate<T> (T model) where T : class
		{
			throw new NotImplementedException ();
		}

		public void Delete<TObject> (IEnumerable<TObject> objList) where TObject : class
		{
			throw new NotImplementedException ();
		}

		public void Delete<TObject> (TObject obj) where TObject : class
		{
			throw new NotImplementedException ();
		}

		#endregion

		#region IDisposable implementation

		public void Dispose ()
		{
			// nothing to do
		}

		#endregion

		internal long InstanceCount = 0;
		internal bool Disposed = false;

		#region Private members

		static readonly Logger Logger = LogManager.GetCurrentClassLogger();
		static Dictionary<Type, IEnumerable<object>> _objects = new Dictionary<Type, IEnumerable<object>> ();
		static readonly FileSystemWatcher _watcher = new FileSystemWatcher();

		static void HandleChanged (object sender, FileSystemEventArgs e)
		{
			try
			{
				lock (_objects)
				{
					Dictionary<Type, IEnumerable<object>> temp = new Dictionary<Type, IEnumerable<object>> ();
					InitObjects (AppDomain.CurrentDomain.BaseDirectory, temp);
					if (temp != null && temp.Any())
					{
						_objects = temp;
					}
				}
			}
			catch (Exception ex) 
			{
				// log exception
				Logger.Error(e.FullPath + " " + ex.Message);
			}
		}

		/// <summary>
		/// Инициализирует все объекты киоска
		/// </summary>
		/// <param name="basePath">Base path.</param>
		/// <param name = "tempCollection"></param>
		static void InitObjects (string basePath, IDictionary<Type, IEnumerable<object>> tempCollection)
		{
			// load advertisements
			using (var reader = new StreamReader (new FileStream(basePath + Path.DirectorySeparatorChar + "ads.config", FileMode.Open, FileAccess.Read, FileShare.ReadWrite)))
			{
				string data = reader.ReadToEnd ();
				//data = Regex.Replace(data, "(.*)//(.*)\\n", "$1/*$2*/\n");
				var collection = JsonConvert.DeserializeObject<Advertisement[]> (data);
				tempCollection.Add (typeof(Advertisement), collection);
			}
			// load categories
			Category[] categories = null;
			using (var reader = new StreamReader (new FileStream(basePath + Path.DirectorySeparatorChar + "categories.config", FileMode.Open, FileAccess.Read, FileShare.ReadWrite)))
			{
				string data = reader.ReadToEnd ();
				data = Regex.Replace (data, "(.*)//(.*)\n", "$1/*$2*/\n");
				categories = JsonConvert.DeserializeObject<Category[]> (data);
				tempCollection.Add (typeof(Category), categories);
			}
			// load objects
			MapObject[] mapObjects = null;
			using (var reader = new StreamReader (new FileStream(basePath + Path.DirectorySeparatorChar + "objects.config", FileMode.Open, FileAccess.Read, FileShare.ReadWrite)))
			{
				string data = reader.ReadToEnd ();
				data = Regex.Replace (data, "(.*)//(.*)\n", "$1/*$2*/\n");
				mapObjects = JsonConvert.DeserializeObject<MapObject[]> (data);
				tempCollection.Add (typeof(MapObject), mapObjects);
			}
			// Load kiosk
			Kiosk[] kiosks = null;
			using (var reader = new StreamReader (new FileStream(basePath + Path.DirectorySeparatorChar + "kiosk.config", FileMode.Open, FileAccess.Read, FileShare.ReadWrite)))
			{
				string data = reader.ReadToEnd ();
				data = Regex.Replace (data, "(.*)//(.*)\n", "$1/*$2*/\n");
				kiosks = JsonConvert.DeserializeObject<Kiosk[]> (data);
				tempCollection.Add (typeof(Kiosk), kiosks);
			}
			// organize categories
			foreach (var category in categories.Where (c => c.ParentId.HasValue))
			{
				var parent = categories.SingleOrDefault (c => c.Id == category.ParentId.Value);
				category.Parent = parent;
				parent.Children.Add (category);
			}
			// merge categories & objects
			foreach (var mapObject in mapObjects)
			{
				List<Category> list = categories.Where (c => mapObject.CategoryIds.Contains (c.Id)).ToList ();
				mapObject.Categories = list;
				if (list != null)
					list.ForEach (c => c.Objects.Add (mapObject));
			}
		}
		#endregion
	}
}

