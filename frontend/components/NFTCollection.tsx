"use client";

import { useState, useEffect } from "react";
import { useAccount, useReadContracts } from "wagmi";
import { useWriteContracts } from "wagmi/experimental";
import { NFTCollectionABI } from "./NFTCollectionABI";
import { NFT_COLLECTION_CONTRACT_ADDRESS } from "@/components/constants";
import { erc20Abi, formatUnits } from "viem";

interface NFT {
  tokenId: number;
  name?: string;
  image?: string;
  attributes?: string[];
}

// Use your CID mapping
export const uriList = [
  "bafkreienggdkoavp6z7zwcjqwedbp3rkik2ab5e5y5v2wabiwh4oujgnsa",
];

const nftContract = {
  address: NFT_COLLECTION_CONTRACT_ADDRESS as `0x${string}`,
  abi: NFTCollectionABI,
} as const;

export default function NFTCollection() {
    const { address, isConnected } = useAccount();
    const { writeContracts } = useWriteContracts();
    const [nfts, setNFTs] = useState<NFT[]>([]);
    const [selectedNFT, setSelectedNFT] = useState<string | null>(null);

    const TOKEN_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS as `0x${string}`;
    const IPFS_BASE_URL = process.env.NEXT_PUBLIC_IPFS_URL || "https://ipfs.io/ipfs/";

    const tokenContract = {
        address: TOKEN_CONTRACT_ADDRESS,
        abi: erc20Abi,
    } as const;

    // Read contract info
    const { data, isLoading, refetch } = useReadContracts({
        contracts: [
        { ...nftContract, functionName: "getCollectionInfo" },
        { ...nftContract, functionName: "getMintingInfo", args: address ? [address] : undefined },
        { ...nftContract, functionName: "baseURI" },
        { ...tokenContract, functionName: "decimals" },
        { ...tokenContract, functionName: "allowance", args: address ? [address, NFT_COLLECTION_CONTRACT_ADDRESS as `0x${string}`] : undefined },
        ],
    });

    const collectionInfo = data?.[0]?.status === "success" ? data[0].result : null;
    const name = collectionInfo ? String(collectionInfo[0]) : "";
    const mintPrice = collectionInfo ? BigInt(collectionInfo[4]) : BigInt(0);
    const isPaused = collectionInfo ? Boolean(collectionInfo[7]) : false;


    const mintingInfo = data?.[1]?.status === "success" ? data[1].result : null;
    const userCanMint = mintingInfo ? Boolean(mintingInfo[2]) : false;

    const tokenDecimals = data?.[2]?.status === "success" ? Number(data[2].result) : 18;
    const allowanceRaw = data?.[3]?.status === "success" ? data[3].result : 0;
    const allowance = typeof allowanceRaw === "bigint" ? allowanceRaw : BigInt(String(allowanceRaw));
    const needsApproval = allowance < mintPrice;

    // Resolve IPFS URIs
    const resolveIPFS = (uri: string) => {
        if (!uri) return "";
        if (uri.startsWith("ipfs://")) return IPFS_BASE_URL + uri.slice(7);
        return uri.replace(/\/ipfs\/\//, "/ipfs/");
    };

    const fetchNFTMetadata = async (cid: string) => {
        try {
        const res = await fetch(`${IPFS_BASE_URL}${cid}`);
        if (!res.ok) throw new Error("Failed to fetch metadata");
        const json = await res.json();
        return json;
        } catch (err) {
        console.error("Error fetching NFT metadata:", err);
        return null;
        }
    };

    // Load NFTs from uriList
    useEffect(() => {
        async function loadNFTs() {
        const nftArray: NFT[] = [];
        for (let i = 0; i < uriList.length; i++) {
            const metadata = await fetchNFTMetadata(uriList[i]);
            if (metadata) {
            nftArray.push({
                tokenId: i,
                name: metadata.name,
                image: resolveIPFS(metadata.image),
                attributes: metadata.attributes,
            });
            }
        }
        setNFTs(nftArray);
        }

        loadNFTs();
    }, []);

    // Approve + Mint
    const handleApproveAndMint = async (tokenURI: string) => {
        if (!address) return;
        setSelectedNFT(tokenURI);

        try {
        if (needsApproval) {
            await writeContracts({
            contracts: [
                { address: TOKEN_CONTRACT_ADDRESS, abi: erc20Abi, functionName: "approve", args: [NFT_COLLECTION_CONTRACT_ADDRESS, mintPrice * BigInt(100)] },
                { address: NFT_COLLECTION_CONTRACT_ADDRESS as `0x${string}`, abi: NFTCollectionABI, functionName: "mint", args: [tokenURI] },
            ],
            });
            alert("Approval + Mint transaction sent!");
        } else {
            await writeContracts({
            contracts: [
                { address: NFT_COLLECTION_CONTRACT_ADDRESS as `0x${string}`, abi: NFTCollectionABI, functionName: "mint", args: [tokenURI] },
            ],
            });
            alert("Mint transaction sent!");
        }

        setTimeout(() => refetch(), 4000);
        } catch (err) {
        console.error("Transaction failed:", err);
        alert("Transaction failed. Check console for details.");
        } finally {
        setSelectedNFT(null);
        }
    };

    const handleApproveOnly = async () => {
        if (!address) return;
        try {
        await writeContracts({
            contracts: [
            { address: TOKEN_CONTRACT_ADDRESS, abi: erc20Abi, functionName: "approve", args: [NFT_COLLECTION_CONTRACT_ADDRESS, mintPrice * BigInt(100)] },
            ],
        });
        alert("Approval transaction sent!");
        setTimeout(() => refetch(), 4000);
        } catch (err) {
        console.error("Approval failed:", err);
        alert("Approval failed. Check console for details.");
        }
    };

    return (
        <div className="lg:col-span-2">
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-amber-200/50 dark:border-amber-800/50">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
                <span className="text-2xl">🎨</span>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{name || "NFT Collection"}</h2>
                <p className="text-sm text-amber-700 dark:text-amber-400">
                {mintPrice > BigInt(0) ? `Mint your NFT for ${formatUnits(mintPrice, tokenDecimals)} tokens` : "Loading..."}
                </p>
            </div>
            </div>

            {!isConnected ? (
            <p className="text-center text-zinc-600 dark:text-zinc-400">Please connect your wallet to view and mint NFTs</p>
            ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
            </div>
            ) : (
            <>
                {/* NFT Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {nfts.map((nft) => {
                    const isProcessing = selectedNFT === nft.image;
                    const canMint = userCanMint && !isPaused;

                    return (
                    <div
                        key={nft.tokenId}
                        className={`group relative aspect-square bg-gradient-to-br from-amber-100 to-orange-100 dark:from-zinc-800 dark:to-amber-900/30 rounded-2xl flex flex-col items-center justify-center overflow-hidden border-2 border-amber-200/50 dark:border-amber-700/50 transition-all duration-300 ${
                        !isProcessing && canMint ? "hover:border-amber-400 dark:hover:border-amber-500 hover:scale-105 cursor-pointer" : "opacity-60 cursor-not-allowed"
                        }`}
                        onClick={() => !isProcessing && canMint && handleApproveAndMint(nft.image!)}
                    >
                        <img
                        src={nft.image}
                        alt={nft.name}
                        className="w-full h-full object-cover"
                        onError={(e) =>
                            (e.currentTarget.src = `https://via.placeholder.com/300?text=NFT+${nft.tokenId}`)
                        }
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2">
                        <p className="font-bold text-white text-sm text-center">{nft.name || `NFT #${nft.tokenId}`}</p>
                        </div>
                        {isProcessing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                            <p className="text-white font-semibold text-xs">Processing...</p>
                            </div>
                        </div>
                        )}
                    </div>
                    );
                })}
                </div>

                {needsApproval && (
                <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <button
                    onClick={handleApproveOnly}
                    className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold transition-colors"
                    >
                    Approve Token Spending Only
                    </button>
                </div>
                )}
            </>
            )}
        </div>
        </div>
    );
}
