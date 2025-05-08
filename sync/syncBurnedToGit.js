const fs = require('fs');
const { ethers } = require('ethers');
const path = require('path');

// === CONFIGURATION ===
const INFURA_URL = 'https://mainnet.infura.io/v3/dab2581b6951461088459b5e9ce8ac0f';
const CONTRACT_ADDRESS = '0x439D925CdDa5285d620635d5d12A852553D9c9b4';
const ABI = [
  "event Burned(address indexed from, uint256 amount)"
];
const OUTPUT_FILE = path.join(__dirname, "sync", "burned.json");
const MAX_ENTRIES = 50;

// === SETUP ===
const provider = new ethers.providers.JsonRpcProvider(INFURA_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// === LOAD EXISTING JSON ===
let burns = [];
try {
  const raw = fs.readFileSync(OUTPUT_FILE);
  burns = JSON.parse(raw);
} catch (e) {
  burns = [];
}

// === LISTEN FOR NEW EVENTS ===
console.log("Listening for Burned events...");

contract.on("Burned", async (from, amount, event) => {
  const timestamp = (await event.getBlock()).timestamp * 1000;
  const entry = {
    wallet: from,
    amount: ethers.utils.formatUnits(amount, 18),
    timestamp: new Date(timestamp).toISOString()
  };

  burns.unshift(entry);
  if (burns.length > MAX_ENTRIES) burns = burns.slice(0, MAX_ENTRIES);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(burns, null, 2));
  console.log("Synced to burned.json in /sync:", entry);
});
