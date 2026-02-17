# Warehouse Management System (WMS)

A modern, React-based Warehouse Management System for comprehensive inventory, product, and order management. Built with React 18, Redux, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (recommended)
- **npm** or **yarn** package manager

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The application will open at `http://localhost:3000` by default.

### Production Build

```bash
npm run build
```

If you're using payment functionality:

```bash
cd stripe-server
npm install
npm start
```

The Stripe server will run on a separate port (typically 3001 or as configured).

## 📋 What is it made from?

| Technology                | Purpose                                |
| ------------------------- | -------------------------------------- |
| **React 18**              | UI framework and components            |
| **Redux + Redux Persist** | State management and local persistence |
| **Tailwind CSS**          | Styling and responsive design          |
| **React Router v6**       | Client-side routing                    |
| **Stripe**                | Payment processing (optional)          |
| **Socket.io**             | Real-time communication                |
| **Axios**                 | HTTP client for API requests           |

## 🎯 Purpose

This Warehouse Management System provides a comprehensive solution for:

- **Product Management:** Manage products, categories, brands, colors, units of measurement
- **Inventory Operations:** Handle receipts, transfers, transactions, and stock costing
- **Order Management:** Sales orders, purchase orders, delivery orders, quotations
- **Administrative Functions:** User management, employee management, vendor management
- **Reporting & Analytics:** Dashboard with charts and inventory cost analysis
- **Location Management:** Multi-location warehouse support with location-based restrictions

### Target Users

Internal operations teams, inventory managers, warehouse supervisors, and administrators who need a unified platform to monitor and control warehouse operations.

## 📁 Project Structure

```
Warehouse Management System/
├── src/
│   ├── pages/
│   │   ├── Admin/                    # Admin dashboard entry point
│   │   └── Account/                  # Authentication pages (Login, Change Password)
│   ├── components/
│   │   └── Admin/                    # Feature modules
│   │       ├── Dashboard/            # Dashboard and analytics
│   │       ├── Products/             # Product management
│   │       ├── Inventory/            # Inventory management
│   │       ├── Categories/           # Product categories
│   │       ├── Brands/               # Brand management
│   │       ├── Colors/               # Color management
│   │       ├── Customers/            # Customer management
│   │       ├── Vendors/              # Supplier/vendor management
│   │       ├── Employees/            # Employee management
│   │       ├── Locations/            # Warehouse locations
│   │       ├── POS/                  # Point of sale
│   │       ├── Transactions/         # Transaction history
│   │       ├── Costing/              # Inventory costing
│   │       └── [Other modules]/      # Additional features
│   ├── redux/
│   │   ├── store.js                  # Redux store configuration
│   │   ├── IchthusSlice.js           # Redux slices and actions
│   │   └── AuthContext.js            # Authentication context
│   ├── UI/
│   │   └── common/                   # Shared UI components
│   ├── CustomHooks/                  # Custom React hooks
│   ├── security.jsx                  # Route protection and auth guards
│   ├── App.js                        # Main app component and routing
│   └── index.js                      # React entry point
├── public/                           # Static assets
├── build/                            # Production build output
├── stripe-server/                    # Payment processing server
├── tailwind.config.js                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
└── package.json                      # Dependencies and scripts
```

## 🔄 Application Flow

### Typical User Journey

1. **Initialization**
   - `index.js` mounts the React app with Redux store and routing
   - Redux Persist rehydrates app state from localStorage
   - Auth context loads user session if available

2. **Navigation**
   - `App.js` defines all routes and main layout
   - Protected routes use `security.jsx` guards to verify authentication
   - Navigation between admin modules and settings

3. **Data Operations**
   - Components call custom hooks (e.g., `useGetData.js`) to fetch data
   - Actions dispatch Redux actions via `IchthusSlice.js`
   - State updates trigger component re-renders

4. **Payment Processing** (if enabled)
   - Frontend triggers payment flows
   - Requests routed to `stripe-server` for secure processing
   - Results returned to frontend for UI updates

## 🔑 Key Features

### Core Modules

- **Dashboard** - Overview with charts and KPIs
- **Products** - Complete product lifecycle management
- **Inventory** - Stock tracking and adjustments
- **Orders** - Sales, purchase, delivery order management
- **Vendors & Customers** - Supplier and customer management
- **Employees** - Staff and role management
- **Locations** - Multi-warehouse support
- **Reports** - Costing and transaction history
- **POS** - Point of sale for retail operations
- **User Management** - Admin roles and permissions

### Technical Features

- ✅ Real-time data updates via Socket.io
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Local data persistence with Redux Persist
- ✅ Protected routes with authentication guards
- ✅ Advanced search and filtering
- ✅ Pagination for large datasets
- ✅ Multi-location warehouse support
- ✅ User role-based restrictions
- ✅ Inventory costing analysis
- ✅ Print-friendly reports

## 🛠️ Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3000

# Stripe (if using payments)
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key_here
```

### Stripe Server Configuration

Edit `stripe-server/` for payment processing:

- Configure Stripe API keys
- Set up webhook endpoints
- Handle payment status updates

## 📦 Dependencies

### Key Frontend Libraries

- `react` - UI framework
- `react-redux` - Redux bindings
- `@reduxjs/toolkit` - Redux state management
- `react-router-dom` - Client routing
- `tailwindcss` - Utility CSS framework
- `axios` - HTTP client
- `socket.io-client` - Real-time updates
- `react-hot-toast` - Notifications
- `recharts` - Charting library
- `date-fns` - Date utilities

See `package.json` for complete dependency list.

## 🚦 Available Scripts

```bash
# Start development server with hot reload
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App (one-way operation)
npm run eject
```

## 🔐 Security Considerations

- Sensitive data stored in environment variables, not in code
- Protected routes verified in `security.jsx`
- User authentication via Auth context
- Payment data handled by Stripe (never stored locally)
- Redux Persist stores non-sensitive UI state only

## 📊 Development Workflow

1. **Create Feature Branches**

   ```bash
   git checkout -b feature/module-name
   ```

2. **Add a New Admin Module**
   - Create folder under `src/components/Admin/ModuleName/`
   - Create module component and sub-components
   - Add Redux slice if state needed
   - Create route in `App.js`
   - Add navigation link

3. **Component Structure**
   - Module container component
   - Feature-specific sub-components
   - Module dialog/modal for CRUD operations
   - Custom hooks for data operations

4. **Testing**
   - Write tests in `src/` alongside components
   - Run with `npm test`
   - Aim for critical path coverage

## 🐛 Troubleshooting

### Port 3000 Already in Use

```bash
# Find and kill the process using port 3000
# Or use a different port:
PORT=3001 npm start
```

### Redux DevTools

Enable Redux DevTools browser extension to inspect state and actions in real-time.

### Clear Local Storage

Open browser DevTools → Application → Local Storage → Clear All

## 📈 Performance Tips

- Use code splitting for large modules
- Lazy load routes with `React.lazy()`
- Memoize expensive computations
- Debounce search and filter operations
- Use Redux selectors to prevent unnecessary re-renders

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Test thoroughly before submitting
4. Follow existing code style and patterns
5. Create a pull request with description

## 📝 Next Steps

- [ ] Add a `.env.example` with required environment variables
- [ ] Create API documentation for backend integration
- [ ] Add unit and integration tests for critical flows
- [ ] Document custom hooks and utilities
- [ ] Create component library documentation
- [ ] Add deployment guide (Docker, hosting platforms)
- [ ] Set up CI/CD pipeline
- [ ] Add error boundary components
- [ ] Implement logging and monitoring

## 📚 Additional Resources

- [React Documentation](https://react.dev)
- [Redux Documentation](https://redux.js.org)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Stripe Integration Guide](https://stripe.com/docs)
- [Create React App Docs](https://create-react-app.dev)

## 📄 License

ISC

---

**Last Updated:** December 2025  
**Created from:** Create React App + Tailwind CSS + Redux
