import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

export function Modal({ title, onClose, children, footer, wide }: ModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}
          className={`w-full ${wide ? 'sm:max-w-lg' : 'sm:max-w-md'} max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-panel border-t sm:border border-line p-5 shadow-2xl`}
          style={{ paddingBottom: 'calc(var(--sab) + 20px)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-600 sm:hidden" aria-hidden />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="tap-target text-slate-400 hover:text-white text-2xl leading-none px-2"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <div>{children}</div>
          {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
