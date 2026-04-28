/**
 * Shop System — Material crafting and wandering hero purchases
 * Tier 3 (depends on Resource System, Hero System)
 *
 * Core Loop:
 * - Territory heroes craft items from materials
 * - Wandering heroes auto-purchase crafted items
 * - Gold flows to kingdom treasury
 */

const ShopSystem = (function () {
  // ─── State ──────────────────────────────────────────────────────────────────

  let shopInventory = {}; // { itemId: quantity }
  let shopLevel = 1;
  let listeners = [];

  const MAX_SHOP_INVENTORY = 100; // max items per type

  // ─── Initialization ─────────────────────────────────────────────────────────

  function init(savedState) {
    shopInventory = savedState?.shopInventory || {};
    shopLevel = savedState?.shopLevel || 1;
    notifyListeners('init', { inventory: shopInventory, level: shopLevel });
  }

  // ─── Item Definitions ───────────────────────────────────────────────────────

  /**
   * Get all available items for sale.
   * @returns {Array} item definitions
   */
  function getItems() {
    return Object.values(GameData.ITEMS);
  }

  /**
   * Get item definition by ID.
   * @param {string} itemId
   * @returns {Object|null}
   */
  function getItem(itemId) {
    return GameData.ITEMS[itemId] || null;
  }

  // ─── Crafting ────────────────────────────────────────────────────────────────

  /**
   * Attempt to craft an item.
   * Deducts materials and adds item to inventory.
   * @param {string} itemId
   * @returns {boolean} success
   */
  function craftItem(itemId) {
    const item = getItem(itemId);
    if (!item) {
      console.warn(`[ShopSystem] Unknown item: ${itemId}`);
      return false;
    }

    // Check if we can afford materials
    if (!ResourceSystem.canAfford(item.cost)) {
      notifyListeners('craft_failed', { itemId, reason: 'insufficient_materials' });
      return false;
    }

    // Check inventory capacity
    const currentQty = shopInventory[itemId] || 0;
    if (currentQty >= MAX_SHOP_INVENTORY) {
      notifyListeners('craft_failed', { itemId, reason: 'inventory_full' });
      return false;
    }

    // Deduct materials
    ResourceSystem.spend(item.cost);

    // Add to inventory
    shopInventory[itemId] = (shopInventory[itemId] || 0) + 1;

    notifyListeners('item_crafted', { itemId, item, newQuantity: shopInventory[itemId] });
    return true;
  }

  /**
   * Batch craft multiple items.
   * @param {string} itemId
   * @param {number} quantity
   * @returns {number} actual quantity crafted
   */
  function craftItemBatch(itemId, quantity) {
    let crafted = 0;
    for (let i = 0; i < quantity; i++) {
      if (craftItem(itemId)) {
        crafted++;
      } else {
        break; // Stop on first failure
      }
    }
    return crafted;
  }

  // ─── Wandering Hero Shopping ─────────────────────────────────────────────────

  /**
   * Process wandering hero shopping attempt.
   * Called by HeroSystem when a wandering hero decides to shop.
   * @param {Object} hero - wandering hero object
   * @returns {Object|null} purchase result { item, goldEarned }
   */
  function processShopping(hero) {
    // Find items in stock that the hero can "buy" (shop has inventory)
    const availableItems = getItems().filter(item => {
      const qty = shopInventory[item.id] || 0;
      return qty > 0;
    });

    if (availableItems.length === 0) {
      // No items available for purchase
      notifyListeners('shopping_no_items', { hero });
      return null;
    }

    // Hero picks a random item from stock
    const purchasedItem = availableItems[Math.floor(Math.random() * availableItems.length)];

    // Remove from shop inventory
    shopInventory[purchasedItem.id] -= 1;
    if (shopInventory[purchasedItem.id] <= 0) {
      delete shopInventory[purchasedItem.id];
    }

    // Add gold to kingdom treasury (sale price = item.price)
    ResourceSystem.add('gold', purchasedItem.price);

    notifyListeners('item_sold', {
      hero,
      item: purchasedItem,
      goldEarned: purchasedItem.price,
      remainingInventory: shopInventory[purchasedItem.id] || 0
    });

    return {
      item: purchasedItem,
      goldEarned: purchasedItem.price,
    };
  }

  // ─── Shop Inventory ──────────────────────────────────────────────────────────

  /**
   * Get current shop inventory.
   * @returns {Object} { itemId: quantity }
   */
  function getInventory() {
    return { ...shopInventory };
  }

  /**
   * Get quantity of specific item in inventory.
   * @param {string} itemId
   * @returns {number}
   */
  function getQuantity(itemId) {
    return shopInventory[itemId] || 0;
  }

  /**
   * Check if shop has item in stock.
   * @param {string} itemId
   * @returns {boolean}
   */
  function hasItem(itemId) {
    return (shopInventory[itemId] || 0) > 0;
  }

  // ─── Shop Level ──────────────────────────────────────────────────────────────

  /**
   * Upgrade shop level (unlocks better items).
   * @param {Object} cost - { gold: amount }
   * @returns {boolean} success
   */
  function upgradeShop(cost) {
    if (!ResourceSystem.spend(cost)) {
      return false;
    }

    shopLevel += 1;
    notifyListeners('shop_upgraded', { newLevel: shopLevel });
    return true;
  }

  /**
   * Get current shop level.
   * @returns {number}
   */
  function getShopLevel() {
    return shopLevel;
  }

  // ─── Auto-Production ─────────────────────────────────────────────────────────

  /**
   * Process automatic item production (if shop is upgraded).
   * Called every tick for higher-level shops.
   * @returns {Object|null} production result
   */
  function processAutoProduction() {
    // Higher shop levels produce items automatically
    const productionChance = 0.1 * shopLevel; // 10% per level

    if (Math.random() > productionChance) {
      return null; // No production this tick
    }

    // Pick a random available recipe
    const items = getItems();
    const affordableRecipes = items.filter(item => {
      // Auto-production needs double the normal cost
      const doubleCost = {};
      for (const [res, amt] of Object.entries(item.cost)) {
        doubleCost[res] = amt * 2;
      }
      return ResourceSystem.canAfford(doubleCost);
    });

    if (affordableRecipes.length === 0) {
      return null;
    }

    const itemToProduce = affordableRecipes[Math.floor(Math.random() * affordableRecipes.length)];

    // Double cost for auto-production
    const doubleCost = {};
    for (const [res, amt] of Object.entries(itemToProduce.cost)) {
      doubleCost[res] = amt * 2;
    }

    ResourceSystem.spend(doubleCost);
    shopInventory[itemToProduce.id] = (shopInventory[itemToProduce.id] || 0) + 1;

    notifyListeners('auto_produced', { item: itemToProduce, quantity: 1 });
    return { item: itemToProduce, quantity: 1 };
  }

  // ─── Listeners ───────────────────────────────────────────────────────────────

  function addListener(callback) {
    listeners.push(callback);
  }

  function removeListener(callback) {
    listeners = listeners.filter(l => l !== callback);
  }

  function notifyListeners(event, data) {
    for (const listener of listeners) {
      try {
        listener(event, data);
      } catch (err) {
        console.error('[ShopSystem] Listener error:', err);
      }
    }
  }

  // ─── Serialization ──────────────────────────────────────────────────────────

  function exportState() {
    return {
      shopInventory: { ...shopInventory },
      shopLevel,
    };
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  return {
    init,
    // Items
    getItems,
    getItem,
    // Crafting
    craftItem,
    craftItemBatch,
    // Shopping
    processShopping,
    getInventory,
    getQuantity,
    hasItem,
    // Shop
    upgradeShop,
    getShopLevel,
    // Production
    processAutoProduction,
    // Listeners
    addListener,
    removeListener,
    // Serialization
    exportState,
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopSystem;
}
