using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MarketGid.Core
{
	/// <summary>
	/// Фабрика для создания UnitOfWork объектов.
	/// На каждый поток создается один объект и сохраняется в ThreadStatic переменной
	/// </summary>
	public class UnitOfWorkFactory : IUnitOfWorkFactory
	{
		[ThreadStatic]
		private static UnitOfWork _local;

		#region IUnitOfWorkFactory Members

		/// <summary>
		/// Создает объект, если в потоке
		/// </summary>
		/// <returns>Объект UnitOfWork</returns>
		public IUnitOfWork Create()
		{
			if (_local == null || _local.Disposed)
			{
				_local = new UnitOfWork();
			}
			_local.InstanceCount += 1;
			return _local;
		}

		#endregion
	}
}
