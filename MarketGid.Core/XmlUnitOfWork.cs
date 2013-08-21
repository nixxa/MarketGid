using System;
using System.Data;
using System.Collections.Generic;
using System.Linq;
using System.Xml.Serialization;
using System.IO;

namespace MarketGid.Core
{
	public class XmlUnitOfWork : IUnitOfWork
	{
		static XmlUnitOfWork() 
		{
			string basePath = AppDomain.CurrentDomain.BaseDirectory;

			// load advertisements
			XmlSerializer serializer = new XmlSerializer (typeof(AdvertisementCollection));
			using (var stream = new FileStream(basePath + "/App_Data/ads.config", FileMode.Open))
			{
				AdvertisementCollection collection = (AdvertisementCollection) serializer.Deserialize (stream);
				_objects.Add (typeof(Advertisement), collection.Advertisements);
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

		[XmlRoot("Advertisements")]
		public class AdvertisementCollection
		{
			[XmlElement("Advertisement")]
			public List<Advertisement> Advertisements = new List<Advertisement> ();
		}

		#endregion
	}
}

