import { useEffect, useState } from "react";
import { Loader2, ShoppingCart, Package } from "lucide-react";

interface OrderItem {
  id: number;
  name: string;
  amount: string | null;
  isChecked: boolean;
  addedByName: string | null;
}

interface OrderList {
  id: number;
  status: string;
  createdAt: string;
}

export default function OrderBoard() {
  const [list, setList] = useState<OrderList | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());

  const fetchData = async () => {
    try {
      const res = await fetch("/api/public/order-list");
      const data = await res.json();
      setList(data.list);
      setItems(data.items || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setClock(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const unchecked = items.filter(i => !i.isChecked);
  const checked = items.filter(i => i.isChecked);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-zinc-900 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-zinc-900 text-zinc-100 p-6 md:p-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-orange-500" />
          <h1 className="text-3xl md:text-4xl font-bold tracking-wide uppercase" style={{ fontFamily: "Oswald, sans-serif" }}>
            Bestellzettel
          </h1>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono text-zinc-400">
            {clock.toLocaleTimeString("de-AT", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p className="text-sm text-zinc-500">
            {clock.toLocaleDateString("de-AT", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>

      {!list || unchecked.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-zinc-500">
          <Package className="h-16 w-16 mb-4 opacity-40" />
          <p className="text-2xl">Keine offenen Bestellungen</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {unchecked.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-zinc-800 rounded-lg px-5 py-4 border border-zinc-700"
            >
              <div className="h-3 w-3 rounded-full bg-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-lg md:text-xl font-medium truncate">
                  {item.amount && (
                    <span className="text-orange-400 font-bold mr-2">{item.amount}</span>
                  )}
                  {item.name}
                </p>
                {item.addedByName && (
                  <p className="text-sm text-zinc-500">{item.addedByName}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checked items (smaller, at bottom) */}
      {checked.length > 0 && (
        <div className="mt-8 pt-6 border-t border-zinc-700">
          <p className="text-sm text-zinc-500 mb-3">{checked.length} erledigt</p>
          <div className="flex flex-wrap gap-2">
            {checked.map((item) => (
              <span key={item.id} className="text-sm text-zinc-600 line-through">
                {item.amount && `${item.amount} `}{item.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-4 right-6 text-xs text-zinc-600">
        Auto-Refresh 60s · mise.at
      </div>
    </div>
  );
}
