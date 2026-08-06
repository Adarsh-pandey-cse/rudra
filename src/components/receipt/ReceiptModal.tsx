"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Info } from "lucide-react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";
import GlassButton from "@/components/ui/GlassButton";
import GradientButton from "@/components/ui/GradientButton";
import OfficialReceipt from "./OfficialReceipt";
import { Invoice, Payment } from "@/store/feeStore";
import { Student } from "@/types";
import { ReceiptRecord, receiptService } from "@/lib/firebase/receiptService";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  payment: Payment;
  student: Student;
  receiptRecord: ReceiptRecord;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  invoice,
  payment,
  student,
  receiptRecord
}: ReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const getExportName = (ext: string) => `Receipt_${receiptRecord.id.replace(/\//g, '')}.${ext}`;

  const handleExportPNG = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(receiptRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = getExportName('png');
      link.href = dataUrl;
      link.click();
      receiptService.logAudit("Student Downloaded PNG", student.id, { receiptId: receiptRecord.id });
    } catch (err) {
      console.error("Failed to export PNG", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!receiptRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(receiptRef.current, { quality: 1.0, pixelRatio: 2 });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (receiptRef.current.offsetHeight * pdfWidth) / receiptRef.current.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(getExportName('pdf'));
      
      receiptService.logAudit("Student Downloaded PDF", student.id, { receiptId: receiptRecord.id });
    } catch (err) {
      console.error("Failed to export PDF", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0F172A]/90 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-full flex flex-col z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Fee Receipt
                </h2>
                <p className="text-slate-400 text-sm mt-1">Download your payment receipt</p>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 bg-[#151C2C] rounded-2xl border border-white/5 overflow-hidden flex flex-col p-6 max-h-[85vh]">
              
              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mb-6">
                <button 
                  onClick={handleExportPDF} 
                  disabled={isExporting}
                  className="px-4 py-2 rounded-md bg-transparent border border-slate-600 text-white font-semibold flex items-center gap-2 hover:bg-slate-800 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" /> Save as PDF
                </button>
                <button 
                  onClick={handleExportPNG} 
                  disabled={isExporting}
                  className="px-4 py-2 rounded-md bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold flex items-center gap-2 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" /> Save to Gallery
                </button>
              </div>

              {/* Receipt Area (Scrollable) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex justify-center pb-6">
                <div 
                  className="origin-top" 
                  style={{ 
                    transform: 'scale(min(1, calc((100vw - 6rem) / 794)))',
                    marginBottom: 'calc(1123px * min(1, calc((100vw - 6rem) / 794)) - 1123px)'
                  }}
                >
                  <div className="shadow-2xl rounded-sm overflow-hidden">
                    <OfficialReceipt 
                      ref={receiptRef}
                      invoice={invoice}
                      payment={payment}
                      student={student}
                      receiptRecord={receiptRecord}
                    />
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="mt-4 bg-[#1E293B] border border-slate-700/50 rounded-lg p-4 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#3B82F6] flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-white" />
                </div>
                <p className="text-slate-300 text-sm">
                  <span className="font-bold text-slate-200">Note:</span> This is a system generated receipt and does not require physical signature.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
