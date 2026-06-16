"use client";

import { ProfileForm } from "./components/profile-form";
import { Separator } from "@/components/ui/separator";


export default function SettingsLayout({}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6 p-6 pb-16">
      <div className="space-y-0.5">
        <h1 className="text-2xl font-bold tracking-tight">Configuración de perfil</h1>
        <p className="text-muted-foreground">
          Administra la información de tu cuenta.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        {/* <div className="flex-1 lg:max-w-2xl">{children}</div> */}
        <div className="flex-1 lg:max-w-2xl">{
          <ProfileForm />}</div>
      </div>
    </div>
  );
}
