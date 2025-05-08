document.addEventListener("DOMContentLoaded", () => {
  const { ethers } = window;
  const tokenAddress = "0x262B7d4B48842EbcAc380B00D0025D7925106D39";
  const bridgeAddress = "0x7Cc488F15A9B6f5bEad9150b287cb0A06634bae3";

  const root = document.getElementById("root");
  root.innerHTML = `
    <div style='padding:2rem; max-width:700px; margin:auto; font-family:sans-serif;'>
      <h1 style='font-size:3rem; text-align:center;'>URASEUM POW</h1>

      <p><strong>Limit:</strong> 50,000 URM ERC-20 per transaction</p>
      <p><strong>Ratio:</strong> 2 URM ERC-20 = 1 native URM</p>
      <p><strong>URM ERC-20 contract:</strong><br><code>${tokenAddress}</code></p>

      <p><strong>Important:</strong> You must provide a valid Uraseum address to receive your native URM.</p>
      <p>To receive your native URM, add Uraseum as a custom network in MetaMask:</p>
      <ul style='margin-left:2rem;'>
        <li><strong>Name:</strong> Uraseum</li>
        <li><strong>RPC:</strong> http://localhost:8545</li>
        <li><strong>Chain ID:</strong> 42666</li>
        <li><strong>Symbol:</strong> URM</li>
      </ul>

      <hr style='margin:2rem 0;'>

      <div style='text-align:center;'>
        <input id='amount' placeholder='Amount to convert' style='padding:0.5rem;width:250px;' /><br>
        <button id='connect' style='margin:1rem;padding:0.5rem 1rem;'>Connect Wallet</button>
        <button id='convert' style='padding:0.5rem 1rem;'>Approve & Convert</button>
        <p id='status' style='margin-top:1rem;white-space:pre-wrap;'></p>
      </div>
    </div>
  `;

  let account = null;

  const tokenAbi = [
    "function approve(address spender, uint256 amount) public returns (bool)",
    "function balanceOf(address account) external view returns (uint256)"
  ];
  const bridgeAbi = [
    "function convertir(uint256 montant) external"
  ];

  document.getElementById("connect").onclick = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const accs = await provider.send("eth_requestAccounts", []);
        account = accs[0];
        document.getElementById("status").textContent = "Connected: " + account;
      } else {
        alert("MetaMask not found");
      }
    } catch (err) {
      document.getElementById("status").textContent = "Connection failed:\n" + err.message;
    }
  };

  document.getElementById("convert").onclick = async () => {
    const status = document.getElementById("status");
    const amount = document.getElementById("amount").value;

    if (!window.ethereum || !account || !amount) return;

    const parsed = ethers.utils.parseUnits(amount, 18);
    const max = ethers.utils.parseUnits("50000", 18);
    if (parsed.gt(max)) {
      status.textContent = "Error: Maximum 50,000 URM ERC-20 per transaction.";
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const token = new ethers.Contract(tokenAddress, tokenAbi, signer);
      const bridge = new ethers.Contract(bridgeAddress, bridgeAbi, signer);

      status.textContent = "Approving URM...";
      const tx1 = await token.approve(bridgeAddress, ethers.constants.MaxUint256);
      await tx1.wait();

      status.textContent = "Calling convertir()...";
      const tx2 = await bridge.convertir(parsed, { gasLimit: 200000 });
      await tx2.wait();

      status.textContent = "Success! URM converted.";
    } catch (err) {
      status.textContent = "Error: " + err.message;
    }
  };
});
