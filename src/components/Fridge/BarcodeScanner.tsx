import { useEffect, useRef, useState } from 'react';
import { X, Camera } from 'lucide-react';

interface Props {
  onScan: (barcode: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onScan, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const scannedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function start() {
      if (!('BarcodeDetector' in window)) {
        setError('Barcode scanning requires Chrome on Android or Safari on iOS 17+. You can enter the item name manually instead.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 } },
        });
        if (!active) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          scan();
        }
      } catch {
        setError('Could not access the camera. Please allow camera permissions and try again.');
      }
    }

    function scan() {
      // @ts-expect-error BarcodeDetector not yet in TS lib
      const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] });

      async function detect() {
        if (!active || scannedRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0 && !scannedRef.current) {
            scannedRef.current = true;
            onScan(codes[0].rawValue as string);
            return;
          }
        } catch { /* frame not ready yet */ }
        rafRef.current = requestAnimationFrame(detect);
      }

      detect();
    }

    start();

    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
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
            <Camera size={52} className="text-white/20 mx-auto mb-5" />
            <p className="text-white/60 text-sm leading-relaxed max-w-xs mx-auto">{error}</p>
            <button onClick={onClose}
              className="mt-6 px-5 py-2.5 bg-white/10 text-white rounded-xl text-sm hover:bg-white/20 transition-colors">
              Go back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

          {/* Dark vignette outside viewfinder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" style={{ maskImage: 'none' }} />

            {/* Viewfinder cutout */}
            <div className="relative z-10 w-72 h-44">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-7 h-7 border-t-2 border-l-2 border-white rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-7 h-7 border-t-2 border-r-2 border-white rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-2 border-l-2 border-white rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-2 border-r-2 border-white rounded-br-sm" />

              {/* Animated scan line */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 overflow-hidden h-32 flex items-center">
                <div className="animate-scan-line w-full h-0.5 bg-gradient-to-r from-transparent via-white to-transparent" />
              </div>
            </div>
          </div>

          <p className="absolute bottom-10 inset-x-0 text-center text-white/50 text-xs">
            Works with EAN-13 barcodes on UK supermarket products
          </p>
        </div>
      )}
    </div>
  );
}
