"use client";
import { LoginForm } from "@/components/login-form";
import Logo from "@/app/VASPP_logoLarge_White 2.png";
import Image from "next/image";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full flex-col md:flex-row">
      <div className="flex flex-1 flex-col items-center bg-black text-white p-10 relative">
        <div className="absolute top-6 left-6">
          <Image 
            src={Logo}
            alt="Company Logo"
            width={120}  
            height={60}  
            priority
            className="object-contain"
            onError={(e) => {
              console.error("Failed to load logo:", e);
            }}
          />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center space-y-6 max-w-md text-center md:text-left mt-16">
          <h1 className="text-4xl font-bold leading-tight">
            Reimbursement Tracker
          </h1>
          <p className="text-lg text-white/80">
            Simplify your team's expense tracking and reimbursement process.
          </p>
          <p className="text-sm text-white/60">
            Streamlined. Transparent. Hassle-free.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white p-8 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-gray-800">
              Welcome
            </h2>
            <p className="text-sm text-gray-500">
              Enter your credentials to sign in
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 p-6 shadow-md bg-white">
            <LoginForm />
          </div>

          <p className="text-center text-xs text-gray-400">
            © {new Date().getFullYear()} Reimbursement Tracker. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}