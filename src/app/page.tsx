import { App } from "@/components/AppShell";
import { StoreProvider } from "@/lib/store";

export default function Page() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
