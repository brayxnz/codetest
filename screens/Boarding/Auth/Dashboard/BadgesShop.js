// screens/Settings/BadgesShop.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { supabase } from '../../../../CBD';

export default function BadgesShop({ route, navigation }) {
  const { userId } = route.params || {};

  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  // Carrito local
  const [cart, setCart] = useState([]);
  const [cartVisible, setCartVisible] = useState(false);

  const loadBadges = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: shopData, error: shopError } = await supabase
        .from('badges_shop')
        .select('*')
        .eq('available', true)
        .order('id', { ascending: true });

      if (shopError) {
        console.log('Error cargando badges_shop:', shopError);
        Alert.alert('Error', 'No se pudieron cargar las insignias.');
        setLoading(false);
        return;
      }

      // Insignias ya compradas (por ahora solo para marcar "Comprado")
      const { data: userData, error: userError } = await supabase
        .from('user_badges_shop')
        .select('badge_id')
        .eq('user_id', userId);

      if (userError) {
        console.log('Error cargando user_badges_shop:', userError);
      }

      const ownedIds = new Set((userData || []).map((row) => row.badge_id));

      const merged = (shopData || []).map((badge) => ({
        ...badge,
        owned: ownedIds.has(badge.id),
      }));

      setBadges(merged);
    } catch (e) {
      console.log('Error loadBadges:', e);
      Alert.alert('Error', 'Ocurrió un problema al cargar la tienda.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  const isInCart = (badgeId) => cart.some((b) => b.id === badgeId);

  const handleToggleCartItem = (badge) => {
    if (badge.owned) {
      Alert.alert('Ya adquirida', 'Ya tienes esta insignia en tu colección.');
      return;
    }

    if (isInCart(badge.id)) {
      setCart((prev) => prev.filter((b) => b.id !== badge.id));
    } else {
      setCart((prev) => [...prev, badge]);
    }
  };

  const handleRemoveFromCart = (badgeId) => {
    setCart((prev) => prev.filter((b) => b.id !== badgeId));
  };

  const totalCart = cart.reduce(
    (sum, b) => sum + Number(b.price || 0),
    0
  );

  const handleGoToPay = () => {
    // Aquí después integraremos Stripe Checkout
    Alert.alert(
      'Checkout (demo)',
      `Implementaremos Stripe aquí.\nTotal: $${totalCart.toFixed(2)}`
    );
  };

  const renderIcon = (badge) => {
    if (badge.icon_family === 'Ionicons') {
      return (
        <Ionicons
          name={badge.icon_name}
          size={26}
          color="#FACC15"
        />
      );
    }
    if (badge.icon_family === 'FontAwesome5') {
      return (
        <FontAwesome5
          name={badge.icon_name}
          size={24}
          color="#FACC15"
        />
      );
    }
    return (
      <Ionicons
        name="pricetag-outline"
        size={24}
        color="#FACC15"
      />
    );
  };

  const renderItem = ({ item }) => {
    const isOwned = item.owned;
    const inCart = isInCart(item.id);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.cardGrid,
          isOwned && styles.cardOwned,
          inCart && !isOwned && styles.cardInCart,
        ]}
        onPress={() => handleToggleCartItem(item)}
      >
        <View style={styles.iconWrapperGrid}>{renderIcon(item)}</View>

        <Text
          style={styles.badgeNameGrid}
          numberOfLines={2}
        >
          {item.name}
        </Text>

        {item.description ? (
          <Text
            style={styles.badgeDescriptionGrid}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        ) : null}

        <Text style={styles.priceTextGrid}>
          ${Number(item.price).toFixed(2)}
        </Text>

        <View style={styles.badgeStatusRow}>
          {isOwned ? (
            <View style={styles.statusPillOwned}>
              <Ionicons
                name="checkmark-circle"
                size={14}
                color="#BBF7D0"
              />
              <Text style={styles.statusPillOwnedText}>Comprado</Text>
            </View>
          ) : inCart ? (
            <View style={styles.statusPillCart}>
              <Ionicons
                name="cart-outline"
                size={14}
                color="#FEF3C7"
              />
              <Text style={styles.statusPillCartText}>En carrito</Text>
            </View>
          ) : (
            <View style={styles.statusPillAdd}>
              <Ionicons
                name="add-circle-outline"
                size={14}
                color="#F97316"
              />
              <Text style={styles.statusPillAddText}>Agregar</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Ionicons
            name="chevron-back-outline"
            size={22}
            color="#E5E7EB"
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tienda de insignias</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Grid de productos */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#d44e00" />
          <Text style={styles.loadingText}>Cargando insignias...</Text>
        </View>
      ) : (
        <FlatList
          data={badges}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="pricetags-outline"
                size={48}
                color="#4B5563"
              />
              <Text style={styles.emptyTitle}>
                No hay insignias disponibles
              </Text>
              <Text style={styles.emptyText}>
                Vuelve más tarde para ver nuevas insignias cosméticas.
              </Text>
            </View>
          }
        />
      )}

      {/* Botón flotante de carrito */}
      {cart.length > 0 && (
        <View style={styles.cartBar}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setCartVisible(true)}
          >
            <View style={styles.cartButtonLeft}>
              <Ionicons
                name="cart-outline"
                size={20}
                color="#FEF3C7"
              />
              <Text style={styles.cartButtonText}>
                Ir al carrito ({cart.length})
              </Text>
            </View>
            <Text style={styles.cartButtonTotal}>
              ${totalCart.toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de carrito */}
      <Modal
        visible={cartVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCartVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header modal */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Carrito</Text>
                <Text style={styles.modalSubtitle}>
                  {cart.length} artículo(s) · Total ${totalCart.toFixed(2)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setCartVisible(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Lista de items del carrito */}
            <ScrollView
              style={{ maxHeight: 320 }}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {cart.length === 0 ? (
                <View style={styles.emptyCartContainer}>
                  <Ionicons
                    name="cart-outline"
                    size={40}
                    color="#4B5563"
                  />
                  <Text style={styles.emptyCartText}>
                    Tu carrito está vacío.
                  </Text>
                </View>
              ) : (
                cart.map((item) => (
                  <View key={item.id} style={styles.cartItemRow}>
                    <View style={styles.cartItemIcon}>
                      {renderIcon(item)}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.cartItemName}>
                        {item.name}
                      </Text>
                      <Text style={styles.cartItemPrice}>
                        ${Number(item.price).toFixed(2)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.cartRemoveBtn}
                      onPress={() => handleRemoveFromCart(item.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#FCA5A5"
                      />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Botón Ir a pagar */}
            <TouchableOpacity
              style={[
                styles.payButton,
                cart.length === 0 && { opacity: 0.5 },
              ]}
              disabled={cart.length === 0}
              onPress={handleGoToPay}
            >
              <Ionicons
                name="card-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.payButtonText}>Ir a pagar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 18,
  },
  listContent: {
    paddingHorizontal: '5%',
    paddingBottom: '20%',
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardGrid: {
    width: '48%',
    backgroundColor: '#141414',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#1F2933',
  },
  cardOwned: {
    borderColor: '#10B981',
    backgroundColor: '#052E16',
  },
  cardInCart: {
    borderColor: '#F97316',
    backgroundColor: '#1F1306',
  },
  iconWrapperGrid: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1F2933',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeNameGrid: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
  },
  badgeDescriptionGrid: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
    minHeight: 28,
  },
  priceTextGrid: {
    color: '#FBBF24',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  badgeStatusRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusPillOwned: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillOwnedText: {
    color: '#BBF7D0',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  statusPillCart: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#92400E',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillCartText: {
    color: '#FEF3C7',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  statusPillAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2933',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillAddText: {
    color: '#F97316',
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  // Cart bar
  cartBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 16,
    paddingHorizontal: 16,
  },
  cartButton: {
    flexDirection: 'row',
    backgroundColor: '#d44e00',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#FEF3C7',
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 8,
  },
  cartButtonTotal: {
    color: '#FEF3C7',
    fontWeight: '700',
    fontSize: 14,
  },
  // Cart modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141414',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2933',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  cartItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cartItemName: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  cartItemPrice: {
    color: '#FBBF24',
    fontSize: 13,
    marginTop: 2,
  },
  cartRemoveBtn: {
    padding: 6,
    marginLeft: 8,
  },
  emptyCartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyCartText: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  payButton: {
    marginTop: 8,
    backgroundColor: '#d44e00',
    borderRadius: 999,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  payButtonText: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '700',
  },
});