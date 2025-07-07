// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface ICollection {
    function initialize(
        string memory name_,
        string memory symbol_,
        string memory contractURI_,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator,
        address initialOwner
    ) external;
}

contract MonadNFTFactory is Ownable, Pausable {
    address public implementation;
    address[] public allCollections;

    event CollectionCreated(address indexed owner, address collection, string name, string symbol, string contractURI);
    event ImplementationChanged(address oldImplementation, address newImplementation);

    constructor(address _implementation) {
        require(_implementation != address(0), "Implementation required");
        implementation = _implementation;
    }

    function setImplementation(address newImplementation) external onlyOwner {
        require(newImplementation != address(0), "Implementation required");
        emit ImplementationChanged(implementation, newImplementation);
        implementation = newImplementation;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function createCollection(
        string memory name_,
        string memory symbol_,
        string memory contractURI_,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) external whenNotPaused returns (address) {
        address clone = Clones.clone(implementation);
        ICollection(clone).initialize(
            name_,
            symbol_,
            contractURI_,
            royaltyReceiver,
            royaltyFeeNumerator,
            msg.sender // initialOwner
        );
        allCollections.push(clone);
        emit CollectionCreated(msg.sender, clone, name_, symbol_, contractURI_);
        return clone;
    }

    function getAllCollections() external view returns (address[] memory) {
        return allCollections;
    }
} 