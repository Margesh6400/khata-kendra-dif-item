import { PDFDocument } from 'pdf-lib';
import React from 'react';
import { generateBillJPEG } from './generateBillJPEG';
import BillInvoiceTemplate from '../components/BillInvoiceTemplate';

type BillInvoiceProps = React.ComponentProps<typeof BillInvoiceTemplate>;

/**
 * Converts a base64 Data URL to a Uint8Array.
 */
function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates a PDF from the bill invoice rendering and returns the PDF as a Data URL.
 */
export const generateBillPDF = async (
  billNumber: string,
  billData: BillInvoiceProps
): Promise<string> => {
  // First render to high-resolution JPEG via html2canvas
  const jpegDataUrl = await generateBillJPEG(billNumber, billData);
  const jpegBytes = dataUrlToBytes(jpegDataUrl);

  const pdf = await PDFDocument.create();
  const embeddedJpg = await pdf.embedJpg(jpegBytes);

  // A4 standard width in points is 595.28 pt
  const pageWidthPt = 595;
  const pageHeightPt = pageWidthPt * (embeddedJpg.height / embeddedJpg.width);

  const page = pdf.addPage([pageWidthPt, pageHeightPt]);
  page.drawImage(embeddedJpg, {
    x: 0,
    y: 0,
    width: pageWidthPt,
    height: pageHeightPt,
  });

  const pdfBytes = await pdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
};
