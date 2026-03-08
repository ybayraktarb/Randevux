"use client"

import { useState, useEffect, useRef } from "react"
import { useChat, type Message } from "ai/react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, Send, Bot, User, Zap, MessageSquare, Loader2, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAiAccessAction } from "@/app/actions/ai.actions"

interface AIChatAssistantProps {
    businessId: string
}

export function AIChatAssistant({ businessId }: AIChatAssistantProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [hasAccess, setHasAccess] = useState<boolean | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
        api: "/api/chat",
        body: { businessId },
        initialMessages: [
            {
                id: "welcome",
                role: "assistant",
                content: "Merhaba! Ben akıllı asistanın. Sana randevu alma, hizmetlerimiz veya personellerimiz hakkında yardımcı olabilirim. Nasıl yardımcı olabilirim?"
            }
        ]
    })

    useEffect(() => {
        async function checkAccess() {
            try {
                const res = await getAiAccessAction(businessId)
                setHasAccess(res.hasAccess)
            } catch (err) {
                console.error("AI Access check failed:", err)
                setHasAccess(false)
            }
        }
        checkAccess()
    }, [businessId])

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    if (hasAccess === false) return null // Hide if no access

    const starterChips = [
        { label: "Bugün müsait mi?", icon: Calendar },
        { label: "Popüler hizmetler neler?", icon: Sparkles },
        { label: "Bana uygun saat öner", icon: Zap }
    ]

    return (
        <div className="fixed bottom-24 right-6 z-[60] md:bottom-32">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: "bottom right" }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-[32px] border border-white/20 bg-white/80 shadow-2xl backdrop-blur-3xl md:w-[400px]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between bg-gray-900 px-6 py-4 text-white">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                                    <Sparkles className="size-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black leading-none">Magic AI</h3>
                                    <p className="mt-1 text-[10px] font-bold text-white/40 uppercase tracking-widest">Akıllı Asistan</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="rounded-xl p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide"
                        >
                            {messages.map((m: Message) => (
                                <div
                                    key={m.id}
                                    className={cn(
                                        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                        m.role === "user" ? "flex-row-reverse" : "flex-row"
                                    )}
                                >
                                    <div className={cn(
                                        "flex size-8 shrink-0 items-center justify-center rounded-xl font-bold text-[10px]",
                                        m.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                                    )}>
                                        {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                                    </div>
                                    <div className={cn(
                                        "max-w-[80%] rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed",
                                        m.role === "user"
                                            ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10"
                                            : "bg-gray-50 text-gray-700 rounded-tl-none border border-gray-100"
                                    )}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="flex size-8 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
                                        <Loader2 className="size-4 animate-spin" />
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-gray-400 font-bold italic">
                                        Düşünüyorum...
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Starter Chips */}
                        {messages.length === 1 && (
                            <div className="flex gap-2 overflow-x-auto px-6 pb-2 scrollbar-hide">
                                {starterChips.map((chip) => (
                                    <button
                                        key={chip.label}
                                        onClick={() => append({ role: "user", content: chip.label })}
                                        className="flex items-center gap-2 whitespace-nowrap rounded-2xl border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-black text-primary hover:bg-primary/10 transition-all"
                                    >
                                        <chip.icon className="size-3" />
                                        {chip.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-4">
                            <div className="relative">
                                <input
                                    value={input}
                                    onChange={handleInputChange}
                                    placeholder="Bir şeyler sorun..."
                                    className="w-full rounded-2xl border border-gray-100 bg-gray-50/50 py-4 pl-6 pr-14 text-sm font-medium focus:border-primary/50 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={!input || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:hover:scale-100"
                                >
                                    <Send className="size-4" />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Floating Trigger Button */}
            <motion.button
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex size-14 items-center justify-center rounded-[24px] shadow-2xl shadow-primary/40 transition-all duration-500",
                    isOpen ? "bg-gray-900 text-white" : "bg-primary text-white"
                )}
            >
                {isOpen ? <X className="size-6" /> : <MessageSquare className="size-6" />}
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute -right-1 -top-1 size-5 rounded-full bg-accent border-2 border-white flex items-center justify-center"
                    >
                        <Zap className="size-3 text-white fill-current" />
                    </motion.div>
                )}
            </motion.button>
        </div>
    )
}
