import React, { useState, useMemo, useEffect } from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View, FlatList, TextInput, TouchableOpacity, Text, ScrollView, SafeAreaView, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import LogoutButton from '@/components/LogoutButton';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProductCard from '@/components/ProductCard';
import { RootState } from '@/store';
import { fetchProductsStart, fetchProductsSuccess, fetchProductsFailure } from '@/store/slices/productsSlice';
import { addToCart } from '@/store/slices/cartSlice';
import { productsApi } from '@/repository/productsApi';

export default function HomeScreen() {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { products, isLoading } = useSelector((state: RootState) => state.products);
  const { totalItems } = useSelector((state: RootState) => state.cart);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    dispatch(fetchProductsStart());
    try {
      const response = await productsApi.getAllProducts();
      if (response.status === 'success' && response.data) {
        // Add mock categories and ratings for display
        const productsWithExtras = response.data.products.map(product => ({
          ...product,
          category: 'General', // You can categorize based on product name or add categories to backend
          rating: 4.5 + Math.random() * 0.5, // Mock rating
          reviews: Math.floor(Math.random() * 200) + 10,
          inStock: true,
        }));
        dispatch(fetchProductsSuccess(productsWithExtras));
      } else {
        dispatch(fetchProductsFailure(response.message || 'Failed to fetch products'));
      }
    } catch (error) {
      dispatch(fetchProductsFailure('Failed to fetch products'));
    }
  };

  const handleAddToCart = (product: any) => {
    dispatch(addToCart({ product }));
    Alert.alert('Added to Cart', `${product.title || product.name} has been added to your cart!`);
  };

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter((cat): cat is string => Boolean(cat))))];

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    return filtered;
  }, [products, searchQuery, selectedCategory]);

  const featuredProducts = products.filter(product => (product.rating || 0) >= 4.5).slice(0, 3);
  const newArrivals = products.slice(-4);

  const renderHeroBanner = () => (
    <View style={styles.heroBanner}>
      <View style={styles.heroContent}>
        <Text style={styles.heroTitle}>Discover Amazing Products</Text>
        <Text style={styles.heroSubtitle}>Find everything you need in one place</Text>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchInputContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderCategoryFilter = () => (
    <View style={styles.categorySection}>
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === item && styles.selectedCategoryChipText
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );

  const renderFeaturedSection = () => {
    if (featuredProducts.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Products</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={featuredProducts}
          renderItem={({ item }) => (
            <View style={styles.featuredCard}>
              <ProductCard 
                product={item} 
                onPress={() => router.push(`/product/${item.id}`)}
              />
              <TouchableOpacity 
                style={styles.addToCartButton}
                onPress={() => handleAddToCart(item)}
              >
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.featuredList}
        />
      </View>
    );
  };

  const renderNewArrivals = () => {
    if (newArrivals.length === 0) return null;
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Arrivals</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllButton}>See all</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={newArrivals}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <ProductCard 
                product={item} 
                onPress={() => router.push(`/product/${item.id}`)}
              />
              <TouchableOpacity 
                style={styles.addToCartButton}
                onPress={() => handleAddToCart(item)}
              >
                <Text style={styles.addToCartText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderAllProducts = () => {
    if (filteredProducts.length === 0 && searchQuery) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No products found</Text>
          <Text style={styles.emptyDescription}>
            Try searching for something else or browse all categories
          </Text>
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearSearchButtonText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (searchQuery || selectedCategory !== 'All') {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results (${filteredProducts.length})` : selectedCategory}
          </Text>
          <FlatList
            data={filteredProducts}
            renderItem={({ item }) => (
              <View style={styles.productCard}>
                <ProductCard product={item} />
              </View>
            )}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        </View>
      );
    }

    return null;
  };

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Hello, {user?.email?.split('@')[0]}! 👋</Text>
              <Text style={styles.headerSubtitle}>What are you looking for today?</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.cartButton}
                onPress={() => router.push('/cart')}
              >
                <Text style={styles.cartIcon}>🛒</Text>
                {totalItems > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalItems}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <LogoutButton />
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderHeroBanner()}
          {renderSearchBar()}
          {renderCategoryFilter()}
          {renderFeaturedSection()}
          {renderNewArrivals()}
          {renderAllProducts()}
        </ScrollView>
      </SafeAreaView>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '400',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroBanner: {
    backgroundColor: '#4F46E5',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#C7D2FE',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    fontSize: 18,
    color: '#9CA3AF',
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    fontWeight: '400',
  },
  clearButton: {
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  categorySection: {
    paddingVertical: 8,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryChip: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#4F46E5',
    fontWeight: '600',
  },
  featuredList: {
    paddingLeft: 4,
  },
  featuredCard: {
    width: 280,
    marginRight: 16,
  },
  productCard: {
    marginBottom: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  clearSearchButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  clearSearchButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartButton: {
    position: 'relative',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cartIcon: {
    fontSize: 24,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  addToCartButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
