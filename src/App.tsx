import { useState, useMemo, useEffect } from 'react'
import './App.css'
import { db } from './firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore'

interface PriceItem {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
}

const SARI_SARI_CATEGORIES = [
  'Canned Goods',
  'Coffee & Beverages',
  'Condiments & Cooking Oil',
  'Crackers & Snacks',
  'Dairy & Milk',
  'Grains & Rice',
  'Laundry & Cleaning',
  'Noodles & Instant Meals',
  'Personal Care',
  'Soda & Juice',
  'Tobacco & Alcohol',
  'Others'
];

function App() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [pin, setPin] = useState('');

  // Firestore Real-time Sync
  useEffect(() => {
    const q = query(collection(db, "prices"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData: PriceItem[] = [];
      querySnapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as PriceItem);
      });
      setItems(itemsData);
    }, (error) => {
      console.error("Firestore sync error:", error);
    });
    return () => unsubscribe();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // Capture reference before async operations
    const formData = new FormData(form);
    const itemData = {
      name: formData.get('name') as string,
      category: formData.get('category') as string,
      price: Number(formData.get('price')),
      unit: formData.get('unit') as string,
    };

    try {
      if (editingItem) {
        await updateDoc(doc(db, "prices", editingItem.id), itemData);
        setEditingItem(null);
      } else {
        await addDoc(collection(db, "prices"), itemData);
      }
      form.reset(); // Safely reset using the captured reference
    } catch (error) {
      console.error("Error saving item: ", error);
      alert("Failed to save item. Error: " + (error as Error).message);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, "prices", id));
    } catch (error) {
      console.error("Error deleting item: ", error);
      alert("Failed to delete item.");
    }
  };

  const login = () => {
    if (pin === '1234') { // Simple default PIN
      setIsAdmin(true);
      setShowAdminLogin(false);
      setPin('');
    } else {
      alert('Wrong PIN!');
    }
  };

  const [adminSearchTerm, setAdminSearchTerm] = useState('');

  const filteredAdminItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(adminSearchTerm.toLowerCase())
    );
  }, [items, adminSearchTerm]);

  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ZZStore
        </h1>
        <button 
          className="btn" 
          style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
          onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
        >
          {isAdmin ? 'Logout Admin' : 'Admin Login'}
        </button>
      </header>

      {showAdminLogin && (
        <div className="glass-card animate-fade-in" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h3>Admin Access</h3>
          <input 
            type="password" 
            className="input-field" 
            placeholder="Enter PIN (Default: 1234)" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ maxWidth: '200px', marginBottom: '1rem' }}
          />
          <br />
          <button className="btn btn-primary" onClick={login}>Login</button>
          <button className="btn" onClick={() => setShowAdminLogin(false)} style={{ color: 'var(--text-secondary)' }}>Cancel</button>
        </div>
      )}

      {isAdmin ? (
        <div className="animate-fade-in">
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <h3>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
            <form onSubmit={handleAddItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input name="name" className="input-field" placeholder="Item Name" defaultValue={editingItem?.name} required />
              <select name="category" className="input-field" defaultValue={editingItem?.category || ""} required>
                <option value="" disabled>Select Category</option>
                {SARI_SARI_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input name="price" className="input-field" type="number" step="0.01" placeholder="Price" defaultValue={editingItem?.price} required />
              <input name="unit" className="input-field" placeholder="Unit (e.g. piece, kg)" defaultValue={editingItem?.unit} required />
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                {editingItem && (
                  <button type="button" className="btn" onClick={() => setEditingItem(null)} style={{ background: '#ef4444', color: '#fff' }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>Manage Inventory</h3>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search inventory..." 
                style={{ maxWidth: '250px', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredAdminItems.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{item.category}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>₱{item.price.toFixed(2)}</div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" onClick={() => setEditingItem(item)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--accent-primary)' }}>Edit</button>
                      <button className="btn" onClick={() => deleteItem(item.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredAdminItems.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                  No items match "{adminSearchTerm}"
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <main className="animate-fade-in">
          <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search items or categories..." 
              style={{ fontSize: '1.2rem', padding: '1rem 1.5rem', borderRadius: '1rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {filteredItems.map(item => (
              <div key={item.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span className="badge badge-success">{item.category}</span>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>per {item.unit}</span>
                  </div>
                  <h3 style={{ margin: '0.5rem 0', fontSize: '1.25rem' }}>{item.name}</h3>
                </div>
                <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>₱{item.price.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
              <p style={{ fontSize: '1.2rem' }}>No items found matching "{searchTerm}"</p>
            </div>
          )}
        </main>
      )}

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
        &copy; 2024 ZZStore Sari-Sari Price List. All prices are subject to change.
      </footer>
    </div>
  )
}

export default App
