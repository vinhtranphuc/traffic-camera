"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { Toaster } from "react-hot-toast";

interface Props {
  locale: string;
  messages: Record<string, unknown>;
  children: ReactNode;
}

export default function Providers({ locale, messages, children }: Props) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <NextIntlClientProvider locale={locale} messages={messages as any}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: "!bg-gray-800 !text-gray-100 !border !border-gray-700",
            }}
          />
        </QueryClientProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
