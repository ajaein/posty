const { v4: uuidv4 } = require('uuid');

/**
 * NFT 마켓플레이스
 */
class NFTMarketplace {
  constructor() {
    this.nfts = new Map();
    this.collections = new Map();
    this.listings = new Map();
    this.sales = [];
    this.nextTokenId = 1;
  }

  /**
   * 컬렉션 생성
   */
  createCollection(name, symbol, creator) {
    const collectionId = uuidv4();
    
    this.collections.set(collectionId, {
      id: collectionId,
      name: name,
      symbol: symbol,
      creator: creator,
      totalSupply: 0,
      floorPrice: 0,
      volume: 0,
      createdAt: Date.now()
    });

    return this.collections.get(collectionId);
  }

  /**
   * NFT 민팅
   */
  mintNFT(collectionId, metadata, owner) {
    const collection = this.collections.get(collectionId);
    if (!collection) {
      throw new Error('컬렉션을 찾을 수 없습니다');
    }

    const tokenId = this.nextTokenId++;
    
    const nft = {
      tokenId: tokenId,
      collectionId: collectionId,
      owner: owner,
      creator: owner,
      metadata: {
        name: metadata.name,
        description: metadata.description,
        image: metadata.image,
        attributes: metadata.attributes || []
      },
      mintedAt: Date.now(),
      transferHistory: []
    };

    this.nfts.set(tokenId, nft);
    collection.totalSupply++;

    return nft;
  }

  /**
   * NFT 전송
   */
  transferNFT(tokenId, from, to) {
    const nft = this.nfts.get(tokenId);
    if (!nft) {
      throw new Error('NFT를 찾을 수 없습니다');
    }

    if (nft.owner !== from) {
      throw new Error('NFT 소유자가 아닙니다');
    }

    nft.owner = to;
    nft.transferHistory.push({
      from: from,
      to: to,
      timestamp: Date.now()
    });

    return nft;
  }

  /**
   * NFT 판매 등록
   */
  listForSale(tokenId, price, seller) {
    const nft = this.nfts.get(tokenId);
    if (!nft) {
      throw new Error('NFT를 찾을 수 없습니다');
    }

    if (nft.owner !== seller) {
      throw new Error('NFT 소유자만 판매할 수 있습니다');
    }

    const listingId = uuidv4();
    
    this.listings.set(listingId, {
      id: listingId,
      tokenId: tokenId,
      seller: seller,
      price: price,
      createdAt: Date.now(),
      status: 'active'
    });

    return this.listings.get(listingId);
  }

  /**
   * NFT 구매
   */
  buyNFT(listingId, buyer) {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error('판매 정보를 찾을 수 없습니다');
    }

    if (listing.status !== 'active') {
      throw new Error('이미 판매된 NFT입니다');
    }

    const nft = this.nfts.get(listing.tokenId);
    const collection = this.collections.get(nft.collectionId);

    // NFT 전송
    this.transferNFT(listing.tokenId, listing.seller, buyer);

    // 판매 완료
    listing.status = 'sold';
    listing.buyer = buyer;
    listing.soldAt = Date.now();

    // 판매 기록
    this.sales.push({
      listingId: listingId,
      tokenId: listing.tokenId,
      collectionId: nft.collectionId,
      seller: listing.seller,
      buyer: buyer,
      price: listing.price,
      timestamp: Date.now()
    });

    // 컬렉션 통계 업데이트
    collection.volume += listing.price;
    this.updateFloorPrice(nft.collectionId);

    return {
      success: true,
      nft: nft,
      price: listing.price
    };
  }

  /**
   * 판매 취소
   */
  cancelListing(listingId, seller) {
    const listing = this.listings.get(listingId);
    if (!listing) {
      throw new Error('판매 정보를 찾을 수 없습니다');
    }

    if (listing.seller !== seller) {
      throw new Error('판매자만 취소할 수 있습니다');
    }

    listing.status = 'cancelled';
    this.listings.delete(listingId);

    return { success: true };
  }

  /**
   * 플로어 가격 업데이트
   */
  updateFloorPrice(collectionId) {
    const activeListings = Array.from(this.listings.values()).filter(listing => {
      const nft = this.nfts.get(listing.tokenId);
      return nft.collectionId === collectionId && listing.status === 'active';
    });

    const collection = this.collections.get(collectionId);
    
    if (activeListings.length > 0) {
      collection.floorPrice = Math.min(...activeListings.map(l => l.price));
    } else {
      collection.floorPrice = 0;
    }
  }

  /**
   * NFT 정보
   */
  getNFT(tokenId) {
    const nft = this.nfts.get(tokenId);
    if (!nft) return null;

    const listing = Array.from(this.listings.values()).find(
      l => l.tokenId === tokenId && l.status === 'active'
    );

    return {
      ...nft,
      listing: listing || null
    };
  }

  /**
   * 컬렉션별 NFT
   */
  getNFTsByCollection(collectionId) {
    return Array.from(this.nfts.values())
      .filter(nft => nft.collectionId === collectionId)
      .map(nft => this.getNFT(nft.tokenId));
  }

  /**
   * 소유자별 NFT
   */
  getNFTsByOwner(owner) {
    return Array.from(this.nfts.values())
      .filter(nft => nft.owner === owner)
      .map(nft => this.getNFT(nft.tokenId));
  }

  /**
   * 판매 중인 NFT
   */
  getActiveListings(collectionId = null) {
    let listings = Array.from(this.listings.values())
      .filter(l => l.status === 'active');

    if (collectionId) {
      listings = listings.filter(l => {
        const nft = this.nfts.get(l.tokenId);
        return nft.collectionId === collectionId;
      });
    }

    return listings.map(l => ({
      ...l,
      nft: this.getNFT(l.tokenId)
    }));
  }

  /**
   * 최근 거래
   */
  getRecentSales(limit = 20) {
    return this.sales.slice(-limit).reverse().map(sale => ({
      ...sale,
      nft: this.getNFT(sale.tokenId)
    }));
  }

  /**
   * 컬렉션 통계
   */
  getCollectionStats(collectionId) {
    const collection = this.collections.get(collectionId);
    if (!collection) return null;

    const sales = this.sales.filter(s => s.collectionId === collectionId);
    const last24h = sales.filter(s => Date.now() - s.timestamp < 24 * 60 * 60 * 1000);

    return {
      ...collection,
      volume24h: last24h.reduce((sum, s) => sum + s.price, 0),
      sales24h: last24h.length,
      owners: new Set(Array.from(this.nfts.values())
        .filter(n => n.collectionId === collectionId)
        .map(n => n.owner)).size
    };
  }

  /**
   * 모든 컬렉션
   */
  getAllCollections() {
    return Array.from(this.collections.values())
      .map(c => this.getCollectionStats(c.id))
      .sort((a, b) => b.volume - a.volume);
  }
}

module.exports = NFTMarketplace;

