using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Reflection;
using BLToolkit.Data;
using BLToolkit.Data.Linq;
using BLToolkit.DataAccess;
using MarketGid.Core.Reflection;

namespace MarketGid.Core
{
	public class UnitOfWork : IUnitOfWork
	{
		internal long InstanceCount = 0;
		internal bool Disposed = false;
		private IDbTransaction _transaction;
		private DbManager _dbManager;
		
		public UnitOfWork()
		{
			_dbManager = new DbManager();
		}
		
		#region IUnitOfWork Members
		
		public IQueryable<T> Query<T>() where T : class
		{
			return _dbManager.GetTable<T>();
		}

		public IUnitOfWork BeginTransaction(IsolationLevel level = IsolationLevel.ReadCommitted)
		{
			if (_transaction == null)
			{
				_dbManager.BeginTransaction(level);
				_transaction = _dbManager.Transaction;
			}
			return this;
		}
		
		public void Commit()
		{
			if (_transaction != null)
			{
				_dbManager.CommitTransaction();
				_transaction = null;
			}
		}
		
		public void Rollback()
		{
			if (_transaction != null)
			{
				_dbManager.RollbackTransaction();
				_transaction = null;
			}
		}
		
		public void Delete<TObject>(IEnumerable<TObject> objList) where TObject : class
		{
			bool canDelete = true;
			foreach (var obj in objList)
			{
				PersistenceAware aware = obj as PersistenceAware;
				if (aware != null) canDelete &= aware.BeforeDelete(this);
			}
			
			if (canDelete) _dbManager.Delete<TObject>(objList);
			
			foreach (var obj in objList)
			{
				PersistenceAware aware = obj as PersistenceAware;
				if (aware != null) aware.AfterDelete(this);
			}
		}
		
		public void Delete<TObject>(TObject obj) where TObject : class
		{
			bool canDelete = true;
			PersistenceAware aware = obj as PersistenceAware;
			if (aware != null) canDelete = aware.BeforeDelete(this);
			if (canDelete) _dbManager.Delete<TObject>(obj);
			if (aware != null) aware.AfterDelete(this);
		}
		
		public void SaveOrUpdate<T>(T obj) where T : class
		{
			var props = typeof(T).GetProperties();
			var primaryKeys = props.Where(p => p.CustomAttributes.Any(a => a.AttributeType == typeof(PrimaryKeyAttribute))).ToList();
			var identityFields = props.Where(p => p.CustomAttributes.Any(a => a.AttributeType == typeof(IdentityAttribute))).ToList();
			
			//Для таблиц состоящих только из первичного ключа
			if (props.Count() == primaryKeys.Count())
			{
				_dbManager.Insert(obj);
				return;
			}
			
			//Если нет identity полей
			if (!identityFields.Any())
			{
				_dbManager.InsertOrReplace(obj);
				return;
			}
			
			//Если есть identity поле
			var idProperty = identityFields.Single();
			var idPropertyAccessor = _typesCache.GetOrAdd(typeof (T), CreateAccessor(idProperty));
			
			object idValue = idPropertyAccessor.Get(obj);
			if ((idValue == null && GetDefault(idProperty.PropertyType) == null) || (idValue != null && idValue.Equals(GetDefault(idProperty.PropertyType))))
			{
				// значение свойства, отмеченного как PrimaryKey, Identity задано - используем InsertWithIdentity
				object identity = _dbManager.InsertWithIdentity(obj);
				idPropertyAccessor.Set(obj, typeof(System.Convert).GetMethod("To" + idProperty.PropertyType.Name, new[] { typeof(decimal) }).Invoke(null, new[] { identity }));
			}
			else
			{
				_dbManager.Update(obj);
			}
		}
		
		#endregion
		
		#region IDisposable Members
		
		public void Dispose()
		{
			InstanceCount -= 1;
			if (InstanceCount > 0)
				return;
			
			if (_transaction != null)
			{
				Rollback();
			}
			
			if (! Disposed)
			{				
				try
				{
					if (_dbManager != null)
					{
						_dbManager.Dispose();
					}
				}
				catch
				{
				}
				Disposed = true;
				_dbManager = null;
			}
		}
		
		#endregion
		
		#region Private members
		
		private static ConcurrentDictionary<Type, IPropertyAccessor> _typesCache = new ConcurrentDictionary<Type, IPropertyAccessor>();
		
		private object GetDefault(Type type)
		{
			if (type.IsValueType) return Activator.CreateInstance(type);
			return null;
		}
		
		private IPropertyAccessor CreateAccessor(PropertyInfo propertyInfo)
		{
			return (IPropertyAccessor) Activator.CreateInstance(
				typeof(DelegatePropertyAccessor<,>).MakeGenericType
				(propertyInfo.DeclaringType, propertyInfo.PropertyType), propertyInfo);
		}
		
		#endregion
	}
}
