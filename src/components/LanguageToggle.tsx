import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="relative inline-flex items-center p-0.5 bg-slate-900/80 backdrop-blur-md border border-slate-700/80 rounded-lg shadow-md select-none w-full max-w-[150px]">
      <div className="relative flex items-center bg-slate-950/60 p-0.5 rounded-md border border-slate-800/80 w-full overflow-hidden">
        {/* Sliding Background Pill */}
        <motion.div
          className="absolute top-0.5 bottom-0.5 bg-blue-600 rounded shadow-sm shadow-blue-600/30"
          initial={false}
          animate={{
            left: language === 'gu' ? '2px' : 'calc(50% + 2px)',
            width: 'calc(50% - 4px)'
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />

        <button
          type="button"
          onClick={() => setLanguage('gu')}
          className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors duration-200 flex items-center justify-center ${
            language === 'gu'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ગુજરાતી
        </button>

        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors duration-200 flex items-center justify-center ${
            language === 'en'
              ? 'text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          English
        </button>
      </div>
    </div>
  );
};

export default LanguageToggle;
