import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Sync external changes (only if it doesn't match internal HTML to avoid cursor jumping)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const execCmd = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    editorRef.current?.focus();
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className={`flex flex-col border border-white/[0.12] rounded-xl overflow-hidden bg-[#07111F] focus-within:border-[#5B5CFF] transition-colors ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-white/[0.04] border-b border-white/[0.08]">
        <button type="button" onClick={() => execCmd('bold')} className="p-1.5 text-[#B6C2D9] hover:text-white hover:bg-white/[0.1] rounded transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => execCmd('italic')} className="p-1.5 text-[#B6C2D9] hover:text-white hover:bg-white/[0.1] rounded transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
        <button type="button" onClick={() => execCmd('underline')} className="p-1.5 text-[#B6C2D9] hover:text-white hover:bg-white/[0.1] rounded transition-colors" title="Underline"><Underline className="w-4 h-4" /></button>
        <div className="w-[1px] h-4 bg-white/[0.1] mx-1" />
        <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-1.5 text-[#B6C2D9] hover:text-white hover:bg-white/[0.1] rounded transition-colors" title="Bullet List"><List className="w-4 h-4" /></button>
        <button type="button" onClick={() => execCmd('insertOrderedList')} className="p-1.5 text-[#B6C2D9] hover:text-white hover:bg-white/[0.1] rounded transition-colors" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
      </div>
      
      {/* Editor Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="p-4 min-h-[120px] text-sm text-white outline-none prose prose-invert max-w-none"
        data-placeholder={placeholder}
        style={{
          cursor: "text"
        }}
      />
    </div>
  );
}
