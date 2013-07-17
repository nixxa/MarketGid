using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace MarketGid.Core
{
	/// <summary>
	/// Фабрика для UnitOfWork
	/// </summary>
	public interface IUnitOfWorkFactory
	{
		/// <summary>
		/// Создает объект
		/// </summary>
		/// <returns></returns>
		IUnitOfWork Create();
	}
}
