import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ProductCard from './BookCard'
import { uploadMultipleImages } from '../utils/imageUpload'
import { getProductImages } from '../utils/productImages'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const createInitialForm = () => ({
  title: '',
  category: 'Books',
  price: '',
  condition: 'Good',
  description: '',
  imageUrls: [],
  imageFiles: []
})

export default function Sell() {
  const [products, setProducts] = useState([])
  const [ld, setLd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef(null)
  const [frm, setFrm] = useState(createInitialForm)
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

  const handleImageSelection = (files) => {
    if (!files || files.length === 0) return

    const selectedFiles = Array.from(files)
    const invalidFiles = selectedFiles.filter(
      (file) => !file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE
    )
    const validFiles = selectedFiles.filter(
      (file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE
    )

    if (validFiles.length === 0) {
      toast.error('Please select valid image files (max 5MB each)')
      return
    }

    if (frm.imageUrls.length + frm.imageFiles.length + validFiles.length > MAX_IMAGES) {
      toast.error('Maximum 5 images allowed')
      return
    }

    // Store files for upload during submission
    setFrm(prev => ({
      ...prev,
      imageFiles: [...prev.imageFiles, ...validFiles]
    }))

    if (invalidFiles.length > 0) {
      toast.error('Some files were skipped. Only images up to 5MB are allowed.')
    }
    
    toast.success(`${validFiles.length} image(s) selected`)
  }

  const removeImage = (index) => {
    setFrm(prev => {
      // Check if the index is for uploaded URLs or selected files
      if (index < prev.imageUrls.length) {
        // Remove from uploaded URLs
        return {
          ...prev,
          imageUrls: prev.imageUrls.filter((_, i) => i !== index)
        }
      } else {
        // Remove from selected files
        const fileIndex = index - prev.imageUrls.length
        return {
          ...prev,
          imageFiles: prev.imageFiles.filter((_, i) => i !== fileIndex)
        }
      }
    })
  }

  const startEdit = (product) => {
    setEditingId(product.id)
    setFrm({
      title: product.title,
      category: product.category,
      price: product.price.toString(),
      condition: product.condition,
      description: product.description || '',
      imageUrls: getProductImages(product),
      imageFiles: []
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFrm(createInitialForm())
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateForm = () => {
    const title = frm.title.trim()
    const description = frm.description.trim()
    const price = Number(frm.price)
    const totalImages = frm.imageUrls.length + frm.imageFiles.length

    if (!title) {
      return 'Product title is required'
    }

    if (title.length < 3) {
      return 'Product title must be at least 3 characters'
    }

    if (!Number.isFinite(price) || price <= 0) {
      return 'Price must be greater than 0'
    }

    if (description.length > 500) {
      return 'Description must be 500 characters or less'
    }

    if (totalImages === 0) {
      return 'Add at least one product image'
    }

    if (totalImages > MAX_IMAGES) {
      return 'Maximum 5 images allowed'
    }

    if (!frm.imageFiles.every((file) => file.type.startsWith('image/') && file.size <= MAX_IMAGE_SIZE)) {
      return 'Only image files up to 5MB are allowed'
    }

    return null
  }

  const sub = async (e) => {
    e.preventDefault()
    if (!auth.currentUser) return

    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }

    setLd(true)
    setUploadingImages(frm.imageFiles.length > 0)
    try {
      // Upload images only during form submission
      let finalImageUrls = frm.imageUrls
      
      if (frm.imageFiles.length > 0) {
        const uploadedUrls = await uploadMultipleImages(frm.imageFiles)
        finalImageUrls = [...frm.imageUrls, ...uploadedUrls]
      }

      const productData = {
        ...frm,
        title: frm.title.trim(),
        description: frm.description.trim(),
        imageUrls: finalImageUrls,
        price: Number(frm.price),
        sellerId: auth.currentUser.uid,
        sellerName: auth.currentUser.email.split('@')[0],
        updatedAt: new Date()
      }

      delete productData.imageFiles

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
        setFrm(createInitialForm())
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (err) {
      console.error('Form submission error:', err)
      toast.error(err.message || `Failed to ${editingId ? 'update' : 'list'} product`)
    } finally {
      setUploadingImages(false)
      setLd(false)
    }
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Product Images</label>
              
              {/* Image Upload Input */}
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageSelection(e.target.files)}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-400"
                >
                  {uploadingImages ? 'Uploading...' : 'Choose Images'}
                </label>

            {/* Image Preview */}
            {(frm.imageUrls.length > 0 || frm.imageFiles.length > 0) && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {/* Show uploaded images */}
                {frm.imageUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
                
                {/* Show selected files that haven't been uploaded yet */}
                {frm.imageFiles.map((file, index) => {
                  const url = URL.createObjectURL(file)
                  return (
                    <div key={`selected-${index}`} className="relative group opacity-75">
                      <img
                        src={url}
                        alt={`Selected ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(frm.imageUrls.length + index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                      <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Selected
                      </div>
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded truncate max-w-full">
                        {file.name}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {uploadingImages && (
              <div className="text-sm text-blue-600 dark:text-blue-400">
                Uploading images... Please wait.
              </div>
            )}
          </div>
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
