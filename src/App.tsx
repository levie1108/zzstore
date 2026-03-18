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

const ITEMS_PER_PAGE = 10;

function App() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [pin, setPin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [largeFont, setLargeFont] = useState(() => localStorage.getItem('zzstore-large-font') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('large-font', largeFont);
    localStorage.setItem('zzstore-large-font', String(largeFont));
  }, [largeFont]);

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
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return filtered;
  }, [items, searchTerm]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
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
      form.reset();
    } catch (error) {
      console.error("Error saving item: ", error);
      alert("Uh oh, something went wrong saving that. Try again?");
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(db, "prices", itemToDelete));
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item: ", error);
      alert("Failed to delete. It's still here.");
    }
  };

  const login = () => {
    if (pin === '110820') { 
      setIsAdmin(true);
      setShowAdminLogin(false);
      setPin('');
    } else {
      alert('Wrong code! Check your notes.');
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem' }}>
      <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--text-primary)' }}>
            ZZStore
          </h1>
          <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}>
            Your neighborhood price companion. Updated daily.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            className={`btn font-toggle-btn${largeFont ? ' font-toggle-active' : ''}`}
            onClick={() => setLargeFont(prev => !prev)}
            title={largeFont ? 'Switch to normal font size' : 'Switch to larger font size'}
            aria-label="Toggle large font"
          >
            {largeFont ? 'Aa\u2212' : 'Aa+'}
          </button>
          <button 
            className="btn" 
            onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
          >
            {isAdmin ? 'Logout' : 'Owner Login'}
          </button>
        </div>
      </header>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 style={{ marginBottom: '1rem' }}>Are you sure?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
              This item will be gone forever. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn btn-primary" style={{ background: '#ef4444', borderColor: '#ef4444', flex: 1 }} onClick={confirmDelete}>
                Delete
              </button>
              <button className="btn" style={{ flex: 1 }} onClick={() => setItemToDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="glass-card" style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h3>Owner Login</h3>
          <p>Please enter your access code to manage items.</p>
          <input 
            type="password" 
            className="input-field" 
            placeholder="PIN Code" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            style={{ maxWidth: '300px', marginBottom: '1.5rem', display: 'block', margin: '0 auto 1.5rem' }}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button className="btn btn-primary" onClick={login}>Login</button>
            <button className="btn" onClick={() => setShowAdminLogin(false)}>Cancel</button>
          </div>
        </div>
      )}

      {isAdmin ? (
        <div className="animate-fade-in">
          <div className="glass-card" style={{ marginBottom: '3rem' }}>
            <h3>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
            <form onSubmit={handleAddItem} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Name</label>
                <input name="name" className="input-field" placeholder="e.g. Corned Beef" defaultValue={editingItem?.name} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Category</label>
                <select name="category" className="input-field" defaultValue={editingItem?.category || ""} required>
                  <option value="" disabled>Select category...</option>
                  {SARI_SARI_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Price (\u20b1)</label>
                <input name="price" className="input-field" type="number" step="0.01" placeholder="0.00" defaultValue={editingItem?.price} required />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 600 }}>Unit</label>
                <input name="unit" className="input-field" placeholder="kg, piece, pack..." defaultValue={editingItem?.unit} required />
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
                {editingItem && (
                  <button type="button" className="btn" onClick={() => setEditingItem(null)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <main>
        <div style={{ marginBottom: '3rem' }}>
          <div className="search-wrapper">
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search for items..." 
              style={{ fontSize: '1.125rem', paddingRight: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <button 
                className="search-clear" 
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                \u2715
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {paginatedItems.map((item) => (
            <div 
              key={item.id} 
              className="glass-card" 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                margin: 0
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span className="badge badge-success">{item.category}</span>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn" onClick={() => setEditingItem(item)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}>Edit</button>
                      <button className="btn" onClick={() => setItemToDelete(item.id)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#fee2e2' }}>Delete</button>
                    </div>
                  )}
                </div>
                <h3 className="item-name">{item.name}</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Per {item.unit}</p>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PRICE</span>
                <span className="price-data" style={{ fontSize: '1.5rem', color: 'var(--text-primary)' }}>
                  \u20b1{item.price.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span style={{ fontWeight: 600 }}>{currentPage} of {totalPages}</span>
            <button 
              className="pagination-btn" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>No items found matching your search.</p>
            <button className="btn" onClick={() => setSearchTerm('')} style={{ marginTop: '1rem' }}>Clear Search</button>
          </div>
        )}
      </main>

      <footer style={{ marginTop: '6rem', padding: '3rem 0', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-secondary)' }}>ZZStore Price List</p>
        <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: 'var(--text-secondary)', opacity: 0.8 }}>Serving the neighborhood since 2024.</p>
      </footer>
    </div>
  )
}

export default App
