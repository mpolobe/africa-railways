// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SENTStaking
 * @notice Staking contract for SENT token holders to earn revenue share from platform fees
 * @dev 50% of platform fees are distributed to stakers proportionally
 * 
 * Revenue Flow:
 * 1. Platform collects 2% fee on AFC transactions
 * 2. 50% of fees converted to POL and deposited here via depositRewards()
 * 3. Stakers claim proportional share based on stake amount and duration
 */
contract SENTStaking is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable sentToken;

    // Staking state
    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 stakedAt;
        uint256 lockUntil;
    }

    mapping(address => StakeInfo) public stakes;
    
    uint256 public totalStaked;
    uint256 public accRewardPerShare; // Accumulated rewards per share (scaled by 1e18)
    uint256 public totalRewardsDistributed;
    
    // Lock periods and bonuses (in seconds)
    uint256 public constant LOCK_30_DAYS = 30 days;
    uint256 public constant LOCK_90_DAYS = 90 days;
    uint256 public constant LOCK_180_DAYS = 180 days;
    uint256 public constant LOCK_365_DAYS = 365 days;
    
    // Bonus multipliers (in basis points, 10000 = 100%)
    uint256 public constant BONUS_30_DAYS = 10000;  // 1x (no bonus)
    uint256 public constant BONUS_90_DAYS = 11000;  // 1.1x
    uint256 public constant BONUS_180_DAYS = 12500; // 1.25x
    uint256 public constant BONUS_365_DAYS = 15000; // 1.5x

    // Events
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDeposited(uint256 amount, uint256 timestamp);
    event EmergencyWithdraw(address indexed user, uint256 amount);

    constructor(address _sentToken) Ownable(msg.sender) {
        require(_sentToken != address(0), "Invalid token address");
        sentToken = IERC20(_sentToken);
    }

    /**
     * @notice Stake SENT tokens with a lock period
     * @param amount Amount of SENT to stake
     * @param lockPeriod Lock duration in seconds (30, 90, 180, or 365 days)
     */
    function stake(uint256 amount, uint256 lockPeriod) external nonReentrant {
        require(amount > 0, "Cannot stake 0");
        require(
            lockPeriod == LOCK_30_DAYS || 
            lockPeriod == LOCK_90_DAYS || 
            lockPeriod == LOCK_180_DAYS || 
            lockPeriod == LOCK_365_DAYS,
            "Invalid lock period"
        );

        StakeInfo storage userStake = stakes[msg.sender];
        
        // Claim pending rewards first if already staking
        if (userStake.amount > 0) {
            uint256 pending = _pendingRewards(msg.sender);
            if (pending > 0) {
                _safeRewardTransfer(msg.sender, pending);
                emit RewardsClaimed(msg.sender, pending);
            }
        }

        // Transfer tokens from user
        sentToken.safeTransferFrom(msg.sender, address(this), amount);

        // Update stake info
        userStake.amount += amount;
        userStake.rewardDebt = (userStake.amount * accRewardPerShare) / 1e18;
        userStake.stakedAt = block.timestamp;
        
        // Set lock period (use longer of existing or new)
        uint256 newLockUntil = block.timestamp + lockPeriod;
        if (newLockUntil > userStake.lockUntil) {
            userStake.lockUntil = newLockUntil;
        }

        totalStaked += amount;

        emit Staked(msg.sender, amount, lockPeriod);
    }

    /**
     * @notice Unstake SENT tokens after lock period
     * @param amount Amount to unstake
     */
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        require(userStake.amount >= amount, "Insufficient stake");
        require(block.timestamp >= userStake.lockUntil, "Still locked");

        // Claim pending rewards
        uint256 pending = _pendingRewards(msg.sender);
        if (pending > 0) {
            _safeRewardTransfer(msg.sender, pending);
            emit RewardsClaimed(msg.sender, pending);
        }

        // Update stake
        userStake.amount -= amount;
        userStake.rewardDebt = (userStake.amount * accRewardPerShare) / 1e18;
        totalStaked -= amount;

        // Transfer tokens back
        sentToken.safeTransfer(msg.sender, amount);

        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Claim pending rewards without unstaking
     */
    function claimRewards() external nonReentrant {
        uint256 pending = _pendingRewards(msg.sender);
        require(pending > 0, "No rewards to claim");

        StakeInfo storage userStake = stakes[msg.sender];
        userStake.rewardDebt = (userStake.amount * accRewardPerShare) / 1e18;

        _safeRewardTransfer(msg.sender, pending);
        emit RewardsClaimed(msg.sender, pending);
    }

    /**
     * @notice Deposit platform fee rewards for distribution
     * @dev Called by platform when converting AFC fees to POL
     */
    function depositRewards() external payable onlyOwner {
        require(msg.value > 0, "No rewards to deposit");
        require(totalStaked > 0, "No stakers");

        accRewardPerShare += (msg.value * 1e18) / totalStaked;
        totalRewardsDistributed += msg.value;

        emit RewardsDeposited(msg.value, block.timestamp);
    }

    /**
     * @notice Emergency withdraw without caring about rewards (forfeits pending rewards)
     */
    function emergencyWithdraw() external nonReentrant {
        StakeInfo storage userStake = stakes[msg.sender];
        uint256 amount = userStake.amount;
        require(amount > 0, "Nothing to withdraw");

        // Clear stake
        userStake.amount = 0;
        userStake.rewardDebt = 0;
        totalStaked -= amount;

        // Transfer tokens (no rewards)
        sentToken.safeTransfer(msg.sender, amount);

        emit EmergencyWithdraw(msg.sender, amount);
    }

    /**
     * @notice Get pending rewards for a user
     */
    function pendingRewards(address user) external view returns (uint256) {
        return _pendingRewards(user);
    }

    /**
     * @notice Get stake info for a user
     */
    function getStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 pendingReward,
        uint256 stakedAt,
        uint256 lockUntil,
        bool canUnstake
    ) {
        StakeInfo storage userStake = stakes[user];
        return (
            userStake.amount,
            _pendingRewards(user),
            userStake.stakedAt,
            userStake.lockUntil,
            block.timestamp >= userStake.lockUntil
        );
    }

    /**
     * @notice Get bonus multiplier for a lock period
     */
    function getBonusMultiplier(uint256 lockPeriod) external pure returns (uint256) {
        if (lockPeriod >= LOCK_365_DAYS) return BONUS_365_DAYS;
        if (lockPeriod >= LOCK_180_DAYS) return BONUS_180_DAYS;
        if (lockPeriod >= LOCK_90_DAYS) return BONUS_90_DAYS;
        return BONUS_30_DAYS;
    }

    /**
     * @notice Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalStaked,
        uint256 _totalRewardsDistributed,
        uint256 _accRewardPerShare,
        uint256 _contractBalance
    ) {
        return (
            totalStaked,
            totalRewardsDistributed,
            accRewardPerShare,
            address(this).balance
        );
    }

    // Internal functions

    function _pendingRewards(address user) internal view returns (uint256) {
        StakeInfo storage userStake = stakes[user];
        if (userStake.amount == 0) return 0;
        
        uint256 accReward = (userStake.amount * accRewardPerShare) / 1e18;
        return accReward - userStake.rewardDebt;
    }

    function _safeRewardTransfer(address to, uint256 amount) internal {
        uint256 balance = address(this).balance;
        if (amount > balance) {
            amount = balance;
        }
        (bool success, ) = to.call{value: amount}("");
        require(success, "Reward transfer failed");
    }

    // Allow contract to receive POL
    receive() external payable {}
}
