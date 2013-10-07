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

		protected void Application_BeginRequest (object sender, EventArgs e)
		{
			string kioskId = Request.Params ["kiosk"];
			if (string.IsNullOrWhiteSpace (kioskId))
			{
				// в запросе идентификатора нет, ищем в куках
				HttpCookie cookie = Request.Cookies ["marketgid_kiosk_id"];
				if (cookie == null || string.IsNullOrWhiteSpace (cookie.Value))
				{
					// в куках тоже нет, берем первый попавшийся
					kioskId = "1";
				}
				else
				{
					kioskId = cookie.Value;
				}
			}

			Context.Items ["kioskId"] = kioskId;

			Response.Cookies ["marketgid_kiosk_id"].Value = kioskId;
			Response.Cookies ["marketgid_kiosk_id"].Expires = DateTime.UtcNow.AddYears (1);
		}
	}
}