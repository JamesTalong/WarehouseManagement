import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "../src/redux/store";
import SignIn from "./pages/Account/SignIn";

import Admin from "./pages/Admin/Admin";
import Dashboard from "./components/Admin/Dashboard/Dashboard";
import UsersComponent from "./components/Admin/User/Users"; // Renamed to avoid conflict with lucide-react
import Categories from "./components/Admin/Categories/Categories";
import AllCategoriesTwo from "./components/Admin/CategoriesTwo/CategoryModule/AllCategoriesTwo";
import CategoriesThree from "./components/Admin/CategoriesThree/CategoriesThree";
import CategoriesFour from "./components/Admin/CategoriesFour/CategoriesFour";
import CategoriesFive from "./components/Admin/CategoriesFive/CategoriesFive";
import Brands from "./components/Admin/Brands/Brands";
import ColorsComponent from "./components/Admin/Colors/Colors"; // Renamed to avoid conflict with chart.js
import Locations from "./components/Admin/Locations/Locations";
import Products from "./components/Admin/Products/Products";
import Pricelists from "./components/Admin/Pricelists/Pricelists";
import Batches from "./components/Admin/Batches/Batches";
import SerialNumbers from "./components/Admin/SerialNumbers/SerialNumbers";
import Customers from "./components/Admin/Customers/Customers";
import Inventory from "./components/Admin/Inventory/Inventory";
import Transactions from "./components/Admin/Transactions/Transactions";
import Pos from "./components/Admin/POS/Pos";
import InventoryStaging from "./components/Admin/InventoryStaging/InventoryStaging";
import UserRestriction from "./components/Admin/UserRestriction/UserRestriction";
import Transfer from "./components/Admin/Transfer/Transfer";
import TransferItems from "./components/Admin/TransferItems/TransferItems";
import InventoryCost from "./components/Admin/Costing/InventoryCost";
import HelpFAQ from "./components/Admin/Batches/HelpFAQ/HelpFAQ";
import UnitOfMeasurement from "./components/Admin/UnitOfMeasurement/UnitOfMeasurement";
import Vendors from "./components/Admin/Vendors/Vendors";
import PurchaseOrders from "./components/Admin/PurchaseOrder/PurchaseOrders";
import GoodsReceipts from "./components/Admin/GoodsReceipts/GoodsReceipts";
import UomConversion from "./components/Admin/UomConversion/UomConversion";
import Employees from "./components/Admin/Employees/Employees";
import ChangePassword from "./pages/Account/ChangePassword";
import InventoryStatus from "./components/Admin/InventoryStatuses/InventoryStatus";
import SellingPriceHistories from "./components/Admin/SellingPriceHistories/SellingPriceHistories";
import PurchasePriceHistories from "./components/Admin/PurchasePriceHistories/PurchasePriceHistories";
import SalesQuotations from "./components/Admin/SalesQuotations/SalesQuotations";
import SalesOrders from "./components/Admin/SalesOrders/SalesOrders";
import DeliveryOrders from "./components/Admin/DeliveryOrders/DeliveryOrders";
import InventoryOverride from "./components/Admin/InventoryOverride/InventoryOverride";
import Approvers from "./components/Admin/Approvers/Approvers";
import DeliveryReturns from "./components/Admin/DeliveryReturns/DeliveryReturns";

import WelcomingPage from "./components/Admin/WelcomingPage/WelcomingPage";
import TradeReturns from "./components/Admin/TradeReturns/TradeReturns";

const App = () => {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route>
        {/* Public Routes for Sign In/Sign Up */}

        <Route path="/signin" element={<SignIn />} />

        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/admin" element={<Admin />}>
          <Route index element={<Navigate to="WelcomingPage" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<UsersComponent />} />
          <Route path="employees" element={<Employees />} />
          <Route path="approvers" element={<Approvers />} />
          <Route path="InventoryStatus" element={<InventoryStatus />} />
          <Route path="SalesOrders" element={<SalesOrders />} />
          <Route
            path="SellingPriceHistories"
            element={<SellingPriceHistories />}
          />
          <Route
            path="PurchasePriceHistories"
            element={<PurchasePriceHistories />}
          />

          <Route path="WelcomingPage" element={<WelcomingPage />} />
          <Route path="TradeReturns" element={<TradeReturns />} />
          <Route path="DeliveryReturns" element={<DeliveryReturns />} />
          <Route path="InventoryOverride" element={<InventoryOverride />} />
          <Route path="DeliveryOrders" element={<DeliveryOrders />} />
          <Route path="SalesQuotations" element={<SalesQuotations />} />
          <Route path="UnitOfMeasurement" element={<UnitOfMeasurement />} />
          <Route path="UomConversion" element={<UomConversion />} />
          <Route path="PurchaseOrders" element={<PurchaseOrders />} />
          <Route path="GoodsReceipts" element={<GoodsReceipts />} />
          <Route path="categories" element={<Categories />} />
          <Route path="categories2" element={<AllCategoriesTwo />} />
          <Route path="categories3" element={<CategoriesThree />} />
          <Route path="categories4" element={<CategoriesFour />} />
          <Route path="categories5" element={<CategoriesFive />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="brands" element={<Brands />} />
          <Route path="colors" element={<ColorsComponent />} />
          <Route path="locations" element={<Locations />} />
          <Route path="product-list" element={<Products />} />
          <Route path="pricelists" element={<Pricelists />} />
          <Route path="batches" element={<Batches />} />
          <Route path="serial-numbers" element={<SerialNumbers />} />
          <Route path="customers" element={<Customers />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="pos" element={<Pos />} />
          <Route path="InventoryStaging" element={<InventoryStaging />} />
          <Route path="userRestriction" element={<UserRestriction />} />
          <Route path="transfer" element={<Transfer />} />
          <Route path="transferItems" element={<TransferItems />} />
          <Route path="InventoryCost" element={<InventoryCost />} />
          <Route path="help-faq" element={<HelpFAQ />} />
        </Route>

        {/* Redirect any other path to signin */}
        <Route path="*" element={<Navigate to="/signin" />} />
      </Route>,
    ),
  );

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ToastContainer position="top-right" autoClose={1000} />
        <RouterProvider router={router} />
      </PersistGate>
    </Provider>
  );
};

export default App;
