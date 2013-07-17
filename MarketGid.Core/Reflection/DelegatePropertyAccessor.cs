using System;
using System.Reflection;

namespace MarketGid.Core.Reflection
{
	public class DelegatePropertyAccessor<TObjectType, TPropertyType> : IPropertyAccessor
	{
		private PropertyInfo _propertyInfo;
		private System.Func<TObjectType, TPropertyType> _getMethod;
		private System.Action<TObjectType, TPropertyType> _setMethod;
		
		public DelegatePropertyAccessor(PropertyInfo propertyInfo)
		{
			_propertyInfo = propertyInfo;
			Type targetType = typeof(TObjectType);
			MethodInfo method = propertyInfo.GetGetMethod(true);
			if (method != null)
				_getMethod = (System.Func<TObjectType, TPropertyType>)Delegate.CreateDelegate(typeof(System.Func<TObjectType, TPropertyType>), method);
			method = propertyInfo.GetSetMethod(true);
			if (method != null)
				_setMethod = (System.Action<TObjectType, TPropertyType>)Delegate.CreateDelegate(typeof(System.Action<TObjectType, TPropertyType>), method);
		}
		
		public object Get(object target)
		{
			if (target == null) throw new InvalidOperationException("Target for property '" + _propertyInfo.Name + "' is NULL");
			if (_getMethod == null) throw new InvalidOperationException("Property '" + _propertyInfo.Name + "' has no getter");
			return _getMethod((TObjectType)target);
		}
		
		public void Set(object target, object value)
		{
			if (target == null) throw new InvalidOperationException("Target for property '" + _propertyInfo.Name + "' is NULL");
			if (_setMethod == null) throw new InvalidOperationException("Property '" + _propertyInfo.Name + "' has no setter");
			_setMethod((TObjectType)target, (TPropertyType)value);
		}
	}
}

