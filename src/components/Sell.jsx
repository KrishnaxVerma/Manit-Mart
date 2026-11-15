import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db, auth } from '../firebase'
import { clearLegacyReservation } from '../utils/reservations'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import ProductCard from './BookCard'
import { uploadMultipleImages } from '../utils/imageUpload'
import { getProductImages } from '../utils/productImages'
import OnboardingModal from './OnboardingModal'
import { generateListingWithAI } from '../services/aiListingService'

const MAX_IMAGES = 5
const MAX_IMAGE_SIZE = 5 * 1024 * 1024

const createInitialForm = () => ({
  title: '',
  category: 'Books',
  price: '',
  originalPrice: '',
  condition: 'Good',
  description: '',
  additionalInfo: '',
  keywords: [],
  conditionSummary: '',
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
  const [sellerUpi, setSellerUpi] = useState(null)
  const [checkingUpi, setCheckingUpi] = useState(true)
  const [showUpiModal, setShowUpiModal] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiGeneratedSuccess, setAiGeneratedSuccess] = useState(false)
  const [keywordInput, setKeywordInput] = useState('')
  const nav = useNavigate()

  const categories = ['Books', 'Electronics', 'Accessories', 'Stationary', 'Others']

  useEffect(() => {
    if (!auth.currentUser) {
      setSellerUpi('krishna.verma@oksbi')
      setCheckingUpi(false)
      return
    }

    // Check user's UPI ID for listing gating
    const fetchUserUpi = async () => {
      try {
        const uDoc = await getDoc(doc(db, 'users', auth.currentUser.uid))
        if (uDoc.exists() && uDoc.data()?.upiId) {
          setSellerUpi(uDoc.data().upiId)
        } else {
          setSellerUpi(null)
        }
      } catch (err) {
        console.error('Failed to fetch user UPI ID:', err)
      } finally {
        setCheckingUpi(false)
      }
    }
    fetchUserUpi()

    const q = query(collection(db, 'products'), where('sellerId', '==', auth.currentUser.uid))
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setProducts(data)
      data.filter((product) => product.status === 'RESERVED').forEach((product) => {
        clearLegacyReservation(product.id).catch((err) => {
          console.error('Failed to clear legacy listing hold:', err)
        })
      })
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
      title: product.title || '',
      category: product.category || 'Books',
      price: product.price ? product.price.toString() : '',
      originalPrice: product.originalPrice ? product.originalPrice.toString() : '',
      condition: product.condition || 'Good',
      description: product.description || '',
      additionalInfo: '',
      keywords: Array.isArray(product.keywords) ? product.keywords : [],
      conditionSummary: product.conditionSummary || '',
      imageUrls: getProductImages(product),
      imageFiles: []
    })
    setAiGeneratedSuccess(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setFrm(createInitialForm())
    setAiGeneratedSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAIGenerate = async () => {
    if (isGeneratingAI) return

    const roughTitle = (frm.title || '').trim()
    if (!roughTitle || roughTitle.length < 2) {
      toast.error('Please enter a product title or rough name first.')
      return
    }

    if (!frm.condition) {
      toast.error('Please select the item condition.')
      return
    }

    setIsGeneratingAI(true)
    setAiGeneratedSuccess(false)

    try {
      const firstImageFile = frm.imageFiles && frm.imageFiles.length > 0 ? frm.imageFiles[0] : null

      const generated = await generateListingWithAI({
        productName: roughTitle,
        category: frm.category,
        condition: frm.condition,
        price: frm.price,
        originalPrice: frm.originalPrice,
        additionalInfo: frm.additionalInfo,
        imageFile: firstImageFile
      })

      setFrm((prev) => ({
        ...prev,
        title: generated.title || prev.title,
        description: generated.description || prev.description,
        category: generated.category || prev.category,
        keywords: generated.keywords && generated.keywords.length > 0 ? generated.keywords : prev.keywords,
        conditionSummary: generated.conditionSummary || prev.conditionSummary
      }))

      setAiGeneratedSuccess(true)
      toast.success('✨ Listing generated with AI! You can review and edit all fields.', {
        duration: 4000
      })
    } catch (err) {
      console.error('AI generation error:', err)
      toast.error(err.message || 'Failed to generate listing with AI')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const removeKeyword = (idxToRemove) => {
    setFrm((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((_, i) => i !== idxToRemove)
    }))
  }

  const addCustomKeyword = () => {
    const val = keywordInput.trim()
    if (val && !frm.keywords.includes(val)) {
      setFrm((prev) => ({
        ...prev,
        keywords: [...prev.keywords, val]
      }))
      setKeywordInput('')
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

    if (!sellerUpi) {
      toast.error('Please configure your UPI ID before listing products so buyers can pay you.', { icon: '💳' })
      setShowUpiModal(true)
      return
    }

    setLd(true)
    setUploadingImages(frm.imageFiles.length > 0)
    try {
      const userSnapshot = await getDoc(doc(db, 'users', auth.currentUser.uid))
      const profileName = userSnapshot.exists() ? userSnapshot.data()?.name?.trim() : ''
      const sellerName =
        profileName || auth.currentUser.displayName?.trim() || auth.currentUser.email.split('@')[0]
      const storedEmail = userSnapshot.exists() ? userSnapshot.data()?.email?.trim() : ''
      const sellerEmail = storedEmail || auth.currentUser.email?.trim() || ''

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
        originalPrice: frm.originalPrice ? Number(frm.originalPrice) : null,
        keywords: Array.isArray(frm.keywords) ? frm.keywords : [],
        conditionSummary: frm.conditionSummary || '',
        sellerId: auth.currentUser.uid,
        sellerName,
        sellerEmail,
        updatedAt: new Date()
      }

      delete productData.imageFiles
      delete productData.additionalInfo

      if (editingId) {
        await updateDoc(doc(db, 'products', editingId), productData)
        toast.success('Product updated successfully')
        cancelEdit()
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
          createdAt: new Date(),
          interested: [],
          status: 'AVAILABLE'
        })
        toast.success('Product listed successfully')
        setFrm(createInitialForm())
        setAiGeneratedSuccess(false)
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

        {!checkingUpi && !sellerUpi && (
          <div className="alert alert-warning shadow-sm rounded-2xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-sm">UPI ID Required to List Items</h3>
                <p className="text-xs opacity-90 mt-0.5">
                  To ensure safe peer-to-peer student transactions, you must add your UPI ID before publishing products.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowUpiModal(true)}
              className="btn btn-warning btn-sm rounded-xl font-bold whitespace-nowrap self-end sm:self-center"
            >
              Add UPI ID Now
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>AI Listing Assistant Ready</span>
            </div>
          </div>

          {/* AI Quick Assistant Bar */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-purple-50/80 dark:from-slate-750 dark:via-slate-800 dark:to-indigo-950/40 border border-blue-200/80 dark:border-indigo-800/60 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-lg shadow-sm shrink-0">
                  ✨
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      AI Listing Assistant
                    </span>
                    <span className="badge badge-primary badge-xs font-semibold py-1">Gemini</span>
                    {frm.imageFiles.length > 0 && (
                      <span className="badge badge-accent badge-xs font-medium">📷 Image Context Ready</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
                    Provide rough product details below and click to generate an attractive title, description, and search keywords.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={isGeneratingAI || ld}
                className="btn btn-sm btn-primary rounded-xl font-semibold gap-2 text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none shadow-sm w-full md:w-auto"
              >
                {isGeneratingAI ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    <span>Generating your listing...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Generate with AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Loading state progress message */}
            {isGeneratingAI && (
              <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-indigo-800/60 flex items-center gap-2 text-xs font-medium text-blue-700 dark:text-blue-300">
                <span className="loading loading-dots loading-xs"></span>
                <span>Generating your listing... Polishing title, crafting description, and categorizing with Gemini.</span>
              </div>
            )}

            {/* Success state indicator */}
            {aiGeneratedSuccess && !isGeneratingAI && (
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-1.5 font-medium">
                  <span>✓</span> Generated successfully! You remain in full control and can edit every field freely.
                </span>
                <button
                  type="button"
                  onClick={() => setAiGeneratedSuccess(false)}
                  className="text-xs opacity-70 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          <form onSubmit={sub} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Title / Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Casio fx-991EX Scientific Calculator"
                  value={frm.title}
                  onChange={(e) => setFrm({ ...frm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category *
                </label>
                <select
                  value={frm.category}
                  onChange={(e) => setFrm({ ...frm, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Selling Price (₹) *
                </label>
                <input
                  type="number"
                  placeholder="Selling Price (₹)"
                  value={frm.price}
                  onChange={(e) => setFrm({ ...frm, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Original Price (₹) <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={frm.originalPrice}
                  onChange={(e) => setFrm({ ...frm, originalPrice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Condition *
                </label>
                <select
                  value={frm.condition}
                  onChange={(e) => setFrm({ ...frm, condition: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="Like New">Like New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional Information / Highlights <span className="text-gray-400 font-normal">(optional, guides Gemini with specific details)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. All functions working properly, bought last semester, original manual included"
                value={frm.additionalInfo}
                onChange={(e) => setFrm({ ...frm, additionalInfo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white text-sm"
              />
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Description <span className="text-gray-400 font-normal">(optional, max 500 characters)</span>
                </label>
                <span className={`text-xs ${frm.description.length > 500 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                  {frm.description.length}/500
                </span>
              </div>
              <textarea
                placeholder="Product description... Click '✨ Generate with AI' above to auto-generate or write your own."
                value={frm.description}
                onChange={(e) => setFrm({ ...frm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                rows="3"
                maxLength={500}
              />
            </div>

            {/* Generated Condition Summary & Keywords */}
            {(frm.conditionSummary || (frm.keywords && frm.keywords.length > 0)) && (
              <div className="p-3.5 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200 dark:border-slate-700 space-y-2.5">
                {frm.conditionSummary && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Condition Summary:</span>
                    <span className="text-gray-600 dark:text-gray-400 italic bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-gray-200 dark:border-slate-700">
                      {frm.conditionSummary}
                    </span>
                  </div>
                )}

                {frm.keywords && frm.keywords.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1.5">
                      Search Keywords (helps students find this item):
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {frm.keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="badge badge-outline badge-sm gap-1 text-xs py-2 px-2.5 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300"
                        >
                          #{kw}
                          <button
                            type="button"
                            onClick={() => removeKeyword(idx)}
                            className="hover:text-red-500 text-xs ml-0.5"
                            title="Remove keyword"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="+ Add keyword"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCustomKeyword()
                            }
                          }}
                          className="input input-xs input-bordered rounded text-xs w-28 bg-white dark:bg-slate-800"
                        />
                        {keywordInput.trim() && (
                          <button
                            type="button"
                            onClick={addCustomKeyword}
                            className="btn btn-xs btn-ghost text-blue-600 dark:text-blue-400"
                          >
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={ld}
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
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
                      disabled={product.status === 'SOLD'}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => del(product.id)}
                      disabled={product.status === 'SOLD'}
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

        <OnboardingModal
          isOpen={showUpiModal}
          onClose={() => setShowUpiModal(false)}
          currentUpi={sellerUpi || ''}
          onSuccess={(newUpi) => setSellerUpi(newUpi)}
        />
      </div>
    </div>
  )
}
