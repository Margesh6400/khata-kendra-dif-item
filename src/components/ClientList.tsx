import React from 'react';
import { Edit, Trash2, Phone, MapPin, Plus, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { ClientFormData } from './ClientForm';
import { useNavigate } from 'react-router-dom';

interface ClientListProps {
  clients: ClientFormData[];
  onEdit: (client: ClientFormData) => void;
  onDelete: (id: string) => void;
  onToggleHide: (client: ClientFormData) => void;
}

const ClientList: React.FC<ClientListProps> = ({ clients, onEdit, onDelete, onToggleHide }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleDelete = React.useCallback((id: string, name: string) => {
    if (window.confirm(`Delete "${name}"?`)) {
      onDelete(id);
    }
  }, [onDelete]);

  const handleCreateUdhar = (client: ClientFormData) => {
    navigate('/udhar-challan', {
      state: {
        preselectedClient: {
          id: client.id,
          nicName: client.client_nic_name,
          fullName: client.client_name,
          site: client.site,
          phone: client.primary_phone_number
        }
      }
    });
  };

  const handleCreateJama = (client: ClientFormData) => {
    navigate('/jama-challan', {
      state: {
        preselectedClient: {
          id: client.id,
          nicName: client.client_nic_name,
          fullName: client.client_name,
          site: client.site,
          phone: client.primary_phone_number
        }
      }
    });
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {clients.length === 0 ? (
        <p className="py-6 text-xs text-center text-gray-500 sm:py-8 sm:text-sm">{t('noClients') || 'No clients found'}</p>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full overflow-hidden bg-white border-collapse rounded-lg shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700">{t('clientNicName')}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700">{t('clientName')}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700">{t('site')}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700">{t('primaryPhone')}</th>
                  <th className="px-4 py-3 text-sm font-semibold text-left text-gray-700">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client: ClientFormData) => (
                  <tr key={client.id} className={`border-t border-gray-200 hover:bg-gray-50 ${client.is_hidden ? 'bg-gray-50 opacity-75' : ''}`}>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        {client.client_nic_name}
                        {client.is_hidden && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-500 bg-gray-200 rounded">
                            {t('hidden') || 'Hidden'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{client.client_name}</td>
                    <td className="px-4 py-3 text-sm">{client.site}</td>
                    <td className="px-4 py-3 text-sm">{client.primary_phone_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCreateUdhar(client)}
                          className="px-2 py-1.5 text-xs font-medium text-white transition-colors bg-red-500 rounded hover:bg-red-600 flex items-center gap-1"
                          title="Create Udhar"
                        >
                          <Plus size={14} />
                          Udhar
                        </button>
                        <button
                          onClick={() => handleCreateJama(client)}
                          className="px-2 py-1.5 text-xs font-medium text-white transition-colors bg-green-500 rounded hover:bg-green-600 flex items-center gap-1"
                          title="Create Jama"
                        >
                          <span className="flex items-center justify-center w-3.5 h-3.5 text-lg font-bold leading-none">-</span>
                          Jama
                        </button>
                        <div className="w-px h-6 bg-gray-300 mx-1"></div>
                        <button
                          onClick={() => onToggleHide(client)}
                          className={`p-2 transition-colors rounded hover:bg-gray-100 touch-manipulation active:scale-95 ${client.is_hidden ? 'text-orange-600' : 'text-gray-500'}`}
                          title={client.is_hidden ? t('unhide') || 'Unhide' : t('hide') || 'Hide'}
                        >
                          {client.is_hidden ? <Eye size={18} /> : <EyeOff size={18} />}
                        </button>
                        <button
                          onClick={() => onEdit(client)}
                          className="p-2 text-blue-600 transition-colors rounded hover:bg-blue-50 touch-manipulation active:scale-95"
                          title={t('edit')}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id!, client.client_nic_name)}
                          className="p-2 text-red-600 transition-colors rounded hover:bg-red-50 touch-manipulation active:scale-95"
                          title={t('delete')}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View - Ultra Compact */}
          <div className="space-y-2 lg:hidden">
            {clients.map((client: ClientFormData) => (
              <div
                key={client.id}
                className="p-2.5 sm:p-3 bg-white border border-gray-200 rounded-lg shadow-sm sm:rounded-xl hover:shadow-md transition-shadow"
              >
                {/* Header Row - Name and Actions */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate sm:text-base">
                      {client.client_nic_name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-gray-600 truncate">
                      {client.client_name}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <button
                      onClick={() => handleCreateUdhar(client)}
                      className="p-1.5 text-[10px] font-medium text-white bg-red-300 hover:bg-red-600 rounded-md transition-colors touch-manipulation active:scale-95 flex items-center justify-center w-7 h-7"
                      aria-label="Create Udhar"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCreateJama(client)}
                      className="p-1.5 text-[10px] font-medium text-white bg-green-300 hover:bg-green-600 rounded-md transition-colors touch-manipulation active:scale-95 flex items-center justify-center w-7 h-7"
                      aria-label="Create Jama"
                    >
                      <span className="text-base font-bold leading-none">−</span>
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-0.5"></div>
                    <button
                      onClick={() => onToggleHide(client)}
                      className={`p-1.5 sm:p-2 rounded-md transition-colors touch-manipulation active:scale-95 ${client.is_hidden ? 'text-orange-600 bg-orange-50' : 'text-gray-500 bg-gray-50'}`}
                      aria-label={client.is_hidden ? 'Unhide' : 'Hide'}
                    >
                      {client.is_hidden ? <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                    </button>
                    <button
                      onClick={() => onEdit(client)}
                      className="p-1.5 sm:p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors touch-manipulation active:scale-95"
                      aria-label="Edit"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id!, client.client_nic_name)}
                      className="p-1.5 sm:p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors touch-manipulation active:scale-95"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Details Row - Compact Info */}
                <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-600">
                  <div className="flex items-center flex-1 min-w-0 gap-1">
                    <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{client.site}</span>
                  </div>
                  <a
                    href={`tel:${client.primary_phone_number}`}
                    className="flex items-center flex-shrink-0 gap-1 text-blue-600 hover:text-blue-700 touch-manipulation active:scale-95"
                  >
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="font-medium">{client.primary_phone_number}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientList;
