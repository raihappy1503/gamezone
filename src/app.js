import { useEffect } from "react";

export default function App() {
    useEffect(() => {
        import("./gamezone/main.ts");
    }, []);
    return <div id="app" data-testid="gamezone-app" />;
}
