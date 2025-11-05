"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits } from "viem";
import { tokenABI } from "@/components/tokenABI";
import { TOKEN_CONTRACT_ADDRESS, COLLATERAL_TOKEN_CONTRACT_ADDRESS } from "@/components/constants";
import { erc20Abi } from "viem";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [mintAmount, setMintAmount] = useState("0.01");
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [approved, setApproved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const amount = parseUnits(mintAmount, 18);

  // ----- Approve Collateral -----
  const { writeContract: approveContract, data: approveHash } = useWriteContract();
  const { isLoading: approving, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  const handleApprove = async () => {
    if (!isConnected) return alert("Connect your wallet first");
    setErrorMessage(null);
    try {
      approveContract({
        address: COLLATERAL_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [TOKEN_CONTRACT_ADDRESS as `0x${string}`, amount],
      });
    } catch (error) {
      console.error("Approval error:", error);
      setErrorMessage("Approval failed. Please try again.");
    }
  };

  // ----- Mint with Collateral -----
  const { writeContract: mintContract, data: mintHash, isPending, isError } = useWriteContract();
  const { isLoading: txLoading, isSuccess: mintSuccess } = useWaitForTransactionReceipt({ hash: mintHash });

  const handleMint = async () => {
    if (!isConnected) return alert("Connect your wallet first");
    setErrorMessage(null);
    try {
      mintContract({
        address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
        abi: tokenABI,
        functionName: "mintWithCollateral",
        args: [amount],
      });
    } catch (contractError) {
      console.error("Minting error:", contractError);
      setErrorMessage("Minting failed. Please try again.");
    }
  };

  // ----- Read: allowance -----
  const { refetch: refetchAllowance, data: allowanceData } = useReadContract({
    address: COLLATERAL_TOKEN_CONTRACT_ADDRESS as `0x${string}`,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as `0x${string}`, TOKEN_CONTRACT_ADDRESS as `0x${string}`],
    query: { enabled: false },
  });

  const fetchAllowance = useCallback(async () => {
    if (!address) return;
    try {
      const { data } = await refetchAllowance();
      // Check if allowance is sufficient - if so, no need to approve again
      const hasEnoughAllowance = data !== undefined && data !== null && BigInt(data) >= amount;
      setApproved(hasEnoughAllowance);
    } catch (err) {
      console.error(err);
      setApproved(false);
    }
  }, [address, amount, refetchAllowance]);

  useEffect(() => {
    if (isConnected) fetchAllowance();
  }, [isConnected, address, fetchAllowance, approveSuccess, mintSuccess]);

  // ----- Read: balanceOf -----
  const { refetch: refetchBalance } = useReadContract({
    address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
    abi: tokenABI,
    functionName: "balanceOf",
    args: [address as `0x${string}`],
    query: { enabled: false },
  });

  const fetchBalance = useCallback(async () => {
    if (!address) return;
    setLoadingBalance(true);
    try {
      const { data } = await refetchBalance();
      setBalance(data ? data.toString() : "0");
    } catch (err) {
      console.error(err);
      setBalance("0");
    } finally {
      setLoadingBalance(false);
    }
  }, [address, refetchBalance]);

  useEffect(() => {
    if (isConnected) fetchBalance();
  }, [isConnected, address, fetchBalance]);

  useEffect(() => {
    if (mintSuccess) fetchBalance();
  }, [mintSuccess, fetchBalance]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-zinc-950 dark:via-amber-950/20 dark:to-zinc-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
        <main className="w-full max-w-5xl">
          {/* Header */}
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-2xl shadow-yellow-500/50 mb-4 transform hover:scale-110 transition-transform duration-300">
              <span className="text-4xl">✨</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 via-amber-500 to-orange-600 dark:from-yellow-400 dark:via-amber-300 dark:to-orange-400 tracking-tight">
              Gold Stable Token
            </h1>
            <p className="text-xl text-amber-800 dark:text-amber-200 font-medium">
              Premium collateralized stablecoin backed by gold reserves
            </p>
          </div>

          {/* Connect Button Container */}
          <div className="flex justify-center mb-12">
            <div className="transform hover:scale-105 transition-transform duration-200">
              <ConnectButton />
            </div>
          </div>

          {isConnected && (
            <div className="grid lg:grid-cols-2 gap-6 animate-in fade-in duration-500">
              {/* Left Column - Balance Card */}
              <div className="space-y-6">
                <div className="group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-200/50 dark:border-amber-800/50 hover:shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-amber-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                        <span className="text-2xl">💰</span>
                      </div>
                      <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                        Your Balance
                      </h2>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-zinc-800 dark:to-amber-900/20 rounded-2xl p-6 mb-4">
                      {loadingBalance ? (
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-amber-700 dark:text-amber-300">Loading balance...</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-amber-700 dark:text-amber-400 mb-2 font-medium">
                            GOF Token Balance
                          </p>
                          <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-600 dark:from-yellow-400 dark:to-amber-400">
                            {balance ?? "0"}
                          </p>
                          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                            GOF
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-amber-100/50 dark:bg-zinc-800/50 rounded-xl p-3">
                        <p className="text-amber-700 dark:text-amber-400 mb-1">Status</p>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Active</p>
                      </div>
                      <div className="bg-amber-100/50 dark:bg-zinc-800/50 rounded-xl p-3">
                        <p className="text-amber-700 dark:text-amber-400 mb-1">Network</p>
                        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Ethereum</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-amber-200/30 dark:border-amber-800/30 hover:shadow-xl transition-all duration-300">
                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">Collateral Ratio</p>
                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">150%</p>
                  </div>
                  <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-2xl p-5 shadow-lg border border-amber-200/30 dark:border-amber-800/30 hover:shadow-xl transition-all duration-300">
                    <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">Stability Fee</p>
                    <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">0.5%</p>
                  </div>
                </div>
              </div>

              {/* Right Column - Mint Card */}
              <div className="space-y-6">
                <div className="group relative bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-200/50 dark:border-amber-800/50 hover:shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02]">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                        <span className="text-2xl">⚡</span>
                      </div>
                      <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                        Mint Tokens
                      </h2>
                    </div>

                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
                          Amount to Mint
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={mintAmount}
                            onChange={(e) => setMintAmount(e.target.value)}
                            className="w-full rounded-2xl border-2 border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-800 p-4 pr-16 text-lg font-semibold text-zinc-800 dark:text-zinc-100 focus:outline-none focus:ring-4 focus:ring-amber-500/30 focus:border-amber-500 transition-all"
                            placeholder="0.00"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-600 dark:text-amber-400">
                            GOF
                          </span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-amber-700 dark:text-amber-400">Required Collateral</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-100">{mintAmount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-amber-700 dark:text-amber-400">You&apos;ll Receive</span>
                          <span className="font-semibold text-zinc-800 dark:text-zinc-100">{mintAmount} GOF</span>
                        </div>
                      </div>

                      {!approved ? (
                        <button
                          onClick={handleApprove}
                          disabled={approving}
                          className={`w-full rounded-2xl px-8 py-4 font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-xl ${
                            approving
                              ? "bg-zinc-400 text-zinc-700 cursor-not-allowed"
                              : "bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-zinc-900 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-400 shadow-amber-500/50"
                          }`}
                        >
                          {approving ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-3 border-zinc-700 border-t-transparent rounded-full animate-spin"></div>
                              Approving...
                            </span>
                          ) : (
                            "Approve Collateral"
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={handleMint}
                          disabled={isPending || txLoading}
                          className={`w-full rounded-2xl px-8 py-4 font-bold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 shadow-xl ${
                            isPending || txLoading
                              ? "bg-zinc-400 text-zinc-700 cursor-not-allowed"
                              : "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white hover:from-amber-400 hover:via-orange-400 hover:to-amber-500 shadow-amber-500/50"
                          }`}
                        >
                          {isPending ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                              Confirm in Wallet...
                            </span>
                          ) : txLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                              Minting...
                            </span>
                          ) : (
                            "🚀 Mint Tokens"
                          )}
                        </button>
                      )}

                      {mintSuccess && (
                        <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            <div>
                              <p className="font-bold text-green-800 dark:text-green-300">Mint Successful!</p>
                              <p className="text-sm text-green-700 dark:text-green-400">Your tokens have been minted</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {errorMessage && (
                        <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">❌</span>
                            <div className="flex-1">
                              <p className="font-bold text-red-800 dark:text-red-300">Transaction Failed</p>
                              <p className="text-sm text-red-700 dark:text-red-400 mt-1 break-words">{errorMessage}</p>
                              <button 
                                onClick={() => setErrorMessage(null)}
                                className="text-xs text-red-600 dark:text-red-400 underline mt-2"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* NFT Collection - Full Width */}
              <div className="lg:col-span-2">
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-200/50 dark:border-amber-800/50">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                        NFT Collection
                      </h2>
                      <p className="text-sm text-amber-700 dark:text-amber-400">
                        Your tokenized assets
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="group relative aspect-square bg-gradient-to-br from-amber-100 to-orange-100 dark:from-zinc-800 dark:to-amber-900/30 rounded-2xl flex flex-col items-center justify-center overflow-hidden border-2 border-amber-200/50 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 hover:scale-105 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-amber-400/0 group-hover:from-yellow-400/20 group-hover:to-amber-400/20 transition-all duration-300"></div>
                        <span className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-300">🏆</span>
                        <p className="font-bold text-zinc-700 dark:text-zinc-300 text-sm">NFT #{n}</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Coming Soon</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="text-center bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-amber-200/50 dark:border-amber-800/50 max-w-2xl mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-amber-500/50 animate-bounce">
                <span className="text-5xl">🔐</span>
              </div>
              <h3 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">
                Connect Your Wallet
              </h3>
              <p className="text-amber-700 dark:text-amber-300 text-lg">
                Connect your wallet to start minting GOF tokens and accessing your digital assets
              </p>
            </div>
          )}
        </main>

        <footer className="mt-16 text-center text-sm text-amber-700 dark:text-amber-400">
          <p className="font-medium">Built with Next.js, Wagmi & RainbowKit</p>
          <p className="text-xs mt-1 text-amber-600 dark:text-amber-500">Secured by blockchain technology</p>
        </footer>
      </div>
    </div>
  );
}