"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ResetPasswordForm } from "@/components/auth/reset-password/reset-password-form";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ResetPasswordDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Handling uncontrolled state if props are not provided is tricky with Dialog,
  // but here we primarily expect it to be controlled or used via composition.
  // For simpler integration, let's just use the props.
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-[#F9F9F3] p-0 border-0 max-w-lg mx-auto [&>button]:hidden">
        {/* Header with beige background */}
        <div className="flex justify-between items-center p-6 border-b bg-[#f0ead6]">
          <DialogTitle className="text-[#2c6e49] text-xl font-semibold">
            Crear nueva contraseña
          </DialogTitle>
          {/* Close button */}
          <div className="w-12 h-12 flex items-center justify-center">
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#2c6e49] bg-transparent border-none cursor-pointer p-0"
            >
              <X className="h-6 w-6" strokeWidth={2} />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-500 mb-6 text-center">
             Ingresa y confirma tu nueva contraseña.
          </p>
          <div className="[&_form]:space-y-4 [&_button[type=submit]]:w-full [&_button[type=submit]]:rounded-full [&_button[type=submit]]:py-2 [&_a]:hidden">
             {/* We hide the "Back to login" link via CSS since we are already authenticated/in-app */}
             <ResetPasswordForm onSuccess={onSuccess} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
