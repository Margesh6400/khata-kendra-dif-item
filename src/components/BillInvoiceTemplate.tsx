import React from 'react';
import { format } from 'date-fns';
import { formatIndianCurrency } from '../utils/currencyFormat';
import logoBw from '../assets/logo_bw.png';

interface BillInvoiceProps {
  companyDetails?: {
    name: string;
    address: string;
    phone: string;
  };
  billDetails: {
    billNumber: string;
    billDate: string;
    fromDate: string;
    toDate: string;
    dailyRent: number;
    category?: string;
  };
  clientDetails: {
    name: string;
    nicName: string;
    site: string;
    phone: string;
  };
  rentalCharges: {
    size: string;
    pieces: number;
    days: number;
    rate: number;
    amount: number;
    startDate?: string;
    endDate?: string;
    causeType?: 'udhar' | 'jama';
    txnQty?: number;
    udharQty?: number;
    jamaQty?: number;
    udharDetails?: { challanNumber: string; qty: number }[];
    jamaDetails?: { challanNumber: string; qty: number }[];
  }[];
  extraCosts: {
    id: string;
    date: string;
    description: string;
    amount: number;
    pieces?: number;
    rate?: number;
  }[];
  payments: {
    id: string;
    date: string;
    method: string;
    note: string;
    amount: number;
  }[];
  summary: {
    totalRent: number;
    totalUdharPlates: number;
    totalJamaPlates: number;
    netPlates: number;
    serviceCharge: number;
    totalExtraCosts: number;
    discounts: number;
    grandTotal: number;
    totalPaid: number;
    advancePaid: number;
    duePayment: number;
  };
  mainNote?: string;
  previousBill?: {
    billNumber: string;
    amount: number;
  };
}

const KhataKendraLogo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <img
      src={logoBw}
      alt="Khata Kendra Logo"
      style={{
        width: '52px',
        height: '52px',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  </div>
);

const DEFAULT_COMPANY_DETAILS = {
  name: 'ખાતા કેન્દ્ર',
  address: 'ઓફિસ-૨૩/૨૪, જે.જે. નગર, પુણાગામ, કનૈયા કોમ્પ.ની પાછળ, ઝુપડપટ્ટીની સામે, પુણા ટુ બોમ્બે માર્કેટ રોડ, સુરત.',
  phone: '(૦) ૦૨૬૧-૨૮૫૪૩૦૭',
};

const BillInvoiceTemplate: React.FC<BillInvoiceProps> = ({
  companyDetails,
  billDetails,
  clientDetails,
  rentalCharges,
  extraCosts,
  payments,
  summary,
  mainNote,
  previousBill,
}) => {
  const company = {
    name: companyDetails?.name || DEFAULT_COMPANY_DETAILS.name,
    address: companyDetails?.address || DEFAULT_COMPANY_DETAILS.address,
    phone: companyDetails?.phone || DEFAULT_COMPANY_DETAILS.phone,
  };

  const formatLocalDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="invoice-container" style={{
      padding: '20px',
      maxWidth: '820px',
      margin: '0 auto',
      fontFamily: '"Noto Sans Gujarati", "Arya", Arial, sans-serif',
      backgroundColor: '#fff',
      color: '#000',
    }}>
      {/* Outer Monolithic Border Container */}
      <div style={{ border: '2.5px solid #000', padding: '0', position: 'relative', minHeight: '920px', display: 'flex', flexDirection: 'column' }}>

        {/* ══════════ TOP HEADER SECTION ══════════ */}
        <div style={{ borderBottom: '2px solid #000' }}>
          {/* Top Info Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1.5px solid #000' }}>
            {/* Left: Logo */}
            <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <KhataKendraLogo />
            </div>

            {/* Center Religious Title & Header */}
            <div style={{ textAlign: 'center', flex: 2 }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                ॥ શ્રી ગણેશાય નમઃ ॥
              </div>
              <div style={{ fontSize: '30px', fontWeight: '900', lineHeight: 1.15, letterSpacing: '0.5px', marginTop: '2px', wordBreak: 'break-word' }}>
                {company.name}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>
                જેક ટેકા * સ્પેન * પ્લેટ * ઝુલા
              </div>
            </div>

            {/* Right: Phone / Mobile Number */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flex: 1, fontSize: '12px', fontWeight: 'bold', lineHeight: 1.3, textAlign: 'right' }}>
              {company.phone}
            </div>
          </div>

          {/* Sub-Header Address Row */}
          <div style={{ padding: '6px 12px', textAlign: 'center', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.2px', backgroundColor: '#f8fafc', borderBottom: '1px solid #000' }}>
            {company.address}
          </div>
        </div>

        {/* ══════════ CLIENT DETAILS GRID BOX ══════════ */}
        <div style={{ padding: '10px 12px', borderBottom: '2px solid #000' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '10px', fontSize: '14px', fontWeight: 'bold' }}>
            {/* Left: Client Name & Site */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ whiteSpace: 'nowrap', width: '55px' }}>નામ :</span>
                <span style={{ borderBottom: '1px dotted #000', flex: 1, paddingLeft: '4px', fontSize: '15px' }}>
                  {clientDetails.name} {clientDetails.nicName ? `(${clientDetails.nicName})` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ whiteSpace: 'nowrap', width: '55px' }}>સાઈટ :</span>
                <span style={{ borderBottom: '1px dotted #000', flex: 1, paddingLeft: '4px' }}>
                  {clientDetails.site}
                </span>
              </div>
            </div>

            {/* Right: Bill Number & Date */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ whiteSpace: 'nowrap', width: '60px' }}>નંબર :</span>
                <span style={{ borderBottom: '1px dotted #000', flex: 1, textAlign: 'center', fontSize: '15px' }}>
                  {billDetails.billNumber}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <span style={{ whiteSpace: 'nowrap', width: '60px' }}>તા. :</span>
                <span style={{ borderBottom: '1px dotted #000', flex: 1, textAlign: 'center' }}>
                  {formatLocalDate(billDetails.billDate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ MAIN RENTAL TABLE (7 COLUMNS MATCHING UPLOADED IMAGE) ══════════ */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #000' }}>
                <th style={{ borderRight: '1px solid #000', padding: '7px 4px', width: '7%', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.2px' }}>નંગ</th>
                <th style={{ borderRight: '1px solid #000', padding: '7px 4px', width: '22%', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.2px' }}>આ.તારીખ</th>
                <th style={{ borderRight: '1px solid #000', padding: '7px 4px', width: '22%', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.2px' }}>જ.તારીખ</th>
                <th style={{ borderRight: '1px solid #000', padding: '7px 4px', width: '10%', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.2px' }}>ભાવ</th>
                <th style={{ borderRight: '1px solid #000', padding: '7px 4px', width: '13%', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.2px' }}>૧ દિવસનુ</th>
                <th style={{ borderRight: '1px solid #000', padding: '7px 4px', width: '11%', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.2px' }}>કુ. દિવસ</th>
                <th style={{ padding: '7px 8px', width: '15%', textAlign: 'right', fontWeight: 'bold', letterSpacing: '0.2px' }}>કુલ રકમ</th>
              </tr>
            </thead>
            <tbody>
              {/* Category Subtitle Row */}
              <tr style={{ borderBottom: '1px solid #000', backgroundColor: '#fafafa' }}>
                <td colSpan={7} style={{ padding: '4px 8px', fontWeight: 'bold', fontSize: '13px', fontStyle: 'italic' }}>
                  {(() => {
                    const cat = (billDetails.category || '').toLowerCase();
                    if (cat.includes('pharma') || cat.includes('ફર્મા')) return 'ફર્મા';
                    if (cat.includes('khapeda') || cat.includes('ખપેડા')) return 'ખપેડા';
                    if (cat.includes('jack') || cat.includes('જેક')) return 'જેક';
                    if (cat.includes('cuplock') || cat.includes('કપલોક')) return 'કપલોક';
                    if (cat.includes('shuttering') || cat.includes('શટરિંગ')) return 'શટરિંગ / પ્લેટ';
                    if (cat.includes('zhula') || cat.includes('ઝુલા') || cat.includes('ઝૂલા')) return 'ઝૂલા';
                    return 'સેન્ટિંગ / ભાડા સામાન';
                  })()}
                </td>
              </tr>

              {/* Previous Bill Row */}
              {previousBill && previousBill.amount > 0 && (
                <tr style={{ borderBottom: '1px solid #000' }}>
                  <td style={{ borderRight: '1px solid #000', padding: '6px 4px', textAlign: 'center' }}>-</td>
                  <td colSpan={5} style={{ borderRight: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>
                    અગાઉનું બિલ #{previousBill.billNumber} બાકી
                  </td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                    {formatIndianCurrency(previousBill.amount)}
                  </td>
                </tr>
              )}

              {/* Rental Charges Rows */}
              {rentalCharges.map((charge, index) => {
                const rowStartDate = charge.startDate ? formatLocalDate(charge.startDate) : formatLocalDate(billDetails.fromDate);
                const rowEndDate = charge.endDate ? formatLocalDate(charge.endDate) : formatLocalDate(billDetails.toDate);
                const dailyRate = charge.rate || billDetails.dailyRent;
                const oneDayAmount = Math.round(charge.pieces * dailyRate);
                const isZeroBalance = charge.pieces === 0 && charge.days === 0;

                const rowBg = index % 2 === 1 ? '#fafcff' : undefined;

                return (
                  <tr key={`charge-${index}`} style={{ borderBottom: '1px solid #000', height: '28px', backgroundColor: rowBg }}>
                    {/* 1. નંગ (Pieces) */}
                    <td style={{ borderRight: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                      {charge.pieces}
                    </td>

                    {/* 2. આ.તારીખ (Udhar Date) */}
                    <td style={{ borderRight: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontWeight: '500' }}>
                      {rowStartDate}
                    </td>

                    {/* 3. જ.તારીખ (Jama Date) */}
                    <td style={{ borderRight: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontWeight: '500' }}>
                      {isZeroBalance ? '-' : `થી ${rowEndDate}`}
                    </td>

                    {/* 4. ભાવ (Rate) */}
                    <td style={{ borderRight: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontWeight: '500' }}>
                      {isZeroBalance ? '-' : dailyRate}
                    </td>

                    {/* 5. ૧ દિવસનુ (1 Day Rent = Pieces * Rate) */}
                    <td style={{ borderRight: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontWeight: '600' }}>
                      {isZeroBalance ? '-' : formatIndianCurrency(oneDayAmount)}
                    </td>

                    {/* 6. કુ. દિવસ (Total Days) */}
                    <td style={{ borderRight: '1px solid #000', padding: '5px 4px', textAlign: 'center', fontWeight: 'bold' }}>
                      {isZeroBalance ? '-' : charge.days}
                    </td>

                    {/* 7. કુલ રકમ (Total Amount) */}
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      {isZeroBalance ? '-' : formatIndianCurrency(Math.round(charge.amount))}
                    </td>
                  </tr>
                );
              })}

              {/* Extra Costs Rows */}
              {extraCosts.map((cost, index) => {
                const desc = (cost.description || '')
                  .replace(/ભાડાની હમાલી \(ઉધાર ચલણ/g, 'ચડાય (ઉધાર ચલણ')
                  .replace(/ભાડાની હમાલી \(જમા ચલણ/g, 'ઉતરાય (જમા ચલણ');
                return (
                  <tr key={`extra-${index}`} style={{ borderBottom: '1px solid #000' }}>
                    <td style={{ borderRight: '1px solid #000', padding: '4px', textAlign: 'center' }}>-</td>
                    <td colSpan={5} style={{ borderRight: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>
                      {desc} {cost.pieces && cost.rate ? `(${cost.pieces} × ₹${cost.rate})` : ''}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      {formatIndianCurrency(cost.amount)}
                    </td>
                  </tr>
                );
              })}

              {/* Payments Received Rows */}
              {payments.map((payment, index) => {
                const methodLabel =
                  payment.method === 'cash' ? 'રોકડ' :
                  payment.method === 'bank' ? 'બેંક' :
                  payment.method === 'cheque' ? 'ચેક' :
                  payment.method === 'online' ? 'ઓનલાઇન' :
                  payment.method;
                return (
                  <tr key={`pay-${index}`} style={{ borderBottom: '1px solid #000' }}>
                    <td style={{ borderRight: '1px solid #000', padding: '4px', textAlign: 'center' }}>-</td>
                    <td colSpan={5} style={{ borderRight: '1px solid #000', padding: '6px 8px', fontWeight: 'bold' }}>
                      ચુકવણી મળી ({formatLocalDate(payment.date)} - {methodLabel} {payment.note ? `[${payment.note}]` : ''})
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                      -{formatIndianCurrency(payment.amount)}
                    </td>
                  </tr>
                );
              })}

              {/* Empty Rows Padding to match physical printed slip layout */}
              {Array.from({ length: Math.max(0, 10 - rentalCharges.length - extraCosts.length - payments.length) }).map((_, i) => (
                <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #e2e8f0', height: '26px' }}>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td style={{ borderRight: '1px solid #000' }}></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ══════════ MAIN NOTE ══════════ */}
        {mainNote && (
          <div style={{ borderTop: '1.5px solid #000', padding: '6px 10px', fontSize: '11px', fontWeight: '600' }}>
            નોંધ: {mainNote}
          </div>
        )}

        {/* ══════════ FOOTER SUMMARY SECTION (MATCHES UPLOADED IMAGE BOTTOM) ══════════ */}
        <div style={{ borderTop: '2px solid #000', display: 'grid', gridTemplateColumns: '1fr 220px' }}>
          {/* Left Column: Terms */}
          <div style={{ borderRight: '2px solid #000', padding: '8px 12px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '10.5px', fontWeight: 'bold', lineHeight: 1.4 }}>
              <div>• દર રવિવારે તથા જાહેર તહેવારે ઓફિસ બંધ રહેશે.</div>
              <div>• ભૂલ-ચૂક લેવી-દેવી.</div>
            </div>
          </div>

          {/* Right Column: TOTAL Box & Signature */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '0' }}>
            {/* TOTAL Header & Amount */}
            <div style={{ borderBottom: '2px solid #000', padding: '6px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '900' }}>કુલ રકમ</span>
              <span style={{ fontSize: '16px', fontWeight: '900' }}>
                {(() => {
                  const finalDue = summary.duePayment < 0 ? Math.abs(summary.duePayment) : summary.duePayment;
                  return formatIndianCurrency(Math.round(finalDue));
                })()}
              </span>
            </div>

            {/* Signature Area */}
            <div style={{ padding: '8px 10px', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '900' }}>
                ફોર, {company.name}
              </div>
              <div style={{ height: '25px' }}></div>
              <div style={{ fontSize: '10px', fontWeight: 'bold', borderTop: '1px dotted #000', paddingTop: '2px', width: '110px', textAlign: 'center' }}>
                અધિકૃત સહી
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BillInvoiceTemplate;
