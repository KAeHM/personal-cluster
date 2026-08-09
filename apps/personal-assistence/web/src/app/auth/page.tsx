import { AuthForm } from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.65_0.22_285/0.08),transparent_50%)]" />
      <AuthForm />
    </div>
  );
}
