import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Stock from "./pages/Stock.jsx";
import Portfolio from "./pages/Portfolio.jsx";
import About from "./pages/About.jsx";

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stock/:symbol" element={<Stock />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}
