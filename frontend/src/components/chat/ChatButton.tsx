import { MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ChatPanel from './ChatPanel'

interface ChatButtonProps {
  open: boolean
  onOpen: () => void
  onClose: () => void
}

export default function ChatButton({ open, onOpen, onClose }: ChatButtonProps) {
  return (
    <>
      {/* Chat o'ng drawer */}
      <ChatPanel open={open} onClose={onClose} />

      {/* FAB — chat yopiq bo'lганда ko'rinadi */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={onOpen}
            className="fixed bottom-4 right-4 sm:right-6 z-50
                       w-12 h-12 rounded-full
                       bg-dark-gold/20 border border-dark-gold/30
                       text-dark-gold shadow-lg shadow-black/30
                       hover:bg-dark-gold/30 hover:border-dark-gold/50 hover:scale-105
                       active:scale-95 transition-all duration-200
                       flex items-center justify-center"
            aria-label="Chat"
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  )
}
