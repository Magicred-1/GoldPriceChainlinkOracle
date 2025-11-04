'use client';

import React, { useEffect, useState } from 'react';
import { useAccount, useContractRead, useWalletClient, usePublicClient } from 'wagmi';
import { ABI } from './abi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESS } from './constants';

function formatBigInt(n: any) {
	try {
		return n?.toString();
	} catch {
		return String(n);
	}
}

export default function ContractUI() {
	const { address } = useAccount();
	const walletClient = useWalletClient();
	const publicClient = usePublicClient();
	const [mintAmount, setMintAmount] = useState('');
	const [redeemAmount, setRedeemAmount] = useState('');
	const [txHash, setTxHash] = useState<string | null>(null);
	const [balance, setBalance] = useState<string>('0');
	const [priceInfo, setPriceInfo] = useState<{ price: string; updatedAt: string } | null>(null);
	const [txPending, setTxPending] = useState(false);
	const [priceLoading, setPriceLoading] = useState(false);

	// Read gold price via hook
	const { data: goldPriceData } = useContractRead({
		address: CONTRACT_ADDRESS as `0x${string}`,
		abi: ABI as any,
		functionName: 'getGoldPrice',
	});

	// Read user's GOF balance via hook (call refetch manually)
	const { data: balanceData } = useContractRead({
		address: CONTRACT_ADDRESS as `0x${string}`,
		abi: ABI as any,
		functionName: 'balanceOf',
		args: [address ?? '0x0000000000000000000000000000000000000000'],
	});

	useEffect(() => {
		if (goldPriceData) {
			const g: any = goldPriceData;
			try {
				const formatted = formatUnits(g[0] as any, 18);
				const updated = Number(g[1])
					? new Date(Number(g[1]) * 1000).toLocaleString()
					: String(g[1]);
				setPriceInfo({ price: formatted, updatedAt: updated });
			} catch (e) {
				setPriceInfo({ price: String(g[0]), updatedAt: String(g[1]) });
			}
		}
	}, [goldPriceData]);

	useEffect(() => {
		if (balanceData) {
			try {
				const formatted = formatUnits(balanceData as any, 18);
				setBalance(formatted);
			} catch (e) {
				setBalance(String(balanceData as any));
			}
		}
	}, [balanceData]);

	// helper to refresh price and balance manually or after tx
	async function refreshData() {
		try {
			setPriceLoading(true);
			// read gold price
			if (!publicClient) return;
			const gp: any = await publicClient.readContract({
				address: CONTRACT_ADDRESS as `0x${string}`,
				abi: ABI as any,
				functionName: 'getGoldPrice',
				args: [],
			});
			try {
				const formatted = formatUnits(gp[0] as any, 18);
				const updated = Number(gp[1])
					? new Date(Number(gp[1]) * 1000).toLocaleString()
					: String(gp[1]);
				setPriceInfo({ price: formatted, updatedAt: updated });
			} catch (e) {
				setPriceInfo({ price: String(gp[0]), updatedAt: String(gp[1]) });
			}

			// read balance if connected
			if (address) {
				const b: any = await publicClient.readContract({
					address: CONTRACT_ADDRESS as `0x${string}`,
					abi: ABI as any,
					functionName: 'balanceOf',
					args: [address as `0x${string}`],
				});
				try {
					setBalance(formatUnits(b as any, 18));
				} catch (e) {
					setBalance(String(b));
				}
			}
		} catch (e) {
			console.error('refresh failed', e);
		} finally {
			setPriceLoading(false);
		}
	}

	// Handlers using walletClient.writeContract (viem-compatible)
	async function handleMint() {
		if (!mintAmount) return;
		try {
			// parseUnits allows users to enter human-friendly token amounts (e.g. "100")
			const amount = parseUnits(mintAmount, 18);
			setTxPending(true);
			const hash = await walletClient?.data?.writeContract({
				address: CONTRACT_ADDRESS as `0x${string}`,
				abi: ABI as any,
				functionName: 'mintWithCollateral',
				args: [amount],
			});
			setTxHash(String(hash));

			// wait for receipt (poll)
			if (hash && publicClient) {
				let receipt: any = null;
				try {
					// some providers expose wait, but poll here for compatibility
					receipt = await publicClient.getTransactionReceipt({
						hash: String(hash) as `0x${string}`,
					});
				} catch (e) {
					// ignore
				}
				while (!receipt) {
					await new Promise((r) => setTimeout(r, 1000));
					try {
						receipt = await publicClient.getTransactionReceipt({
							hash: String(hash) as `0x${string}`,
						});
					} catch (e) {
						// ignore
					}
				}
				// refresh on mined
				await refreshData();
			}
		} catch (e: any) {
			console.error('mint failed', e);
			setTxHash(null);
		}
		setTxPending(false);
	}

	async function handleRedeem() {
		if (!redeemAmount) return;
		try {
			const amount = parseUnits(redeemAmount, 18);
			setTxPending(true);
			const hash = await walletClient?.data?.writeContract({
				address: CONTRACT_ADDRESS as `0x${string}`,
				abi: ABI as any,
				functionName: 'redeem',
				args: [amount],
			});
			setTxHash(String(hash));

			if (hash && publicClient) {
				let receipt: any = null;
				try {
					receipt = await publicClient.getTransactionReceipt({
						hash: String(hash) as `0x${string}`,
					});
				} catch (e) {}
				while (!receipt) {
					await new Promise((r) => setTimeout(r, 1000));
					try {
						receipt = await publicClient.getTransactionReceipt({
							hash: String(hash) as `0x${string}`,
						});
					} catch (e) {}
				}
				await refreshData();
			}
		} catch (e: any) {
			console.error('redeem failed', e);
			setTxHash(null);
		}
		setTxPending(false);
	}

	return (
		<section className="w-full max-w-3xl rounded-2xl p-8 bg-gradient-to-br from-[#0f172a] to-[#001219] text-white shadow-2xl glassmorphism">
			<h2 className="text-2xl font-bold mb-4 neon">Gold Stable (GOF) — Interface</h2>

			<div className="grid gap-4 md:grid-cols-2">
				<div className="p-4 rounded-lg bg-black/30">
					<p className="text-sm text-zinc-300">Connected address</p>
					<p className="truncate font-mono mt-2">{address ?? 'Not connected'}</p>
					<p className="text-sm text-zinc-300 mt-3">GOF balance</p>
					<p className="font-mono">{balance}</p>
				</div>

				<div className="p-4 rounded-lg bg-black/30">
					<p className="text-sm text-zinc-300">Gold price (18dp)</p>
					<p className="font-mono">{priceInfo ? priceInfo.price : '—'}</p>
					<p className="text-xs text-zinc-400 mt-1">
						updatedAt: {priceInfo ? priceInfo.updatedAt : '—'}
					</p>
				</div>
			</div>

			<div className="mt-6 grid gap-4 md:grid-cols-2">
				<div className="p-4 rounded-lg bg-black/20">
					<label className="text-sm">Mint GOF (amount GOF)</label>
					<input
						value={mintAmount}
						onChange={(e) => setMintAmount(e.target.value)}
						placeholder="e.g. 100"
						className="w-full mt-2 p-2 rounded bg-black/40"
					/>
					<div className="mt-3 flex gap-2">
						<button
							onClick={handleMint}
							className="px-4 py-2 rounded bg-emerald-500 text-black font-semibold"
						>
							Mint
						</button>
					</div>
				</div>

				<div className="p-4 rounded-lg bg-black/20">
					<label className="text-sm">Redeem GOF (amount GOF)</label>
					<input
						value={redeemAmount}
						onChange={(e) => setRedeemAmount(e.target.value)}
						placeholder="e.g. 50"
						className="w-full mt-2 p-2 rounded bg-black/40"
					/>
					<div className="mt-3 flex gap-2">
						<button
							onClick={handleRedeem}
							className="px-4 py-2 rounded bg-rose-500 text-black font-semibold"
						>
							Redeem
						</button>
					</div>
				</div>
			</div>

			<div className="mt-6 text-sm text-zinc-300">
				<p>Last tx: {txHash ?? '—'}</p>
			</div>
		</section>
	);
}
