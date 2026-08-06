"use client";

import React, { forwardRef } from "react";
import { Invoice, Payment } from "@/store/feeStore";
import { Student } from "@/types";
import { ReceiptRecord } from "@/lib/firebase/receiptService";
import { IndianRupee, MapPin, Phone, Globe, User, BookOpen, Fingerprint, CalendarDays, Receipt, Clock, CreditCard, Hash } from "lucide-react";

interface OfficialReceiptProps {
  invoice: Invoice;
  payment: Payment;
  student: Student;
  receiptRecord: ReceiptRecord;
  instituteName?: string;
}

const OfficialReceipt = forwardRef<HTMLDivElement, OfficialReceiptProps>(({
  invoice,
  payment,
  student,
  receiptRecord,
  instituteName = "RUDRA"
}, ref) => {
  const receiptDate = new Date(receiptRecord.createdAt);
  const monthText = new Date(invoice.month).toLocaleString(undefined, { month: 'long', year: 'numeric' });
  const paymentDateText = new Date(payment.paymentDate).toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });
  const receiptDateText = receiptDate.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  if (!invoice || !payment || !student) return null;

  return (
    <div 
      ref={ref}
      id="receipt-export-container"
      className="w-[794px] min-h-[1123px] bg-white text-slate-900 p-[50px] relative flex flex-col mx-auto font-sans"
      style={{ 
        fontFamily: "'Inter', sans-serif",
        width: '794px', 
        minHeight: '1123px',
      }}
    >
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="text-blue-600">
              <svg width="48" height="48" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M40 20 L20 20 L20 30 L40 30 C50 30, 55 35, 55 45 C55 55, 50 60, 40 60 L20 60 L20 80 L35 80 L55 60 C65 55, 70 40, 60 25 C50 15, 30 15, 30 15 Z" fill="currentColor"/>
                <path d="M20 35 L40 35" stroke="white" strokeWidth="4"/>
                <circle cx="20" cy="25" r="5" fill="currentColor"/>
                <circle cx="20" cy="60" r="5" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tight text-blue-700 uppercase">{instituteName}</h1>
              <p className="text-slate-600 text-sm font-medium">Master Learning. Every Day.</p>
            </div>
          </div>
          <div>
            <div className="bg-[#1D4ED8] text-white font-bold px-6 py-2 rounded-md tracking-wider shadow-sm uppercase">
              FEE RECEIPT
            </div>
          </div>
        </div>

        {/* Title Line */}
        <div className="flex items-center justify-center my-6">
          <div className="h-px bg-blue-300 flex-1"></div>
          <h2 className="px-6 text-xl font-bold tracking-[0.1em] text-[#0F172A] uppercase">Payment Receipt</h2>
          <div className="h-px bg-blue-300 flex-1"></div>
        </div>

        {/* Top Meta Info */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-1">Receipt No.</p>
            <p className="font-bold text-[#1D4ED8]">{receiptRecord.id}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-600 mb-1">Receipt Date</p>
            <p className="font-bold text-[#1D4ED8]">{receiptDateText}</p>
          </div>
        </div>

        {/* Student Information */}
        <div className="relative border border-blue-500 rounded-xl p-6 mt-4 mb-10">
          <div className="absolute -top-[14px] left-6 bg-[#1D4ED8] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <User className="w-3 h-3" /> STUDENT INFORMATION
          </div>
          
          <div className="flex justify-between gap-8 pt-2">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-[140px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><User className="w-4 h-4 text-blue-600"/> Student Name</span>
                <span className="font-bold text-slate-900">{student.name}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><User className="w-4 h-4 text-blue-600"/> Father's Name</span>
                <span className="font-bold text-slate-900">Nilesh Kumar Pandey</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-600"/> Class / Batch</span>
                <span className="font-bold text-slate-900">Class {student.grade?.replace(/[^0-9]/g, '') || '10'} (All Students)</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><Fingerprint className="w-4 h-4 text-blue-600"/> Student ID</span>
                <span className="font-bold text-slate-900">{student.username}</span>
              </div>
              <div className="grid grid-cols-[140px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><Phone className="w-4 h-4 text-blue-600"/> Phone Number</span>
                <span className="font-bold text-slate-900">{student.parentPhone || '+91 98765 43210'}</span>
              </div>
            </div>
            {/* Student Photo Placeholder */}
            <div className="w-[120px] h-[160px] rounded-lg overflow-hidden bg-slate-200 border border-slate-300 shadow-sm shrink-0 flex items-center justify-center">
               {student.avatar && student.avatar.length > 10 ? (
                  <img src={student.avatar} alt="Student Photo" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-200 to-slate-100" />
               )}
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="relative border border-blue-500 rounded-xl p-6 mt-6 mb-10">
          <div className="absolute -top-[14px] left-6 bg-[#1D4ED8] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <Receipt className="w-3 h-3" /> PAYMENT DETAILS
          </div>
          
          <div className="flex justify-between gap-8 pt-2">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-[160px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600"/> Fee Type</span>
                <span className="font-bold text-slate-900">Monthly Tuition Fee</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><Clock className="w-4 h-4 text-blue-600"/> For Month</span>
                <span className="font-bold text-slate-900">{monthText}</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-600"/> Due Date</span>
                <span className="font-bold text-slate-900">{new Date(invoice.dueDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-600"/> Payment Mode</span>
                <span className="font-bold text-slate-900">{payment.mode}</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><Hash className="w-4 h-4 text-blue-600"/> Transaction ID / Ref. No.</span>
                <span className="font-bold text-slate-900">{payment.mode}/{payment.referenceNumber || 'N/A'}</span>
              </div>
              <div className="grid grid-cols-[160px_1fr] items-center text-sm">
                <span className="text-slate-600 font-medium flex items-center gap-2"><CalendarDays className="w-4 h-4 text-blue-600"/> Payment Date & Time</span>
                <span className="font-bold text-slate-900">{paymentDateText}</span>
              </div>
            </div>

            {/* Amount Details Box */}
            <div className="w-[280px] border border-blue-400 rounded-lg overflow-hidden shrink-0 flex flex-col bg-[#F8FAFC]">
              <div className="bg-[#EFF6FF] border-b border-blue-200 py-2 text-center text-sm font-bold text-[#1D4ED8] uppercase">
                Amount Details
              </div>
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-center text-sm">
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>Monthly Fee</span>
                  <span className="flex items-center"><IndianRupee className="w-3 h-3 mr-0.5"/> {invoice.baseAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>Discount</span>
                  <span className="flex items-center"><IndianRupee className="w-3 h-3 mr-0.5"/> {invoice.discountAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>Late Fee</span>
                  <span className="flex items-center"><IndianRupee className="w-3 h-3 mr-0.5"/> {invoice.lateFeeAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 font-medium">
                  <span>Previous Balance</span>
                  <span className="flex items-center"><IndianRupee className="w-3 h-3 mr-0.5"/> {invoice.previousBalance.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <div className="bg-white border-t border-blue-300 py-3 px-4 flex justify-between items-center text-blue-700 font-bold">
                <span className="uppercase">Total Paid</span>
                <span className="flex items-center text-lg"><IndianRupee className="w-4 h-4 mr-0.5"/> {payment.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Area - Signatures and Stamp */}
        <div className="flex justify-between items-end mt-auto mb-8 px-8">
          
          {/* PAID Stamp */}
          <div className="flex items-center justify-center -rotate-12 w-40 h-40 border-[6px] border-blue-700 text-blue-700 rounded-full shadow-sm">
             <div className="border-[2px] border-blue-700 w-[140px] h-[140px] rounded-full flex flex-col items-center justify-center relative">
               <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full animate-[spin_20s_linear_infinite]" style={{ transform: 'rotate(-45deg)' }}>
                  <path id="curve" d="M 10 50 A 40 40 0 1 1 90 50 A 40 40 0 1 1 10 50" fill="transparent" />
                  <text className="text-[12px] font-black tracking-[0.2em] uppercase" fill="currentColor">
                    <textPath href="#curve" startOffset="0%">
                      THANK YOU • THANK YOU • 
                    </textPath>
                  </text>
                </svg>
               <span className="text-4xl font-black tracking-tight uppercase relative z-10 bg-white px-2">PAID</span>
               <div className="h-[2px] bg-blue-700 w-20 mt-1 relative z-10"></div>
             </div>
          </div>

          <div className="relative border border-blue-400 rounded-lg p-4 w-[280px] bg-slate-50 text-center">
            <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 bg-[#1D4ED8] text-white text-[10px] font-bold px-4 py-1 rounded-full shadow-sm uppercase tracking-wider">
              VERIFIED BY
            </div>
            
            <div className="pt-2 pb-2 flex justify-center">
               <div className="font-[Signature] italic text-4xl text-slate-800 h-10 flex items-center justify-center opacity-80">
                 Adarsh
               </div>
            </div>
            
            <p className="font-bold text-[#1D4ED8] text-sm">Adarsh Pandey</p>
            <p className="text-xs text-slate-700 font-medium mt-1">Verified By: <span className="text-[#1D4ED8] font-bold">Adarsh Pandey</span></p>
            <p className="text-xs text-slate-600 mt-0.5">On: <span className="font-semibold text-slate-800">{paymentDateText}</span></p>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="text-center mb-6">
          <p className="text-[#1D4ED8] font-bold italic text-[15px]">Thank you for your payment!</p>
          <p className="text-[#1D4ED8] italic text-sm">Your timely payments help us maintain quality education.</p>
        </div>

        {/* Footer Links */}
        <div className="border-t border-blue-300 pt-4 px-2">
          <div className="flex justify-between items-center text-xs text-[#1D4ED8] font-medium">
            <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3"/> Rudra Classes, Knowledge Park, Greater Noida, UP</span>
            <span className="flex items-center gap-1.5"><Phone className="w-3 h-3"/> +91 98765 43210</span>
            <span className="flex items-center gap-1.5"><Globe className="w-3 h-3"/> www.rudraclasses.in</span>
          </div>
        </div>
      </div>
    </div>
  );
});

OfficialReceipt.displayName = "OfficialReceipt";

export default OfficialReceipt;
