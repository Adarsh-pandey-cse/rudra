import re

with open("src/app/dashboard/student/homework/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

action_buttons_start = content.find("{/* Action Buttons */}")
action_buttons_end = content.find("{/* Hidden inputs for Subjective uploads */}")

if action_buttons_start != -1 and action_buttons_end != -1:
    new_ui = """{/* Action Buttons and Drag & Drop */}
                  {!isCompleted ? (
                    <div className="flex flex-col gap-5 mt-4 items-center">
                      <div
                        onDragOver={e => { if (isPastDue) return; e.preventDefault(); !isUploading && setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => { if (isPastDue) return; e.preventDefault(); setIsDragging(false); const target = e.dataTransfer; if (!isUploading && target.files && target.files.length > 0) handleFileChange({ target } as any); }}
                        onClick={() => !isPastDue && !isUploading && fileInputRef.current?.click()}
                        className={`w-full max-w-2xl mx-auto border-2 border-dashed rounded-[14px] p-8 flex flex-col items-center justify-center text-center transition-colors ${isPastDue ? "cursor-not-allowed border-red-500/20 bg-red-500/5 opacity-70" : isUploading ? "cursor-not-allowed border-white/[0.1] bg-white/[0.02]" : isDragging ? "cursor-pointer border-[#4F9DFF] bg-[#4F9DFF]/10" : "cursor-pointer border-white/[0.12] hover:bg-white/[0.04]"}`}
                      >
                        {isPastDue ? (
                          <>
                            <div className="p-4 bg-red-500/10 border border-red-500/20 shadow-lg rounded-full mb-4">
                              <UploadCloud className="w-6 h-6 text-red-400" />
                            </div>
                            <p className="text-[15px] text-red-400 font-bold mb-1.5">Deadline Passed</p>
                            <p className="text-xs text-red-400/70">Submissions are closed. Ask your teacher to extend the deadline.</p>
                          </>
                        ) : isUploading ? (<div className="scale-75"><UploadProgressRing /></div>) : (
                          <>
                            <div className="p-4 bg-white/[0.03] border border-white/[0.05] shadow-lg rounded-full mb-4">
                              <UploadCloud className={`w-6 h-6 ${isDragging ? "text-[#4F9DFF]" : "text-[#7B8798]"}`} />
                            </div>
                            <p className="text-[15px] text-white font-medium mb-1.5">Tap to Upload or Drag files here</p>
                            <p className="text-xs text-[#7B8798]">Supports JPG, PNG, HEIC</p>
                          </>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-2xl mx-auto">
                        <GlassButton 
                          onClick={(e) => { e.stopPropagation(); cameraInputRef.current?.click(); }}
                          disabled={isUploading || isPastDue}
                          className="w-full sm:w-1/3 py-3 border-[#8B5CF6]/30 hover:bg-[#8B5CF6]/10 text-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                        >
                          <Camera className="w-4 h-4 mr-2" /> Take Photo
                        </GlassButton>
                        
                        <GlassButton 
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          disabled={isUploading || isPastDue}
                          className="w-full sm:w-1/3 py-3 border-[#4F9DFF]/30 hover:bg-[#4F9DFF]/10 text-[#4F9DFF] disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                        >
                          <UploadCloud className="w-4 h-4 mr-2" /> Upload File
                        </GlassButton>
                      
                        <GradientButton 
                          onClick={handleSubmitSubjective} 
                          disabled={isSubmitting || isUploading || isPastDue} 
                          className="w-full sm:w-1/3 py-3 disabled:opacity-50 disabled:cursor-not-allowed justify-center"
                        >
                          {isSubmitting ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Submit Work
                        </GradientButton>
                      </div>
                    </div>
                  ) : null}

                  """
    
    content = content[:action_buttons_start] + new_ui + content[action_buttons_end:]
    
    with open("src/app/dashboard/student/homework/[id]/page.tsx", "w", encoding="utf-8") as f:
        f.write(content)
else:
    print("Could not find delimiters")
