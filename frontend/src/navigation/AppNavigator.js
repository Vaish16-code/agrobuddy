import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';

// Farmer Screens
import FarmerDashboard from '../screens/Farmer/FarmerDashboard';
import AddFarmerProduct from '../screens/Farmer/AddFarmerProduct';
import ViewTraderProducts from '../screens/Farmer/ViewTraderProducts';
import FarmerProductDetails from '../screens/Farmer/FarmerProductDetails';

// Trader Screens
import TraderDashboard from '../screens/Trader/TraderDashboard';
import AddTraderProduct from '../screens/Trader/AddTraderProduct';
import ViewFarmerProducts from '../screens/Trader/ViewFarmerProducts';
import TraderProductDetails from '../screens/Trader/TraderProductDetails';

// User Screens
import UserDashboard from '../screens/User/UserDashboard';
import ProductList from '../screens/User/ProductList';
import ProductDetails from '../screens/User/ProductDetails';

// Shared Screens
import OrderHistory from '../screens/Shared/OrderHistory';

import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2E7D32' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="Login" 
      component={LoginScreen} 
      options={{ headerShown: false }}
    />
    <Stack.Screen 
      name="Register" 
      component={RegisterScreen}
      options={{ title: 'Create Account' }}
    />
  </Stack.Navigator>
);

const FarmerStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#2E7D32' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="FarmerDashboard" 
      component={FarmerDashboard} 
      options={{ title: 'Farmer Dashboard' }}
    />
    <Stack.Screen 
      name="AddFarmerProduct" 
      component={AddFarmerProduct}
      options={{ title: 'Add Product' }}
    />
    <Stack.Screen 
      name="ViewTraderProducts" 
      component={ViewTraderProducts}
      options={{ title: 'Buy Seeds' }}
    />
    <Stack.Screen 
      name="FarmerProductDetails" 
      component={FarmerProductDetails}
      options={{ title: 'Product Details' }}
    />
    <Stack.Screen 
      name="OrderHistory" 
      component={OrderHistory}
      options={{ title: 'My Orders' }}
    />
  </Stack.Navigator>
);

const TraderStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#FF8F00' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="TraderDashboard" 
      component={TraderDashboard} 
      options={{ title: 'Trader Dashboard' }}
    />
    <Stack.Screen 
      name="AddTraderProduct" 
      component={AddTraderProduct}
      options={{ title: 'Add Product' }}
    />
    <Stack.Screen 
      name="ViewFarmerProducts" 
      component={ViewFarmerProducts}
      options={{ title: 'Browse Farmer Products' }}
    />
    <Stack.Screen 
      name="TraderProductDetails" 
      component={TraderProductDetails}
      options={{ title: 'Product Details' }}
    />
    <Stack.Screen 
      name="OrderHistory" 
      component={OrderHistory}
      options={{ title: 'My Orders' }}
    />
  </Stack.Navigator>
);

const UserStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#1976D2' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <Stack.Screen 
      name="UserDashboard" 
      component={UserDashboard} 
      options={{ title: 'Home' }}
    />
    <Stack.Screen 
      name="ProductList" 
      component={ProductList}
      options={{ title: 'Products' }}
    />
    <Stack.Screen 
      name="ProductDetails" 
      component={ProductDetails}
      options={{ title: 'Product Details' }}
    />
    <Stack.Screen 
      name="OrderHistory" 
      component={OrderHistory}
      options={{ title: 'My Orders' }}
    />
  </Stack.Navigator>
);

const AppNavigator = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const getMainStack = () => {
    if (!isAuthenticated) {
      return <AuthStack />;
    }

    switch (user?.role) {
      case 'farmer':
        return <FarmerStack />;
      case 'trader':
        return <TraderStack />;
      case 'user':
        return <UserStack />;
      default:
        return <AuthStack />;
    }
  };

  return (
    <NavigationContainer>
      {getMainStack()}
    </NavigationContainer>
  );
};

export default AppNavigator;
