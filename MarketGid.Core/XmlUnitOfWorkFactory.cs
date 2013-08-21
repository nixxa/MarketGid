using System;

namespace MarketGid.Core
{
	public class XmlUnitOfWorkFactory : IUnitOfWorkFactory
	{
		[ThreadStatic]
		private static XmlUnitOfWork _local;

		#region IUnitOfWorkFactory Members

		/// <summary>
		/// Создает объект, если в потоке
		/// </summary>
		/// <returns>Объект UnitOfWork</returns>
		public IUnitOfWork Create()
		{
			if (_local == null || _local.Disposed)
			{
				_local = new XmlUnitOfWork();
			}
			_local.InstanceCount += 1;
			return _local;
		}

		#endregion
	}
}

