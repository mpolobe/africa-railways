import { ethers } from "ethers";

export const handler = async (event) => {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
    const walletAddress = event.walletAddress;

    const abi = ["function balanceOf(address) view returns (uint256)"];
    const contract = new ethers.Contract(contractAddress, abi, provider);

    try {
        const balance = await contract.balanceOf(walletAddress);
        return {
            statusCode: 200,
            body: JSON.stringify({
                address: walletAddress,
                balance: ethers.formatUnits(balance, 18),
                currency: "AFRC"
            })
        };
    } catch (error) {
        return { statusCode: 500, body: error.message };
    }
};
