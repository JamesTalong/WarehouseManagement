import React, { useEffect, useState } from "react";
import FAQItem from "./FAQItem";

// --- DATA FOR THE FAQ ---
const faqData = [
  {
    icon: "📊",
    title: "Dashboard",
    question: "What is this page for?",
    answer:
      "This is the main summary page. It shows key reports, sales charts, and other important real-time activities from your Point of Sale (POS).",
    id: "dashboard",
  },
  {
    icon: "👥",
    title: "Staff Access: Users",
    question: "Who are these users? Can I see my customers here?",
    answer:
      "No, this section is only for your staff (employees, admins) who need to log in to the system. You can add new staff, remove old ones, and manage their login details here.",
    id: "staff-users",
  },
  {
    icon: "🔒",
    title: "Staff Access: User Permissions",
    question: "Why can't some of my staff see certain pages?",
    answer:
      'This page controls what each "Job Role" is allowed to see and do. For example, you can restrict cashiers from accessing financial reports or product setup pages.',
    id: "user-permissions",
  },
  {
    icon: "📦",
    title: "Product Setup (Dropdown)",
    question: "What are Categories 1-5 and Brands for? Which one should I use?",
    answer:
      'These are for organizing your products. Think of them as filters or labels. You only need to use the ones that make sense for your business. For example, Category 1 could be "Electronics" and Category 2 could be "Smartphones".',
    tip: "This is not for creating the actual sellable product. This is just for creating the groups that your products will belong to.",
    id: "product-setup-dropdown",
  },
  {
    icon: "📝",
    title: "Product Setup: Stock Entry (Batches)",
    question: "How do I add new inventory or update stock levels?",
    answer:
      'You do it here. A "Batch" is a group of stock you are adding to your inventory. For example, adding "100 units of Coca-Cola" would be done by creating a new batch.',
    id: "stock-entry-batches",
  },
  {
    icon: "🏷️",
    title: "Product Setup: Pricelists",
    question: "Where do I set up the items that will appear on my POS screen?",
    answer:
      'Right here. The "Pricelist" is the final list of products with their selling prices that your cashier will see on the POS screen. This is where you connect a product to a price.',
    id: "pricelists",
  },
  {
    icon: "💰",
    title: "Inventory: Cost of Goods",
    question: "Is this the selling price of my products?",
    answer:
      'No, this shows the "cost price" – how much you paid to acquire the items. This is essential for calculating your actual profit margins.',
    id: "cost-of-goods",
  },
  {
    icon: "🚚",
    title: "Inventory: Item Transfers",
    question: 'What does "Transfer Items" mean?',
    answer:
      "This is for moving inventory from one location to another (e.g., from your main warehouse to a specific store branch). A complete history of all transfers is recorded here.",
    id: "item-transfers",
  },
  {
    icon: "🔢",
    title: "Inventory: SerialNumbers",
    question: "What does this page show?",
    answer:
      "This page lets you view and track unique serial numbers for specific items, which is critical for products like electronics, phones, or high-value goods that require warranty tracking.",
    id: "serial-numbers",
  },
  {
    icon: "📈",
    title: "Inventory (Main)",
    question: "Is this where I update my stock quantities?",
    answer:
      "No. This page is for viewing your current inventory levels. It shows you how many items are sold, unsold, and the total stock on hand.",
    tip: 'To add new stock, use "Stock Entry (Batches)" for regular entries or "Upload Excel Inventory" for large, bulk uploads.',
    id: "inventory-main",
  },
  {
    icon: "📤",
    title: "Inventory: Upload Excel Inventory",
    question: "What is this for? Do I need it?",
    answer:
      'This is a powerful tool for adding a large number of inventory items (especially those with serial numbers) at once from a spreadsheet. The data is "staged" for you to review before it goes live in your inventory.',
    id: "upload-excel-inventory",
  },
  {
    icon: "🎨",
    title: "Colors / Locations / Products",
    question: "Why would the same product be priced differently?",
    answer:
      'This setup allows for price variations. For example, a "Large T-Shirt" might cost more if it\'s "Red" (Color) or if it\'s sold at your "Premium Mall" branch (Location). The "Products" page is where you define the base item before adding these variations.',
    id: "colors-locations-products",
  },
  {
    icon: "🧑",
    title: "Customers",
    question: "Is this my list of sales contacts?",
    answer:
      "Yes. This is the master list of all your customers. You can add new customers, edit their details, or view their purchase history from here.",
    id: "customers",
  },
  {
    icon: "🧾",
    title: "Transactions",
    question: "What is the difference between this and the POS page?",
    answer:
      "This page is your sales history. It shows a complete list of all past purchase transactions. The POS page is where you create new transactions.",
    id: "transactions",
  },
  {
    icon: "💻",
    title: "POS (Point of Sale)",
    question: "What does this screen do?",
    answer:
      "This is the main event! The POS screen is the virtual cash register where your staff will select items, process payments, and complete sales with customers.",
    id: "pos",
  },
];

const HelpFAQ = ({ openItemId }) => {
  const [openFAQId, setOpenFAQId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (openItemId) {
      setOpenFAQId(openItemId);
      setTimeout(() => {
        // Use timeout to ensure the element is rendered
        const element = document.getElementById(`faq-item-${openItemId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
    }
  }, [openItemId]);

  const toggleFAQ = (id) => {
    setOpenFAQId(openFAQId === id ? null : id);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1); // Reset to first page on new search
  };

  // Filter FAQs based on search term
  const filteredFaqs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredFaqs.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFaqs = filteredFaqs.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-4 min-h-full">
      <div className="w-full bg-white rounded-lg shadow-sm p-6">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-800">Help Center</h1>
          <p className="text-lg text-gray-500 mt-2">
            Frequently Asked Questions and Answers
          </p>
        </div>

        <div>
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search FAQs by question or title..."
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>

          {/* FAQ Items List */}
          {currentFaqs.length > 0 ? (
            currentFaqs.map((item) => (
              <FAQItem
                key={item.id}
                id={item.id}
                icon={item.icon}
                title={item.title}
                question={item.question}
                answer={item.answer}
                tip={item.tip}
                isOpen={openFAQId === item.id}
                onToggle={() => toggleFAQ(item.id)}
              />
            ))
          ) : (
            <p className="text-center text-gray-600 text-lg py-8">
              No FAQs found matching your search.
            </p>
          )}

          {/* Pagination Controls */}
          {filteredFaqs.length > itemsPerPage && (
            <div className="flex justify-center items-center space-x-2 mt-8">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
              >
                Previous
              </button>

              {/* Page Numbers */}
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => paginate(index + 1)}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    currentPage === index + 1
                      ? "bg-blue-700 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpFAQ;
