// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

interface IFlashLoanReceiver {
    function executeOperation(address token, uint256 amount, uint256 fee, bytes calldata data) external;
}

contract LiquidityPool is ERC20 {
    // 1. State Variables & Setup
    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;

    // TWAP Accumulators
    uint256 public price0CumulativeLast;
    uint256 public price1CumulativeLast;
    uint32 public blockTimestampLast;

    uint256 private constant MINIMUM_LIQUIDITY = 10**3;
    
    event Mint(address indexed sender, uint256 amount0, uint256 amount1);
    event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to);
    event Swap(
        address indexed sender,
        uint256 amount0In,
        uint256 amount1In,
        uint256 amount0Out,
        uint256 amount1Out,
        address indexed to
    );
    event Sync(uint256 reserve0, uint256 reserve1);
    
    // Custom reentrancy guard
    uint256 private unlocked = 1;
    modifier lock() {
        require(unlocked == 1, "Locked (Reentrancy Guard)");
        unlocked = 0;
        _;
        unlocked = 1;
    }

    // The LP Token is implemented by inheriting OpenZeppelin's ERC20
    constructor(address _token0, address _token1) ERC20("DeFi Exchange LP", "DEX-LP") {
        require(_token0 != address(0) && _token1 != address(0), "Invalid tokens");
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    // TWAP Update logic
    function _update(uint256 balance0, uint256 balance1, uint256 _reserve0, uint256 _reserve1) private {
        uint32 blockTimestamp = uint32(block.timestamp % 2**32);
        uint32 timeElapsed = blockTimestamp - blockTimestampLast;
        if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
            price0CumulativeLast += ((_reserve1 << 112) / _reserve0) * timeElapsed;
            price1CumulativeLast += ((_reserve0 << 112) / _reserve1) * timeElapsed;
        }
        reserve0 = balance0;
        reserve1 = balance1;
        blockTimestampLast = blockTimestamp;
        emit Sync(reserve0, reserve1);
    }

    // 2. Core Function 1: Adding Liquidity
    function addLiquidity(uint256 amount0Desired, uint256 amount1Desired) external lock returns (uint256 shares) {
        require(amount0Desired > 0 && amount1Desired > 0, "Zero amount");

        uint256 _reserve0 = reserve0;
        uint256 _reserve1 = reserve1;
        uint256 amount0;
        uint256 amount1;

        if (totalSupply() == 0) {
            amount0 = amount0Desired;
            amount1 = amount1Desired;
        } else {
            uint256 amount1Optimal = (amount0Desired * _reserve1) / _reserve0;
            if (amount1Optimal <= amount1Desired) {
                amount0 = amount0Desired;
                amount1 = amount1Optimal;
            } else {
                uint256 amount0Optimal = (amount1Desired * _reserve0) / _reserve1;
                require(amount0Optimal <= amount0Desired, "Optimal amount > desired");
                amount0 = amount0Optimal;
                amount1 = amount1Desired;
            }
        }

        // Measured Reality: Measure Before -> Execute -> Measure After
        uint256 balance0Before = token0.balanceOf(address(this));
        require(token0.transferFrom(msg.sender, address(this), amount0), "Transfer0 failed");
        uint256 actualAmount0 = token0.balanceOf(address(this)) - balance0Before;

        uint256 balance1Before = token1.balanceOf(address(this));
        require(token1.transferFrom(msg.sender, address(this), amount1), "Transfer1 failed");
        uint256 actualAmount1 = token1.balanceOf(address(this)) - balance1Before;

        // Calculate shares using actual amounts received!
        if (totalSupply() == 0) {
            shares = Math.sqrt(actualAmount0 * actualAmount1) - MINIMUM_LIQUIDITY;
            _mint(address(0xdead), MINIMUM_LIQUIDITY); // Permanently lock the first 1000 shares
        } else {
            shares = Math.min(
                (actualAmount0 * totalSupply()) / _reserve0,
                (actualAmount1 * totalSupply()) / _reserve1
            );
        }
        require(shares > 0, "Shares equal zero");

        _mint(msg.sender, shares);
        _update(token0.balanceOf(address(this)), token1.balanceOf(address(this)), _reserve0, _reserve1);
        
        emit Mint(msg.sender, actualAmount0, actualAmount1);
    }

    // 3. Core Function 2: Swapping
    function swap(address tokenIn, uint256 amountInDesired) external lock returns (uint256 amountOut) {
        require(amountInDesired > 0, "Zero input amount");
        require(tokenIn == address(token0) || tokenIn == address(token1), "Invalid token");
        
        uint256 _reserve0 = reserve0;
        uint256 _reserve1 = reserve1;
        // The "Zero Reserve" Trap Check
        require(_reserve0 > 0 && _reserve1 > 0, "Zero liquidity in pool");

        bool isToken0 = tokenIn == address(token0);
        
        IERC20 tokenInContract = isToken0 ? token0 : token1;
        IERC20 tokenOutContract = isToken0 ? token1 : token0;
        
        uint256 reserveIn = isToken0 ? _reserve0 : _reserve1;
        uint256 reserveOut = isToken0 ? _reserve1 : _reserve0;

        // Measured Reality: Measure Before -> Execute -> Measure After
        uint256 balanceBefore = tokenInContract.balanceOf(address(this));
        require(tokenInContract.transferFrom(msg.sender, address(this), amountInDesired), "Transfer in failed");
        uint256 actualAmountIn = tokenInContract.balanceOf(address(this)) - balanceBefore;
        require(actualAmountIn > 0, "Actual input amount is zero");

        // Apply a 0.3% fee to the TRUE amount received
        uint256 amountInWithFee = actualAmountIn * 997;
        
        // Calculate output using x * y = k
        amountOut = (amountInWithFee * reserveOut) / ((reserveIn * 1000) + amountInWithFee);
        
        // Ensure output is valid and won't completely drain the pool
        require(amountOut > 0, "Zero output amount");
        require(amountOut < reserveOut, "Insufficient liquidity for swap");

        // Final Interaction: Transfer output tokens to user BEFORE update
        require(tokenOutContract.transfer(msg.sender, amountOut), "Transfer out failed");

        // Effects: Update state using measured reality
        uint256 balance0 = token0.balanceOf(address(this));
        uint256 balance1 = token1.balanceOf(address(this));

        // The K Invariant Check
        uint256 reserve0Adjusted = (balance0 * 1000) - (isToken0 ? actualAmountIn * 3 : 0);
        uint256 reserve1Adjusted = (balance1 * 1000) - (!isToken0 ? actualAmountIn * 3 : 0);
        
        require(reserve0Adjusted * reserve1Adjusted >= _reserve0 * _reserve1 * (1000**2), "K invariant failed");

        _update(balance0, balance1, _reserve0, _reserve1);

        uint256 amount0In = isToken0 ? actualAmountIn : 0;
        uint256 amount1In = isToken0 ? 0 : actualAmountIn;
        uint256 amount0Out = isToken0 ? 0 : amountOut;
        uint256 amount1Out = isToken0 ? amountOut : 0;
        emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, msg.sender);
    }

    // 4. Core Function 3: Removing Liquidity
    function removeLiquidity(uint256 shares) external lock returns (uint256 amount0, uint256 amount1) {
        require(shares > 0, "Zero shares");
        
        uint256 _totalSupply = totalSupply();
        uint256 _reserve0 = reserve0;
        uint256 _reserve1 = reserve1;
        
        // Calculate proportional tokens to return (multiply before divide)
        amount0 = (shares * _reserve0) / _totalSupply;
        amount1 = (shares * _reserve1) / _totalSupply;

        require(amount0 > 0 && amount1 > 0, "Calculated amounts are zero");

        // Checks-Effects-Interactions (Effects First)
        _burn(msg.sender, shares);

        // Checks-Effects-Interactions (Interactions Last)
        require(token0.transfer(msg.sender, amount0), "Transfer0 failed");
        require(token1.transfer(msg.sender, amount1), "Transfer1 failed");

        _update(token0.balanceOf(address(this)), token1.balanceOf(address(this)), _reserve0, _reserve1);
        
        emit Burn(msg.sender, amount0, amount1, msg.sender);
    }

    // 5. Utility: Sync Reserves
    function sync() external lock {
        _update(token0.balanceOf(address(this)), token1.balanceOf(address(this)), reserve0, reserve1);
    }

    // 6. Flash Loan
    function flashLoan(address receiver, address token, uint256 amount, bytes calldata data) external lock {
        require(token == address(token0) || token == address(token1), "Invalid token");
        uint256 _reserve0 = reserve0;
        uint256 _reserve1 = reserve1;
        
        IERC20 tokenContract = IERC20(token);
        
        // 0.3% fee
        uint256 fee = (amount * 3) / 1000;
        
        uint256 balanceBefore = tokenContract.balanceOf(address(this));
        require(balanceBefore >= amount, "Insufficient liquidity");

        // Optimistic transfer
        require(tokenContract.transfer(receiver, amount), "Transfer out failed");

        // Callback
        IFlashLoanReceiver(receiver).executeOperation(token, amount, fee, data);

        // Enforcement
        uint256 balanceAfter = tokenContract.balanceOf(address(this));
        require(balanceAfter >= balanceBefore + fee, "Flash loan not repaid");

        // Update reserves
        _update(token0.balanceOf(address(this)), token1.balanceOf(address(this)), _reserve0, _reserve1);
    }
}
