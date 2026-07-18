import React from 'react';
import { usePlateSizes } from '../hooks/usePlateSizes';
import { ItemsData } from './ItemsTable';
import udharTemplate from '../assets/UdharReceiptTemplate_11zon.jpg';
import jamaTemplate from '../assets/JamaReceiptTemplate_11zon.jpg';

interface ReceiptTemplateProps {
  challanType: 'udhar' | 'jama';
  challanNumber: string;
  date: string;
  clientName: string;
  clientSortName?: string;
  site: string;
  phone: string;
  driverName?: string;
  items: ItemsData;
}

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({
  challanType,
  challanNumber,
  date,
  clientName,
  clientSortName,
  site,
  phone,
  driverName,
  items
}) => {
  const { sizes: plateSizes } = usePlateSizes();
  const getQtyOrZero = (qty: number | undefined) => qty ? qty.toString() : '';

  // Helper function to convert coordinates to pixel positions
  const getPosition = (x: number, y: number) => ({
    left: `${x}px`,
    top: `${y}px`,
  });

  // Define coordinates for each element
  const coordinates = {
    challanType: { x: 80, y: 150},
    challanNumber: { x: 230, y: 380 },
    date: { x: 880, y: 380},
    clientName: { x: 200, y: 464 },
    clientSortName: { x: 938, y: 464 },  
    driverId: { x: 850, y: 1150},
    site: { x: 200, y: 514},
    phone: { x: 200, y: 560 },
    itemsStart: { x: 320, y: 700, increment: 63.5 },
    borrowedStockStart: { x: 550, y: 700, increment: 63.5 },
    notesStart: { x: 640, y: 710, increment: 63.5 },
    grandTotal: { x: 320, y: 1270 },
    mainNotes: { x: 150, y: 1534 }
  };

  const sizes = plateSizes.reduce((acc, ps, index) => {
    // Only map up to 10 sizes since the physical receipt template only has 10 rows
    if (index >= 10) return acc;
    
    let qty = 0;
    let borrowedStock = 0;
    let lost = 0;
    let damaged = 0;
    let note = '';

    if (items.items) {
      const itemData = items.items[ps.id] || { qty: 0, borrowed: 0, lost: 0, damaged: 0, note: '' };
      qty = itemData.qty;
      borrowedStock = itemData.borrowed;
      lost = itemData.lost || 0;
      damaged = itemData.damaged || 0;
      note = itemData.note;
    } else {
      qty = (items as any)[`size_${ps.id}_qty`] || 0;
      borrowedStock = (items as any)[`size_${ps.id}_borrowed`] || 0;
      lost = (items as any)[`size_${ps.id}_lost`] || 0;
      damaged = (items as any)[`size_${ps.id}_damaged`] || 0;
      note = (items as any)[`size_${ps.id}_note`] || '';
    }

    const total = (qty || 0) + (borrowedStock || 0);
    // Fixed-coordinate template has no lost/damaged columns; surface them in the note text
    const extras = [lost > 0 ? `ગુમ: ${lost}` : '', damaged > 0 ? `નુકસાન: ${damaged}` : ''].filter(Boolean).join(' | ');
    const noteWithLost = extras ? `${note ? note + ' | ' : ''}${extras}` : note;

    return {
      ...acc,
      [ps.name]: {
        pattern: getQtyOrZero(total),
        borrowedStock: getQtyOrZero(borrowedStock),
        note: noteWithLost || ''
      }
    };
  }, {} as Record<string, { pattern: string, borrowedStock: string, note: string }>);

  // Calculate grand total of all sizes
  const grandTotal = Object.values(sizes)
    .map(value => parseInt(value.pattern) || 0)
    .reduce((total, qty) => total + qty, 0);

  return (
    <div className="flex justify-center bg-gray-100" style={{ minHeight: '100vh', padding: '10px' }}>
      <div
        id="receipt-template"
        className="bg-white"
        style={{
          width: '1200px',
          height: '1697px',
          position: 'relative',
          boxSizing: 'border-box',
          backgroundImage: `url(${challanType === 'udhar' ? udharTemplate : jamaTemplate})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >

        {/* Challan Number */}
        <div style={{
          position: 'absolute',
          ...getPosition(coordinates.challanNumber.x, coordinates.challanNumber.y),
          fontSize: '28px',
          fontWeight: '720',
          color: '#000000'
        }}>
          {challanNumber}
        </div>

        {/* Date */}
        <div style={{
          position: 'absolute',
          ...getPosition(coordinates.date.x, coordinates.date.y),
          left: `${coordinates.date.x}px`,
          fontSize: '28px',
          fontWeight: '720',
          color: '#000000'
        }}>
          {date}
        </div>

        {/* Client Name */}
        <div style={{
          position: 'absolute',
          ...getPosition(coordinates.clientName.x, coordinates.clientName.y),
          fontSize: '31px',
          fontWeight: '720',
          color: '#000000',
          maxWidth: '650px'
        }}>
          {clientName}
        </div>

        {/* Client Sort Name */}
        {clientSortName && (
          <div style={{
            position: 'absolute',
            ...getPosition(coordinates.clientSortName.x, coordinates.clientSortName.y),
            fontSize: '31px',
            fontWeight: '720',
            color: '#000000'
          }}>
            {clientSortName}
          </div>
        )}

        {/* Driver/ID */}
        <div style={{
          position: 'absolute',
          ...getPosition(coordinates.driverId.x, coordinates.driverId.y),
          left: `${coordinates.driverId.x}px`,
          fontSize: '28px',
          fontWeight: '620',
          color: '#000000',
          maxWidth: '250px'
        }}>
          {driverName || ''}
        </div>

        {/* Site */}
        <div style={{
          position: 'absolute',
          ...getPosition(coordinates.site.x, coordinates.site.y),
          fontSize: '31px',
          fontWeight: '720',
          color: '#000000',
          maxWidth: '1000px'
        }}>
          {site}
        </div>

        {/* Phone */}
        <div style={{
          position: 'absolute',
          ...getPosition(coordinates.phone.x, coordinates.phone.y),
          fontSize: '31px',
          fontWeight: '720',
          color: '#000000'
        }}>
          {phone}
        </div>

        {/* Items Quantities - Positioned over background table */}
        {Object.entries(sizes).map(([size, value], index) => {
          const y = coordinates.itemsStart.y + (index * coordinates.itemsStart.increment);
          return (
            <React.Fragment key={size}>
              {/* Regular Quantity */}
              <div
                style={{
                  position: 'absolute',
                  ...getPosition(coordinates.itemsStart.x, y),
                  fontSize: '32px',
                  fontWeight: '750',
                  color: '#000000',
                  textAlign: 'center',
                  width: '120px'
                }}
              >
                {value.pattern}
              </div>
              
              {/* Borrowed Stock */}
              {value.borrowedStock && (
                <div
                  style={{
                    position: 'absolute',
                    ...getPosition(value.note ? coordinates.borrowedStockStart.x - 30 : coordinates.borrowedStockStart.x, y),
                    fontSize: '28px',
                    fontWeight: '750',
                    color: '#000000', 
                    textAlign: 'center',
                    width: '120px'
                  }}
                >
                  {value.borrowedStock}
                </div>
              )}

              {/* Notes */}
              {value.note && (
                <div
                  style={{
                    position: 'absolute',
                    ...getPosition(value.borrowedStock ? coordinates.notesStart.x - 30 : coordinates.notesStart.x, y),
                    fontSize: '23px',
                    fontWeight: '700',
                    color: '#666666',
                    textAlign: 'left',
                    width: '200px'
                  }}
                >
                  {value.note}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Grand Total */}
        <div style={{
          position: 'absolute',
          ...getPosition(coordinates.grandTotal.x, coordinates.grandTotal.y),
          fontSize: '34px',
          fontWeight: '750',
          color: '#000000',
          textAlign: 'center',
          width: '120px'
        }}>
          {grandTotal}
        </div>

        {/* Grand Total above main notes */}
        <div style={{
          position: 'absolute',
          ...getPosition(coordinates.grandTotal.x + 330 , coordinates.mainNotes.y - 48),
          fontSize: '26px',
          fontWeight: '750',
          color: '#000000',
          textAlign: 'center',
          width: '120px'
        }}>
          {grandTotal}
        </div>

        {/* Main Notes */}
        {items.main_note && (
          <div style={{
            position: 'absolute',
            ...getPosition(coordinates.mainNotes.x, coordinates.mainNotes.y),
            fontSize: '30px',
            fontWeight: '600',
            color: '#000000',
            maxWidth: '800px'
          }}>
            {items.main_note}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReceiptTemplate;