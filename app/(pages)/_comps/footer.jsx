// components/Footer.js
import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-lightteal-800 py-4 border-t border-orange-600 text-center mt-8">
      <h2 className="text-orange-400 text-lg font-semibold mb-2">
        Connect with the Developers
      </h2>
      <div className="flex justify-center gap-4 mb-2">
        <Link href="https://www.linkedin.com/in/ethan-prendergast/" target="_blank" rel="noopener noreferrer">
          <img
            src="https://media.licdn.com/dms/image/v2/D4D03AQFRXWOcBPHCnQ/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1699334116043?e=1735776000&v=beta&t=eIv2AiqtCUQ_6oB2Eh6sDUZEpa_J88KSIbi9Q4U5Iqk"
            alt="Ethan Prendergast LinkedIn Profile"
            className="w-12 h-12 rounded-full border border-orange-500 hover:opacity-80 transition-opacity"
          />
        </Link>
        <Link href="https://www.linkedin.com/in/omar-khan-view/" target="_blank" rel="noopener noreferrer">
          <img
            src="https://media.licdn.com/dms/image/v2/D4E03AQHZMPN6zl2gyQ/profile-displayphoto-shrink_400_400/profile-displayphoto-shrink_400_400/0/1709221240728?e=1735776000&v=beta&t=jU1cz2g_Gte9J7t4aJvFeQ1CHBU7IUdKi5h8nRiLv6w"
            alt="Omar Khan LinkedIn Profile"
            className="w-12 h-12 rounded-full border border-orange-500 hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>
      <p className="text-gray-400 text-sm">
        We’re here to build something great. Connect with us!
      </p>
    </footer>
  );
};

export default Footer;
