using System;

namespace MarketGid.Core
{
	public class FileUnitOfWorkFactory : IUnitOfWorkFactory
	{
		[ThreadStatic]
		private static FileUnitOfWork _local;

		#region IUnitOfWorkFactory Members

		/// <summary>
		/// Создает объект, если в потоке
		/// </summary>
		/// <returns>Объект UnitOfWork</returns>
		public IUnitOfWork Create()
		{
			if (_local == null || _local.Disposed)
			{
				_local = new FileUnitOfWork();
			}
			_local.InstanceCount += 1;
			return _local;
		}

		#endregion
	}
}

