// src/pages/admin/FetchFailedHelp.js

import React from "react";

const FetchFailedHelp = () => {
  return (
    <div className="bg-red-50 p-6 rounded-lg shadow-lg border-l-8 border-red-600 max-w-4xl mx-auto my-8">
      <h2 className="text-3xl font-extrabold text-red-800 mb-4">
        How to Resolve "Fetch Failed - Batangas API Expired" Issue
      </h2>
      <div className="space-y-5 text-gray-800">
        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            Issue Summary:
          </h3>
          <p>
            The API fetch failed due to the expiration of the database user
            credentials. The expired user is:
          </p>
          <div className="mt-2 p-3 bg-gray-100 rounded-md border border-gray-300">
            <p>
              <strong>User ID:</strong> james
            </p>
            <p>
              <strong>Password:</strong>{" "}
              <code className="bg-gray-200 p-1 rounded">admindb123#</code>
            </p>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            This affects both the API connection and the SQL login.
          </p>
        </div>

        <div>
          <h3 className="font-bold text-xl text-green-700">✅ Steps to Fix</h3>
          <ol className="list-decimal list-inside space-y-4 mt-2">
            <li>
              <span className="font-semibold">
                Remotely access the computer
              </span>
              <div className="ml-6 mt-1 p-3 bg-gray-100 rounded-md border border-gray-300">
                <p>
                  <strong>IP Address:</strong>{" "}
                  <code className="bg-gray-200 p-1 rounded">
                    192.168.10.222
                  </code>
                </p>
              </div>
            </li>
            <li>
              <span className="font-semibold">
                Open SQL Server Management Studio (SSMS)
              </span>{" "}
              or your preferred SQL client.
            </li>
            <li>
              <span className="font-semibold">
                Reset the expired SQL user credentials
              </span>
              <ul className="list-disc list-inside ml-6 mt-1 text-gray-600 space-y-1">
                <li>
                  Update the password for user <strong>james</strong> to:{" "}
                  <code className="bg-gray-200 p-1 rounded">admindb123#</code>
                </li>
                <li>
                  Make sure the user account is enabled and not locked or
                  expired.
                </li>
              </ul>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default FetchFailedHelp;
