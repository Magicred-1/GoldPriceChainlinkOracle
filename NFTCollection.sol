// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title NFTCollectionERC20
 * @dev NFT Collection mintable by paying with ERC20 tokens
 * Metadata stored on IPFS
 */
contract NFTCollectionERC20 is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // ERC20 token used for payment
    IERC20 public paymentToken;
    
    // Price per NFT in ERC20 tokens (with decimals)
    uint256 public mintPrice;
    
    // Maximum supply of NFTs
    uint256 public maxSupply;
    
    // Base URI for IPFS metadata
    string private _baseTokenURI;
    
    // Mapping to track if a token URI has been set
    mapping(uint256 => bool) private _tokenURISet;
    
    // Toggle for pausing minting
    bool public mintingPaused;
    
    // Max mints per address (0 = unlimited)
    uint256 public maxMintsPerAddress;
    
    // Track mints per address
    mapping(address => uint256) public mintedByAddress;
    
    // Events
    event NFTMinted(address indexed minter, uint256 indexed tokenId, string tokenURI);
    event MintPriceUpdated(uint256 oldPrice, uint256 newPrice);
    event PaymentTokenUpdated(address indexed oldToken, address indexed newToken);
    event BaseURIUpdated(string newBaseURI);
    event MintingPausedToggled(bool isPaused);
    event FundsWithdrawn(address indexed token, address indexed to, uint256 amount);
    
    constructor(
        string memory name,
        string memory symbol,
        address _paymentToken,
        uint256 _mintPrice,
        uint256 _maxSupply,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        require(_paymentToken != address(0), "Invalid payment token");
        require(_maxSupply > 0, "Max supply must be > 0");
        
        paymentToken = IERC20(_paymentToken);
        mintPrice = _mintPrice;
        maxSupply = _maxSupply;
        _baseTokenURI = baseTokenURI;
        mintingPaused = false;
        maxMintsPerAddress = 0; // Unlimited by default
    }
    
    /**
     * @dev Mint a new NFT by paying with ERC20 tokens
     * @param tokenURI The IPFS URI for the token metadata (e.g., "QmHash...")
     */
    function mint(string memory tokenURI) external nonReentrant {
        require(!mintingPaused, "Minting is paused");
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");
        
        if (maxMintsPerAddress > 0) {
            require(
                mintedByAddress[msg.sender] < maxMintsPerAddress,
                "Max mints per address reached"
            );
        }
        
        // Transfer ERC20 tokens from minter to contract
        require(
            paymentToken.transferFrom(msg.sender, address(this), mintPrice),
            "Payment failed"
        );
        
        // Mint NFT
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenURISet[tokenId] = true;
        
        mintedByAddress[msg.sender]++;
        
        emit NFTMinted(msg.sender, tokenId, tokenURI);
    }
    
    /**
     * @dev Batch mint multiple NFTs
     * @param tokenURIs Array of IPFS URIs for token metadata
     */
    function batchMint(string[] memory tokenURIs) external nonReentrant {
        require(!mintingPaused, "Minting is paused");
        require(tokenURIs.length > 0, "Empty array");
        require(
            _tokenIdCounter.current() + tokenURIs.length <= maxSupply,
            "Exceeds max supply"
        );
        
        if (maxMintsPerAddress > 0) {
            require(
                mintedByAddress[msg.sender] + tokenURIs.length <= maxMintsPerAddress,
                "Exceeds max mints per address"
            );
        }
        
        uint256 totalCost = mintPrice * tokenURIs.length;
        
        // Transfer total ERC20 tokens from minter to contract
        require(
            paymentToken.transferFrom(msg.sender, address(this), totalCost),
            "Payment failed"
        );
        
        // Mint all NFTs
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _safeMint(msg.sender, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            _tokenURISet[tokenId] = true;
            
            emit NFTMinted(msg.sender, tokenId, tokenURIs[i]);
        }
        
        mintedByAddress[msg.sender] += tokenURIs.length;
    }
    
    /**
     * @dev Owner can mint NFTs for free (for giveaways, team, etc.)
     * @param to Address to mint to
     * @param tokenURI IPFS URI for the token metadata
     */
    function ownerMint(address to, string memory tokenURI) external onlyOwner {
        require(_tokenIdCounter.current() < maxSupply, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _tokenURISet[tokenId] = true;
        
        emit NFTMinted(to, tokenId, tokenURI);
    }
    
    /**
     * @dev Update the mint price
     * @param newPrice New price in ERC20 tokens
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        uint256 oldPrice = mintPrice;
        mintPrice = newPrice;
        emit MintPriceUpdated(oldPrice, newPrice);
    }
    
    /**
     * @dev Update the payment token
     * @param newPaymentToken Address of new ERC20 payment token
     */
    function setPaymentToken(address newPaymentToken) external onlyOwner {
        require(newPaymentToken != address(0), "Invalid token address");
        address oldToken = address(paymentToken);
        paymentToken = IERC20(newPaymentToken);
        emit PaymentTokenUpdated(oldToken, newPaymentToken);
    }
    
    /**
     * @dev Set base URI for IPFS metadata
     * @param baseTokenURI New base URI (e.g., "ipfs://")
     */
    function setBaseURI(string memory baseTokenURI) external onlyOwner {
        _baseTokenURI = baseTokenURI;
        emit BaseURIUpdated(baseTokenURI);
    }
    
    /**
     * @dev Toggle minting pause state
     */
    function toggleMintingPause() external onlyOwner {
        mintingPaused = !mintingPaused;
        emit MintingPausedToggled(mintingPaused);
    }
    
    /**
     * @dev Set maximum mints per address
     * @param max Maximum number of mints (0 = unlimited)
     */
    function setMaxMintsPerAddress(uint256 max) external onlyOwner {
        maxMintsPerAddress = max;
    }
    
    /**
     * @dev Withdraw accumulated ERC20 tokens
     * @param to Address to send tokens to
     */
    function withdrawTokens(address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        uint256 balance = paymentToken.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(paymentToken.transfer(to, balance), "Transfer failed");
        emit FundsWithdrawn(address(paymentToken), to, balance);
    }
    
    /**
     * @dev Emergency withdraw any ERC20 token
     * @param token Address of ERC20 token to withdraw
     * @param to Address to send tokens to
     */
    function emergencyWithdraw(address token, address to) external onlyOwner {
        require(to != address(0), "Invalid address");
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(tokenContract.transfer(to, balance), "Transfer failed");
        emit FundsWithdrawn(token, to, balance);
    }
    
    /**
     * @dev Get total number of minted NFTs
     */
    function totalMinted() external view returns (uint256) {
        return _tokenIdCounter.current();
    }
    
    /**
     * @dev Get remaining supply
     */
    function remainingSupply() external view returns (uint256) {
        return maxSupply - _tokenIdCounter.current();
    }
    
    /**
     * @dev Override base URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Required overrides for multiple inheritance
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}