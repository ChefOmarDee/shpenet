"use client";
// Import Footer component
import Footer from "./_comps/footer";
import React, { useState, useEffect } from "react";
import { Clock, Building2, UserPlus } from "lucide-react";
import Link from "next/link";

const TabsContainer = ({ children, className = "" }) => (
  <div className={`w-full ${className}`}>{children}</div>
);

const TabsList = ({ children }) => (
  <div className="flex items-center justify-between border-b border-black mb-4">
    <div className="flex">{children}</div>
    <Link href="/addconnection" passHref>
      <button className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors -mt-2">
        <UserPlus className="w-4 h-4" />
        Create Connection
      </button>
    </Link>
  </div>
);

const TabTrigger = ({ isActive, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm transition-colors duration-150
      ${
        isActive
          ? "text-orange-500 border-b-2 border-orange-500"
          : "text-orange-400 hover:text-orange-300"
      }`}
  >
    {children}
  </button>
);

const TabContent = ({ isActive, children }) => (
  <div className={`${isActive ? "block" : "hidden"}`}>{children}</div>
);

const ReminderTable = ({ reminders, getTimeUntil, activeTab }) => (
  <div>
    <Link href="/addconnection" passHref>
      <button className="md:hidden w-full mb-4 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors">
        <UserPlus className="w-4 h-4" />
        Create Connection
      </button>
    </Link>

    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="p-2 text-center text-orange-400 border-b border-r border-black">
            Profile
          </th>
          <th className="p-2 text-center text-orange-400 border-b border-r border-black">
            Name
          </th>
          <th className="p-2 text-center text-orange-400 border-b border-r border-black hidden lg:table-cell">
            Position
          </th>
          <th className="p-2 text-center text-orange-400 border-b border-r border-black hidden md:table-cell">
            Company
          </th>
          <th className="p-2 text-center text-orange-400 border-b border-r border-black hidden lg:table-cell">
            Time Until
          </th>
          <th className="p-2 text-center text-orange-400 border-b border-black">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {reminders.map((reminder) => (
          <tr
            key={reminder._id || `${reminder.UID}-${reminder.email}-${reminder.createdAt}`}
            className="border-b border-black hover:bg-lightteal-700/50 transition-colors"
          >
            <td className="p-2 border-r border-black text-center">
              <img
                src={reminder.profilePicture}
                alt={`${reminder.firstName} ${reminder.lastName}`}
                className="w-8 h-8 rounded-full mx-auto"
              />
            </td>
            <td className="p-2 border-r border-black text-center text-white">
              {reminder.firstName} {reminder.lastName}
            </td>
            <td className="p-2 border-r border-black text-center text-gray-300 hidden lg:table-cell">
              {reminder.position}
            </td>
            <td className="p-2 border-r border-black text-center hidden md:table-cell">
              <a
                href={reminder.companyURL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-1 transition-colors justify-center"
              >
                <Building2 className="w-4 h-4" />
                <span>{reminder.companyName}</span>
              </a>
            </td>
            <td className="p-2 text-center border-r border-black hidden lg:table-cell">
              <div className="flex items-center gap-1 text-gray-300 justify-center">
                <Clock className="w-4 h-4" />
                <span>{getTimeUntil(reminder.remindTime, activeTab)}</span>
              </div>
            </td>
            <td className="p-2 text-center">
              <Link href={`/details/${reminder._id}`}>
                <button className="bg-blue-500 text-white px-4 py-1 rounded-md hover:bg-blue-600 transition-colors">
                  View
                </button>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex justify-center gap-2 mt-4">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage <= 1}
      className="px-3 py-1 border border-orange-600/30 rounded text-orange-400 hover:bg-lightteal-700/50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
    >
      Previous
    </button>
    <span className="px-3 py-1 text-white">
      Page {currentPage} of {totalPages}
    </span>
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage >= totalPages}
      className="px-3 py-1 border border-orange-600/30 rounded text-orange-400 hover:bg-lightteal-700/50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
    >
      Next
    </button>
  </div>
);

const RemindersDashboard = () => {
  const [reminders, setReminders] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemsPerPage = 5;

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/getconnection?status=${activeTab}&page=${currentPage}&limit=${itemsPerPage}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch reminders");
      }

      const data = await response.json();
      setReminders(data.reminders);
      setTotalPages(data.pagination.pages);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching reminders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [activeTab, currentPage]);

  const getTimeUntil = (remindTime, currentTab) => {
    const now = new Date();
    const diff = new Date(remindTime) - now;

    if (diff < 0) {
      if (currentTab === "active") {
        const hours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
        const minutes = Math.abs(
          Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        );

        if (hours === 0) {
          return `${minutes} minutes overdue`;
        }
        return `${hours} hours overdue`;
      }
      return "Past due";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days} days`;
    if (hours > 0) return `${hours} hours`;
    return `${minutes} minutes`;
  };

  if (error) {
    return <div className="text-center text-red-500 p-8">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-lightteal-500 bg-gradient-to-b from-lightteal-500 to-lightteal-500 flex flex-col">
      <div className="flex flex-col justify-center flex-grow w-full px-4 py-12">
        <div className="w-full max-w-6xl mx-auto rounded-lg border border-orange-600 shadow-lg overflow-hidden bg-lightteal-800">
          <div className="p-6">
            <TabsContainer>
              <TabsList>
                <TabTrigger
                  isActive={activeTab === "active"}
                  onClick={() => {
                    setActiveTab("active");
                    setCurrentPage(1);
                  }}
                >
                  Active Reminders
                </TabTrigger>
                <TabTrigger
                  isActive={activeTab === "inactive"}
                  onClick={() => {
                    setActiveTab("inactive");
                    setCurrentPage(1);
                  }}
                >
                  Inactive Reminders
                </TabTrigger>
              </TabsList>

              <TabContent isActive={true}>
                {isLoading ? (
                  <div className="text-center p-8">Loading reminders...</div>
                ) : (
                  <>
                    <ReminderTable
                      reminders={reminders}
                      getTimeUntil={getTimeUntil}
                      activeTab={activeTab}
                    />
                    {totalPages > 1 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </>
                )}
              </TabContent>
            </TabsContainer>
          </div>
        </div>
      </div>
      
      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default RemindersDashboard;
