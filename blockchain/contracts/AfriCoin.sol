// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AfriCoin is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 1000000000 * (10 ** 18); // 1 Billion AFRC

    // We pass msg.sender to the Ownable constructor
    constructor() ERC20("AfriCoin", "AFRC") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    // Function to reward railway travelers
    function rewardTraveler(address traveler, uint256 amount) public onlyOwner {
        _mint(traveler, amount);
    }
}
