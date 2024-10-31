"use client";
// Import Footer component
import Footer from "../../_comps/footer";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Trash2, FileText, Home, Linkedin, LogOut } from "lucide-react";

// Logout Dialog Component
const LogoutDialog = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative z-10 bg-lightteal-800 border border-orange-600 rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-white mb-2">Confirm Logout</h2>
        <p className="text-gray-300 mb-6">
          Are you sure you want to logout? Any unsaved progress will be lost.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-lightteal-500 text-white rounded-lg hover:bg-lightteal-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default function DocumentDetails({ params }) {
  const { documentId } = params;
  const router = useRouter();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  async function fetchDocumentData() {
    try {
      const response = await fetch(`/api/getdocumentdata?documentId=${documentId}`);
      if (!response.ok) throw new Error("Failed to fetch document data");

      const data = await response.json();
      setDocument(data.document);
    } catch (error) {
      console.error("Error fetching document data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocumentData();
  }, [documentId]);

  async function handleArchive() {
    try {
      const response = await fetch(`/api/archiveconnection?documentId=${documentId}`, { method: "GET" });

      if (!response.ok) throw new Error("Failed to archive document");

      alert("Document archived successfully.");
      await fetchDocumentData();
    } catch (error) {
      console.error("Error archiving document:", error);
      alert("Error archiving document. Please try again.");
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/deleteconnection?documentId=${documentId}`, { method: "GET" });

      if (!response.ok) throw new Error("Failed to delete document");

      alert("Document deleted successfully.");
      router.push("/");
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Error deleting document. Please try again.");
    }
  }

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  function calculateTimeUntilRemind(remindTime) {
    const now = new Date();
    const timeDifference = new Date(remindTime) - now;

    if (timeDifference <= 0) return "Remind time has passed";

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

    let result = "";
    if (days > 0) result += `${days} day${days > 1 ? "s" : ""} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? "s" : ""} `;
    if (minutes > 0 || result === "") result += `${minutes} minute${minutes !== 1 ? "s" : ""}`;

    return result.trim();
  }

  if (loading) {
    return <div className="text-center text-orange-400">Loading...</div>;
  }

  if (!document) {
    return <h1 className="text-center text-2xl text-orange-400">Document not found or invalid ID</h1>;
  }

  const {
    firstName,
    lastName,
    position,
    companyName,
    companyURL,
    linkedinUrl,
    profilePicture,
    createdAt,
    remindTime,
    reminded,
  } = document;
  const timeUntilRemind = calculateTimeUntilRemind(remindTime);

  return (
<div className="min-h-screen w-full bg-lightteal-500 bg-gradient-to-b from-lightteal-500 to-lightteal-500 flex flex-col">
  {/* Top Button Container */}
  <div className="flex justify-between items-center px-4 py-4">
    {/* Home Button */}
    <button
      onClick={() => router.push("/")}
      className="bg-orange-500 text-white p-3 md:px-6 md:py-3 rounded-full hover:bg-orange-600 transition-colors flex items-center justify-center"
      aria-label="Back to Home"
    >
      <Home className="w-6 h-6" />
    </button>

    {/* Logout Button */}
    <button
      onClick={() => setShowLogoutDialog(true)}
      className="bg-orange-500 text-white p-3 md:px-6 md:py-3 rounded-full hover:bg-orange-600 transition-colors flex items-center gap-2 justify-center"
      aria-label="Logout"
    >
      <LogOut className="w-5 h-5" />
      <span className="hidden md:inline">Logout</span>
    </button>
  </div>

  {/* Logout Confirmation Dialog */}
  <LogoutDialog isOpen={showLogoutDialog} onClose={() => setShowLogoutDialog(false)} onConfirm={handleLogout} />

  {/* Document Details */}
  <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-6">
    <div className="relative bg-lightteal-800 rounded-lg shadow-lg p-6 sm:p-8 max-w-md w-full text-center border border-orange-600">
      {profilePicture && (
        <img
          src={profilePicture}
          alt={`${firstName} ${lastName}'s profile`}
          className="rounded-full w-32 h-32 sm:w-44 sm:h-44 mx-auto mb-4 sm:mb-6 object-cover border-4 border-orange-500"
        />
      )}

      <h1 className="text-xl sm:text-2xl font-semibold text-orange-400">{firstName} {lastName}</h1>
      <p className="text-base sm:text-lg text-gray-300 mt-2">{position}</p>

      <div className="flex flex-col items-center gap-2 mt-4">
        <p className="text-gray-300">
          Works at:&nbsp;
          <a
            href={companyURL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 font-semibold hover:text-orange-300 ml-1 inline-flex items-center gap-1 transition-colors"
          >
            {companyName}
          </a>
        </p>

        {linkedinUrl && (
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 inline-flex items-center gap-2 transition-colors text-center"
          >
            <Linkedin className="w-5 h-5" />
            <span>LinkedIn Profile</span>
          </a>
        )}
      </div>

      {createdAt && (
        <p className="mt-4 text-gray-400 text-sm">
          Created on: {new Date(createdAt).toLocaleString()}
        </p>
      )}

      {remindTime && (
        <p className="mt-2 text-gray-400 text-sm">
          Reminder in: {timeUntilRemind}
        </p>
      )}

      {reminded ? (
        <p className="mt-2 text-orange-500 text-sm">This item is archived</p>
      ) : (
        <p className="mt-2 text-green-500 text-sm">This item is active</p>
      )}
    </div>

    {/* Archive and Delete Buttons */}
    <div className="flex justify-center gap-4 mt-6">
      <button
        onClick={handleArchive}
        disabled={reminded}
        className={`px-4 py-2 rounded-md flex items-center gap-1 transition-colors ${
          reminded ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-orange-500 text-white hover:bg-orange-600"
        }`}
      >
        <FileText className="w-5 h-5" />
        Archive
      </button>
      <button
        onClick={() => setShowDeletePrompt(true)}
        className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center gap-1 hover:bg-red-700 transition-colors"
      >
        <Trash2 className="w-5 h-5" />
        Delete
      </button>
    </div>

    {/* Delete Confirmation Dialog */}
    {showDeletePrompt && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeletePrompt(false)} />
        <div className="relative z-10 bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h2 className="text-xl font-bold mb-2">Confirm Delete</h2>
          <p className="text-gray-600 mb-6">Are you sure you want to delete this document? This action cannot be undone.</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeletePrompt(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    )}
  </div>

  {/* Footer Component */}
  <Footer />
</div>
  );
}
