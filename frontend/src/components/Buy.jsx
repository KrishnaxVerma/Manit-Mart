import { useState, useEffect } from 'react'
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import ProductCard from './BookCard'
import Navbar from './Navbar'

export default function Buy() {
  const [products, setProducts] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [cond, setCond] = useState('All')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [ld, setLd] = useState(true)
  const nav = useNavigate()

  const categories = ['All', 'Books', 'Electronics', 'Accessories', 'Stationary', 'Others']

  useEffect(() => {
    if (!auth.currentUser) {
      nav('/login')
      return
    }

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProducts(data)
      setFiltered(data)
      setLd(false)
    })
    return unsub
  }, [nav])

  useEffect(() => {
    let f = products

    if (search) {
      f = f.filter(p => 
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (category !== 'All') {
      f = f.filter(p => p.category === category)
    }

    if (cond !== 'All') {
      f = f.filter(p => p.condition === cond)
    }

    if (priceRange.min) {
      f = f.filter(p => p.price >= Number(priceRange.min))
    }

    if (priceRange.max) {
      f = f.filter(p => p.price <= Number(priceRange.max))
    }

    setFiltered(f)
  }, [products, search, category, cond, priceRange])

  if (ld) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-gray-50 pt-20 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Buy Products</h1>
        <p className="text-gray-600 mb-8">Find items from MANIT students</p>

        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={cond}
              onChange={(e) => setCond(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="All">All Conditions</option>
              <option value="Like New">Like New</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                className="w-24 px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                type="number"
                placeholder="Max"
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                className="w-24 px-3 py-2 border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Showing {filtered.length} of {products.length} products
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500">No products found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onInterested={(id) => {
                  setProducts(products.map(p => 
                    p.id === id ? { ...p, interested: [...p.interested, auth.currentUser?.uid] } : p
                  ))
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  </>
  )
}