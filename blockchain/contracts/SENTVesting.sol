// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SENTVesting
 * @notice Transparent on-chain vesting for SENT token allocations
 * @dev All vesting schedules are publicly verifiable on-chain
 * 
 * Addresses the "Opaque Token Allocation" concern by making all
 * team, advisor, community, and ecosystem allocations fully transparent
 * with immutable vesting schedules.
 */
contract SENTVesting is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable sentToken;

    // Vesting schedule structure
    struct VestingSchedule {
        address beneficiary;
        string allocation;          // e.g., "Team", "Advisor", "Community"
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTime;
        uint256 cliffDuration;      // Time before any tokens vest
        uint256 vestingDuration;    // Total vesting period after cliff
        uint256 tgePercentage;      // Percentage released at TGE (basis points)
        bool revocable;
        bool revoked;
    }

    // All vesting schedules (publicly readable)
    VestingSchedule[] public vestingSchedules;
    
    // Beneficiary to schedule IDs mapping
    mapping(address => uint256[]) public beneficiarySchedules;
    
    // Total tokens locked in vesting
    uint256 public totalVestingAmount;
    uint256 public totalReleasedAmount;

    // Token Generation Event timestamp
    uint256 public tgeTimestamp;
    bool public tgeSet;

    // Events
    event VestingScheduleCreated(
        uint256 indexed scheduleId,
        address indexed beneficiary,
        string allocation,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration
    );
    event TokensReleased(
        uint256 indexed scheduleId,
        address indexed beneficiary,
        uint256 amount
    );
    event VestingRevoked(uint256 indexed scheduleId, uint256 unvestedAmount);
    event TGESet(uint256 timestamp);

    constructor(address _sentToken) Ownable(msg.sender) {
        require(_sentToken != address(0), "Invalid token");
        sentToken = IERC20(_sentToken);
    }

    /**
     * @notice Set the Token Generation Event timestamp
     * @dev Can only be set once, starts all vesting clocks
     */
    function setTGE(uint256 _tgeTimestamp) external onlyOwner {
        require(!tgeSet, "TGE already set");
        require(_tgeTimestamp > 0, "Invalid timestamp");
        
        tgeTimestamp = _tgeTimestamp;
        tgeSet = true;
        
        emit TGESet(_tgeTimestamp);
    }

    /**
     * @notice Create a new vesting schedule
     * @param beneficiary Address receiving the vested tokens
     * @param allocation Category name (e.g., "Team", "Advisor")
     * @param totalAmount Total tokens to vest
     * @param cliffDuration Seconds before vesting starts
     * @param vestingDuration Seconds for linear vesting after cliff
     * @param tgePercentage Percentage released at TGE (basis points, 1000 = 10%)
     * @param revocable Whether the schedule can be revoked
     */
    function createVestingSchedule(
        address beneficiary,
        string calldata allocation,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 vestingDuration,
        uint256 tgePercentage,
        bool revocable
    ) external onlyOwner returns (uint256) {
        require(beneficiary != address(0), "Invalid beneficiary");
        require(totalAmount > 0, "Amount must be > 0");
        require(vestingDuration > 0, "Duration must be > 0");
        require(tgePercentage <= 10000, "TGE % too high");

        // Transfer tokens to this contract
        sentToken.safeTransferFrom(msg.sender, address(this), totalAmount);

        uint256 scheduleId = vestingSchedules.length;

        vestingSchedules.push(VestingSchedule({
            beneficiary: beneficiary,
            allocation: allocation,
            totalAmount: totalAmount,
            releasedAmount: 0,
            startTime: 0, // Set when TGE happens
            cliffDuration: cliffDuration,
            vestingDuration: vestingDuration,
            tgePercentage: tgePercentage,
            revocable: revocable,
            revoked: false
        }));

        beneficiarySchedules[beneficiary].push(scheduleId);
        totalVestingAmount += totalAmount;

        emit VestingScheduleCreated(
            scheduleId,
            beneficiary,
            allocation,
            totalAmount,
            cliffDuration,
            vestingDuration
        );

        return scheduleId;
    }

    /**
     * @notice Release vested tokens for a schedule
     * @param scheduleId ID of the vesting schedule
     */
    function release(uint256 scheduleId) external nonReentrant {
        require(tgeSet, "TGE not set");
        require(scheduleId < vestingSchedules.length, "Invalid schedule");

        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        require(!schedule.revoked, "Schedule revoked");
        require(
            msg.sender == schedule.beneficiary || msg.sender == owner(),
            "Not authorized"
        );

        uint256 releasable = _releasableAmount(scheduleId);
        require(releasable > 0, "Nothing to release");

        schedule.releasedAmount += releasable;
        totalReleasedAmount += releasable;

        sentToken.safeTransfer(schedule.beneficiary, releasable);

        emit TokensReleased(scheduleId, schedule.beneficiary, releasable);
    }

    /**
     * @notice Revoke a vesting schedule (if revocable)
     * @dev Unvested tokens are returned to owner
     */
    function revoke(uint256 scheduleId) external onlyOwner {
        require(scheduleId < vestingSchedules.length, "Invalid schedule");

        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        require(schedule.revocable, "Not revocable");
        require(!schedule.revoked, "Already revoked");

        // Release any vested tokens first
        uint256 releasable = _releasableAmount(scheduleId);
        if (releasable > 0) {
            schedule.releasedAmount += releasable;
            totalReleasedAmount += releasable;
            sentToken.safeTransfer(schedule.beneficiary, releasable);
        }

        // Return unvested tokens to owner
        uint256 unvested = schedule.totalAmount - schedule.releasedAmount;
        schedule.revoked = true;
        totalVestingAmount -= unvested;

        if (unvested > 0) {
            sentToken.safeTransfer(owner(), unvested);
        }

        emit VestingRevoked(scheduleId, unvested);
    }

    /**
     * @notice Get releasable amount for a schedule
     */
    function releasableAmount(uint256 scheduleId) external view returns (uint256) {
        return _releasableAmount(scheduleId);
    }

    /**
     * @notice Get vested amount for a schedule
     */
    function vestedAmount(uint256 scheduleId) external view returns (uint256) {
        return _vestedAmount(scheduleId);
    }

    /**
     * @notice Get all schedule IDs for a beneficiary
     */
    function getSchedulesByBeneficiary(address beneficiary) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return beneficiarySchedules[beneficiary];
    }

    /**
     * @notice Get total number of vesting schedules
     */
    function getScheduleCount() external view returns (uint256) {
        return vestingSchedules.length;
    }

    /**
     * @notice Get detailed schedule info
     */
    function getScheduleInfo(uint256 scheduleId) external view returns (
        address beneficiary,
        string memory allocation,
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 vestedAmt,
        uint256 releasableAmt,
        uint256 cliffEnd,
        uint256 vestingEnd,
        bool revoked
    ) {
        require(scheduleId < vestingSchedules.length, "Invalid schedule");
        VestingSchedule storage s = vestingSchedules[scheduleId];
        
        uint256 cliffEndTime = tgeSet ? tgeTimestamp + s.cliffDuration : 0;
        uint256 vestingEndTime = tgeSet ? cliffEndTime + s.vestingDuration : 0;
        
        return (
            s.beneficiary,
            s.allocation,
            s.totalAmount,
            s.releasedAmount,
            _vestedAmount(scheduleId),
            _releasableAmount(scheduleId),
            cliffEndTime,
            vestingEndTime,
            s.revoked
        );
    }

    /**
     * @notice Get global vesting statistics
     */
    function getGlobalStats() external view returns (
        uint256 totalSchedules,
        uint256 totalLocked,
        uint256 totalReleased,
        uint256 totalRemaining,
        bool isTgeSet,
        uint256 tgeTime
    ) {
        return (
            vestingSchedules.length,
            totalVestingAmount,
            totalReleasedAmount,
            totalVestingAmount - totalReleasedAmount,
            tgeSet,
            tgeTimestamp
        );
    }

    // Internal functions

    function _vestedAmount(uint256 scheduleId) internal view returns (uint256) {
        if (!tgeSet) return 0;
        
        VestingSchedule storage schedule = vestingSchedules[scheduleId];
        if (schedule.revoked) {
            return schedule.releasedAmount;
        }

        uint256 currentTime = block.timestamp;
        
        // TGE release
        uint256 tgeAmount = (schedule.totalAmount * schedule.tgePercentage) / 10000;
        
        // Before cliff
        uint256 cliffEnd = tgeTimestamp + schedule.cliffDuration;
        if (currentTime < cliffEnd) {
            return tgeAmount;
        }

        // After cliff, linear vesting
        uint256 vestingEnd = cliffEnd + schedule.vestingDuration;
        uint256 vestingAmount = schedule.totalAmount - tgeAmount;

        if (currentTime >= vestingEnd) {
            return schedule.totalAmount;
        }

        uint256 timeVested = currentTime - cliffEnd;
        uint256 linearVested = (vestingAmount * timeVested) / schedule.vestingDuration;

        return tgeAmount + linearVested;
    }

    function _releasableAmount(uint256 scheduleId) internal view returns (uint256) {
        uint256 vested = _vestedAmount(scheduleId);
        uint256 released = vestingSchedules[scheduleId].releasedAmount;
        
        if (vested <= released) return 0;
        return vested - released;
    }
}
