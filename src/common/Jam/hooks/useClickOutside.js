import { useEffect, useCallback } from 'react';

const useClickOutside = (ref, handler) => {
    const listener = useCallback((event) => {
        if (!ref?.current || !ref.current.contains || ref.current.contains(event.target)) {
            return;
        }
        requestAnimationFrame(() => {
            handler(event);
        });
    }, [ref, handler]);

    useEffect(() => {
        const options = { passive: true };
        document.addEventListener('mousedown', listener, options);
        document.addEventListener('touchstart', listener, options);

        return () => {
            document.removeEventListener('mousedown', listener, options);
            document.removeEventListener('touchstart', listener, options);
        };
    }, [listener]);
};

export { useClickOutside };
export default useClickOutside; 