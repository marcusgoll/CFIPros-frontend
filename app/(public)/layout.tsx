import { HeaderNavigation } from "@/components/layout/HeaderNavigation";
import { NavigationErrorBoundary } from "@/components/layout/NavigationErrorBoundary";
import { Footer } from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavigationErrorBoundary>
        <HeaderNavigation />
      </NavigationErrorBoundary>
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}