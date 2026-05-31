import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';

/**
 * NetworkStatus — renders a persistent offline banner + fires toasts
 * for online/offline/slow-connection transitions.
 * Mount once in App.jsx; works on every page automatically.
 */
export default function NetworkStatus() {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isSlow, setIsSlow] = useState(false);
    const wasOfflineRef = useRef(!navigator.onLine);
    const slowToastShownRef = useRef(false);

    useEffect(() => {
        // ── Online / Offline handlers ──
        const handleOffline = () => {
            setIsOffline(true);
            wasOfflineRef.current = true;
            toast.error('You are offline. Please check your internet connection.', {
                id: 'network-offline',
                duration: Infinity,
                icon: <WifiOff className="h-4 w-4" />,
            });
        };

        const handleOnline = () => {
            setIsOffline(false);
            toast.dismiss('network-offline');
            if (wasOfflineRef.current) {
                toast.success('Back online! Your connection has been restored.', {
                    id: 'network-online',
                    duration: 4000,
                    icon: <Wifi className="h-4 w-4" />,
                });
                wasOfflineRef.current = false;
            }
        };

        // ── Slow connection detection ──
        const checkSlow = () => {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (!conn) return;

            const effectiveType = conn.effectiveType; // '4g' | '3g' | '2g' | 'slow-2g'
            const downlink = conn.downlink; // Mbps
            const slow = effectiveType === '2g' || effectiveType === 'slow-2g' || downlink < 0.5;

            setIsSlow(slow);
            if (slow && !slowToastShownRef.current) {
                slowToastShownRef.current = true;
                toast.warning('Slow internet detected. Some features may take longer to load.', {
                    id: 'network-slow',
                    duration: 6000,
                    icon: <AlertTriangle className="h-4 w-4" />,
                });
            } else if (!slow) {
                slowToastShownRef.current = false;
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check slow connection on mount and on change
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            checkSlow();
            conn.addEventListener('change', checkSlow);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (conn) conn.removeEventListener('change', checkSlow);
        };
    }, []);

    // Persistent offline banner at the top of the viewport
    if (!isOffline && !isSlow) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white transition-all duration-300 ${
                isOffline
                    ? 'bg-red-600'
                    : 'bg-amber-500 text-amber-950'
            }`}
            role="alert"
            aria-live="assertive"
        >
            {isOffline ? (
                <>
                    <WifiOff className="h-4 w-4 animate-pulse" />
                    <span>No internet connection — Please check your network and try again</span>
                </>
            ) : (
                <>
                    <AlertTriangle className="h-4 w-4" />
                    <span>Slow internet detected — Some actions may take longer than usual</span>
                </>
            )}
        </div>
    );
}
