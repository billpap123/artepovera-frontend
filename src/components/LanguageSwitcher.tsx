// src/components/LanguageSwitcher.tsx

import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/Language.css'; // We'll create this new CSS file

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="language-switcher">
      <select 
        className="language-switcher-select" 
        onChange={handleLanguageChange} 
        defaultValue={i18n.language}
      >
        <option value="en">EN</option>
        <option value="el">ΕL</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;