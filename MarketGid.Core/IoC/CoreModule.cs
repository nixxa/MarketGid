using System;
using Autofac;

namespace MarketGid.Core
{
	public class CoreModule : Module
	{
		protected override void Load (ContainerBuilder builder)
		{
			base.Load (builder);

			builder.RegisterType<FileUnitOfWorkFactory> ().As<IUnitOfWorkFactory> ();
		}
	}
}

