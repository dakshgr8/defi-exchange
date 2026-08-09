// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract MockToken is ERC20, Ownable, EIP712 {
    address public oracleNode;
    mapping(address => uint256) public nonces;

    bytes32 private constant CLAIM_TYPEHASH = keccak256("Claim(address user,uint256 amount,uint256 nonce)");

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
    function claim(uint256 amount, bytes memory signature) public {
        bytes32 structHash = keccak256(abi.encode(CLAIM_TYPEHASH, msg.sender, amount, nonces[msg.sender]));
        bytes32 digest = _hashTypedDataV4(structHash);
        
        address signer = ECDSA.recover(digest, signature);
        require(signer == oracleNode, "Invalid Oracle Signature");
        
        nonces[msg.sender]++;
        _mint(msg.sender, amount);
    }
}
