// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MockToken is ERC20, Ownable, EIP712 {
    address public oracleNode;
    mapping(address => uint256) public nonces;
    mapping(string => bool) public claimedCertificates;

    event CarbonRetired(address indexed user, uint256 amount, string note);

    bytes32 private constant CLAIM_TYPEHASH = keccak256("Claim(address user,string certificateId,uint256 amount,uint256 nonce)");

    constructor(string memory name, string memory symbol, address initialOwner) 
        ERC20(name, symbol) 
        Ownable(initialOwner)
        EIP712(name, "1")
    {
        oracleNode = initialOwner; // Default Oracle is the deployer wallet
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function setOracleNode(address _oracleNode) external onlyOwner {
        oracleNode = _oracleNode;
    }

    // Secure claim function: verifies cryptographic signature from the Oracle Server
    function claim(string memory certificateId, uint256 amount, bytes memory signature) public {
        require(!claimedCertificates[certificateId], "Certificate already claimed");

        bytes32 structHash = keccak256(abi.encode(
            CLAIM_TYPEHASH, 
            msg.sender, 
            keccak256(bytes(certificateId)), 
            amount, 
            nonces[msg.sender]
        ));
        bytes32 digest = _hashTypedDataV4(structHash);
        
        address signer = ECDSA.recover(digest, signature);
        require(signer == oracleNode, "Invalid Oracle Signature");
        
        claimedCertificates[certificateId] = true;
        nonces[msg.sender]++;
        _mint(msg.sender, amount);
    }

    // Users can permanently burn their carbon tokens to claim the real-world environmental benefit
    function retire(uint256 amount, string memory note) public {
        _burn(msg.sender, amount);
        emit CarbonRetired(msg.sender, amount, note);
    }
}
