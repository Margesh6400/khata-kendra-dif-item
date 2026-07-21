import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
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
  Globe
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
  const { logout } = useAuth();
  const { enableCategorySeparation, activeCategory, setActiveCategory } = useSettings();
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

  // Add padding to main content when using mobile header
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.style.paddingTop = '72px';  // 56px + 8px + 8px
    }
    return () => {
      if (mainContent) {
        mainContent.style.paddingTop = '';
      }
    };
  }, []);

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
      <div className="p-4 relative" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center p-1 overflow-hidden transition-colors w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 shrink-0">
            <img
              src={logo}
              alt="Company Logo"
              className="object-contain w-full h-full"
            />
          </div>
          <div className="truncate">
            <h1 className="text-base font-bold text-white leading-tight truncate">{t('appName')}</h1>
            <p className="text-[11px] truncate" style={{ color: '#9ca3af' }}>{t('Rental_Management')}</p>
          </div>
        </div>

        {/* Custom Category Switcher Dropdown */}
        {enableCategorySeparation && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-white rounded-lg border border-slate-700/80 bg-slate-800/40 hover:bg-slate-800/80 transition-all select-none"
              style={{ outline: 'none' }}
            >
              {(() => {
                const currentCat = categoriesList.find(c => c.id === activeCategory);
                if (currentCat) {
                  const Icon = currentCat.icon;
                  return (
                    <div className="flex items-center gap-2 text-left truncate">
                      <div 
                        className="flex items-center justify-center w-5 h-5 rounded-md text-white shrink-0"
                        style={{ backgroundColor: currentCat.iconColor }}
                      >
                        <Icon size={12} strokeWidth={2.5} />
                      </div>
                      <div className="truncate">
                        <p className="text-white text-[11px] font-bold leading-none truncate">{currentCat.label}</p>
                        <p className="text-[9px] leading-none mt-0.5 truncate" style={{ color: '#94a3b8' }}>{currentCat.desc}</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <span style={{ color: '#9ca3af' }}>Select Section</span>
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
                  className="absolute left-0 right-0 mt-2 z-50 p-1.5 rounded-xl border border-slate-700 bg-slate-900/95 shadow-xl backdrop-blur-md"
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto'
                  }}
                >
                  <div className="text-[10px] font-bold text-slate-500 px-2 py-1.5 uppercase tracking-wider">
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
                        className="flex items-center justify-between w-full px-2 py-2 rounded-lg text-left transition-all mb-0.5 last:mb-0 animate-fadeIn"
                        style={{
                          backgroundColor: isSelected ? cat.activeBg : 'transparent',
                          border: isSelected ? `1px solid ${cat.borderColor}` : '1px solid transparent'
                        }}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div 
                            className="flex items-center justify-center w-6 h-6 rounded-md text-white shrink-0"
                            style={{ backgroundColor: cat.iconColor }}
                          >
                            <Icon size={13} strokeWidth={2.5} />
                          </div>
                          <div className="truncate text-left">
                            <span className="block text-white text-[12px] font-semibold leading-tight truncate">{cat.label}</span>
                            <span className="block text-[9px] leading-tight truncate" style={{ color: '#94a3b8' }}>{cat.desc}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: cat.iconColor }} />
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
                      className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left text-xs font-bold text-blue-400 hover:bg-blue-500/10 transition-all"
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

      <div className="flex-1 p-4 overflow-y-auto">
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
                className="flex items-center w-full gap-3 px-5 py-3 font-medium transition-all"
                style={{
                  fontSize: '16px',
                  color: isActive ? '#60a5fa' : '#9ca3af',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
                  borderLeft: isActive ? `4px solid ${activeColor}` : '4px solid transparent',
                  borderRadius: '0'
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
                <Icon size={20} />
                <span className="flex-1 text-left">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="flex justify-center">
          <LanguageToggle />
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-full gap-2 px-4 py-2 transition-colors duration-150 rounded-lg bg-red-500/10 hover:bg-red-500/20"
          style={{
            minHeight: '44px',
            color: '#f87171'
          }}
        >
          <LogOut size={20} />
          <span className="font-medium">{t('logout')}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="fixed top-0 left-0 z-50 flex-col hidden h-screen lg:flex" style={{ width: '250px', backgroundColor: '#1f2937' }}>
        {renderSidebarContent()}
      </nav>

      {/* Mobile Header - Slightly lower position with rounded corners */}
      <div
        className="fixed left-0 right-0 z-50 flex items-center justify-between px-4 bg-white border-b shadow-sm lg:hidden"
        style={{
          height: '56px',
          borderColor: '#e5e7eb',
          top: '8px',
          margin: '0 8px',
          borderRadius: '8px'
        }}
      >
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -ml-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 shrink-0"
          style={{ color: '#2563eb' }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <h1 className="font-bold text-center truncate px-2" style={{ fontSize: '16px', color: '#1f2937' }}>
          {getCurrentPageName()}
        </h1>
        {enableCategorySeparation && activeCategory ? (
          <div className="relative shrink-0">
            <button
              onClick={() => setMobileDropdownOpen(!mobileDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-white rounded-full transition-all shadow-sm active:scale-95 animate-fadeIn"
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
                  className="fixed inset-0 z-40 bg-black/10" 
                  onClick={() => setMobileDropdownOpen(false)}
                />
                <div 
                  className="absolute right-0 mt-1.5 z-50 w-44 p-1 rounded-xl border border-gray-100 bg-white shadow-xl"
                  style={{ top: '100%' }}
                >
                  <div className="text-[9px] font-bold text-gray-450 px-2 py-1 uppercase tracking-wider">
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
                        className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-left transition-all mb-0.5 last:mb-0"
                        style={{
                          backgroundColor: isSelected ? 'rgba(37, 99, 235, 0.05)' : 'transparent',
                        }}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <div 
                            className="flex items-center justify-center w-5 h-5 rounded-md text-white shrink-0"
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
                  <div className="border-t border-gray-150 my-1 pt-1">
                    <button
                      onClick={() => {
                        setActiveCategory(null);
                        setMobileDropdownOpen(false);
                      }}
                      className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-left text-[11px] font-bold text-blue-600 hover:bg-blue-50 transition-all"
                    >
                      <Globe size={12} />
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 lg:hidden"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setMobileMenuOpen(false)}
          />

          <nav
            className="fixed top-0 left-0 z-50 flex flex-col h-screen overflow-y-auto lg:hidden"
            style={{
              width: '280px',
              backgroundColor: '#1f2937',
              boxShadow: '4px 0 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.3s ease'
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