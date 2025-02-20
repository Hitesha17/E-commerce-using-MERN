import * as React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Menu, Avatar, Tooltip, MenuItem, Badge, Button, Stack, useMediaQuery, useTheme } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUserInfo } from '../../user/UserSlice';
import { selectCartItems } from '../../cart/CartSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { selectWishlistItems } from '../../wishlist/WishlistSlice';
import { selectProductIsFilterOpen, toggleFilters } from '../../products/ProductSlice';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import TuneIcon from '@mui/icons-material/Tune';

export const Navbar = ({ isProductList = false }) => {
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const userInfo = useSelector(selectUserInfo);
  const cartItems = useSelector(selectCartItems);
  const loggedInUser = useSelector(selectLoggedInUser);
  const wishlistItems = useSelector(selectWishlistItems);
  const isProductFilterOpen = useSelector(selectProductIsFilterOpen);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const is480 = useMediaQuery(theme.breakpoints.down(480));

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleToggleFilters = () => {
    dispatch(toggleFilters());
  };

  const settings = [
    { name: "Home", to: "/" },
    { name: 'Profile', to: loggedInUser?.isAdmin ? "/admin/profile" : "/profile" },
    { name: loggedInUser?.isAdmin ? 'Orders' : 'My Orders', to: loggedInUser?.isAdmin ? "/admin/orders" : "/orders" },
    { name: 'Logout', to: "/logout" },
  ];

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "white", boxShadow: "none", color: "text.primary" }}>
      <Toolbar sx={{ p: 1, height: "4rem", display: "flex", justifyContent: "space-between" }}>

        {/* Brand Name */}
        <Typography
          variant="h6"
          noWrap
          component={Link}
          to="/"
          sx={{
            fontWeight: 700,
            letterSpacing: '.3rem',
            color: 'inherit',
            textDecoration: 'none',
            display: { xs: 'none', md: 'flex' },
          }}
        >
          Trend Find
        </Typography>

        {/* Right-Side Controls */}
        <Stack flexDirection="row" alignItems="center" columnGap={2}>
          {/* User Avatar */}
          <Tooltip title="Open settings">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt={userInfo?.name} src={userInfo?.avatar || "null"} />
            </IconButton>
          </Tooltip>

          {/* User Menu */}
          <Menu
            sx={{ mt: '45px' }}
            anchorEl={anchorElUser}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {loggedInUser?.isAdmin && (
              <MenuItem onClick={handleCloseUserMenu}>
                <Typography component={Link} sx={{ textDecoration: "none", color: "text.primary" }} to="/admin/add-product">
                  Add New Product
                </Typography>
              </MenuItem>
            )}
            {settings.map((setting) => (
              <MenuItem key={setting.name} onClick={handleCloseUserMenu}>
                <Typography component={Link} sx={{ textDecoration: "none", color: "text.primary" }} to={setting.to}>
                  {setting.name}
                </Typography>
              </MenuItem>
            ))}
          </Menu>

          {/* User Greeting */}
          <Typography variant="h6" fontWeight={300}>
            {is480 ? userInfo?.name?.split(" ")[0] : `Hey👋, ${userInfo?.name}`}
          </Typography>

          {/* Admin Button */}
          {loggedInUser?.isAdmin && <Button variant="contained">Admin</Button>}

          {/* Icons for Cart, Wishlist, and Filters */}
          <Stack flexDirection="row" columnGap="1rem" alignItems="center">
            {/* Cart Icon */}
            {cartItems?.length > 0 && (
              <Badge badgeContent={cartItems.length} color="error">
                <IconButton onClick={() => navigate("/cart")}>
                  <ShoppingCartOutlinedIcon />
                </IconButton>
              </Badge>
            )}

            {/* Wishlist Icon */}
            {!loggedInUser?.isAdmin && wishlistItems?.length > 0 && (
              <Badge badgeContent={wishlistItems.length} color="error">
                <IconButton component={Link} to="/wishlist">
                  <FavoriteBorderIcon />
                </IconButton>
              </Badge>
            )}

            {/* Product Filter Toggle */}
            {isProductList && (
              <IconButton onClick={handleToggleFilters}>
                <TuneIcon sx={{ color: isProductFilterOpen ? "black" : "" }} />
              </IconButton>
            )}
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
