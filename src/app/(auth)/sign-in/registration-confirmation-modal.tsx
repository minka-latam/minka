"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface RegistrationConfirmationModalProps {
  open: boolean;
}

export function RegistrationConfirmationModal({
  open,
}: RegistrationConfirmationModalProps) {
  const [isOpen, setIsOpen] = useState(open);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md rounded-xl bg-white">
        <DialogHeader>
          <DialogTitle>Revisa tu correo</DialogTitle>
          <DialogDescription className="text-base text-gray-600">
            Tu cuenta ha sido creada exitosamente. Por favor revisa tu correo
            electrónico para confirmarla antes de iniciar sesión.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            className="bg-[#2c6e49] text-white hover:bg-[#1e4d33]"
            onClick={() => setIsOpen(false)}
          >
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
