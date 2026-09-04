import re

def insert_download_btn(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "Download" not in content:
        content = content.replace("Trash2, ArrowLeft", "Trash2, ArrowLeft, Download")
        content = content.replace("Trash2, ArrowLeft,", "Trash2, ArrowLeft, Download,")
        content = content.replace("Image as ImageIcon, ArrowLeft", "Image as ImageIcon, ArrowLeft, Download")
        content = content.replace("Image as ImageIcon, ArrowLeft,", "Image as ImageIcon, ArrowLeft, Download,")

    old_btns = """                    {/* Delete Message Button */}
                    <button 
                      onClick={() => handleDeleteMessage(msg.id)}
                      className={cn(
                        "opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-white/[0.06] text-[#7B8798] hover:text-[#EF4444] transition-all",
                        isMe ? "order-1" : "order-2"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>"""
    new_btns = """                    {/* Action Buttons */}
                    <div className={cn(
                      "opacity-0 group-hover:opacity-100 flex flex-col gap-1 transition-all",
                      isMe ? "order-1" : "order-2"
                    )}>
                      {msg.attachmentUrl && (
                        <a 
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="p-1.5 rounded-full hover:bg-white/[0.06] text-[#7B8798] hover:text-[#38BDF8] transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="p-1.5 rounded-full hover:bg-white/[0.06] text-[#7B8798] hover:text-[#EF4444] transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>"""
    content = content.replace(old_btns, new_btns)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

insert_download_btn("src/app/dashboard/student/chat/page.tsx")
insert_download_btn("src/app/dashboard/teacher/chat/page.tsx")
