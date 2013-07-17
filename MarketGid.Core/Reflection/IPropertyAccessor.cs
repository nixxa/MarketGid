using System;

namespace MarketGid.Core.Reflection
{
	public interface IPropertyAccessor
	{
		object Get(object target);
		void Set(object target, object value);
	}
}

