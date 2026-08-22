import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { getBusinessInfo } from '../utils/businessInfo';
import {
  UserPlus,
  FileText,
  FileCheck,
  Package,
  BookOpen,
  BookMarked,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Settings as SettingsIcon,
  Layers,
  Construction,
  Boxes,
  FolderOpen,
  ChevronDown,
  Globe,
  Wallet
} from 'lucide-react';
import logo from '../assets/logo.png';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import LanguageToggle from './LanguageToggle';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const {
    enableCategorySeparation,
    activeCategory,
    setActiveCategory,
    useCustomBusinessInfo,
    businessName,
    businessPhone,
    businessAddress,
  } = useSettings();
  const businessInfo = getBusinessInfo(
    { useCustomBusinessInfo, businessName, businessPhone, businessAddress },
    language
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);

  const categoriesList = [
    {
      id: 'shuttering' as const,
      label: language === 'gu' ? 'શટરિંગ' : 'Shuttering',
      desc: language === 'gu' ? 'પ્લેટ અને એસેસરીઝ' : 'Plates & Accessories',
      icon: Layers,
      iconColor: '#dc2626',
      bgColor: 'rgba(239, 68, 68, 0.12)',
      activeBg: 'rgba(239, 68, 68, 0.2)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    {
      id: 'jack' as const,
      label: language === 'gu' ? 'જેક' : 'Jack',
      desc: language === 'gu' ? 'પાઇપ અને પ્રોપ્સ' : 'Pipes & Props',
      icon: Construction,
      iconColor: '#16a34a',
      bgColor: 'rgba(16, 185, 129, 0.12)',
      activeBg: 'rgba(16, 185, 129, 0.2)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    {
      id: 'cuplock' as const,
      label: language === 'gu' ? 'કપલોક' : 'Cuplock',
      desc: language === 'gu' ? 'સ્કેફોલ્ડિંગ સિસ્ટમ' : 'Scaffolding System',
      icon: Boxes,
      iconColor: '#8b5cf6',
      bgColor: 'rgba(168, 85, 247, 0.12)',
      activeBg: 'rgba(168, 85, 247, 0.2)',
      borderColor: 'rgba(168, 85, 247, 0.3)',
    },
    {
      id: 'other' as const,
      label: language === 'gu' ? 'અન્ય' : 'Other',
      desc: language === 'gu' ? 'વધારાની સામગ્રી' : 'Extra Material',
      icon: FolderOpen,
      iconColor: '#2563eb',
      bgColor: 'rgba(59, 130, 246, 0.12)',
      activeBg: 'rgba(59, 130, 246, 0.2)',
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
  ];

  // Prevent background scroll when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const navItems = [
    {
      path: '/dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      colorClass: 'blue'
    },
    {
      path: '/quick-payments',
      label: language === 'gu' ? 'ચૂકવણી કલેક્શન' : 'Quick Payments',
      icon: Wallet,
      colorClass: 'green'
    },
    {
      path: '/client-ledger',
      label: t('clientLedger'),
      icon: BookMarked,
      colorClass: 'slate'
    },
    {
      path: '/stock',
      label: t('stockManagement'),
      icon: Package,
      colorClass: 'orange'
    },
    {
      path: '/udhar-challan',
      label: t('udharChallan'),
      icon: FileText,
      colorClass: 'red'
    },
    {
      path: '/jama-challan',
      label: t('jamaChallan'),
      icon: FileCheck,
      colorClass: 'green'
    },
    {
      path: '/challan-book',
      label: t('challanBook'),
      icon: BookOpen,
      colorClass: 'cyan'
    },
    {
      path: '/clients',
      label: t('addClient'),
      icon: UserPlus,
      colorClass: 'blue'
    },
    {
      path: '/billing',
      label: t('billing'),
      icon: FileText,
      colorClass: 'blue'
    },
    {
      path: '/bill-book',
      label: t('billBook'),
      icon: BookOpen,
      colorClass: 'blue'
    },
    {
      path: '/settings',
      label: t('settings'),
      icon: SettingsIcon,
      colorClass: 'purple'
    },
  ];

  const getActiveColor = (colorClass: string): string => {
    const colors: Record<string, string> = {
      blue: '#2563eb',
      red: '#dc2626',
      green: '#16a34a',
      orange: '#f59e0b',
      cyan: '#0891b2',
      slate: '#475569',
      purple: '#8b5cf6'
    };
    return colors[colorClass] || colors.blue;
  };

  const getCurrentPageName = () => {
    const currentPath = location.pathname;
    const currentNavItem = navItems.find(item => item.path === currentPath);
    if (currentPath === '/stock-history') return t('stockHistory');
    return currentNavItem?.label || t('appName');
  };

  const renderSidebarContent = () => (
    <>
      <div className="p-4 relative border-b border-slate-800/80">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center p-1.5 overflow-hidden transition-all w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-white/10 hover:bg-white/20 shrink-0 shadow-inner">
            <img
              src={logo}
              alt="Company Logo"
              className="object-contain w-full h-full"
            />
          </div>
          <div className="truncate">
            <h1 className="text-base font-bold text-white leading-tight truncate">{businessInfo.name}</h1>
            <p className="text-[11px] truncate text-slate-400 font-medium">{t('Rental_Management')}</p>
          </div>
        </div>

        {/* Custom Category Switcher Dropdown */}
        {enableCategorySeparation && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2.5 text-xs font-semibold text-white rounded-xl border border-slate-700/80 bg-slate-800/50 hover:bg-slate-800/90 transition-all select-none shadow-sm"
              style={{ outline: 'none' }}
            >
              {(() => {
                const currentCat = categoriesList.find(c => c.id === activeCategory);
                if (currentCat) {
                  const Icon = currentCat.icon;
                  return (
                    <div className="flex items-center gap-2.5 text-left truncate">
                      <div 
                        className="flex items-center justify-center w-6 h-6 rounded-lg text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: currentCat.iconColor }}
                      >
                        <Icon size={13} strokeWidth={2.5} />
                      </div>
                      <div className="truncate">
                        <p className="text-white text-[12px] font-bold leading-none truncate">{currentCat.label}</p>
                        <p className="text-[10px] leading-none mt-1 truncate text-slate-400">{currentCat.desc}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <span className="text-slate-400">Select Section</span>
                );
              })()}
              <ChevronDown 
                size={14} 
                className="text-slate-400 transition-transform duration-200 shrink-0" 
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }} 
              />
            </button>

            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setDropdownOpen(false)}
                />
                
                <div 
                  className="absolute left-0 right-0 mt-2 z-50 p-2 rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-xl"
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}
                >
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1.5 uppercase tracking-wider">
                    {language === 'gu' ? 'વિભાગ બદલો' : 'Switch Section'}
                  </div>
                  {categoriesList.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setDropdownOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-left transition-all mb-1 last:mb-0 animate-fadeIn"
                        style={{
                          backgroundColor: isSelected ? cat.activeBg : 'transparent',
                          border: isSelected ? `1px solid ${cat.borderColor}` : '1px solid transparent'
                        }}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <div 
                            className="flex items-center justify-center w-6 h-6 rounded-lg text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.iconColor }}
                          >
                            <Icon size={13} strokeWidth={2.5} />
                          </div>
                          <div className="truncate text-left">
                            <span className="block text-white text-[12px] font-semibold leading-tight truncate">{cat.label}</span>
                            <span className="block text-[10px] leading-tight truncate text-slate-400">{cat.desc}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.iconColor }} />
                        )}
                      </button>
                    );
                  })}
                  
                  <div className="border-t border-slate-800 my-1 pt-1">
                    <button
                      onClick={() => {
                        setActiveCategory(null);
                        setDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition-all"
                    >
                      <Globe size={14} />
                      <span>{language === 'gu' ? 'મુખ્ય મેનુ (બધા વિભાગ)' : 'Main Category Menu'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map(({ path, label, icon: Icon, colorClass }) => {
            const isActive = location.pathname === path;
            const activeColor = getActiveColor(colorClass);

            return (
              <button
                key={path}
                onClick={() => {
                  navigate(path);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center w-full gap-3 px-3.5 py-2.5 text-sm font-medium transition-all group relative rounded-xl"
                style={{
                  color: isActive ? '#60a5fa' : '#9ca3af',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.14)' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#9ca3af';
                  }
                }}
              >
                {/* Active Pill Indicator */}
                {isActive && (
                  <span
                    className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-full transition-all"
                    style={{ backgroundColor: activeColor }}
                  />
                )}
                <Icon size={19} className={`shrink-0 ${isActive ? 'text-blue-400' : 'group-hover:text-white transition-colors'}`} />
                <span className="flex-1 text-left font-semibold truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-3 border-t border-slate-800/80">
        <div className="flex justify-center">
          <LanguageToggle />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full gap-2 px-4 py-2.5 transition-all duration-150 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 active:scale-[0.98]"
          style={{
            minHeight: '44px',
            color: '#f87171'
          }}
        >
          <LogOut size={18} />
          <span className="font-semibold text-sm">{t('logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="fixed top-0 left-0 z-50 flex-col hidden h-screen lg:flex border-r border-slate-800/80 shadow-2xl shadow-black/30" style={{ width: '250px', backgroundColor: '#0f172a', borderRadius: '0 24px 24px 0', paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {renderSidebarContent()}
      </nav>

      {/* Mobile Header - Full-width modern header supporting iOS safe areas */}
      <header
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs lg:hidden"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div className="flex items-center justify-between px-3 sm:px-4 h-14">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-blue-600 focus:outline-none transition-all active:scale-95 shrink-0"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="font-bold text-center truncate px-2 text-slate-800 text-sm sm:text-base">
          {getCurrentPageName()}
        </h1>
        {enableCategorySeparation && activeCategory ? (
          <div className="relative shrink-0">
            <button
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-white rounded-full transition-all shadow-sm active:scale-95"
              style={{
                backgroundColor: (() => {
                  const colors = { shuttering: '#dc2626', jack: '#16a34a', cuplock: '#8b5cf6', other: '#2563eb' };
                  return colors[activeCategory] || '#2563eb';
                })(),
                outline: 'none',
              }}
            >
              <span>{(() => {
                const names = { 
                  shuttering: language === 'gu' ? 'શટરિંગ' : 'Shuttering',
                  jack: language === 'gu' ? 'જેક' : 'Jack',
                  cuplock: language === 'gu' ? 'કપલોક' : 'Cuplock',
                  other: language === 'gu' ? 'અન્ય' : 'Other'
                };
                return names[activeCategory] || activeCategory.toUpperCase();
              })()}</span>
              <ChevronDown size={11} strokeWidth={3} />
            </button>

            {mobileDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs" 
                  onClick={() => setMobileDropdownOpen(false)}
                />
                <div 
                  className="absolute right-0 mt-2 z-50 w-48 p-1.5 rounded-2xl border border-gray-100 bg-white shadow-2xl animate-fadeIn"
                  style={{ top: '100%' }}
                >
                  <div className="text-[10px] font-bold text-gray-400 px-2.5 py-1 uppercase tracking-wider">
                    {language === 'gu' ? 'વિભાગ બદલો' : 'Switch Section'}
                  </div>
                  {categoriesList.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategory(cat.id);
                          setMobileDropdownOpen(false);
                        }}
                        className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-left transition-all mb-0.5 last:mb-0"
                        style={{
                          backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div 
                            className="flex items-center justify-center w-5 h-5 rounded-lg text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.iconColor }}
                          >
                            <Icon size={11} strokeWidth={2.5} />
                          </div>
                          <span className="text-gray-700 text-xs font-semibold truncate">{cat.label}</span>
                        </div>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.iconColor }} />
                        )}
                      </button>
                    );
                  })}
                  <div className="border-t border-gray-100 my-1 pt-1">
                    <button
                      onClick={() => {
                        setActiveCategory(null);
                        setMobileDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-xl text-left text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <Globe size={13} />
                      <span>{language === 'gu' ? 'મુખ્ય મેનુ' : 'Main Menu'}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-8 shrink-0" />
        )}
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[100] lg:hidden bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          <nav
            className="fixed top-0 left-0 z-[110] flex flex-col h-screen overflow-y-auto lg:hidden shadow-2xl shadow-black/50"
            style={{
              width: '280px',
              backgroundColor: '#0f172a',
              borderRadius: '0 24px 24px 0',
              transition: 'transform 0.3s ease',
              paddingTop: 'env(safe-area-inset-top)',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
          >
            {renderSidebarContent()}
          </nav>
        </>
      )}
    </>
  );
};

export default Navbar;