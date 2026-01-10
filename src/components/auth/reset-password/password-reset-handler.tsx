"use client";

import { useEffect, useState, Suspense } from "react";
import { ResetPasswordDialog } from "./reset-password-dialog";

function PasswordResetHandlerContent() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check for the trigger in sessionStorage
    const checkStorage = () => {
      if (typeof window !== "undefined") {
        const shouldTrigger = sessionStorage.getItem("trigger_reset_password");
        
        if (shouldTrigger === "true") {
          setIsOpen(true);
          // Clean up immediately
          sessionStorage.removeItem("trigger_reset_password");
        }
      }
    };

    checkStorage();
  }, []);

  const handleSuccess = () => {
    setIsOpen(false);
  };

  return (
    <ResetPasswordDialog 
      open={isOpen} 
      onOpenChange={setIsOpen} 
      onSuccess={handleSuccess}
    />
  );
}

export function PasswordResetHandler() {
  return (
    <Suspense fallback={null}>
      <PasswordResetHandlerContent />
    </Suspense>
  );
}
