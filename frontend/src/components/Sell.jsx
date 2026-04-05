import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ProductCard from './BookCard'

export default function Sell() {
  const [products, setProducts] = useState([])
  const [ld, setLd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [frm, setFrm] = useState({
    title: '',
    category: 'Books',
    price: '',
    condition: 'Good',
    description: '',
    imageUrls: ['']
  })
  const nav = useNavigate()

  const categories = ['Books', 'Electronics', 'Accessories', 'Stationary', 'Others']

  useEffect(() => {
    if (!auth.currentUser) {
      nav('/login')
      return
    }

    const q = query(collection(db, 'products'), where('sellerId', '==', auth.currentUser.uid))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProducts(data)
    })
    return unsub
  }, [nav])

  const addImageField = () => {
    setFrm({ ...frm, imageUrls: [...frm.imageUrls, ''] })
  }

  const removeImageField = (index) => {
    setFrm({ ...frm, imageUrls: frm.imageUrls.filter((_, i) => i !== index) })
  }

  const updateImageUrl = (index, value) => {
    const newUrls = [...frm.imageUrls]
    newUrls[index] = value
    setFrm({ ...frm, imageUrls: newUrls })
  }

  const startEdit = (product) => {
    setEditingId(product.id)
    setFrm({
      title: product.title,
      category: product.category,
      price: product.price.toString(),
      condition: product.condition,
      description: product.description || '',
      imageUrls: product.imageUrls.length > 0 ? product.imageUrls : ['']
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFrm({
      title: '',
      category: 'Books',
      price: '',
      condition: 'Good',
      description: '',
      imageUrls: ['']
    })
  }

  const sub = async (e) => {
    e.preventDefault()
    if (!auth.currentUser) return
    setLd(true)
    try {
      const validUrls = frm.imageUrls.filter(url => url.trim() !== '')
      const productData = {
        ...frm,
        imageUrls: validUrls,
        price: Number(frm.price),
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.email.split('@')[0],
        updatedAt: new Date()
      }

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData)
        toast.success('Product updated successfully')
        cancelEdit()
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date(),
          interested: []
        })
        toast.success('Product listed successfully')
        setFrm({ title: '', category: 'Books', price: '', condition: 'Good', description: '', imageUrls: [''] })
      }
    } catch (err) {
      toast.error(`Failed to ${editingId ? 'update' : 'list'} product`)
    }
    setLd(false)
  }

  const del = async (id) => {
    if (!confirm('Remove this listing?')) return
    try {
      await deleteDoc(doc(db, 'products', id))
      toast.success('Listing removed')
    } catch (err) {
      toast.error('Failed to remove')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sell Products</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">List your items for MANIT students</p>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {editingId ? 'Edit Product' : 'Add New Product'}
          </h2>
          <form onSubmit={sub} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Title"
                value={frm.title}
                onChange={(e) => setFrm({ ...frm, title: e.target.value })}
                className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
              <select
                value={frm.category}
                onChange={(e) => setFrm({ ...frm, category: e.target.value })}
                className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Price (₹)"
                value={frm.price}
                onChange={(e) => setFrm({ ...frm, price: e.target.value })}
                className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                required
              />
              <select
                value={frm.condition}
                onChange={(e) => setFrm({ ...frm, condition: e.target.value })}
                className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Poor">Poor</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Images (Drive Links)</label>
              {frm.imageUrls.map((url, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="url"
                    placeholder={`Drive Link ${index + 1}`}
                    value={url}
                    onChange={(e) => updateImageUrl(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  {frm.imageUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImageField(index)}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageField}
                className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add More Images
              </button>
            </div>

            <textarea
              placeholder="Description (optional)"
              value={frm.description}
              onChange={(e) => setFrm({ ...frm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              rows="3"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={ld}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {ld ? (editingId ? 'Updating...' : 'Listing...') : (editingId ? 'Update Product' : 'List Product')}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Your Listings ({products.length})</h2>
          {products.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No products listed yet</p>
          ) : (
            <div className="space-y-4">
              {products.map(product => (
                <div key={product.id} className="relative">
                  <ProductCard product={product} />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={() => startEdit(product)}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(product.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}