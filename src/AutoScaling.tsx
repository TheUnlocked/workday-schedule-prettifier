import { PropsWithChildren, useEffect, useRef, useState } from "react";

export default function AutoScaling(props: PropsWithChildren<{}>) {
    const [fontSize, setFontSize] = useState<string | null>(null);
    const [isFinalized, setFinalized] = useState(false);

    const testStripRef = useRef<HTMLSpanElement>(null);
    const contentContainerRef = useRef<HTMLDivElement>(null);

    const [tickerVal, ticker] = useState(0);

    function tick() {
        ticker(i => i + 1);
    }

    useEffect(() => {
        if (!isFinalized) {
            const testStripElt = testStripRef.current;
            const contentContainerElt = contentContainerRef.current;
            if (testStripElt && contentContainerElt) {
                const expectedHeight = testStripElt.getBoundingClientRect().height;
                const actualHeight = contentContainerElt.getBoundingClientRect().height;
                const ratio = expectedHeight / actualHeight;
    
                if (actualHeight <= expectedHeight) {
                    setFinalized(true);
                }
                else {
                    setFontSize(fontSize => {
                        if (fontSize === null) {
                            fontSize = getComputedStyle(testStripElt).fontSize;
                        }
                        const [, number, units] = /([0-9.]+)(.*)/.exec(fontSize)!;
                        return +number * (1 - 0.2 * (1 - ratio)) + units;
                    });
                    setTimeout(tick, 10);
                }
            }
        }
    }, [isFinalized, testStripRef, contentContainerRef, tickerVal]);

    if (!isFinalized) {
        return (
            <div style={fontSize ? { fontSize } : {}}>
                <span ref={testStripRef} style={{ position: 'absolute', left: '-999999rem' }}>-</span>
                <div ref={contentContainerRef}>
                    {props.children}
                </div>
            </div>
        );
    }

    return (
        <div style={fontSize ? { fontSize } : {}}>
            {props.children}
        </div>
    );
}