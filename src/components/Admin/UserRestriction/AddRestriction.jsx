import React, { useEffect, useState, useMemo } from "react";
import { FaTimes, FaShieldAlt, FaSearch, FaCheck } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import { domain } from "../../../security";

const MenuStructure = [
  {
    category: "General",
    permissions: [
      { title: "Dashboard", permissionKey: "dashboard" },
      { title: "Help & FAQ", permissionKey: "helpFaq" },
    ],
  },
  {
    category: "Product Setup",
    permissions: [
      { title: "Product Setup Access", permissionKey: "productSetup" },
      { title: "Inventory Status", permissionKey: "inventoryStatus" },
      { title: "Unit Of Measurement", permissionKey: "unitOfMeasurement" },
      // { title: "Uom Conversion", permissionKey: "uomConversion" },
      { title: "Categories", permissionKey: "categories" },
      { title: "Categories 2", permissionKey: "categories2" },
      { title: "Categories 3", permissionKey: "categories3" },
      { title: "Categories 4", permissionKey: "categories4" },
      { title: "Categories 5", permissionKey: "categories5" },
      { title: "Brands", permissionKey: "brands" },
      { title: "Pricelists", permissionKey: "pricelists" },
    ],
  },
  {
    category: "Procurement",
    permissions: [
      { title: "Procurement Access", permissionKey: "procurement" },
      { title: "Purchase Orders", permissionKey: "purchaseOrders" },
      { title: "Goods Receipts", permissionKey: "goodsReceipts" },
    ],
  },
  {
    category: "Sales",
    permissions: [
      { title: "Sales Access", permissionKey: "sales" },
      { title: "Sales Quotations", permissionKey: "salesQuotations" },
      { title: "Sales Orders", permissionKey: "salesOrders" },
      { title: "Delivery Orders", permissionKey: "deliveryOrders" },
    ],
  },
  {
    category: "Returns",
    permissions: [
      { title: "Returns Access", permissionKey: "returns" },
      { title: "Delivery Returns", permissionKey: "deliveryReturns" },
      { title: "Trade Returns", permissionKey: "tradeReturns" },
    ],
  },
  {
    category: "Prices",
    permissions: [
      { title: "Prices Access", permissionKey: "prices" },
      {
        title: "Selling Price Histories",
        permissionKey: "sellingPriceHistories",
      },
      {
        title: "Purchase Price Histories",
        permissionKey: "purchasePriceHistories",
      },
    ],
  },
  {
    category: "Inventory",
    permissions: [
      { title: "Inventory Access", permissionKey: "inventory" },
      { title: "Inventory Dashboard", permissionKey: "inventoryDashboard" },
      { title: "Item Details", permissionKey: "itemDetails" },
      { title: "Physical Inventory", permissionKey: "physicalInventory" },
      { title: "Transfer Items", permissionKey: "transferItems" },
    ],
  },
  {
    category: "Staff Access",
    permissions: [
      { title: "Staff Access Control", permissionKey: "staffAccess" },
      { title: "Users", permissionKey: "users" },
      { title: "User Restrictions", permissionKey: "userRestriction" },
      { title: "Employees", permissionKey: "employees" },
      { title: "Approvers", permissionKey: "approvers" },
    ],
  },
  {
    category: "Back Tracking",
    permissions: [
      { title: "Back Tracking Access", permissionKey: "backTracking" },
      { title: "Stock Entry (Batches)", permissionKey: "batches" },
      { title: "Serial Numbers", permissionKey: "serialNumbers" },
    ],
  },
  {
    category: "Others",
    permissions: [
      { title: "Locations", permissionKey: "locations" },
      { title: "Products", permissionKey: "productList" },
      { title: "Customers", permissionKey: "customers" },
      { title: "Vendors", permissionKey: "vendors" },
      { title: "Transactions", permissionKey: "transactions" },
      { title: "POS", permissionKey: "pos" },
    ],
  },
];

const flattenMenus = (structure) =>
  structure.flatMap((group) => group.permissions);
const rows = flattenMenus(MenuStructure);

const AddRestriction = ({ isOpen, setIsOpen, refreshData, jobRoleToEdit }) => {
  const [roleName, setRoleName] = useState("");
  const [permissions, setPermissions] = useState({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (jobRoleToEdit) {
      setRoleName(jobRoleToEdit.roleName || "");
      const updatedPerms = {};
      rows.forEach((item) => {
        updatedPerms[item.permissionKey] =
          jobRoleToEdit[item.permissionKey] || false;
      });
      setPermissions(updatedPerms);
    } else {
      setRoleName("");
      setPermissions({});
    }
  }, [jobRoleToEdit, isOpen]);

  // Search Logic
  const filteredMenu = useMemo(() => {
    if (!searchQuery) return MenuStructure;
    return MenuStructure.map((group) => ({
      ...group,
      permissions: group.permissions.filter((p) =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    })).filter((group) => group.permissions.length > 0);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleCheckboxChange = (permissionKey) => {
    setPermissions((prev) => ({
      ...prev,
      [permissionKey]: !prev[permissionKey],
    }));
  };

  const handleCategoryToggle = (category) => {
    const categoryPermissions =
      MenuStructure.find((item) => item.category === category)?.permissions ||
      [];
    const allChecked = categoryPermissions.every(
      (perm) => permissions[perm.permissionKey],
    );
    const updated = { ...permissions };
    categoryPermissions.forEach((perm) => {
      updated[perm.permissionKey] = !allChecked;
    });
    setPermissions(updated);
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.warning("Please enter a role name");
      return;
    }
    const payload = {
      roleName,
      ...rows.reduce((acc, item) => {
        acc[item.permissionKey] = !!permissions[item.permissionKey];
        return acc;
      }, {}),
    };

    const url = jobRoleToEdit
      ? `${domain}/api/JobRole/${jobRoleToEdit.id}`
      : `${domain}/api/JobRole`;
    try {
      if (jobRoleToEdit) {
        await axios.put(url, payload);
        toast.success("Permissions updated");
      } else {
        await axios.post(url, payload);
        toast.success("Role created");
      }
      setIsOpen(false);
      refreshData?.();
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-hidden">
      {/* Container widened to 7xl (1280px) */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl flex flex-col max-h-[92vh] border border-slate-200 animate-in fade-in zoom-in duration-200">
        {/* Sticky Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <FaShieldAlt size={20} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {jobRoleToEdit
                  ? "Modify Security Role"
                  : "New Access Control Role"}
              </h2>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">
                Permissions Management
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-full transition-all text-slate-400"
          >
            <FaTimes size={22} />
          </button>
        </div>

        {/* Scrollable Content Section */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Top Info Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
            <div className="lg:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                Role Designation
              </label>
              <input
                type="text"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Senior Warehouse Supervisor"
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white transition-all outline-none text-slate-700 text-lg font-medium"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                Search Permissions
              </label>
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter by name..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-slate-700"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Permissions Grid - Responsive 1 to 4 columns */}
          <div>
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Module-Level Controls
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-normal">
                  {Object.values(permissions).filter(Boolean).length} Active
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredMenu.map((group, groupIdx) => {
                const categoryPerms = group.permissions;
                const activeCount = categoryPerms.filter(
                  (p) => permissions[p.permissionKey],
                ).length;
                const isAllSelected =
                  activeCount === categoryPerms.length &&
                  categoryPerms.length > 0;

                return (
                  <div
                    key={groupIdx}
                    className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
                  >
                    {/* Category Header */}
                    <label className="flex items-center gap-3 p-4 bg-slate-50/50 border-b border-slate-100 rounded-t-2xl cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => handleCategoryToggle(group.category)}
                        className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
                      />
                      <span className="font-bold text-slate-700 flex-grow truncate">
                        {group.category}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          activeCount > 0
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        {activeCount}
                      </span>
                    </label>

                    {/* Permissions List */}
                    <div className="p-3 space-y-1">
                      {categoryPerms.map((permission) => (
                        <label
                          key={permission.permissionKey}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group/item"
                        >
                          <input
                            type="checkbox"
                            checked={!!permissions[permission.permissionKey]}
                            onChange={() =>
                              handleCheckboxChange(permission.permissionKey)
                            }
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                          />
                          <span className="text-sm text-slate-600 group-hover/item:text-slate-900 truncate">
                            {permission.title}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500 italic">
            Changes will be applied immediately to all users in this role.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 sm:flex-none px-8 py-3 text-slate-600 font-bold hover:bg-slate-200/50 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 sm:flex-none px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <FaCheck />
              {jobRoleToEdit ? "Save Updates" : "Confirm & Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRestriction;
