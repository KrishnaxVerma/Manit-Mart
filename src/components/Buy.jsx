import { useEffect, useRef, useState } from 'react'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from 'firebase/firestore'
import { db, auth } from '../firebase'
import { useNavigate } from 'react-router-dom'
import ProductCard from './BookCard'

const PAGE_SIZE = 20
const DEFAULT_FILTERS = {
  search: '',
  category: 'All',
  cond: 'All',
  priceRange: { min: '', max: '' },
}

export default function Buy() {
  const [products, setProducts] = useState([])
  const [tempFilters, setTempFilters] = useState(DEFAULT_FILTERS)
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS)
  const [ld, setLd] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [lastVisible, setLastVisible] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const nav = useNavigate()
  const requestIdRef = useRef(0)

  const categories = ['All', 'Books', 'Electronics', 'Accessories', 'Stationary', 'Others']

  const buildProductsQuery = (cursor = null, pageLimit = PAGE_SIZE) => {
    const constraints = []

    constraints.push(orderBy('createdAt', 'desc'))

    if (cursor) {
      constraints.push(startAfter(cursor))
    }

    constraints.push(limit(pageLimit))

    return query(collection(db, 'products'), ...constraints)
  }

  const matchesClientFilters = (product) => {
    const normalizedSearch = activeFilters.search.trim().toLowerCase()
    const normalizedCategory = String(product.category || '').trim().toLowerCase()
    const normalizedCondition = String(product.condition || '').trim().toLowerCase()

    if (
      normalizedSearch &&
      !product.title?.toLowerCase().includes(normalizedSearch) &&
      !product.description?.toLowerCase().includes(normalizedSearch)
    ) {
      return false
    }

    if (
      activeFilters.category !== 'All' &&
      normalizedCategory !== activeFilters.category.trim().toLowerCase()
    ) {
      return false
    }

    if (
      activeFilters.cond !== 'All' &&
      normalizedCondition !== activeFilters.cond.trim().toLowerCase()
    ) {
      return false
    }

    if (activeFilters.priceRange.min && product.price < Number(activeFilters.priceRange.min)) {
      return false
    }

    if (activeFilters.priceRange.max && product.price > Number(activeFilters.priceRange.max)) {
      return false
    }

    return true
  }

  const resetPaginationState = () => {
    setProducts([])
    setLastVisible(null)
    setHasMore(false)
    setVisibleCount(PAGE_SIZE)
  }

  const updateHasMoreState = async (cursor, currentRequestId) => {
    if (!cursor) {
      if (requestIdRef.current === currentRequestId) {
        setHasMore(false)
      }
      return
    }

    const nextPageSnapshot = await getDocs(buildProductsQuery(cursor, 1))

    if (requestIdRef.current === currentRequestId) {
      setHasMore(!nextPageSnapshot.empty)
    }
  }

  const fetchProducts = async ({ reset = false } = {}) => {
    const currentRequestId = requestIdRef.current
    const cursor = reset ? null : lastVisible

    if (reset) {
      setLd(true)
      resetPaginationState()
    } else {
      if (!hasMore || loadingMore) {
        return
      }

      setLoadingMore(true)
    }

    try {
      const snapshot = await getDocs(buildProductsQuery(cursor))

      if (requestIdRef.current !== currentRequestId) {
        return
      }

      const nextProducts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      const nextCursor = snapshot.docs.at(-1) ?? cursor ?? null

      setProducts((currentProducts) =>
        reset ? nextProducts : [...currentProducts, ...nextProducts]
      )
      setLastVisible(nextCursor)

      if (snapshot.empty || snapshot.docs.length < PAGE_SIZE) {
        setHasMore(false)
      } else {
        await updateHasMoreState(nextCursor, currentRequestId)
      }
    } catch (error) {
      if (requestIdRef.current === currentRequestId) {
        if (reset) {
          setProducts([])
        }
        setHasMore(false)
        setLastVisible(null)
      }
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setLd(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    if (!auth.currentUser) {
      nav('/login')
      return
    }

    requestIdRef.current += 1
    fetchProducts({ reset: true })
    // `fetchProducts` is intentionally omitted to avoid re-running on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    nav,
    activeFilters.category,
    activeFilters.cond,
    activeFilters.search,
    activeFilters.priceRange.min,
    activeFilters.priceRange.max,
  ])

  const applyFilters = () => {
    requestIdRef.current += 1
    setLd(true)
    resetPaginationState()
    setActiveFilters({
      search: tempFilters.search,
      category: tempFilters.category,
      cond: tempFilters.cond,
      priceRange: {
        min: tempFilters.priceRange.min,
        max: tempFilters.priceRange.max,
      },
    })
  }

  const clearAllFilters = () => {
    requestIdRef.current += 1
    setLd(true)
    resetPaginationState()
    setTempFilters(DEFAULT_FILTERS)
    setActiveFilters(DEFAULT_FILTERS)
  }

  const filteredProducts = products.filter(matchesClientFilters)
  const visibleProducts = filteredProducts.slice(0, visibleCount)
  const canLoadMoreFilteredProducts = visibleCount < filteredProducts.length

  if (ld) return <div className="flex items-center justify-center min-h-screen">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pt-20 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Buy Products</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">Find items from MANIT students</p>

        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={tempFilters.search}
              onChange={(e) =>
                setTempFilters((current) => ({
                  ...current,
                  search: e.target.value,
                }))
              }
              className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            />
            <select
              value={tempFilters.category}
              onChange={(e) =>
                setTempFilters((current) => ({
                  ...current,
                  category: e.target.value,
                }))
              }
              className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              value={tempFilters.cond}
              onChange={(e) =>
                setTempFilters((current) => ({
                  ...current,
                  cond: e.target.value,
                }))
              }
              className="px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
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
                value={tempFilters.priceRange.min}
                onChange={(e) =>
                  setTempFilters((current) => ({
                    ...current,
                    priceRange: { ...current.priceRange, min: e.target.value },
                  }))
                }
                className="w-24 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="Max"
                value={tempFilters.priceRange.max}
                onChange={(e) =>
                  setTempFilters((current) => ({
                    ...current,
                    priceRange: { ...current.priceRange, max: e.target.value },
                  }))
                }
                className="w-24 px-3 py-2 border border-gray-200 dark:border-slate-600 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                disabled={ld}
                className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {ld ? 'Searching...' : 'Filter/Search'}
              </button>
              <button
                onClick={clearAllFilters}
                disabled={ld}
                className="rounded border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 text-sm text-gray-600 dark:text-gray-300">
          Showing {visibleProducts.length} of {filteredProducts.length} matching products
        </div>

        {visibleProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 dark:text-gray-400">No products found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product}
              />
            ))}
          </div>
        )}

        {(canLoadMoreFilteredProducts || hasMore) && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => {
                if (canLoadMoreFilteredProducts) {
                  setVisibleCount((current) => current + PAGE_SIZE)
                  return
                }

                fetchProducts()
              }}
              disabled={loadingMore}
              className="rounded bg-blue-600 px-6 py-2 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {loadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
