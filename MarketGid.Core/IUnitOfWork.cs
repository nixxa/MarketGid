using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;

namespace MarketGid.Core
{
	/// <summary>
	/// Интерфейс для шаблона UnitOfWork
	/// </summary>
	public interface IUnitOfWork : IDisposable
	{
		/// <summary>
		/// Формирует запрос
		/// </summary>
		/// <typeparam name="T"></typeparam>
		/// <returns></returns>
		IQueryable<T> Query<T>() where T : class;
		/// <summary>
		/// Стартует транзакцию
		/// </summary>
		/// <param name="level"></param>
		/// <returns></returns>
		IUnitOfWork BeginTransaction(IsolationLevel level = IsolationLevel.ReadCommitted);
		/// <summary>
		/// Фиксирует транзакцию
		/// </summary>
		void Commit();
		/// <summary>
		/// Отменяет транзакцию
		/// </summary>
		void Rollback();
		/// <summary>
		/// Обновляет или добавляет объект
		/// </summary>
		/// <typeparam name="T"></typeparam>
		/// <param name="model"></param>
		void SaveOrUpdate<T>(T model) where T : class;
		/// <summary>
		/// Удаляет объекты
		/// </summary>
		/// <typeparam name="TObject"></typeparam>
		/// <param name="objList"></param>
		void Delete<TObject>(IEnumerable<TObject> objList) where TObject : class;
		/// <summary>
		/// Удаляет один объект
		/// </summary>
		/// <typeparam name="TObject"></typeparam>
		/// <param name="obj"></param>
		void Delete<TObject>(TObject obj) where TObject : class;
	}
}
