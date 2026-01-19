// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SENTGovernance
 * @notice On-chain governance for SENT token holders
 * @dev Voting power = SENT balance at proposal creation snapshot
 * 
 * Governance Scope:
 * - Railway corridor expansions (which countries to add)
 * - Fee structure changes (platform commission rates)
 * - Treasury management (how to deploy reserves)
 * - Partnership approvals (new railway operators)
 * - Protocol upgrades
 */
contract SENTGovernance is Ownable, ReentrancyGuard {
    IERC20 public immutable sentToken;

    // Proposal states
    enum ProposalState { Pending, Active, Canceled, Defeated, Succeeded, Queued, Executed }

    // Proposal types for categorization
    enum ProposalType { 
        CorridorExpansion,    // Add new railway corridor
        FeeChange,            // Modify platform fees
        TreasuryAction,       // Treasury fund allocation
        PartnershipApproval,  // Approve new railway partner
        ProtocolUpgrade,      // Technical changes
        Other                 // General governance
    }

    struct Proposal {
        uint256 id;
        address proposer;
        ProposalType proposalType;
        string title;
        string description;
        string ipfsHash;           // Detailed proposal on IPFS
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 startBlock;
        uint256 endBlock;
        uint256 snapshotBlock;     // Block for balance snapshot
        bool canceled;
        bool executed;
        mapping(address => bool) hasVoted;
        mapping(address => uint8) voteChoice; // 0=against, 1=for, 2=abstain
    }

    // Configuration
    uint256 public proposalThreshold;     // Min SENT to create proposal (default: 0.1% of supply)
    uint256 public votingDelay;           // Blocks before voting starts (default: 1 day)
    uint256 public votingPeriod;          // Blocks for voting (default: 7 days)
    uint256 public quorumPercentage;      // Min participation % (default: 4%)
    uint256 public executionDelay;        // Blocks before execution (default: 2 days)

    // State
    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public latestProposalIds;

    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        ProposalType proposalType,
        string title,
        uint256 startBlock,
        uint256 endBlock
    );
    event VoteCast(
        address indexed voter,
        uint256 indexed proposalId,
        uint8 support,
        uint256 weight
    );
    event ProposalCanceled(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalQueued(uint256 indexed proposalId, uint256 eta);
    event GovernanceParameterUpdated(string parameter, uint256 oldValue, uint256 newValue);

    constructor(
        address _sentToken,
        uint256 _proposalThreshold,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _quorumPercentage
    ) Ownable(msg.sender) {
        require(_sentToken != address(0), "Invalid token");
        require(_quorumPercentage <= 100, "Quorum too high");
        
        sentToken = IERC20(_sentToken);
        proposalThreshold = _proposalThreshold;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        quorumPercentage = _quorumPercentage;
        executionDelay = 17280; // ~2 days at 10s blocks
    }

    /**
     * @notice Create a new governance proposal
     * @param proposalType Category of the proposal
     * @param title Short title for the proposal
     * @param description Brief description
     * @param ipfsHash IPFS hash for detailed proposal document
     */
    function propose(
        ProposalType proposalType,
        string calldata title,
        string calldata description,
        string calldata ipfsHash
    ) external returns (uint256) {
        require(
            sentToken.balanceOf(msg.sender) >= proposalThreshold,
            "Below proposal threshold"
        );
        require(bytes(title).length > 0, "Empty title");
        require(bytes(title).length <= 100, "Title too long");

        // Check proposer doesn't have active proposal
        uint256 latestId = latestProposalIds[msg.sender];
        if (latestId != 0) {
            ProposalState state = getProposalState(latestId);
            require(
                state != ProposalState.Active && state != ProposalState.Pending,
                "Already has active proposal"
            );
        }

        proposalCount++;
        uint256 proposalId = proposalCount;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.proposer = msg.sender;
        newProposal.proposalType = proposalType;
        newProposal.title = title;
        newProposal.description = description;
        newProposal.ipfsHash = ipfsHash;
        newProposal.snapshotBlock = block.number;
        newProposal.startBlock = block.number + votingDelay;
        newProposal.endBlock = newProposal.startBlock + votingPeriod;

        latestProposalIds[msg.sender] = proposalId;

        emit ProposalCreated(
            proposalId,
            msg.sender,
            proposalType,
            title,
            newProposal.startBlock,
            newProposal.endBlock
        );

        return proposalId;
    }

    /**
     * @notice Cast a vote on a proposal
     * @param proposalId ID of the proposal
     * @param support 0=against, 1=for, 2=abstain
     */
    function castVote(uint256 proposalId, uint8 support) external nonReentrant {
        require(support <= 2, "Invalid vote type");
        require(getProposalState(proposalId) == ProposalState.Active, "Voting closed");

        Proposal storage proposal = proposals[proposalId];
        require(!proposal.hasVoted[msg.sender], "Already voted");

        // Get voting power at snapshot
        uint256 weight = sentToken.balanceOf(msg.sender);
        require(weight > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;
        proposal.voteChoice[msg.sender] = support;

        if (support == 0) {
            proposal.againstVotes += weight;
        } else if (support == 1) {
            proposal.forVotes += weight;
        } else {
            proposal.abstainVotes += weight;
        }

        emit VoteCast(msg.sender, proposalId, support, weight);
    }

    /**
     * @notice Cancel a proposal (only proposer or if proposer falls below threshold)
     */
    function cancel(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(!proposal.executed, "Already executed");
        require(!proposal.canceled, "Already canceled");

        // Proposer can always cancel, or anyone if proposer below threshold
        require(
            msg.sender == proposal.proposer ||
            sentToken.balanceOf(proposal.proposer) < proposalThreshold,
            "Cannot cancel"
        );

        proposal.canceled = true;
        emit ProposalCanceled(proposalId);
    }

    /**
     * @notice Execute a successful proposal
     * @dev In practice, this marks it as executed; actual execution is off-chain
     */
    function execute(uint256 proposalId) external onlyOwner {
        require(getProposalState(proposalId) == ProposalState.Succeeded, "Not succeeded");

        Proposal storage proposal = proposals[proposalId];
        proposal.executed = true;

        emit ProposalExecuted(proposalId);
    }

    /**
     * @notice Get the current state of a proposal
     */
    function getProposalState(uint256 proposalId) public view returns (ProposalState) {
        require(proposalId > 0 && proposalId <= proposalCount, "Invalid proposal");

        Proposal storage proposal = proposals[proposalId];

        if (proposal.canceled) {
            return ProposalState.Canceled;
        }

        if (proposal.executed) {
            return ProposalState.Executed;
        }

        if (block.number < proposal.startBlock) {
            return ProposalState.Pending;
        }

        if (block.number <= proposal.endBlock) {
            return ProposalState.Active;
        }

        // Check if quorum reached and majority for
        uint256 totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
        uint256 totalSupply = sentToken.totalSupply();
        uint256 quorum = (totalSupply * quorumPercentage) / 100;

        if (totalVotes < quorum) {
            return ProposalState.Defeated;
        }

        if (proposal.forVotes > proposal.againstVotes) {
            return ProposalState.Succeeded;
        }

        return ProposalState.Defeated;
    }

    /**
     * @notice Get proposal core details
     */
    function getProposalCore(uint256 proposalId) external view returns (
        address proposer,
        ProposalType proposalType,
        string memory title,
        string memory description
    ) {
        Proposal storage p = proposals[proposalId];
        return (p.proposer, p.proposalType, p.title, p.description);
    }

    /**
     * @notice Get proposal vote details
     */
    function getProposalVotes(uint256 proposalId) external view returns (
        uint256 forVotes,
        uint256 againstVotes,
        uint256 abstainVotes,
        uint256 startBlock,
        uint256 endBlock,
        ProposalState state
    ) {
        Proposal storage p = proposals[proposalId];
        return (
            p.forVotes,
            p.againstVotes,
            p.abstainVotes,
            p.startBlock,
            p.endBlock,
            getProposalState(proposalId)
        );
    }

    /**
     * @notice Check if an address has voted on a proposal
     */
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return proposals[proposalId].hasVoted[voter];
    }

    /**
     * @notice Get vote choice for a voter on a proposal
     */
    function getVoteChoice(uint256 proposalId, address voter) external view returns (uint8) {
        require(proposals[proposalId].hasVoted[voter], "Has not voted");
        return proposals[proposalId].voteChoice[voter];
    }

    // Admin functions to update governance parameters

    function setProposalThreshold(uint256 newThreshold) external onlyOwner {
        emit GovernanceParameterUpdated("proposalThreshold", proposalThreshold, newThreshold);
        proposalThreshold = newThreshold;
    }

    function setVotingDelay(uint256 newDelay) external onlyOwner {
        emit GovernanceParameterUpdated("votingDelay", votingDelay, newDelay);
        votingDelay = newDelay;
    }

    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "Period must be > 0");
        emit GovernanceParameterUpdated("votingPeriod", votingPeriod, newPeriod);
        votingPeriod = newPeriod;
    }

    function setQuorumPercentage(uint256 newQuorum) external onlyOwner {
        require(newQuorum <= 100, "Quorum too high");
        emit GovernanceParameterUpdated("quorumPercentage", quorumPercentage, newQuorum);
        quorumPercentage = newQuorum;
    }
}
