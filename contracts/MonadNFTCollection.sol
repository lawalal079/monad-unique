// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract MonadNFTCollection is Initializable, ERC721URIStorageUpgradeable, ERC2981Upgradeable, OwnableUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    string public contractURI;
    uint256 public nextTokenId;
    mapping(address => bool) public signers;
    mapping(uint256 => string) public traits;
    mapping(uint256 => uint256) public rarity;
    address[] public allSigners;
    mapping(address => bool) public admins;
    address[] public allAdmins;

    event SignerAdded(address indexed signer);
    event SignerRemoved(address indexed signer);
    event ContractURIUpdated(string newContractURI);
    event TokenMinted(address indexed to, uint256 tokenId, string tokenURI, string traits, uint256 rarity);
    event TokenBurned(uint256 tokenId);
    event TokenURIUpdated(uint256 tokenId, string newTokenURI);
    event RoyaltyInfoUpdated(address receiver, uint96 feeNumerator);
    event TraitsAndRarityUpdated(uint256 indexed tokenId, string newTraits, uint256 newRarity);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);

    modifier onlySignerOrOwner() {
        require(signers[msg.sender] || owner() == msg.sender, "Not signer or owner");
        _;
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        string memory contractURI_,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator,
        address initialOwner
    ) public initializer {
        __ERC721_init(name_, symbol_);
        __ERC721URIStorage_init();
        __Ownable_init();
        __Pausable_init();
        __ERC2981_init();
        contractURI = contractURI_;
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);
        _transferOwnership(initialOwner);
    }

    // --- Admin/Signer Management ---
    function addAdmin(address admin) external onlyOwner {
        if (!admins[admin]) {
            admins[admin] = true;
            allAdmins.push(admin);
            emit AdminAdded(admin);
        }
    }
    function removeAdmin(address admin) external onlyOwner {
        admins[admin] = false;
        emit AdminRemoved(admin);
    }
    function getAdmins() public view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allAdmins.length; i++) {
            if (admins[allAdmins[i]]) count++;
        }
        address[] memory current = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allAdmins.length; i++) {
            if (admins[allAdmins[i]]) {
                current[idx] = allAdmins[i];
                idx++;
            }
        }
        return current;
    }

    function addSigner(address signer) external onlyOwner {
        if (!signers[signer]) {
            signers[signer] = true;
            allSigners.push(signer);
            emit SignerAdded(signer);
        }
    }
    function removeSigner(address signer) external onlyOwner {
        signers[signer] = false;
        emit SignerRemoved(signer);
    }
    function getSigners() public view returns (address[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allSigners.length; i++) {
            if (signers[allSigners[i]]) count++;
        }
        address[] memory current = new address[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allSigners.length; i++) {
            if (signers[allSigners[i]]) {
                current[idx] = allSigners[i];
                idx++;
            }
        }
        return current;
    }

    // --- Pausing ---
    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // --- Metadata ---
    function setContractURI(string memory newContractURI) external onlyOwner {
        contractURI = newContractURI;
        emit ContractURIUpdated(newContractURI);
    }
    function setTokenURI(uint256 tokenId, string memory newTokenURI) external onlySignerOrOwner {
        _setTokenURI(tokenId, newTokenURI);
        emit TokenURIUpdated(tokenId, newTokenURI);
    }

    // --- Minting ---
    function mint(
        address to,
        string memory tokenURI_,
        string memory traits_,
        uint256 rarity_
    ) external onlySignerOrOwner whenNotPaused returns (uint256) {
        uint256 tokenId = nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI_);
        traits[tokenId] = traits_;
        rarity[tokenId] = rarity_;
        emit TokenMinted(to, tokenId, tokenURI_, traits_, rarity_);
        return tokenId;
    }

    // --- Burning ---
    function burn(uint256 tokenId) external {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved or owner");
        _burn(tokenId);
        emit TokenBurned(tokenId);
    }

    // --- Royalties ---
    function setRoyaltyInfo(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
        emit RoyaltyInfoUpdated(receiver, feeNumerator);
    }

    // --- Overrides ---
    function supportsInterface(bytes4 interfaceId) public view override(ERC721URIStorageUpgradeable, ERC2981Upgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setTraitsAndRarity(uint256 tokenId, string memory newTraits, uint256 newRarity) external onlySignerOrOwner {
        traits[tokenId] = newTraits;
        rarity[tokenId] = newRarity;
        emit TraitsAndRarityUpdated(tokenId, newTraits, newRarity);
    }
} 