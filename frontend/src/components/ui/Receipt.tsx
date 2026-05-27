'use client';

import React from 'react';
import { Printer, Download, X } from 'lucide-react';
import Button from './Button';
import { formatCurrency, formatDate } from '@/utils/helpers';

interface ReceiptProps {
  sale: {
    id: number;
    total_amount: number;
    payment_method: string;
    created_at: string;
    cashier_name?: string;
    items?: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
    }>;
  };
  store: {
    store_name: string;
    address?: string;
    phone?: string;
  };
  onClose?: () => void;
}

export default function Receipt({ sale, store, onClose }: ReceiptProps) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt #${sale.id}</title>
            <style>
              body { font-family: 'Courier New', monospace; max-width: 300px; margin: 20px auto; }
              .receipt { padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
              .store-name { font-size: 18px; font-weight: bold; }
              .item { display: flex; justify-content: space-between; margin: 5px 0; }
              .total { border-top: 2px solid #000; margin-top: 10px; padding-top: 10px; font-weight: bold; }
              .footer { text-align: center; margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="receipt">
              <div class="header">
                <div class="store-name">${store.store_name}</div>
                ${store.address ? `<div>${store.address}</div>` : ''}
                ${store.phone ? `<div>${store.phone}</div>` : ''}
              </div>
              
              <div>
                <div><strong>Receipt #${sale.id}</strong></div>
                <div>Date: ${formatDate(sale.created_at, 'long')}</div>
                <div>Cashier: ${sale.cashier_name || 'N/A'}</div>
              </div>

              <div style="margin: 15px 0;">
                ${sale.items?.map(item => `
                  <div class="item">
                    <span>${item.product_name} x${item.quantity}</span>
                    <span>${formatCurrency(item.unit_price * item.quantity)}</span>
                  </div>
                  <div style="font-size: 12px; color: #666; margin-left: 10px;">
                    @ ${formatCurrency(item.unit_price)} each
                  </div>
                `).join('') || ''}
              </div>

              <div class="total">
                <div class="item">
                  <span>TOTAL</span>
                  <span>${formatCurrency(sale.total_amount)}</span>
                </div>
                <div class="item">
                  <span>Payment Method</span>
                  <span style="text-transform: uppercase;">${sale.payment_method}</span>
                </div>
              </div>

              <div class="footer">
                <div>Thank you for your business!</div>
                <div style="margin-top: 10px; font-size: 12px;">Powered by POS System</div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 no-print">
          <h2 className="text-lg font-semibold text-gray-900">Receipt</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Receipt Content */}
        <div className="p-6 font-mono text-sm">
          {/* Store Info */}
          <div className="text-center mb-6 pb-4 border-b-2 border-dashed border-gray-300">
            <h3 className="text-xl font-bold mb-2">{store.store_name}</h3>
            {store.address && <p className="text-gray-600">{store.address}</p>}
            {store.phone && <p className="text-gray-600">{store.phone}</p>}
          </div>

          {/* Receipt Info */}
          <div className="mb-4 space-y-1">
            <div className="flex justify-between">
              <span className="font-semibold">Receipt #</span>
              <span>{sale.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Date</span>
              <span>{formatDate(sale.created_at, 'long')}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold">Cashier</span>
              <span>{sale.cashier_name || 'N/A'}</span>
            </div>
          </div>

          {/* Items */}
          <div className="my-6 space-y-3">
            <div className="border-b border-gray-300 pb-2">
              <div className="flex justify-between font-semibold">
                <span>Item</span>
                <span>Amount</span>
              </div>
            </div>
            {sale.items?.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between">
                  <span className="flex-1">
                    {item.product_name} x{item.quantity}
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(item.unit_price * item.quantity)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 ml-2">
                  @ {formatCurrency(item.unit_price)} each
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-800 pt-3 mt-4 space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(sale.total_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method</span>
              <span className="uppercase font-semibold">{sale.payment_method}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t-2 border-dashed border-gray-300">
            <p className="font-semibold">Thank you for your business!</p>
            <p className="text-xs text-gray-500 mt-2">Powered by POS System</p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-200 flex gap-3 no-print">
          <Button
            variant="primary"
            fullWidth
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Receipt
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-print,
          .receipt-print * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}