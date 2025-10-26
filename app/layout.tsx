'use client';


import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {PrivyProvider} from '@privy-io/react-auth';
import {toSolanaWalletConnectors} from "@privy-io/react-auth/solana";
import { SolanaProvider } from "./components/solana-provider";
//import { PrivyWagmiConnector } from '@privy-io/wagmi-connector';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ""}
          clientId="client-WY6RdAbAda3ZBpac51H58nCwF5EvhRRe38npaBWU79TE9"
          config={{
            appearance: { walletChainType: 'solana-only', walletList: ['metamask', 'phantom'], },
            externalWallets: {
              solana: { connectors: toSolanaWalletConnectors({
                  shouldAutoConnect: false, // 👈 avoid silent auto-connection attempts
                })}
            },
          }}
        >
          <SolanaProvider>
            {children}
          </SolanaProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
