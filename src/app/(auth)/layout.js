import "@/features/auth/styles/auth.css";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-full bg-background text-foreground">
      {children}
    </div>
  );
}