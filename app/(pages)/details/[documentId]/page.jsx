"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Trash2, FileText, Home, Linkedin } from "lucide-react";

export default function DocumentDetails({ params }) {
  const { documentId } = params;
  const router = useRouter();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeletePrompt, setShowDeletePrompt] = useState(false);

  useEffect(() => {
    async function fetchDocumentData() {
      try {
        const response = await fetch(
          `/api/getdocumentdata?documentId=${documentId}`
        );
        if (!response.ok) throw new Error("Failed to fetch document data");

        const data = await response.json();
        setDocument(data.document);
      } catch (error) {
        console.error("Error fetching document data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDocumentData();
  }, [documentId]);

  async function handleArchive() {
    try {
      const response = await fetch(
        `/api/archiveconnection?documentId=${documentId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Failed to archive document");
      alert("Document archived successfully.");
      router.refresh();
    } catch (error) {
      console.error("Error archiving document:", error);
      alert("Error archiving document. Please try again.");
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(
        `/api/deleteconnection?documentId=${documentId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) throw new Error("Failed to delete document");

      alert("Document deleted successfully.");
      router.push("/");
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Error deleting document. Please try again.");
    }
  }

  function calculateTimeUntilRemind(remindTime) {
    const now = new Date();
    const timeDifference = new Date(remindTime) - now;

    if (timeDifference <= 0) return "Remind time has passed";

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
    );

    let result = "";
    if (days > 0) result += `${days} day${days > 1 ? "s" : ""} `;
    if (hours > 0) result += `${hours} hour${hours > 1 ? "s" : ""} `;
    if (minutes > 0 || result === "")
      result += `${minutes} minute${minutes !== 1 ? "s" : ""}`;

    return result.trim();
  }

  if (loading) {
    return <div className="text-center text-orange-400">Loading...</div>;
  }

  if (!document) {
    return (
      <h1 className="text-center text-2xl text-orange-400">
        Document not found or invalid ID
      </h1>
    );
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
    <div className="min-h-screen w-full bg-lightteal-500 bg-gradient-to-b from-lightteal-500 to-lightteal-500 flex flex-col items-center justify-center p-6">
      {/* Home Button */}
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 bg-orange-500 text-white p-5 rounded-full hover:bg-orange-600 transition-colors"
        aria-label="Back to Home"
      >
        <Home className="w-6 h-6" />
      </button>

      <div className="relative bg-lightteal-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center border border-orange-600">
        {profilePicture && (
          <img
            src={profilePicture}
            alt={`${firstName} ${lastName}'s profile`}
            className="rounded-full w-44 h-44 mx-auto mb-6 object-cover border-4 border-orange-500"
          />
        )}

        <h1 className="text-2xl font-semibold text-orange-400">
          {firstName} {lastName}
        </h1>
        <p className="text-lg text-gray-300 mt-2">{position}</p>

        <div className="flex flex-col items-center gap-2 mt-4">
          <p className="text-gray-300">
            Works at:
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
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-2 transition-colors"
            >
              <Linkedin className="w-5 h-5" />
              LinkedIn Profile
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
        {reminded && (
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
            reminded
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-orange-500 text-white hover:bg-orange-600"
          }`}
        >
          <FileText className="w-5 h-5" />
          Archive
        </button>

        <button
          onClick={() => setShowDeletePrompt(true)}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center gap-1"
        >
          <Trash2 className="w-5 h-5" />
          Delete Connection
        </button>
      </div>

      {/* Delete Confirmation Prompt */}
      {showDeletePrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-lightteal-800 p-6 rounded-md text-center max-w-sm w-full border border-orange-600">
            <p className="text-white mb-4">
              Are you sure you want to delete this connection?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setShowDeletePrompt(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
