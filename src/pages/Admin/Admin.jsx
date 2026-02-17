import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  FaUser,
  FaSignOutAlt,
  FaAngleLeft,
  FaAngleRight,
  FaArchive,
  FaChartBar,
  FaCalculator,
  FaBoxOpen,
  FaUserFriends,
  FaAngleDown,
  FaMapMarkerAlt,
  FaTags,
  FaQuestionCircle,
  FaBars,
} from "react-icons/fa";
import logo from "../../Images/logo.png";
import profile from "../../Images/profile.jpg";
import { toast } from "react-toastify";
import { Navigate, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  REMOVE_ACTIVE_USER,
  selectFullName,
  selectImgUrl,
  selectRoleId,
  selectIsLoggedIn,
  selectLocationName,
} from "../../redux/IchthusSlice";
import Loader from "../../components/loader/Loader";
import { domain } from "../../security";
import FetchFailedHelp from "../../components/Admin/Batches/HelpFAQ/FetchFailedHelp";

const Admin = () => {
  // --- State ---
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1280);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [rolePermissions, setRolePermissions] = useState(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

  // --- Hooks ---
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // --- Redux Selectors ---
  const fullName = useSelector(selectFullName);
  const imgUrl = useSelector(selectImgUrl);
  const roleId = useSelector(selectRoleId);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const LocationName = useSelector(selectLocationName);

  // --- Menu Data (Wrapped in useMemo to fix ESLint dependency warning) ---
  const Menus = useMemo(
    () => [
      {
        title: "Dashboard",
        path: "dashboard",
        Icon: FaChartBar,
        permissionKey: "dashboard",
      },

      {
        title: "Product Setup",
        Icon: FaBoxOpen,
        permissionKey: "productSetup",
        dropdown: [
          {
            title: "Inventory Status",
            path: "InventoryStatus",
            permissionKey: "inventoryStatus",
          },
          {
            title: "Unit Of Measurement",
            path: "UnitOfMeasurement",
            permissionKey: "unitOfMeasurement",
          },
          // {
          //   title: "Uom Conversion",
          //   path: "UomConversion",
          //   permissionKey: "uomConversion",
          // },
          {
            title: "Categories",
            path: "categories",
            permissionKey: "categories",
          },
          {
            title: "Categories 2",
            path: "categories2",
            permissionKey: "categories2",
          },
          {
            title: "Categories 3",
            path: "categories3",
            permissionKey: "categories3",
          },
          {
            title: "Categories 4",
            path: "categories4",
            permissionKey: "categories4",
          },
          {
            title: "Categories 5",
            path: "categories5",
            permissionKey: "categories5",
          },
          { title: "Brands", path: "brands", permissionKey: "brands" },
        ],
      },
      {
        title: "Procurement",
        Icon: FaArchive,
        permissionKey: "procurement",
        dropdown: [
          {
            title: "Purchase Orders",
            path: "PurchaseOrders",
            permissionKey: "purchaseOrders",
          },
          {
            title: "Goods Receipts",
            path: "GoodsReceipts",
            permissionKey: "goodsReceipts",
          },
        ],
      },
      {
        title: "Sales",
        Icon: FaArchive,
        permissionKey: "sales",
        dropdown: [
          {
            title: "Sales Quotations",
            path: "SalesQuotations",
            permissionKey: "salesQuotations",
          },
          {
            title: "Sales Orders",
            path: "SalesOrders",
            permissionKey: "salesOrders",
          },
          {
            title: "Delivery Orders",
            path: "DeliveryOrders",
            permissionKey: "deliveryOrders",
          },
        ],
      },
      {
        title: "Returns",
        Icon: FaArchive,
        permissionKey: "returns",
        dropdown: [
          {
            title: "Delivery Returns",
            path: "DeliveryReturns",
            permissionKey: "deliveryReturns",
          },
          {
            title: "Trade Returns",
            path: "TradeReturns",
            permissionKey: "tradeReturns",
          },
        ],
      },
      {
        title: "Prices",
        Icon: FaArchive,
        permissionKey: "prices",
        dropdown: [
          {
            title: "Selling Price",
            path: "SellingPriceHistories",
            permissionKey: "sellingPriceHistories",
          },
          {
            title: "Purchase Price",
            path: "PurchasePriceHistories",
            permissionKey: "purchasePriceHistories",
          },
        ],
      },
      {
        title: "Inventory",
        Icon: FaArchive,
        permissionKey: "inventory",
        dropdown: [
          {
            title: "Inventory Dashboard",
            path: "inventory",
            permissionKey: "inventoryDashboard",
          },
          {
            title: "Item Details",
            path: "InventoryCost",
            permissionKey: "itemDetails",
          },
          {
            title: "Physical Inventory",
            path: "InventoryOverride",
            permissionKey: "physicalInventory",
          },
          {
            title: "Transfer",
            path: "transfer",
            permissionKey: "transferItems",
          },
        ],
      },
      {
        title: "Staff Access",
        Icon: FaUser,
        permissionKey: "staffAccess",
        dropdown: [
          { title: "Users", path: "users", permissionKey: "users" },
          {
            title: "Permissions",
            path: "userRestriction",
            permissionKey: "userRestriction",
          },
          { title: "Employees", path: "employees", permissionKey: "employees" },
          { title: "Approvers", path: "approvers", permissionKey: "approvers" },
        ],
      },

      {
        title: "Back Tracking",
        Icon: FaArchive,
        permissionKey: "backTracking",
        dropdown: [
          {
            title: "Stock Entry (Batches)",
            path: "batches",
            permissionKey: "batches",
          },
          {
            title: "Serial Numbers",
            path: "serial-numbers",
            permissionKey: "serialNumbers",
          },
        ],
      },
      {
        title: "Locations",
        path: "locations",
        Icon: FaMapMarkerAlt,
        permissionKey: "locations",
      },
      {
        title: "Products",
        path: "product-list",
        Icon: FaTags,
        permissionKey: "productList",
      },
      {
        title: "Customers",
        path: "customers",
        Icon: FaUserFriends,
        permissionKey: "customers",
      },
      {
        title: "Vendors",
        path: "vendors",
        Icon: FaUserFriends,
        permissionKey: "vendors",
      },
      {
        title: "Transactions",
        path: "transactions",
        Icon: FaChartBar,
        permissionKey: "transactions",
      },
      { title: "POS", path: "pos", Icon: FaCalculator, permissionKey: "pos" },
      { title: "Help & FAQ", path: "help-faq", Icon: FaQuestionCircle },
    ],
    [],
  );

  // --- Effects ---
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1280);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Updated Effect: Included 'Menus' in dependency array
  useEffect(() => {
    const activeMenu = Menus.find((menu) =>
      menu.dropdown?.some((subItem) =>
        location.pathname.includes(subItem.path),
      ),
    );
    if (activeMenu) {
      setOpenDropdown(activeMenu.title);
    }
  }, [location.pathname, Menus]);

  useEffect(() => {
    if (isLoggedIn && roleId) {
      const fetchPermissions = async () => {
        setLoadingPermissions(true);
        setFetchFailed(false);
        try {
          const response = await axios.get(`${domain}/api/JobRole/${roleId}`);
          setRolePermissions(response.data);
        } catch (error) {
          console.error("Failed to fetch permissions", error);
          toast.error("Connection Error: Could not fetch permissions.");
          setRolePermissions(null);
          setFetchFailed(true);
        } finally {
          setLoadingPermissions(false);
        }
      };
      fetchPermissions();
    } else if (!isLoggedIn) {
      setRolePermissions(null);
      setLoadingPermissions(false);
    }
  }, [roleId, isLoggedIn]);

  if (!isLoggedIn) return <Navigate to="/signin" />;

  // --- Helpers ---
  const isSidebarExpanded = (isDesktop && open) || mobileOpen;

  const logoutUser = () => {
    toast.success("Logout Successful.");
    dispatch(REMOVE_ACTIVE_USER());
    setRolePermissions(null);
    navigate("/signin");
  };

  const handleMenuClick = (menu) => {
    if (menu.path) {
      navigate(`/admin/${menu.path}`);
      setOpenDropdown(null);
      if (!isDesktop) setMobileOpen(false);
    } else if (menu.dropdown) {
      setOpenDropdown(openDropdown === menu.title ? null : menu.title);
    }
  };

  const canDisplayMenu = (menu) => {
    if (!rolePermissions) return false;
    if (!menu.permissionKey && !menu.dropdown) return true;
    if (menu.dropdown) {
      return menu.dropdown.some((subItem) =>
        subItem.permissionKey
          ? rolePermissions[subItem.permissionKey] === true
          : true,
      );
    }
    return rolePermissions[menu.permissionKey] === true;
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans">
      {/* Mobile Overlay */}
      {mobileOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen bg-slate-900 text-slate-300 shadow-xl transition-all duration-300 ease-in-out flex flex-col
          ${
            isDesktop
              ? open
                ? "w-72"
                : "w-20"
              : mobileOpen
                ? "w-72 translate-x-0"
                : "w-72 -translate-x-full"
          }`}
      >
        {/* Toggle Button (Desktop Only) */}
        {isDesktop && (
          <button
            className="absolute top-8 -right-3 w-7 h-7 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md z-50 transition-transform"
            onClick={() => setOpen(!open)}
          >
            {open ? <FaAngleLeft size={14} /> : <FaAngleRight size={14} />}
          </button>
        )}

        {/* Logo Section */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50">
          <img
            src={logo}
            alt="logo"
            className={`w-8 h-8 object-contain transition-all duration-500 ${
              isSidebarExpanded ? "rotate-0" : "rotate-[360deg]"
            }`}
          />
          {isSidebarExpanded && (
            <h1 className="text-white font-bold text-lg tracking-wide whitespace-nowrap transition-opacity duration-300">
              POINT 7VEN
            </h1>
          )}
        </div>

        {/* User Profile Snippet */}
        <div
          className={`flex items-center transition-all duration-300 border-b border-slate-700/50 bg-slate-800/30 overflow-hidden
            ${isSidebarExpanded ? "px-4 py-3 gap-3" : "justify-center py-4"}
          `}
        >
          {loadingPermissions ? (
            <Loader size={16} color="white" />
          ) : (
            <>
              <img
                src={imgUrl || profile}
                alt="Profile"
                className={`rounded-full border border-slate-500 object-cover shrink-0 transition-all duration-300 ${
                  isSidebarExpanded ? "w-9 h-9" : "w-8 h-8"
                }`}
              />

              {/* Text fades in/out and is aligned left next to image */}
              <div
                className={`flex flex-col justify-center transition-all duration-300 ${
                  isSidebarExpanded
                    ? "opacity-100 w-auto"
                    : "opacity-0 w-0 hidden"
                }`}
              >
                <p className="text-sm font-semibold text-white leading-none whitespace-nowrap">
                  {fullName || "User"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 leading-none whitespace-nowrap">
                  {LocationName}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-grow overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {Menus.filter(canDisplayMenu).map((menu, index) => {
            const isActive = location.pathname.includes(menu.path);
            const isDropdownOpen = openDropdown === menu.title;

            return (
              <div key={index} className="mb-1">
                {/* Purple Parent when Open Logic */}
                <div
                  onClick={() => handleMenuClick(menu)}
                  className={`
                    group flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200
                    ${
                      isDropdownOpen
                        ? "bg-indigo-600 text-white shadow-md"
                        : isActive && !menu.dropdown
                          ? "bg-indigo-600 text-white shadow-md"
                          : "hover:bg-slate-800 hover:text-white"
                    }
                  `}
                >
                  <div className="min-w-[20px] text-lg">
                    <menu.Icon />
                  </div>

                  {isSidebarExpanded && (
                    <div className="flex justify-between items-center w-full overflow-hidden">
                      <span className="text-sm font-medium whitespace-nowrap">
                        {menu.title}
                      </span>
                      {menu.dropdown && (
                        <span
                          className={`transition-transform duration-200 ${
                            isDropdownOpen ? "rotate-180" : ""
                          }`}
                        >
                          <FaAngleDown size={12} />
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Dropdown Items */}
                {menu.dropdown && isDropdownOpen && isSidebarExpanded && (
                  // Vertical Line
                  <div className="ml-4 mt-2 pl-2 border-l-2 border-slate-700 space-y-1">
                    {menu.dropdown
                      .filter(
                        (sub) =>
                          !sub.permissionKey ||
                          rolePermissions?.[sub.permissionKey] === true,
                      )
                      .map((subItem, subIndex) => (
                        <div
                          key={subIndex}
                          onClick={() => handleMenuClick(subItem)}
                          className={`
                            text-sm px-3 py-2 cursor-pointer rounded-md transition-colors duration-200 flex items-center gap-2
                            ${
                              // Dark Box for Active Child Logic
                              location.pathname.includes(subItem.path)
                                ? "bg-slate-800 text-white shadow-inner font-medium"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            }
                          `}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                          {subItem.title}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900">
          <div
            onClick={logoutUser}
            className={`
              flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors duration-200 text-red-400 hover:bg-red-500/10 hover:text-red-300
              ${!isSidebarExpanded && "justify-center"}
            `}
          >
            <FaSignOutAlt size={18} />
            {isSidebarExpanded && (
              <span className="text-sm font-medium">Sign Out</span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main
        className="flex-grow p-6 h-full overflow-y-auto w-full transition-all duration-300 ease-in-out  relative"
        style={{ marginLeft: isDesktop ? (open ? "18rem" : "5rem") : "0" }}
      >
        {/* Sticky Mobile Header */}
        {!isDesktop && (
          <div className="sticky top-0 z-30 flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-md border border-gray-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                className="text-slate-600 hover:text-indigo-600"
              >
                <FaBars size={24} />
              </button>
              <h2 className="font-semibold text-slate-700">Menu</h2>
            </div>
            <img src={logo} alt="logo" className="w-8 h-8" />
          </div>
        )}

        {/* Content Render */}
        <div className="max-w-7xl mx-auto min-h-full pb-10">
          {fetchFailed ? (
            <FetchFailedHelp />
          ) : loadingPermissions ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 mt-20">
              <Loader />
              <p className="mt-4 text-sm animate-pulse">
                Loading access rights...
              </p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

export default Admin;
