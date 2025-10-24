'use client';

import { useState } from 'react';
import { useWallets } from '@privy-io/react-auth/solana';



export default function UploadButton() {
  const { wallets } = useWallets();
  const connectedWallet = wallets.find((w) => w.address);





  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success?: boolean;
    message?: string;
    ipfsCid?: string;
    playableUrl?: string;
  }>({});

  const handleFolderSelect = async () => {
    try {
      if (!connectedWallet) {
        throw new Error('No wallet connected');
      }

      // Create a hidden file input element
      const input = document.createElement('input');
      input.type = 'file';
      // @ts-expect-error - webkitdirectory is a non-standard attribute
      input.webkitdirectory = true;
      input.multiple = true;

      // Create a promise to handle the file selection
      const fileSelectionPromise = new Promise<Event>((resolve, reject) => {
        input.onchange = (e) => resolve(e);
        input.onerror = () => reject(new Error('File selection failed'));
      });

      // Trigger file selection dialog
      input.click();

      // Wait for file selection
      const event = await fileSelectionPromise;
      const files = ((event.target as HTMLInputElement)?.files);
      
      if (!files || files.length === 0) {
        throw new Error('No files selected');
      }

      setIsUploading(true);
      setUploadStatus({ message: 'Reading folder contents...' });

      // Create FormData to send files
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i], files[i].webkitRelativePath);
      }
      formData.append('wallet', JSON.stringify({
        publicKey: connectedWallet.address
      }));

      // Call your upload API
      const response = await fetch('/api/uploadFolder', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadStatus({
        success: true,
        message: 'Upload successful!',
        ipfsCid: data.manifest.ipfs.cid,
        playableUrl: data.manifest.ipfs.playableUrl
      });

    } catch (error) {
        console.error('Upload error:', error);
        setUploadStatus({
            success: false,
            message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    } finally {
      setIsUploading(false);
    }
};

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <button
        onClick={handleFolderSelect}
        disabled={!connectedWallet || isUploading}
        className="px-6 py-3 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isUploading ? 'Uploading...' : 'Choose Game Folder'}
      </button>

      {uploadStatus.message && (
        <div className={`mt-4 p-4 rounded-lg ${
          uploadStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          <p>{uploadStatus.message}</p>
          {uploadStatus.success && uploadStatus.playableUrl && (
            <>
              <p className="mt-2">
                IPFS CID: <code className="bg-gray-100 px-2 py-1 rounded">{uploadStatus.ipfsCid}</code>
              </p>
              <a
                href={uploadStatus.playableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-blue-600 hover:underline block"
              >
                Play Game
              </a>
            </>
          )}
        </div>
      )}
    </div>
  );
}
