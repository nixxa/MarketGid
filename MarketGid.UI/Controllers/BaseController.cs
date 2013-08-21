using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using MarketGid.Core;

namespace MarketGid.UI.Controllers
{
	/// <summary>
	/// Базовый класс
	/// </summary>
    public abstract class BaseController : Controller
    {
		/// <summary>
		/// Initializes a new instance of the <see cref="MvcApplication1.Controllers.BaseController"/> class.
		/// </summary>
		/// <param name="factory">Factory.</param>
        public BaseController(IUnitOfWorkFactory factory)
		{
			Factory = factory;
		}

		protected readonly IUnitOfWorkFactory Factory;
    }
}
