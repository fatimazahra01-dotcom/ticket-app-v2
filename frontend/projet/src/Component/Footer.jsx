import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} Vivo Energy Maroc — IT OSS</p>
        <p>Immeuble Le Zénith II, Sidi Maarouf, Casablanca</p>
        <p>
          <a href="https://www.vivoenergy.com" target="_blank" rel="noopener noreferrer">
            www.vivoenergy.com
          </a>
        </p>
      </div>
    </footer>
  );
}