"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Image as ImageIcon, FileText, Share2, Printer, Copy, Check, Download } from 'lucide-react';
import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { cn } from '@/lib/utils';
import { FeeReceiptTemplate, FeeReceiptData } from './FeeReceiptTemplate';

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FeeReceiptData | null;
}

export function FeeReceiptModal({ isOpen, onClose, data }: FeeReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Dynamically calculate scale based on container width
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const targetWidth = 794; 
        const padding = window.innerWidth < 768 ? 20 : 40;
        const newScale = Math.min(1, (containerWidth - padding) / targetWidth);
        setScale(newScale);
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [isOpen]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const getFileName = (ext: string) => {
    const safeName = data.student.name.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    const month = data.payment.month.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase();
    return `RUDRA_RECEIPT_${month}_${safeName}.${ext}`;
  };

  const handleExport = async (type: 'jpg' | 'png' | 'pdf') => {
    if (!receiptRef.current) return;
    setIsGenerating(type);
    
    try {
      // Ensure fonts and images are loaded before capturing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const element = receiptRef.current;
      const options = { 
        pixelRatio: 3,
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      };

      if (type === 'jpg') {
        const dataUrl = await toJpeg(element, { ...options, quality: 1, backgroundColor: '#ffffff' });
        downloadLink(dataUrl, getFileName('jpg'));
        uploadToFirebase(dataUrl, 'jpg');
      } else if (type === 'png') {
        const dataUrl = await toPng(element, options);
        downloadLink(dataUrl, getFileName('png'));
        uploadToFirebase(dataUrl, 'png');
      } else if (type === 'pdf') {
        const dataUrl = await toPng(element, options);
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        pdf.save(getFileName('pdf'));
        uploadToFirebase(dataUrl, 'pdf');
      }
    } catch (error) {
      console.error('Failed to generate receipt:', error);
      alert('Failed to generate receipt. Please try again.');
    } finally {
      setIsGenerating(null);
    }
  };

  const uploadToFirebase = async (dataUrl: string, type: string) => {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const { receiptService } = await import('@/lib/firebase/receiptService');
      await receiptService.uploadAsset(blob, `receipts/${data.receiptNumber}.${type}`);
    } catch (e) {
      console.error("Firebase upload failed", e);
    }
  };

  const downloadLink = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = async () => {
    if (!receiptRef.current) return;
    setIsGenerating('print');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(receiptRef.current, { pixelRatio: 3, style: { transform: 'scale(1)', transformOrigin: 'top left' } });
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print Receipt</title>
              <style>
                @page { margin: 0; size: A4 portrait; }
                body { margin: 0; display: flex; justify-content: center; align-items: flex-start; background: #fff; }
                img { width: 100%; max-width: 210mm; height: auto; }
              </style>
            </head>
            <body>
              <img src="${dataUrl}" onload="window.print();window.close();" />
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rudra Fee Receipt',
          text: `Fee receipt for ${data.student.name} - ${data.payment.month}`,
          url: `https://rudra.app/verify/${data.receiptNumber}`,
        });
      } catch (e) {
        console.error('Share failed', e);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(data.receiptNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && data && (
        <div key="fee-receipt-modal" className="fixed inset-0 z-[100] flex items-center justify-center">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-[#07111F]/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-[1200px] max-h-[95dvh] mx-4 flex flex-col md:flex-row gap-4 md:gap-6 overflow-y-auto md:overflow-hidden pb-24 md:pb-0"
        >
          {/* Main Preview Area */}
          <div className="w-full md:flex-1 flex flex-col bg-white/[0.02] border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm shrink-0 md:shrink h-[60dvh] md:h-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
              <div>
                <h2 className="text-lg font-bold text-white">Payment Receipt</h2>
                <p className="text-xs text-[#7B8798]">Download your tuition payment receipt</p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/[0.05] text-[#B6C2D9] hover:bg-white/[0.1] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div ref={containerRef} className="flex-1 overflow-auto p-4 md:p-8 flex items-start justify-center receipt-scroll-container custom-scrollbar">
              {/* Scaled Wrapper for Preview */}
              <div 
                className="relative origin-top transition-transform duration-300"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: 'top center',
                  marginBottom: `-${1123 * (1 - scale)}px` // Fix container height collapse
                }}
              >
                <FeeReceiptTemplate data={data} ref={receiptRef} />
              </div>
            </div>
          </div>

          {/* Action Sidebar */}
          <div className="w-full md:w-80 flex flex-col gap-4">
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-4">Export Options</h3>
              
              <div className="space-y-3">
                <ExportButton 
                  icon={Download} 
                  label="Download PDF" 
                  desc="Professional A4 format"
                  onClick={() => handleExport('pdf')}
                  loading={isGenerating === 'pdf'}
                  primary
                />
                
                <ExportButton 
                  icon={ImageIcon} 
                  label="Save to Gallery (PNG)"
                  desc="High quality image format"
                  onClick={() => handleExport('png')}
                  loading={isGenerating === 'png'}
                />
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/[0.08] rounded-3xl p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-4">Share Options</h3>
              
              <div className="space-y-3">
                <ExportButton 
                  icon={Printer} 
                  label="Print Receipt" 
                  desc="Direct to printer"
                  onClick={handlePrint}
                  loading={isGenerating === 'print'}
                />
                <ExportButton 
                  icon={Share2} 
                  label="Share..." 
                  desc="Share via apps"
                  onClick={handleShare}
                />
                <ExportButton 
                  icon={copied ? Check : Copy} 
                  label={copied ? "Copied!" : "Copy Receipt Number"} 
                  desc={data.receiptNumber}
                  onClick={handleCopyLink}
                  success={copied}
                />
              </div>
            </div>
            
            <div className="mt-auto bg-[#131D2E]/80 border border-[#5B5CFF]/20 rounded-2xl p-4 flex items-start gap-3 backdrop-blur-md">
              <div className="w-6 h-6 rounded-full bg-[#5B5CFF]/20 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5 text-[#5B5CFF]" />
              </div>
              <p className="text-[11px] text-[#B6C2D9] leading-relaxed">
                <strong className="text-white block mb-1">Authenticity Guaranteed</strong>
                This is a digitally generated receipt and does not require a physical signature.
              </p>
            </div>
          </div>

        </motion.div>
        
        <style dangerouslySetInnerHTML={{__html: `
          .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}} />
      </div>
      )}
    </AnimatePresence>
  );
}

const ExportButton = ({ 
  icon: Icon, 
  label, 
  desc,
  onClick, 
  loading,
  primary,
  success
}: { 
  icon: any, 
  label: string, 
  desc?: string,
  onClick: () => void, 
  loading?: boolean,
  primary?: boolean,
  success?: boolean
}) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        "relative w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-300 overflow-hidden group",
        primary 
          ? "bg-gradient-to-r from-[#5B5CFF] to-[#4F9DFF] text-white hover:shadow-[0_0_20px_rgba(91,92,255,0.4)] hover:scale-[1.02]" 
          : success
            ? "bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E]"
            : "bg-white/[0.04] border border-white/[0.08] text-[#B6C2D9] hover:bg-white/[0.08] hover:text-white"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
        primary ? "bg-white/20" : success ? "bg-[#22C55E]/20" : "bg-white/[0.06] group-hover:bg-white/[0.1]"
      )}>
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>
      
      <div className="text-left flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{label}</p>
        {desc && <p className={cn("text-[10px] truncate opacity-70", primary ? "text-blue-100" : "")}>{desc}</p>}
      </div>
      
      {/* Ripple Effect overlay */}
      <div className="absolute inset-0 opacity-0 group-active:opacity-20 bg-white transition-opacity duration-150 rounded-xl" />
    </button>
  );
};
