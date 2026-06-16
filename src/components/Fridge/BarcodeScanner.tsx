import { useEffect, useRef, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { NotFoundException } from '@zxing/library';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scannedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    async function start() {
      try {
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      } catch {
        setError('Could not access the camera. Please allow camera permissions and try again.');
        return;
      }

      if (!videoRef.current) return;

      try {
        await reader.decodeFromConstraints(
          { video: { facingMode: 'environment', width: { ideal: 1280 } } },
          videoRef.current,
          (result, err) => {
            if (result && !scannedRef.current) {
              scannedRef.current = true;
              onScan(result.getText());
              return;
            }
            if (err && !(err instanceof NotFoundException)) {
              // ignore NotFoundException — it just means no barcode in this frame
            }
          }
        );
        setReady(true);
      } catch {
        setError('Could not start the barcode scanner. Please try again.');
      }
    }

    start();

    return () => {
      BrowserMultiFormatReader.releaseAllStreams();
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
        <div>
          <h2 className="text-white font-semibold text-lg">Scan barcode</h2>
          <p className="text-white/50 text-xs mt-0.5">Point at the barcode on the packaging</p>
        </div>
        <button onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
          <X size={18} className="text-white" />
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">{error}</p>
            <button onClick={onClose}
              className="mt-6 px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition-colors">
              Go back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 size={36} className="text-white/50 animate-spin" />
            </div>
          )}

          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

          {ready && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Semi-dark surround */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Viewfinder */}
              <div className="relative z-10 w-72 h-44">
                <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white" />

                {/* Scan line */}
                <div className="absolute inset-x-0 top-0 bottom-0 overflow-hidden flex items-center">
                  <div className="animate-scan-line w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent" />
                </div>
              </div>
            </div>
          )}

          <p className="absolute bottom-10 inset-x-0 text-center text-white/40 text-xs pointer-events-none">
            Works with EAN-13 barcodes on UK supermarket products
          </p>
        </div>
      )}
    </div>
  );
}
