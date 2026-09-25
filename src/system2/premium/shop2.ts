export type ShopOffer={id:string;name:string;kind:'COSMETIC'|'SUBSCRIPTION'|'SUPPORTER';priceLabel:string;payToWin:false;benefits:string[]};
export const SHOP_OFFERS:readonly ShopOffer[]=[
 {id:'premium-monthly',name:'SYSTEM PREMIUM',kind:'SUBSCRIPTION',priceLabel:'TBD',payToWin:false,benefits:['AI campaigns','advanced stats','extra cosmetic slots']},
 {id:'founder-frame',name:'FOUNDER FRAME',kind:'COSMETIC',priceLabel:'TBD',payToWin:false,benefits:['profile frame only']},
 {id:'supporter-pack',name:'SUPPORTER PACK',kind:'SUPPORTER',priceLabel:'TBD',payToWin:false,benefits:['cosmetics','supporter badge']},
];
export function offerGrantsProgression(){return false;}