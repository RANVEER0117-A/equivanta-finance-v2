import { Link } from "react-router-dom";

export default function Footer() {
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("sa_theme", next);
    const lbl = document.getElementById("footerThemeLabel");
    if (lbl) lbl.textContent = next === "dark" ? "Light Mode" : "Dark Mode";
  }

  return (
    <footer>
      <div className="footer-inner">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">Stock Analyzer</div>
            <p className="footer-desc">
              A modern tool for analyzing Indian stocks on NSE and BSE. Powered by yfinance and TradingView.
            </p>
            <div className="footer-theme-row">
              <span>Appearance:</span>
              <button className="footer-theme-btn" onClick={toggleTheme}>
                <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
                <span id="footerThemeLabel">Dark Mode</span>
              </button>
            </div>
          </div>
          <div className="footer-col">
            <h4>Navigate</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/portfolio">Portfolio</Link></li>
              <li><a href="#">Screener</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Indices</h4>
            <ul>
              <li><Link to="/stock/%5ENSEI">Nifty 50</Link></li>
              <li><Link to="/stock/%5EBSESN">Sensex</Link></li>
              <li><Link to="/stock/%5ECNXBANK">Bank Nifty</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2025 Stock Analyzer. All rights reserved.</span>
          <span>Data from Yahoo Finance &amp; TradingView</span>
        </div>
        <p className="footer-disclaimer">
          Disclaimer: For informational purposes only. Not investment advice.
        </p>
      </div>
    </footer>
  );
}
