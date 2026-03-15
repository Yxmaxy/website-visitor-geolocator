import { useEffect, useRef, useState } from "react";

export function useScrollbarHeight<T extends HTMLElement>(deps: React.DependencyList = []) {
    const ref = useRef<T>(null);
    const [scrollbarHeight, setScrollbarHeight] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const check = () => {
            const hasOverflow = el.scrollWidth > el.clientWidth;
            // offsetHeight includes scrollbar, clientHeight excludes it
            const measuredScrollbar = hasOverflow ? el.offsetHeight - el.clientHeight : 0;
            setScrollbarHeight(measuredScrollbar);
        };
        const observer = new ResizeObserver(check);
        observer.observe(el);
        check();
        return () => observer.disconnect();
    }, deps);

    return { ref, scrollbarHeight };
}
