// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/*
 * GoldStableChainlink.sol (Student Exercise)
 * ERC20 stable token pegged to 1oz of gold (XAU/USD).
 * Oracle: Chainlink Price Feed (XAU/USD)
 * Collateral: ERC20 (e.g. USDC)
 */

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface AggregatorV3Interface {
    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );

    function decimals() external view returns (uint8);
}

contract GoldStableChainlink is ERC20, Ownable, ReentrancyGuard {
    IERC20 public collateral;
    AggregatorV3Interface public priceFeed;

    uint16 public collateralRatioPct = 120;  // 120%
    uint16 public mintFeeBps = 50;           // 0.5%
    uint16 public redeemFeeBps = 50;         // 0.5%
    uint256 public constant BPS_DENOM = 10000;

    event Minted(address indexed user, uint256 amountGOF, uint256 collateralDeposited);
    event Redeemed(address indexed user, uint256 amountGOF, uint256 collateralReturned);
    event OracleUpdated(address oldFeed, address newFeed);

    constructor(address _collateral, address _priceFeed)
        ERC20("Gold Stable (Chainlink)", "GOF")
        Ownable(msg.sender)
    {
        collateral = IERC20(_collateral);
        priceFeed = AggregatorV3Interface(_priceFeed);
    }

    /// @notice Get gold price from Chainlink, normalized to 18 decimals
    function getGoldPrice() public view returns (uint256 price18, uint256 updatedAt) {
        // TODO: Retrieve data from priceFeed.latestRoundData()
        // TODO: Normalize price to 18 decimals
        // HINT: use priceFeed.decimals() to adjust
    }

    /// @notice Calculate how much collateral is needed to mint `amountGOF`
    function requiredCollateralForMint(uint256 amountGOF) public view returns (uint256 requiredCollateral) {
        // TODO: Use gold price and collateral ratio to compute required collateral
        // HINT: convert between decimals (18 for price, token decimals for collateral)
    }

    function mintWithCollateral(uint256 amountGOF) external nonReentrant {
        // TODO: calculate required collateral
        // TODO: transfer collateral from sender
        // TODO: apply mint fee and mint tokens
        // TODO: emit Minted event
    }

    function redeem(uint256 amountGOF) external nonReentrant {
        // TODO: compute gold value of amountGOF
        // TODO: apply redemption fee
        // TODO: burn GOF and transfer collateral back
        // TODO: emit Redeemed event
    }

    // ADMIN FUNCTIONS
    function setPriceFeed(address newFeed) external onlyOwner {
        address old = address(priceFeed);
        priceFeed = AggregatorV3Interface(newFeed);
        emit OracleUpdated(old, newFeed);
    }

    function setCollateralRatio(uint16 newPct) external onlyOwner {
        require(newPct >= 100, "ratio < 100%");
        collateralRatioPct = newPct;
    }

    function setFees(uint16 _mintFeeBps, uint16 _redeemFeeBps) external onlyOwner {
        require(_mintFeeBps <= 1000 && _redeemFeeBps <= 1000, "fees too high");
        mintFeeBps = _mintFeeBps;
        redeemFeeBps = _redeemFeeBps;
    }

    function emergencyWithdrawCollateral(address to, uint256 amount) external onlyOwner {
        require(collateral.transfer(to, amount), "withdraw failed");
    }
}
