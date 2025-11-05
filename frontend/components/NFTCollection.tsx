import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { NFTCollectionABI } from "@/components/NFTCollectionABI";
import { NFT_COLLECTION_CONTRACT_ADDRESS } from "@/components/constants";

interface NFT {
  tokenId: number;
  uri: string;
}

export default function NFTCollection() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient(); // Needed for writing
  const [nfts, setNFTs] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);

  useEffect(() => {
    const fetchNFTs = async () => {
      setLoading(true);
      try {
        // Fetch total minted NFTs and max supply
        const totalMinted: number = Number(
          await publicClient.readContract({
            address: NFT_COLLECTION_CONTRACT_ADDRESS,
            abi: NFTCollectionABI,
            functionName: "totalMinted",
          })
        );

        const remainingSupply: number = Number(
          await publicClient.readContract({
            address: NFT_COLLECTION_CONTRACT_ADDRESS,
            abi: NFTCollectionABI,
            functionName: "remainingSupply",
          })
        );

        // Example: Generate tokenURIs for all mintable NFTs
        // In your contract, baseURI + tokenId is common for pre-minted NFTs
        const baseURI: string = await publicClient.readContract({
          address: NFT_COLLECTION_CONTRACT_ADDRESS,
          abi: NFTCollectionABI,
          functionName: "_baseURI",
        });

        const allNFTs: NFT[] = [];
        for (let i = totalMinted; i < totalMinted + remainingSupply; i++) {
          allNFTs.push({
            tokenId: i,
            uri: `${baseURI}${i}`,
          });
        }

        setNFTs(allNFTs);
      } catch (err) {
        console.error("Failed to fetch NFTs:", err);
        setNFTs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNFTs();
  }, [publicClient]);

  const handleMint = async (tokenURI: string) => {
    if (!walletClient) return;
    setMinting(true);
    try {
      await walletClient.writeContract({
        address: NFT_COLLECTION_CONTRACT_ADDRESS,
        abi: NFTCollectionABI,
        functionName: "mint",
        args: [tokenURI],
      });
      alert("NFT minted successfully!");
    } catch (err) {
      console.error("Mint failed:", err);
      alert("Mint failed. Check console.");
    } finally {
      setMinting(false);
    }
  };

  return (
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
              Mint your NFT
            </p>
          </div>
        </div>

        {loading ? (
          <p>Loading NFTs...</p>
        ) : nfts.length === 0 ? (
          <p>No NFTs available for minting.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {nfts.map((nft) => (
              <div
                key={nft.tokenId}
                className="group relative aspect-square bg-gradient-to-br from-amber-100 to-orange-100 dark:from-zinc-800 dark:to-amber-900/30 rounded-2xl flex flex-col items-center justify-center overflow-hidden border-2 border-amber-200/50 dark:border-amber-700/50 hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => handleMint(nft.uri)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-amber-400/0 group-hover:from-yellow-400/20 group-hover:to-amber-400/20 transition-all duration-300"></div>
                <img
                  src={nft.uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${nft.uri.slice(7)}` : nft.uri}
                  alt={`NFT #${nft.tokenId}`}
                  className="w-full h-full object-cover rounded-2xl mb-2"
                />
                <p className="font-bold text-zinc-700 dark:text-zinc-300 text-sm mt-2">
                  NFT #{nft.tokenId}
                </p>
                {minting && <p className="absolute bottom-2 text-xs text-red-500">Minting...</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
