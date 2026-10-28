import * as Dialog from '@radix-ui/react-dialog'
import { AlertTriangle, Check, LoaderCircle, Trash2, X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { useLanguage } from '../context/LanguageContext'
import { CicikMascot } from './CicikMascot'

export type ConfirmDeleteModalProps = {
  isOpen: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  itemCount?: number
  onConfirm: () => Promise<void> | void
  onClose: () => void
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  confirmText,
  cancelText,
  itemCount,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  const { trEn } = useLanguage()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleDismiss = useCallback(() => {
    if (isDeleting) return
    setIsDeleting(false)
    setIsSuccess(false)
    onClose()
  }, [isDeleting, onClose])

  const modalTitle =
    title ?? trEn('Geçmişi Silmek İstediğinize Emin Misiniz?', 'Are you sure you want to clear history?')

  const modalDesc =
    description ??
    trEn(
      'Bu işlem geri alınamaz. Kaydedilen tüm geçmiş kayıtları tarayıcınızın yerel depolama alanından kalıcı olarak silinecektir.',
      'This action cannot be undone. All saved past entries will be permanently deleted from your local storage.',
    )

  const handleConfirmClick = async () => {
    setIsDeleting(true)
    try {
      await onConfirm()
      setIsSuccess(true)
      await new Promise((resolve) => setTimeout(resolve, 550))
      setIsDeleting(false)
      setIsSuccess(false)
      onClose()
    } catch {
      setIsDeleting(false)
      setIsSuccess(false)
    }
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss() }}>
      <Dialog.Portal>
        {/* Radix Accessible Backdrop with smooth blur */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Radix Accessible Modal Dialog Card */}
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 cambly-card overflow-hidden p-6 sm:p-7 text-[var(--text-main)] shadow-2xl transition-all border border-[var(--border-card)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 focus:outline-none">
          {/* Close Button via Radix Dialog.Close */}
          {!isDeleting && (
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={trEn('Pencereyi kapat', 'Close dialog')}
                className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--text-muted)] hover:bg-[var(--sidebar-bg)] hover:text-[var(--text-main)] transition cursor-pointer"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          )}

          {isDeleting ? (
            /* LOADING & FEEDBACK SCREEN (UI/UX Pro Max) */
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4 animate-enter">
              <div className="relative">
                <CicikMascot mood={isSuccess ? 'success' : 'processing'} size="md" />
                {!isSuccess ? (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-chick-yellow p-1.5 text-black shadow-md animate-spin">
                    <LoaderCircle className="size-4" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-chick-success p-1.5 text-white shadow-md animate-enter">
                    <Check className="size-4 stroke-[3]" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Dialog.Title className="text-base font-bold text-[var(--text-main)] font-display">
                  {isSuccess
                    ? trEn('Geçmiş Başarıyla Temizlendi!', 'History Cleared Successfully!')
                    : trEn('Geçmiş Temizleniyor…', 'Clearing History…')}
                </Dialog.Title>
                <Dialog.Description className="text-xs text-[var(--text-muted)] font-sans">
                  {isSuccess
                    ? trEn('Tüm veriler kaldırıldı.', 'All data has been removed.')
                    : trEn('Kayıtlar kalıcı olarak siliniyor, lütfen bekleyin…', 'Records are being permanently deleted, please wait…')}
                </Dialog.Description>
              </div>

              {/* Stylized progress track */}
              <div className="w-48 h-1.5 rounded-full bg-[var(--sidebar-bg)] overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isSuccess
                      ? 'w-full bg-chick-success'
                      : 'w-2/3 bg-chick-yellow animate-pulse'
                  }`}
                />
              </div>
            </div>
          ) : (
            /* CONFIRMATION SCREEN */
            <div className="space-y-5">
              {/* Header Icon + Mascot Badge */}
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <div className="grid size-12 place-items-center rounded-2xl bg-chick-red/15 text-chick-red ring-4 ring-chick-red/10">
                    <Trash2 className="size-6" aria-hidden="true" />
                  </div>
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full bg-chick-yellow text-black text-[10px] shadow-xs">
                    <AlertTriangle className="size-3 text-chick-red" aria-hidden="true" />
                  </span>
                </div>

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-chick-red font-sans">
                      {trEn('Kalıcı Silme Onayı', 'Permanent Deletion')}
                    </span>
                    {typeof itemCount === 'number' && itemCount > 0 && (
                      <span className="rounded-full bg-chick-red/15 px-2 py-0.5 text-[10px] font-mono font-bold text-chick-red">
                        {itemCount} {trEn('kayıt', 'items')}
                      </span>
                    )}
                  </div>
                  <Dialog.Title className="mt-1 text-lg sm:text-xl font-bold text-[var(--text-main)] font-display leading-snug">
                    {modalTitle}
                  </Dialog.Title>
                </div>
              </div>

              {/* Description Body via Radix Dialog.Description */}
              <Dialog.Description asChild>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--sidebar-bg)] p-4 text-xs leading-relaxed text-[var(--text-muted)] font-sans">
                  <p>{modalDesc}</p>
                </div>
              </Dialog.Description>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
                <Dialog.Close asChild>
                  <button
                    type="button"
                    className="w-full sm:w-auto rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg)] px-5 py-2.5 text-xs font-bold text-[var(--text-main)] hover:bg-[var(--sidebar-bg)] transition cursor-pointer"
                  >
                    {cancelText ?? trEn('Vazgeç', 'Cancel')}
                  </button>
                </Dialog.Close>

                <button
                  type="button"
                  onClick={() => void handleConfirmClick()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-chick-red px-6 py-2.5 text-xs font-bold text-black shadow-sm hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span>{confirmText ?? trEn('Evet, Kalıcı Olarak Sil', 'Yes, Delete Permanently')}</span>
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
