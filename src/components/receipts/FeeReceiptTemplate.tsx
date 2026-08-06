"use client";

import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from '@/lib/utils';
import { IndianRupee, MapPin, Phone, Globe } from 'lucide-react';

export interface FeeReceiptData {
  receiptNumber: string;
  receiptDate: string;
  student: {
    name: string;
    fatherName: string;
    classBatch: string;
    studentId: string;
    phone: string;
    photoUrl?: string;
  };
  payment: {
    feeType: string;
    month: string;
    dueDate: string;
    mode: string;
    transactionId: string;
    paymentDateTime: string;
  };
  breakdown: {
    monthlyFee: number;
    discount: number;
    lateFee: number;
    previousBalance: number;
    totalPaid: number;
  };
  verification: {
    verifierName: string;
    verifiedDateTime: string;
    isSystemVerified: boolean;
  };
}

interface FeeReceiptTemplateProps {
  data: FeeReceiptData;
}

export const FeeReceiptTemplate = forwardRef<HTMLDivElement, FeeReceiptTemplateProps>(
  ({ data }, ref) => {
    
    const qrData = JSON.stringify({
      rid: data.receiptNumber,
      sid: data.student.studentId,
      url: `https://rudra.app/verify/${data.receiptNumber}`
    });

    return (
      <div 
        ref={ref} 
        className="bg-white text-slate-900 w-[794px] h-[1123px] relative mx-auto overflow-hidden shadow-2xl flex flex-col font-sans"
        style={{ WebkitFontSmoothing: 'antialiased' }}
      >
        {/* Top Header */}
        <div className="flex justify-between items-start px-12 pt-12 pb-6">
          <div className="flex items-center gap-3">
            {/* Rudra Logo SVG */}
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 0C10.745 0 0 10.745 0 24C0 37.255 10.745 48 24 48C37.255 48 48 37.255 48 24C48 10.745 37.255 0 24 0ZM32.19 16.5C32.19 16.5 29.835 24.36 29.745 24.63C29.43 25.56 28.53 26.25 27.525 26.25H20.25V33.75C20.25 35.4 18.9 36.75 17.25 36.75C15.6 36.75 14.25 35.4 14.25 33.75V14.25C14.25 12.6 15.6 11.25 17.25 11.25H27.75C31.47 11.25 34.5 14.28 34.5 18C34.5 19.38 34.08 20.67 33.36 21.75L36.315 26.43C36.93 27.39 36.63 28.68 35.67 29.295C34.71 29.91 33.42 29.61 32.805 28.65L29.34 23.25H20.25V17.25H27.75C28.17 17.25 28.5 16.92 28.5 16.5H32.19Z" fill="#1D4ED8"/>
            </svg>
            <div>
              <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight leading-none mb-1">RUDRA</h1>
              <p className="text-xs text-slate-500 font-medium">Master Learning. Every Day.</p>
            </div>
          </div>
          <div className="bg-[#1D4ED8] text-white px-5 py-2.5 rounded-lg font-bold text-sm tracking-widest shadow-md">
            FEE RECEIPT
          </div>
        </div>

        {/* Divider with Title */}
        <div className="flex items-center justify-center px-12 mb-8">
          <div className="h-px bg-slate-200 flex-1" />
          <h2 className="px-6 text-xl font-bold text-slate-800 tracking-[0.2em]">PAYMENT RECEIPT</h2>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Receipt Meta */}
        <div className="flex justify-between px-12 mb-8">
          <div>
            <p className="text-[11px] text-slate-500 font-semibold mb-1 uppercase">Receipt No.</p>
            <p className="text-base font-bold text-[#1D4ED8]">{data.receiptNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500 font-semibold mb-1 uppercase">Receipt Date</p>
            <p className="text-base font-bold text-[#1D4ED8]">{data.receiptDate}</p>
          </div>
        </div>

        <div className="flex-1 px-12 space-y-8">
          {/* Student Information Section */}
          <div className="relative border border-[#2563EB]/20 rounded-2xl p-6 pt-8">
            <div className="absolute -top-3 left-6 bg-[#2563EB] text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              STUDENT INFORMATION
            </div>
            
            <div className="flex justify-between items-center">
              <div className="space-y-4 flex-1">
                <InfoRow icon="user" label="Student Name" value={data.student.name} />
                <InfoRow icon="user" label="Father's Name" value={data.student.fatherName} />
                <InfoRow icon="book" label="Class / Batch" value={data.student.classBatch} />
                <InfoRow icon="id" label="Student ID" value={data.student.studentId} />
                <InfoRow icon="phone" label="Phone Number" value={data.student.phone} />
              </div>
              {data.student.photoUrl && (
                <div className="w-28 h-36 rounded-xl border-4 border-slate-100 overflow-hidden shrink-0 shadow-sm ml-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.student.photoUrl} alt="Student" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Payment Details Section */}
          <div className="relative border border-[#2563EB]/20 rounded-2xl p-6 pt-8">
            <div className="absolute -top-3 left-6 bg-[#2563EB] text-white px-4 py-1 rounded-full text-xs font-bold tracking-wide flex items-center gap-2 shadow-sm">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>
              PAYMENT DETAILS
            </div>

            <div className="flex gap-8">
              <div className="flex-1 space-y-4">
                <InfoRow icon="clock" label="Fee Type" value={data.payment.feeType} />
                <InfoRow icon="clock" label="For Month" value={data.payment.month} />
                <InfoRow icon="calendar" label="Due Date" value={data.payment.dueDate} />
                <InfoRow icon="card" label="Payment Mode" value={data.payment.mode} />

                <InfoRow icon="calendar" label="Payment Date & Time" value={data.payment.paymentDateTime} />
              </div>

              {/* Amount Breakdown Box */}
              <div className="w-72 border border-blue-100 rounded-xl overflow-hidden bg-slate-50/50 flex flex-col z-10">
                <div className="bg-blue-50 py-3 text-center border-b border-blue-100">
                  <span className="text-xs font-bold text-[#1D4ED8] tracking-widest">AMOUNT DETAILS</span>
                </div>
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-center">
                  <AmountRow label="Monthly Fee" amount={data.breakdown.monthlyFee} />
                  <AmountRow label="Discount" amount={data.breakdown.discount} />
                  <AmountRow label="Late Fee" amount={data.breakdown.lateFee} />
                  <AmountRow label="Previous Balance" amount={data.breakdown.previousBalance} />
                </div>
                <div className="p-4 border-t border-blue-100 bg-white flex justify-between items-center rounded-b-xl">
                  <span className="text-sm font-bold text-[#1D4ED8] uppercase tracking-wider">Total Paid</span>
                  <span className="text-lg font-bold text-[#1D4ED8] flex items-center">
                    <IndianRupee className="w-4 h-4 mr-0.5" />
                    {data.breakdown.totalPaid.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section (Stamp, QR, Verification) */}
        <div className="flex justify-between items-end px-12 mt-auto mb-16 relative">
          
          {/* PAID Stamp Graphic */}
          <div className="relative w-40 h-40">
            <svg viewBox="0 0 200 200" className="w-full h-full text-[#2563EB] opacity-90 transform -rotate-12">
              <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="8 4" />
              <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="2" />
              <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="1" />
              <path id="curve" d="M 30 100 A 70 70 0 1 1 170 100 A 70 70 0 1 1 30 100" fill="transparent" />
              <text fill="currentColor" fontSize="22" fontWeight="bold" letterSpacing="6">
                <textPath href="#curve" startOffset="50%" textAnchor="middle">THANK YOU • THANK YOU • </textPath>
              </text>
              <text x="100" y="115" fontSize="46" fontWeight="900" textAnchor="middle" fill="currentColor">PAID</text>
            </svg>
          </div>

          <div className="flex flex-col items-center">
            <QRCodeSVG value={qrData} size={72} level="M" includeMargin={false} className="opacity-90" />
            <span className="text-[8px] text-slate-400 mt-2">Scan to Verify</span>
          </div>

          {/* Verification Box */}
          <div className="relative border border-blue-100 rounded-xl p-5 w-64 text-center bg-slate-50/30">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#2563EB] text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase whitespace-nowrap">
              Verified By
            </div>
            
            {/* Signature Font */}
            <div className="h-12 flex items-center justify-center mt-3 mb-1">
              <span className="text-3xl text-slate-800" style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive", fontStyle: 'italic' }}>
                {data.verification.verifierName}
              </span>
            </div>
            
            {/* Printed Name */}
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2">
              {data.verification.verifierName}
            </div>
            
            <p className="text-[10px] text-slate-500 leading-tight border-t border-blue-100/50 pt-2 mx-2">
              On: <span className="font-semibold text-slate-700">{data.verification.verifiedDateTime}</span>
            </p>
          </div>
        </div>

        {/* Thank You Message */}
        <div className="text-center px-12 mb-8 space-y-1">
          <p className="text-sm font-bold text-[#1D4ED8] italic">Thank you for your payment!</p>
          <p className="text-xs text-slate-500 italic">Your timely payments help us maintain quality education.</p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-12 py-5 flex justify-between items-center mt-auto">
          <div className="flex items-center gap-1.5 text-[10px] text-[#1D4ED8] font-medium">
            <MapPin className="w-3.5 h-3.5" />
            <span>Rudra Classes, Knowledge Park, Greater Noida, UP</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#1D4ED8] font-medium">
            <Phone className="w-3.5 h-3.5" />
            <span>+91 98765 43210</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#1D4ED8] font-medium">
            <Globe className="w-3.5 h-3.5" />
            <span>www.rudraclasses.in</span>
          </div>
        </div>

        {/* Background Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none z-[-1]">
          <svg width="400" height="400" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M24 0C10.745 0 0 10.745 0 24C0 37.255 10.745 48 24 48C37.255 48 48 37.255 48 24C48 10.745 37.255 0 24 0ZM32.19 16.5C32.19 16.5 29.835 24.36 29.745 24.63C29.43 25.56 28.53 26.25 27.525 26.25H20.25V33.75C20.25 35.4 18.9 36.75 17.25 36.75C15.6 36.75 14.25 35.4 14.25 33.75V14.25C14.25 12.6 15.6 11.25 17.25 11.25H27.75C31.47 11.25 34.5 14.28 34.5 18C34.5 19.38 34.08 20.67 33.36 21.75L36.315 26.43C36.93 27.39 36.63 28.68 35.67 29.295C34.71 29.91 33.42 29.61 32.805 28.65L29.34 23.25H20.25V17.25H27.75C28.17 17.25 28.5 16.92 28.5 16.5H32.19Z" fill="#1D4ED8"/>
          </svg>
        </div>
      </div>
    );
  }
);

FeeReceiptTemplate.displayName = 'FeeReceiptTemplate';

const InfoRow = ({ icon, label, value }: { icon: string, label: string, value: string }) => {
  
  const renderIcon = () => {
    switch(icon) {
      case 'user': return <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
      case 'book': return <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
      case 'id': return <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>;
      case 'phone': return <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
      case 'clock': return <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'calendar': return <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      case 'card': return <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
      case 'hash': return <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>;
      default: return null;
    }
  };

  return (
    <div className="flex text-[13px]">
      <div className="w-48 text-slate-500 font-medium flex items-center gap-2">
        {renderIcon()}
        {label}
      </div>
      <div className="font-bold text-slate-800 flex-1">{value}</div>
    </div>
  );
};

const AmountRow = ({ label, amount }: { label: string, amount: number }) => (
  <div className="flex justify-between items-center text-[13px]">
    <span className="text-slate-600 font-medium">{label}</span>
    <span className="text-slate-800 font-bold flex items-center">
      <IndianRupee className="w-3.5 h-3.5 mr-0.5 text-slate-400" />
      {amount.toLocaleString('en-IN')}
    </span>
  </div>
);
