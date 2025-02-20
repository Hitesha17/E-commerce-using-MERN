import { useSelector } from "react-redux";
import {
  Navigate,
  Route,
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
} from "react-router-dom";
import {
  selectIsAuthChecked,
  selectLoggedInUser,
} from "./features/auth/AuthSlice";
import { Logout } from "./features/auth/components/Logout";
import { Protected } from "./features/auth/components/Protected";
import { useAuthCheck } from "./hooks/useAuth/useAuthCheck";
import { useFetchLoggedInUserDetails } from "./hooks/useAuth/useFetchLoggedInUserDetails";
import {
  AddProductPage,
  AdminOrdersPage,
  CartPage,
  CheckoutPage,
  ForgotPasswordPage,
  HomePage,
  LoginPage,
  OrderSuccessPage,
  OtpVerificationPage,
  ProductDetailsPage,
  ProductUpdatePage,
  ResetPasswordPage,
  SignupPage,
  UserOrdersPage,
  UserProfilePage,
  WishlistPage,
} from "./pages";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

function App() {
  const isAuthChecked = useSelector(selectIsAuthChecked);
  const loggedInUser = useSelector(selectLoggedInUser);

  useAuthCheck();
  useFetchLoggedInUserDetails(loggedInUser);

  const stripePromise = loadStripe(
    "pk_test_51QcpGWD8KDgrStpyI2pSAKf2v5vPeprN5Mu9z0wS04UA8VYRtR0sB8euC8MACe0EZ50kDoqCgWHkkzYytJKwbU6400nJTke8mK"
  ); // Replace with your actual Stripe public key

  const routes = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<OtpVerificationPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/reset-password/:userId/:passwordResetToken"
          element={<ResetPasswordPage />}
        />
        <Route
          exact
          path="/logout"
          element={
            <Protected>
              <Logout />
            </Protected>
          }
        />
        <Route
          exact
          path="/product-details/:id"
          element={
            <Protected>
              <ProductDetailsPage />
            </Protected>
          }
        />

        {loggedInUser?.isAdmin ? (
          // admin routes
          <>
            <Route
              path="/admin/dashboard"
              element={
                <Protected>
                  <AdminDashboardPage />
                </Protected>
              }
            />
            <Route
              path="/admin/product-update/:id"
              element={
                <Protected>
                  <ProductUpdatePage />
                </Protected>
              }
            />
            <Route
              path="/admin/add-product"
              element={
                <Protected>
                  <AddProductPage />
                </Protected>
              }
            />
            <Route
              path="/admin/orders"
              element={
                <Protected>
                  <AdminOrdersPage />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to={"/admin/dashboard"} />} />
          </>
        ) : (
          // user routes
          <>
            <Route
              path="/"
              element={
                <Protected>
                  <HomePage />
                </Protected>
              }
            />
            <Route
              path="/cart"
              element={
                <Protected>
                  <CartPage />
                </Protected>
              }
            />
            <Route
              path="/profile"
              element={
                <Protected>
                  <UserProfilePage />
                </Protected>
              }
            />
            <Route
              path="/wishlist"
              element={
                <Protected>
                  <WishlistPage />
                </Protected>
              }
            />

            {/* Wrap CheckoutPage in Elements provider */}
            <Route
              path="/checkout"
              element={
                <Elements stripe={stripePromise}>
                  <Protected>
                    <CheckoutPage />
                  </Protected>
                </Elements>
              }
            />

            <Route
              path="/order-success/:id"
              element={
                <Protected>
                  <OrderSuccessPage />
                </Protected>
              }
            />
            <Route
              path="/orders"
              element={
                <Protected>
                  <UserOrdersPage />
                </Protected>
              }
            />
          </>
        )}

        <Route path="*" element={<NotFoundPage />} />
      </>
    )
  );

  return isAuthChecked ? <RouterProvider router={routes} /> : "";
}

export default App;
