// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract MockToken is ERC20, Ownable {
    
    // ==========================================
    // DAO PEER-VERIFICATION WITH STAKING
    // ==========================================
    struct Claim {
        address user;
        string proofUrl;
        uint256 amountRequested;
        uint256 yesStake;
        uint256 noStake;
        bool processed;
        uint256 voterCount;
        uint256 deadline;        // Auto-finalize after this timestamp
    }

    struct Vote {
        bool voteYes;
        uint256 stakeAmount;
        bool rewarded;
    }

    uint256 public nextClaimId;
    uint256 public constant MIN_STAKE = 1e18;         // Minimum 1 CRB to vote
    uint256 public constant VOTING_PERIOD = 300;      // 5 minutes voting window (for demo)

    mapping(uint256 => Claim) public claims;
    mapping(uint256 => mapping(address => Vote)) public votes;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => address[]) private claimVoters;

    event CarbonRetired(address indexed user, uint256 amount, string note);
    event ClaimSubmitted(uint256 indexed claimId, address indexed user, string proofUrl, uint256 amountRequested, uint256 deadline);
    event Voted(uint256 indexed claimId, address indexed voter, bool voteYes, uint256 stakeAmount);
    event ClaimProcessed(uint256 indexed claimId, bool approved, uint256 amountMinted);
    event RewardClaimed(uint256 indexed claimId, address indexed voter, uint256 reward);

    constructor(string memory name, string memory symbol, address initialOwner) 
        ERC20(name, symbol) 
        Ownable(initialOwner)
    {}

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function retire(uint256 amount, string memory note) public {
        _burn(msg.sender, amount);
        emit CarbonRetired(msg.sender, amount, note);
    }

    // ==========================================
    // DAO FUNCTIONS
    // ==========================================

    // 1. Submit a claim — voting window starts now
    function submitClaim(string memory proofUrl, uint256 amountRequested) public {
        require(amountRequested > 0, "Amount must be greater than 0");
        require(bytes(proofUrl).length > 0, "Proof URL cannot be empty");

        Claim storage newClaim = claims[nextClaimId];
        newClaim.user = msg.sender;
        newClaim.proofUrl = proofUrl;
        newClaim.amountRequested = amountRequested;
        newClaim.processed = false;
        newClaim.deadline = block.timestamp + VOTING_PERIOD;
        
        emit ClaimSubmitted(nextClaimId, msg.sender, proofUrl, amountRequested, newClaim.deadline);
        nextClaimId++;
    }

    // 2. Vote by staking CRB (only during voting window)
    function voteOnClaim(uint256 claimId, bool voteYes, uint256 stakeAmount) public {
        require(claimId < nextClaimId, "Claim does not exist");
        require(stakeAmount >= MIN_STAKE, "Must stake at least 1 CRB");
        
        Claim storage c = claims[claimId];
        require(!c.processed, "Claim already processed");
        require(block.timestamp < c.deadline, "Voting period has ended");
        require(!hasVoted[claimId][msg.sender], "Already voted");
        require(balanceOf(msg.sender) >= stakeAmount, "Insufficient CRB balance");

        // Lock the stake
        _transfer(msg.sender, address(this), stakeAmount);

        hasVoted[claimId][msg.sender] = true;
        votes[claimId][msg.sender] = Vote(voteYes, stakeAmount, false);
        claimVoters[claimId].push(msg.sender);
        c.voterCount++;

        if (voteYes) {
            c.yesStake += stakeAmount;
        } else {
            c.noStake += stakeAmount;
        }

        emit Voted(claimId, msg.sender, voteYes, stakeAmount);
    }

    // 3. Finalize — ONLY callable after deadline has passed (no manual override)
    function finalizeClaim(uint256 claimId) public {
        require(claimId < nextClaimId, "Claim does not exist");
        
        Claim storage c = claims[claimId];
        require(!c.processed, "Claim already processed");
        require(block.timestamp >= c.deadline, "Voting period not ended yet");
        
        c.processed = true;
        bool approved = c.yesStake > c.noStake && c.voterCount > 0;

        // Mint CRB to the claimer if approved
        if (approved) {
            _mint(c.user, c.amountRequested);
        }

        // Distribute rewards to winners
        if (c.voterCount > 0) {
            uint256 totalLoserStake = approved ? c.noStake : c.yesStake;
            uint256 totalWinnerStake = approved ? c.yesStake : c.noStake;

            address[] memory voterList = claimVoters[claimId];
            for (uint256 i = 0; i < voterList.length; i++) {
                Vote storage v = votes[claimId][voterList[i]];
                bool isWinner = (v.voteYes == approved);

                if (isWinner && totalWinnerStake > 0) {
                    uint256 reward = v.stakeAmount + (v.stakeAmount * totalLoserStake / totalWinnerStake);
                    v.rewarded = true;
                    _transfer(address(this), voterList[i], reward);
                    emit RewardClaimed(claimId, voterList[i], reward);
                }
            }

            // Burn rounding dust
            uint256 contractBalance = balanceOf(address(this));
            if (contractBalance > 0 && contractBalance < 1e15) {
                _burn(address(this), contractBalance);
            }
        }

        emit ClaimProcessed(claimId, approved, approved ? c.amountRequested : 0);
    }

    // View helper
    function getVoterCount(uint256 claimId) public view returns (uint256) {
        return claims[claimId].voterCount;
    }
}
