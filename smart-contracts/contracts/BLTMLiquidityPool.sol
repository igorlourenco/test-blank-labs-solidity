// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BLTM.sol";

contract BLTMLiquidityPool is AccessControl {
    using SafeERC20 for IERC20;

    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    uint256 public exchangeRate;
    IERC20 public immutable usdc;
    BLTM public immutable bltm;
    uint256 private constant ROYALTY_PERCENTAGE = 2;
    uint256 private constant PERCENTAGE_BASE = 100;
    uint256 public royaltiesBalance;

    event ExchangeRateUpdated(uint256 newRate);
    event TokensSwapped(
        address indexed user,
        uint256 usdcAmount,
        uint256 bltmAmount,
        uint256 royaltyAmount
    );
    event TokensRedeemed(
        address indexed user,
        uint256 bltmAmount,
        uint256 usdcAmount,
        uint256 royaltyAmount
    );
    event RoyaltiesWithdrawn(address indexed owner, uint256 amount);

    constructor(address _usdc, address _bltm, uint256 _exchangeRate) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_bltm != address(0), "Invalid BLTM address");
        require(_exchangeRate > 0, "Invalid exchange rate");

        usdc = IERC20(_usdc);
        bltm = BLTM(_bltm);
        exchangeRate = _exchangeRate;
        royaltiesBalance = 0;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OWNER_ROLE, msg.sender);
    }

    function updateExchangeRate(uint256 newRate) external onlyRole(OWNER_ROLE) {
        require(newRate > 0, "Invalid exchange rate");
        exchangeRate = newRate;
        emit ExchangeRateUpdated(newRate);
    }

    function swapUSDCForBLTM(uint256 usdcAmount) external {
        require(usdcAmount > 0, "Amount must be positive");

        // calculate royalty
        uint256 royaltyAmount = (usdcAmount * ROYALTY_PERCENTAGE) /
            PERCENTAGE_BASE;
        uint256 netUsdcAmount = usdcAmount - royaltyAmount;

        // calculate BLTM amount to mint based on net USDC amount
        uint256 bltmAmount = netUsdcAmount * exchangeRate;

        // transfer USDC from user to contract
        usdc.safeTransferFrom(msg.sender, address(this), usdcAmount);

        // update royalties balance
        royaltiesBalance += royaltyAmount;

        // mint BLTM tokens to user
        bltm.mint(msg.sender, bltmAmount);

        emit TokensSwapped(
            msg.sender,
            netUsdcAmount,
            bltmAmount,
            royaltyAmount
        );
    }

    function swapBLTMForUSDC(uint256 bltmAmount) external {
        require(bltmAmount > 0, "Amount must be positive");

        // calculate gross USDC amount
        uint256 usdcAmount = bltmAmount / exchangeRate;
        require(usdcAmount > 0, "USDC amount too small");

        // calculate royalty
        uint256 royaltyAmount = (usdcAmount * ROYALTY_PERCENTAGE) /
            PERCENTAGE_BASE;
        uint256 netUsdcAmount = usdcAmount - royaltyAmount;

        // ensure contract has enough USDC - excluding royalties
        uint256 availableUSDC = usdc.balanceOf(address(this)) -
            royaltiesBalance;
        require(availableUSDC >= netUsdcAmount, "Insufficient USDC in pool");

        // burn BLTM tokens first
        bltm.burn(msg.sender, bltmAmount);

        // update royalties balance
        royaltiesBalance += royaltyAmount;

        // transfer net USDC to user
        usdc.safeTransfer(msg.sender, netUsdcAmount);

        emit TokensRedeemed(
            msg.sender,
            bltmAmount,
            netUsdcAmount,
            royaltyAmount
        );
    }

    function withdrawRoyalties(uint256 amount) external onlyRole(OWNER_ROLE) {
        require(amount > 0, "Amount must be positive");
        require(amount <= royaltiesBalance, "Amount exceeds royalties balance");

        royaltiesBalance -= amount;
        usdc.safeTransfer(msg.sender, amount);
        emit RoyaltiesWithdrawn(msg.sender, amount);
    }

    function getAvailableUSDC() public view returns (uint256) {
        return usdc.balanceOf(address(this)) - royaltiesBalance;
    }
}
