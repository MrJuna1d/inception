'use client';
import { useEffect, useState } from 'react';
import { useConnectWallet } from '@privy-io/react-auth';
import { useWallets } from '@privy-io/react-auth/solana';
import UploadButton from './UploadButton';



export default function GameLayout() {
  const { connectWallet } = useConnectWallet();
  const { wallets } = useWallets();
  const connectedWallet = wallets.find((w) => w.address);
  const address = connectedWallet?.address;

  const shortAddress = (addr: string) => (addr ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : '');

  // Placeholder games list — later populate from chain/DB
  const [games, setGames] = useState();

  

  function openGodotEditor() {
    // Placeholder — open a dedicated route or external editor. Create /godot route later.
    window.open('/godot', '_blank');
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-800 via-indigo-900 to-gray-900 shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="text-xl font-bold tracking-tight">Inception</div>
          <div className="text-sm text-gray-300">Blockchain Game Hub</div>
        </div>

        <div className="flex items-center space-x-3">
          {address ? (
            <div className="px-3 py-1 rounded-md bg-gray-800 border border-gray-700 text-sm">
              Wallet: {shortAddress(address)}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              Connect Wallet
            </button>
          )}

          <button
            onClick={openGodotEditor}
            className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500 text-white font-semibold"
          >
            Create Game
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="w-80 p-6 border-r border-gray-800 bg-gradient-to-b from-gray-900 to-gray-800">
          <h2 className="text-lg font-semibold mb-4">Library</h2>
          <div className="space-y-3">
            <div className="p-3 rounded-md bg-gray-800 border border-gray-700">All Games</div>
            <div className="p-3 rounded-md bg-gray-800 border border-gray-700">My Uploads</div>
            <div className="p-3 rounded-md bg-gray-800 border border-gray-700">Marketplace</div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm text-gray-400 mb-2">Upload</h3>
            <div className="bg-gray-800 p-3 rounded-md">
              <UploadButton />
            </div>
            <div>

            </div>
          </div>
        </aside>

        {/* Right Content */}
        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Games</h1>
            <div className="text-sm text-gray-400">Click a game to play</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {/* {games.map((g) => (
              <button
                key={g.id}
                className="group bg-gradient-to-br from-gray-800 to-gray-700 rounded-lg overflow-hidden shadow-md p-0 border border-gray-700 hover:scale-105 transform transition"
                onClick={() => alert(`Open game ${g.title} (implement player)`)}
              >
                <div className="w-full aspect-square bg-gray-800 flex items-center justify-center">
                  <div className="text-center px-3">
                    <div className="text-lg font-semibold text-white mb-1">{g.title}</div>
                    <div className="text-xs text-gray-400">CID: {g.cid || '—'}</div>
                  </div>
                </div>
              </button>
            ))} */}
          </div>
        </main>
      </div>
    </div>
  );
}
