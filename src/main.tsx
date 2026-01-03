import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId="509177086998-6k4n22s2igdufn27blepvki8j62srnp8.apps.googleusercontent.com">
        <App />
    </GoogleOAuthProvider>
);
