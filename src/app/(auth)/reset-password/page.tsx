import { ResetPasswordForm } from "@/components/auth/reset-password/reset-password-form";

export const dynamic = "force-dynamic";

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Crear nueva contraseña</h1>
        <p className="text-gray-500">Ingresa y confirma tu nueva contraseña.</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
