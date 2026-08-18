import { AuthFooter } from "@/components/auth-footer";

export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <AuthFooter />
    </>
  );
}
