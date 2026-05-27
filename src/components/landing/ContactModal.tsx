import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { ScrambleText } from "./ScrambleText";
import { soundManager } from "./SoundManager";

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [visaType, setVisaType] = useState("O-1");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playClick();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName("");
      setEmail("");
      setMessage("");
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-end">
          {/* Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Sidebar Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 220 }}
            className="relative z-10 h-full w-full max-w-lg border-l border-white/10 bg-black/80 px-6 py-20 backdrop-blur-2xl sm:px-12 md:max-w-xl flex flex-col justify-between"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-6" />
            </button>

            <div>
              <div className="mb-10">
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--landing-muted)]">
                  Contact Protocol
                </span>
                <h3 className="mt-2 text-2xl font-light text-white sm:text-3xl leading-tight">
                  Initiate your U.S. visa plan with{" "}
                  <span className="text-[var(--landing-accent)] font-medium">VisaIQ</span>.
                </h3>
              </div>

              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    onSubmit={handleSubmit}
                    className="flex flex-col gap-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Name Input */}
                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[9px] uppercase tracking-wider text-[var(--landing-muted)]">
                        Your Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="h-11 border border-white/10 bg-white/5 px-4 font-mono text-xs text-white placeholder-white/20 outline-none focus:border-[var(--landing-accent)] focus:bg-white/10 transition-all rounded-none"
                      />
                    </div>

                    {/* Email Input */}
                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[9px] uppercase tracking-wider text-[var(--landing-muted)]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="h-11 border border-white/10 bg-white/5 px-4 font-mono text-xs text-white placeholder-white/20 outline-none focus:border-[var(--landing-accent)] focus:bg-white/10 transition-all rounded-none"
                      />
                    </div>

                    {/* Visa Interest */}
                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[9px] uppercase tracking-wider text-[var(--landing-muted)]">
                        Visa Category
                      </label>
                      <select
                        value={visaType}
                        onChange={(e) => setVisaType(e.target.value)}
                        className="h-11 border border-white/10 bg-white/5 px-4 font-mono text-xs text-white outline-none focus:border-[var(--landing-accent)] focus:bg-white/10 transition-all rounded-none appearance-none cursor-pointer"
                      >
                        <option value="O-1" className="bg-neutral-900 text-white">O-1 Extraordinary Ability</option>
                        <option value="F-1" className="bg-neutral-900 text-white">F-1 Student Visa</option>
                        <option value="B-1" className="bg-neutral-900 text-white">B-1 Business Visitor</option>
                        <option value="B-2" className="bg-neutral-900 text-white">B-2 Tourist Visitor</option>
                      </select>
                    </div>

                    {/* Message Input */}
                    <div className="flex flex-col gap-2">
                      <label className="font-mono text-[9px] uppercase tracking-wider text-[var(--landing-muted)]">
                        Describe your goals
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Briefly tell us about your achievements, university admissions, or business goals..."
                        required
                        rows={4}
                        className="border border-white/10 bg-white/5 p-4 font-mono text-xs text-white placeholder-white/20 outline-none focus:border-[var(--landing-accent)] focus:bg-white/10 transition-all resize-none rounded-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="group flex h-12 w-full items-center justify-center gap-2 border border-white/25 bg-[var(--landing-accent)] text-xs font-mono uppercase tracking-widest text-[var(--landing-solid-bg)] hover:bg-[var(--landing-accent)]/90 active:scale-95 transition-all cursor-pointer rounded-none"
                    >
                      <ScrambleText as="span">Submit Inquiry</ScrambleText>
                      <Send className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </button>
                  </motion.form>
                ) : (
                  /* Success Feedback */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                  >
                    <div className="size-16 items-center justify-center flex border border-[var(--landing-accent)] rounded-full mb-6">
                      <Send className="size-6 text-[var(--landing-accent)] animate-pulse" />
                    </div>
                    <h4 className="text-xl font-light text-white">Transmission Received</h4>
                    <p className="mt-3 text-xs text-[var(--landing-muted)] max-w-xs font-mono leading-relaxed">
                      AI agents have logged your visa profile. An attorney will verify details shortly.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="font-mono text-[8px] uppercase tracking-[0.25em] text-white/20 text-center sm:text-left">
              Secure VisaIQ Tunnel • 256-bit Encrypted
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
