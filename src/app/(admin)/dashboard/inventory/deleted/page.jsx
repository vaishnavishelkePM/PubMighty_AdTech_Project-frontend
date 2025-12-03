import InventoryView from 'src/sections/dashboard/inventories/inventory-view';

// (optional but nice for <head> title)
export const metadata = {
  title: 'Inventory - Deleted | PubMighty Dashboard',
};

export default function InventoryDeletedPage() {
  // We pass a mode, so InventoryView can know it's the "deleted" screen
  return <InventoryView mode="deleted" />;
}
