using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http;
using System.Web.Mvc;
using System.Web.Routing;
using Autofac;
using Autofac.Configuration;
using Autofac.Integration.Mvc;
using MarketGid.Core;

namespace MarketGid.UI
{
	public class MvcApplication : System.Web.HttpApplication
	{
		protected void Application_Start()
		{
			// init DI container
			var builder = new ContainerBuilder();
			builder.RegisterModule(new ConfigurationSettingsReader());
			builder.RegisterModule(new CoreModule());
			builder.RegisterControllers(typeof(MvcApplication).Assembly).InstancePerHttpRequest().PropertiesAutowired();
			var container = builder.Build();
			DependencyResolver.SetResolver(new AutofacDependencyResolver(container));

			// init application
			AreaRegistration.RegisterAllAreas();

			FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
			RouteConfig.RegisterRoutes(RouteTable.Routes);
		}
	}
}