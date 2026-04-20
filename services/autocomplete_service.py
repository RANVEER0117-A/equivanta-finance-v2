"""
autocomplete_service.py
Provides fast in-memory search over a curated list of Indian stocks (NSE/BSE).
"""

from __future__ import annotations

STOCKS: list[dict] = [
    {"symbol": "RELIANCE.NS",    "name": "Reliance Industries Ltd"},
    {"symbol": "TCS.NS",         "name": "Tata Consultancy Services"},
    {"symbol": "HDFCBANK.NS",    "name": "HDFC Bank Ltd"},
    {"symbol": "INFY.NS",        "name": "Infosys Ltd"},
    {"symbol": "ICICIBANK.NS",   "name": "ICICI Bank Ltd"},
    {"symbol": "HINDUNILVR.NS",  "name": "Hindustan Unilever Ltd"},
    {"symbol": "SBIN.NS",        "name": "State Bank of India"},
    {"symbol": "BAJFINANCE.NS",  "name": "Bajaj Finance Ltd"},
    {"symbol": "WIPRO.NS",       "name": "Wipro Ltd"},
    {"symbol": "MARUTI.NS",      "name": "Maruti Suzuki India Ltd"},
    {"symbol": "TATAMOTORS.NS",  "name": "Tata Motors Ltd"},
    {"symbol": "ADANIENT.NS",    "name": "Adani Enterprises Ltd"},
    {"symbol": "ADANIPORTS.NS",  "name": "Adani Ports and Special Economic Zone"},
    {"symbol": "AXISBANK.NS",    "name": "Axis Bank Ltd"},
    {"symbol": "KOTAKBANK.NS",   "name": "Kotak Mahindra Bank Ltd"},
    {"symbol": "LT.NS",          "name": "Larsen and Toubro Ltd"},
    {"symbol": "ITC.NS",         "name": "ITC Ltd"},
    {"symbol": "SUNPHARMA.NS",   "name": "Sun Pharmaceutical Industries"},
    {"symbol": "TITAN.NS",       "name": "Titan Company Ltd"},
    {"symbol": "BAJAJFINSV.NS",  "name": "Bajaj Finserv Ltd"},
    {"symbol": "NESTLEIND.NS",   "name": "Nestle India Ltd"},
    {"symbol": "ULTRACEMCO.NS",  "name": "UltraTech Cement Ltd"},
    {"symbol": "ASIANPAINT.NS",  "name": "Asian Paints Ltd"},
    {"symbol": "POWERGRID.NS",   "name": "Power Grid Corporation of India"},
    {"symbol": "NTPC.NS",        "name": "NTPC Ltd"},
    {"symbol": "ONGC.NS",        "name": "Oil and Natural Gas Corporation"},
    {"symbol": "COALINDIA.NS",   "name": "Coal India Ltd"},
    {"symbol": "TATASTEEL.NS",   "name": "Tata Steel Ltd"},
    {"symbol": "JSWSTEEL.NS",    "name": "JSW Steel Ltd"},
    {"symbol": "HCLTECH.NS",     "name": "HCL Technologies Ltd"},
    {"symbol": "TECHM.NS",       "name": "Tech Mahindra Ltd"},
    {"symbol": "DRREDDY.NS",     "name": "Dr. Reddys Laboratories"},
    {"symbol": "CIPLA.NS",       "name": "Cipla Ltd"},
    {"symbol": "DIVISLAB.NS",    "name": "Divi's Laboratories Ltd"},
    {"symbol": "APOLLOHOSP.NS",  "name": "Apollo Hospitals Enterprise"},
    {"symbol": "EICHERMOT.NS",   "name": "Eicher Motors Ltd"},
    {"symbol": "HEROMOTOCO.NS",  "name": "Hero MotoCorp Ltd"},
    {"symbol": "BAJAJ-AUTO.NS",  "name": "Bajaj Auto Ltd"},
    {"symbol": "M&M.NS",         "name": "Mahindra & Mahindra Ltd"},
    {"symbol": "GRASIM.NS",      "name": "Grasim Industries Ltd"},
    {"symbol": "INDUSINDBK.NS",  "name": "IndusInd Bank Ltd"},
    {"symbol": "SHREECEM.NS",    "name": "Shree Cement Ltd"},
    {"symbol": "BPCL.NS",        "name": "Bharat Petroleum Corporation"},
    {"symbol": "IOC.NS",         "name": "Indian Oil Corporation Ltd"},
    {"symbol": "BRITANNIA.NS",   "name": "Britannia Industries Ltd"},
    {"symbol": "PIDILITIND.NS",  "name": "Pidilite Industries Ltd"},
    {"symbol": "HAVELLS.NS",     "name": "Havells India Ltd"},
    {"symbol": "BERGEPAINT.NS",  "name": "Berger Paints India Ltd"},
    {"symbol": "DABUR.NS",       "name": "Dabur India Ltd"},
    {"symbol": "MARICO.NS",      "name": "Marico Ltd"},
    {"symbol": "COLPAL.NS",      "name": "Colgate-Palmolive India Ltd"},
    {"symbol": "GODREJCP.NS",    "name": "Godrej Consumer Products Ltd"},
    {"symbol": "MUTHOOTFIN.NS",  "name": "Muthoot Finance Ltd"},
    {"symbol": "CHOLAFIN.NS",    "name": "Cholamandalam Investment and Finance"},
    {"symbol": "HDFCLIFE.NS",    "name": "HDFC Life Insurance Co Ltd"},
    {"symbol": "SBILIFE.NS",     "name": "SBI Life Insurance Company Ltd"},
    {"symbol": "ICICIPRULI.NS",  "name": "ICICI Prudential Life Insurance"},
    {"symbol": "BANDHANBNK.NS",  "name": "Bandhan Bank Ltd"},
    {"symbol": "FEDERALBNK.NS",  "name": "Federal Bank Ltd"},
    {"symbol": "IDFCFIRSTB.NS",  "name": "IDFC First Bank Ltd"},
    {"symbol": "PNB.NS",         "name": "Punjab National Bank"},
    {"symbol": "BANKBARODA.NS",  "name": "Bank of Baroda"},
    {"symbol": "CANBK.NS",       "name": "Canara Bank"},
    {"symbol": "ZOMATO.NS",      "name": "Zomato Ltd"},
    {"symbol": "NYKAA.NS",       "name": "FSN E-Commerce Ventures Ltd"},
    {"symbol": "PAYTM.NS",       "name": "One 97 Communications Ltd"},
    {"symbol": "POLICYBZR.NS",   "name": "PB Fintech Ltd"},
    {"symbol": "DELHIVERY.NS",   "name": "Delhivery Ltd"},
    {"symbol": "IRCTC.NS",       "name": "Indian Railway Catering and Tourism"},
    {"symbol": "TATAPOWER.NS",   "name": "Tata Power Company Ltd"},
    {"symbol": "ADANIGREEN.NS",  "name": "Adani Green Energy Ltd"},
    {"symbol": "ADANIPOWER.NS",  "name": "Adani Power Ltd"},
    {"symbol": "ADANITRANS.NS",  "name": "Adani Transmission Ltd"},
    {"symbol": "TORNTPHARM.NS",  "name": "Torrent Pharmaceuticals Ltd"},
    {"symbol": "AUROPHARMA.NS",  "name": "Aurobindo Pharma Ltd"},
    {"symbol": "LUPIN.NS",       "name": "Lupin Ltd"},
    {"symbol": "BIOCON.NS",      "name": "Biocon Ltd"},
    {"symbol": "PFIZER.NS",      "name": "Pfizer Ltd"},
    {"symbol": "ABBOTINDIA.NS",  "name": "Abbott India Ltd"},
    {"symbol": "SIEMENS.NS",     "name": "Siemens Ltd"},
    {"symbol": "ABB.NS",         "name": "ABB India Ltd"},
    {"symbol": "BHEL.NS",        "name": "Bharat Heavy Electricals Ltd"},
    {"symbol": "HAL.NS",         "name": "Hindustan Aeronautics Ltd"},
    {"symbol": "BEL.NS",         "name": "Bharat Electronics Ltd"},
    {"symbol": "SAIL.NS",        "name": "Steel Authority of India"},
    {"symbol": "HINDALCO.NS",    "name": "Hindalco Industries Ltd"},
    {"symbol": "VEDL.NS",        "name": "Vedanta Ltd"},
    {"symbol": "NMDC.NS",        "name": "NMDC Ltd"},
    {"symbol": "TATACONSUM.NS",  "name": "Tata Consumer Products Ltd"},
    {"symbol": "JUBLFOOD.NS",    "name": "Jubilant Foodworks Ltd"},
    {"symbol": "DEVYANI.NS",     "name": "Devyani International Ltd"},
    {"symbol": "SAPPHIRE.NS",    "name": "Sapphire Foods India Ltd"},
    {"symbol": "DMART.NS",       "name": "Avenue Supermarts Ltd"},
    {"symbol": "TRENT.NS",       "name": "Trent Ltd"},
    {"symbol": "PAGEIND.NS",     "name": "Page Industries Ltd"},
    {"symbol": "MCDOWELL-N.NS",  "name": "United Spirits Ltd"},
    {"symbol": "ATUL.NS",        "name": "Atul Ltd"},
    {"symbol": "DEEPAKNTR.NS",   "name": "Deepak Nitrite Ltd"},
    {"symbol": "PIIND.NS",       "name": "PI Industries Ltd"},
    {"symbol": "UPL.NS",         "name": "UPL Ltd"},
    {"symbol": "NAUKRI.NS",      "name": "Info Edge India Ltd"},
    {"symbol": "JUSTDIAL.NS",    "name": "Just Dial Ltd"},
    {"symbol": "INDIAMART.NS",   "name": "IndiaMART InterMESH Ltd"},
    {"symbol": "GMRINFRA.NS",    "name": "GMR Airports Infrastructure"},
    {"symbol": "MPHASIS.NS",     "name": "Mphasis Ltd"},
    {"symbol": "LTIM.NS",        "name": "LTIMindtree Ltd"},
    {"symbol": "PERSISTENT.NS",  "name": "Persistent Systems Ltd"},
    {"symbol": "COFORGE.NS",     "name": "Coforge Ltd"},
    {"symbol": "KPITTECH.NS",    "name": "KPIT Technologies Ltd"},
    {"symbol": "TATAELXSI.NS",   "name": "Tata Elxsi Ltd"},
    {"symbol": "TANLA.NS",       "name": "Tanla Platforms Ltd"},
    {"symbol": "ROUTE.NS",       "name": "Route Mobile Ltd"},
    {"symbol": "^NSEI",          "name": "Nifty 50"},
    {"symbol": "^BSESN",         "name": "BSE Sensex"},
    {"symbol": "^CNXBANK",       "name": "Nifty Bank"},
]

# Build lowercase lookup index once at import time
_INDEX: list[tuple[str, str, dict]] = [
    (s["symbol"].lower(), s["name"].lower(), s)
    for s in STOCKS
]


def search_stocks(query: str, limit: int = 10) -> list[dict]:
    """
    Return up to `limit` stocks whose symbol or name contains `query`.
    Case-insensitive, prioritises symbol-prefix matches.
    """
    q = query.lower().strip()
    if not q:
        return []

    symbol_prefix: list[dict] = []
    name_prefix:   list[dict] = []
    contains:      list[dict] = []

    for sym_lower, name_lower, stock in _INDEX:
        if sym_lower.startswith(q):
            symbol_prefix.append(stock)
        elif name_lower.startswith(q):
            name_prefix.append(stock)
        elif q in sym_lower or q in name_lower:
            contains.append(stock)

    ranked = symbol_prefix + name_prefix + contains
    return ranked[:limit]
