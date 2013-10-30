using System;
using System.Data;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;
using System.IO;
using Newtonsoft.Json;
using System.Text.RegularExpressions;
using MarketGid.Core.Models;

namespace MarketGid.Core
{
	public class FileUnitOfWork : IUnitOfWork
	{
		static FileUnitOfWork() 
		{
			string basePath = AppDomain.CurrentDomain.BaseDirectory;

			// load advertisements
			using (var reader = new StreamReader (basePath + "/App_Data/ads.config"))
			{
				string data = reader.ReadToEnd ();
				//data = Regex.Replace(data, "(.*)//(.*)\\n", "$1/*$2*/\n");
				var collection = JsonConvert.DeserializeObject<Advertisement[]> (data);
				_objects.Add (typeof(Advertisement), collection);
			}

			// load categories
			Category[] categories = null;
			using (var reader = new StreamReader (basePath + "/App_Data/categories.config"))
			{
				string data = reader.ReadToEnd ();
				data = Regex.Replace(data, "(.*)//(.*)\n", "$1/*$2*/\n");
				categories = JsonConvert.DeserializeObject<Category[]> (data);
				_objects.Add (typeof(Category), categories);
			}

			// load objects
			MapObject[] mapObjects = null;
			using (var reader = new StreamReader (basePath + "/App_Data/objects.config"))
			{
				string data = reader.ReadToEnd ();
				data = Regex.Replace(data, "(.*)//(.*)\n", "$1/*$2*/\n");
				mapObjects = JsonConvert.DeserializeObject<MapObject[]> (data);
				_objects.Add (typeof(MapObject), mapObjects);
			}

			// Load kiosk
			Kiosk[] kiosks = null;
			using (var reader = new StreamReader (basePath + "/App_Data/kiosk.config"))
			{
				string data = reader.ReadToEnd ();
				data = Regex.Replace(data, "(.*)//(.*)\n", "$1/*$2*/\n");
				kiosks = JsonConvert.DeserializeObject<Kiosk[]> (data);
				_objects.Add (typeof(Kiosk), kiosks);
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
				List<Category> list = categories.Where (c => mapObject.CategoryIds.Contains(c.Id)).ToList ();
				mapObject.Categories = list;
				if (list != null)
					list.ForEach(c => c.Objects.Add (mapObject));
			}
		}

		#region IUnitOfWork implementation

		public IQueryable<T> Query<T> () where T : class
		{
			if (!_objects.ContainsKey(typeof(T))) return (new T[0]).AsQueryable();
			var collection = _objects [typeof(T)];
			return collection.OfType<T> ().AsQueryable ();
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

		private static Dictionary<Type, IEnumerable<object>> _objects = new Dictionary<Type, IEnumerable<object>> ();

		#endregion
	}
}

