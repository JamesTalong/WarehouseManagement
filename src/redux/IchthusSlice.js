import { createSlice } from "@reduxjs/toolkit";
import { toast } from "react-toastify";

const initialState = {
  // Auth state
  isLoggedIn: false,
  userID: null,
  userName: null,
  employeeId: null,
  firstName: null,
  lastName: null,
  middleName: null,
  imgUrl: null,
  admin: false,
  roleName: null,
  roleId: null,
  locationId: null,
  locationName: null,

  // Other application state
  posProducts: [],
  checkedBrands: [],
  checkedCategories: [],
  checkedCategoriesTwo: [],
  checkedCategoriesThree: [],
  checkedCategoriesFour: [],
  checkedCategoriesFive: [],
  lastModifiedProduct: null,
  lastModifiedProducts: [],
  selectedCustomer: null,
  refreshProducts: false,
  existingLocation: null,
};

// HELPER: Calculate total quantity currently in cart for a specific product ID (in Base Units)
const calculateTotalBaseUsage = (cartItems, productId) => {
  return cartItems
    .filter((item) => item.productId === productId)
    .reduce((total, item) => {
      const rate = item.conversionRate || 1;
      return total + item.quantity * rate;
    }, 0);
};

export const IchthusSlice = createSlice({
  name: "Ichthus",
  initialState,
  reducers: {
    // --- AUTH REDUCERS (Unchanged) ---
    SET_ACTIVE_USER: (state, action) => {
      const {
        userID,
        userName,
        employeeId,
        imgUrl,
        admin,
        roleName,
        roleId,
        firstName,
        lastName,
        middleName,
        locationId,
        locationName,
      } = action.payload;

      state.isLoggedIn = true;
      state.userID = userID;
      state.userName = userName;
      state.employeeId = employeeId;
      state.imgUrl = imgUrl;
      state.admin = admin;
      state.roleName = roleName;
      state.roleId = roleId;
      state.firstName = firstName;
      state.lastName = lastName;
      state.middleName = middleName;
      state.locationId = locationId;
      state.locationName = locationName;
    },

    REMOVE_ACTIVE_USER: (state) => {
      state.isLoggedIn = false;
      state.userID = null;
      state.userName = null;
      state.employeeId = null;
      state.imgUrl = null;
      state.admin = false;
      state.roleName = null;
      state.roleId = null;
      state.firstName = null;
      state.lastName = null;
      state.middleName = null;
      state.locationId = null;
      state.locationName = null;
      state.posProducts = [];
      state.lastModifiedProducts = [];
      state.selectedCustomer = null;
    },

    // --- POS REDUCERS (UPDATED STOCK LOGIC) ---
    addToPos: (state, action) => {
      const incoming = action.payload;
      const incomingRate = incoming.conversionRate || 1;
      const incomingBaseQty = (incoming.quantity || 1) * incomingRate;

      // Calculate max stock in Base Units (e.g., if max is 3 boxes of 10, total is 30)
      const maxBaseStock = incoming.maxQuantity * incomingRate;

      // Calculate what is already in the cart for this Product ID (across all units)
      const currentBaseUsage = calculateTotalBaseUsage(
        state.posProducts,
        incoming.productId
      );

      if ((incoming.quantity || 1) < 1) {
        toast.error("Quantity must be at least 1.");
        return;
      }

      // Check if adding this will exceed total physical stock
      if (currentBaseUsage + incomingBaseQty > maxBaseStock) {
        toast.error(
          `Insufficient stock! You have ${
            maxBaseStock - currentBaseUsage
          } base units remaining.`
        );
        return;
      }

      const itemIndex = state.posProducts.findIndex(
        (item) => item.id === incoming.id
      );

      if (itemIndex >= 0) {
        state.posProducts[itemIndex].quantity += incoming.quantity || 1;
      } else {
        state.posProducts.push({
          ...incoming,
          quantity: incoming.quantity || 1,
        });
      }

      // Update Last Modified Logic
      const existingLastModified = state.lastModifiedProducts.find(
        (p) => p.id === incoming.id
      );

      // Get the updated quantity of the specific line item
      const updatedItemQty =
        itemIndex >= 0
          ? state.posProducts[itemIndex].quantity
          : incoming.quantity || 1;

      if (existingLastModified) {
        existingLastModified.quantity = updatedItemQty;
      } else {
        state.lastModifiedProducts.push({
          id: incoming.id,
          quantity: updatedItemQty,
        });
      }

      state.lastModifiedProduct = {
        id: incoming.id,
        quantity: updatedItemQty,
      };

      toast.success("Product added to POS");
    },

    setExistingLocation: (state, action) => {
      state.existingLocation = action.payload;
    },

    increasePosQuantity: (state, action) => {
      const item = state.posProducts.find(
        (item) => item.id === action.payload.id
      );

      if (item) {
        const rate = item.conversionRate || 1;
        const oneUnitInBase = 1 * rate;

        // Max stock available in base units
        const maxBaseStock = item.maxQuantity * rate;

        // Current usage across all variants of this product
        const currentBaseUsage = calculateTotalBaseUsage(
          state.posProducts,
          item.productId
        );

        if (currentBaseUsage + oneUnitInBase > maxBaseStock) {
          toast.error(
            `Cannot increase quantity. Exceeds total available stock.`
          );
          return;
        }

        item.quantity++;

        // Update Last Modified
        const existingLastModified = state.lastModifiedProducts.find(
          (p) => p.id === item.id
        );
        if (existingLastModified) {
          existingLastModified.quantity = item.quantity;
        } else {
          state.lastModifiedProducts.push({
            id: item.id,
            quantity: item.quantity,
          });
        }
        state.lastModifiedProduct = { id: item.id, quantity: item.quantity };
      }
    },

    decreasePosQuantity: (state, action) => {
      const item = state.posProducts.find(
        (item) => item.id === action.payload.id
      );
      if (item && item.quantity > 1) {
        item.quantity--;

        const existingLastModified = state.lastModifiedProducts.find(
          (p) => p.id === item.id
        );
        if (existingLastModified) {
          existingLastModified.quantity = item.quantity;
        } else {
          state.lastModifiedProducts.push({
            id: item.id,
            quantity: item.quantity,
          });
        }
        state.lastModifiedProduct = { id: item.id, quantity: item.quantity };
      }
    },

    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const product = state.posProducts.find((item) => item.id === id);

      if (product) {
        if (quantity < 1) {
          toast.error("Quantity must be at least 1.");
          return;
        }

        const rate = product.conversionRate || 1;
        const maxBaseStock = product.maxQuantity * rate;

        // Calculate usage of OTHER items of same product ID (excluding this one being updated)
        const otherVariantsUsage = state.posProducts
          .filter((p) => p.productId === product.productId && p.id !== id)
          .reduce((sum, p) => sum + p.quantity * (p.conversionRate || 1), 0);

        const newProposedUsage = quantity * rate;

        if (otherVariantsUsage + newProposedUsage > maxBaseStock) {
          toast.error(`Total quantity exceeds available stock.`);
          return;
        }

        product.quantity = quantity;

        const existingLastModified = state.lastModifiedProducts.find(
          (p) => p.id === id
        );
        if (existingLastModified) {
          existingLastModified.quantity = product.quantity;
        } else {
          state.lastModifiedProducts.push({ id, quantity: product.quantity });
        }
        state.lastModifiedProduct = { id, quantity: product.quantity };
      }
    },

    updateDiscount: (state, action) => {
      const { id, discount } = action.payload;
      const product = state.posProducts.find((item) => item.id === id);
      if (product) {
        const maxDiscount = product.quantity * product.price;
        product.discount = Math.max(0, Math.min(discount, maxDiscount));
      }
    },

    deleteItemPos: (state, action) => {
      const deletedProduct = state.posProducts.find(
        (item) => item.id === action.payload
      );

      state.posProducts = state.posProducts.filter(
        (item) => item.id !== action.payload
      );

      if (deletedProduct) {
        state.lastModifiedProducts = state.lastModifiedProducts.filter(
          (item) => item.id !== deletedProduct.id
        );

        const newLastModifiedProduct = {
          id: deletedProduct.id,
          quantity: 0,
        };
        state.lastModifiedProduct = newLastModifiedProduct;
        state.lastModifiedProducts.push(newLastModifiedProduct);
      }
      toast.error("Product removed from POS");
    },
    // ... rest of filters (toggleBrand, toggleCategory, etc) remain unchanged
    toggleBrand: (state, action) => {
      const brand = action.payload;
      const isBrandChecked = state.checkedBrands.some((b) => b.id === brand.id);
      if (isBrandChecked) {
        state.checkedBrands = state.checkedBrands.filter(
          (b) => b.id !== brand.id
        );
      } else {
        state.checkedBrands.push(brand);
      }
    },
    toggleCategory: (state, action) => {
      const category = action.payload;
      const isCategoryChecked = state.checkedCategories.some(
        (b) => b.id === category.id
      );
      if (isCategoryChecked) {
        state.checkedCategories = state.checkedCategories.filter(
          (b) => b.id !== category.id
        );
      } else {
        state.checkedCategories.push(category);
      }
    },
    toggleCategoryTwo: (state, action) => {
      const category = action.payload;
      const isChecked = state.checkedCategoriesTwo.some(
        (b) => b.id === category.id
      );
      if (isChecked)
        state.checkedCategoriesTwo = state.checkedCategoriesTwo.filter(
          (b) => b.id !== category.id
        );
      else state.checkedCategoriesTwo.push(category);
    },
    toggleCategoryThree: (state, action) => {
      const category = action.payload;
      const isChecked = state.checkedCategoriesThree.some(
        (b) => b.id === category.id
      );
      if (isChecked)
        state.checkedCategoriesThree = state.checkedCategoriesThree.filter(
          (b) => b.id !== category.id
        );
      else state.checkedCategoriesThree.push(category);
    },
    toggleCategoryFour: (state, action) => {
      const category = action.payload;
      const isChecked = state.checkedCategoriesFour.some(
        (b) => b.id === category.id
      );
      if (isChecked)
        state.checkedCategoriesFour = state.checkedCategoriesFour.filter(
          (b) => b.id !== category.id
        );
      else state.checkedCategoriesFour.push(category);
    },
    toggleCategoryFive: (state, action) => {
      const category = action.payload;
      const isChecked = state.checkedCategoriesFive.some(
        (b) => b.id === category.id
      );
      if (isChecked)
        state.checkedCategoriesFive = state.checkedCategoriesFive.filter(
          (b) => b.id !== category.id
        );
      else state.checkedCategoriesFive.push(category);
    },
    resetPos: (state) => {
      state.posProducts = [];
      state.lastModifiedProduct = null;
      state.lastModifiedProducts = [];
      toast.info("POS has been reset");
    },
    setSelectedCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    triggerRefresh: (state) => {
      state.refreshProducts = !state.refreshProducts;
    },
  },
});

export const {
  SET_ACTIVE_USER,
  REMOVE_ACTIVE_USER,
  addToPos,
  resetPos,
  increasePosQuantity,
  decreasePosQuantity,
  deleteItemPos,
  toggleBrand,
  toggleCategory,
  toggleCategoryTwo,
  toggleCategoryThree,
  toggleCategoryFour,
  toggleCategoryFive,
  updateDiscount,
  updateQuantity,
  setSelectedCustomer,
  clearSelectedCustomer,
  triggerRefresh,
  setExistingLocation,
} = IchthusSlice.actions;

// Selectors
export const selectIsLoggedIn = (state) => state.orebiReducer.isLoggedIn;
export const selectUserID = (state) => state.orebiReducer.userID;
export const selectUserName = (state) => state.orebiReducer.userName;
export const selectEmployeeId = (state) => state.orebiReducer.employeeId;
export const selectImgUrl = (state) => state.orebiReducer.imgUrl;
export const selectAdmin = (state) => state.orebiReducer.admin;
export const selectRoleName = (state) => state.orebiReducer.roleName;
export const selectRoleId = (state) => state.orebiReducer.roleId;
export const selectFirstName = (state) => state.orebiReducer.firstName;
export const selectLastName = (state) => state.orebiReducer.lastName;
export const selectFullName = (state) =>
  `${state.orebiReducer.firstName || ""} ${
    state.orebiReducer.lastName || ""
  }`.trim();
export const selectLocationId = (state) => state.orebiReducer.locationId;
export const selectLocationName = (state) => state.orebiReducer.locationName;
export const selectPosProducts = (state) => state.orebiReducer.posProducts;
export const selectLastModifiedProduct = (state) =>
  state.orebiReducer.lastModifiedProduct;
export const selectLastModifiedProducts = (state) =>
  state.orebiReducer.lastModifiedProducts;
export const selectSelectedCustomer = (state) =>
  state.orebiReducer.selectedCustomer;

export default IchthusSlice.reducer;
