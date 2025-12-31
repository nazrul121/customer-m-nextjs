// components/admin/AdminModal.tsx
import React from "react";

interface AdminModalProps {
  id: string;
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function AdminModal({ id, title, children, actionLabel, onAction }: AdminModalProps) {
  return (
    <dialog id={id} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box bg-base-100 border border-base-300">
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        
        <div className="py-2">
          {children}
        </div>

        <div className="modal-action">
          <form method="dialog" className="flex gap-2">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-ghost">Cancel</button>
            {actionLabel && (
              <button className="btn btn-primary" onClick={onAction}>
                {actionLabel}
              </button>
            )}
          </form>
        </div>
      </div>
      {/* Backdrop to close when clicking outside */}
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}