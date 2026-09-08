import re

with open("src/app/dashboard/student/homework/[id]/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

replacement = """                  {/* Action Buttons */}
                  {!isCompleted && (
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="flex w-full sm:w-auto gap-3">
                        <GlassButton 
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex-1 sm:flex-none px-6 py-3 flex items-center justify-center gap-2"
                        >
                          <Camera className="w-4 h-4" /> Take Photo
                        </GlassButton>
                        <GlassButton 
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 sm:flex-none px-6 py-3 flex items-center justify-center gap-2"
                        >
                          <UploadCloud className="w-4 h-4" /> Upload
                        </GlassButton>
                      </div>
                      
                      <div className="w-full sm:w-auto sm:ml-auto">
                        <GradientButton 
                          onClick={handleSubmitSubjective} 
                          disabled={isSubmitting || isPastDue} 
                          className={`w-full sm:w-auto px-8 py-3 flex items-center justify-center gap-2 ${isPastDue ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isSubmitting ? (
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {isPastDue ? "Deadline Passed" : "Submit Assignment"}
                        </GradientButton>
                      </div>
                    </div>
                  )}

                  {/* Hidden inputs for Subjective uploads */}"""

content = content.replace("{/* Hidden inputs for Subjective uploads */}", replacement)

with open("src/app/dashboard/student/homework/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
