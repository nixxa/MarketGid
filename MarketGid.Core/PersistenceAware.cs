using System;

namespace MarketGid.Core
{
	/// <summary>
	/// Базовый класс для объектов модели, для которых нужно выполнять какие либо действия до удаления объекта или после удаления
	/// </summary>
	public abstract class PersistenceAware
	{
		/// <summary>
		/// Выполняется до удаления объекта
		/// </summary>
		/// <param name="context">Контекст</param>
		/// <returns>True если можно удалять</returns>
		public virtual bool BeforeDelete(IUnitOfWork context) { return true; }
		/// <summary>
		/// Выполняется после удаления объекта
		/// </summary>
		/// <param name="context">Контекст</param>
		public virtual void AfterDelete(IUnitOfWork context) { }
	}
}

