import { Stack, TextField, Typography, Button, Radio, Paper, IconButton, Box, useTheme, useMediaQuery } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useEffect, useState } from 'react';
import { Cart } from '../../cart/components/Cart';
import { useForm } from 'react-hook-form';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useDispatch, useSelector } from 'react-redux';
import { addAddressAsync, selectAddressStatus, selectAddresses } from '../../address/AddressSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { Link, useNavigate } from 'react-router-dom';
import { createOrderAsync, selectCurrentOrder, selectOrderStatus } from '../../order/OrderSlice';
import { resetCartByUserIdAsync, selectCartItems } from '../../cart/CartSlice';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { SHIPPING, TAXES } from '../../../constants';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Grid, FormControl } from '@mui/material';

const stripePromise = loadStripe('pk_test_51QcpGWD8KDgrStpyI2pSAKf2v5vPeprN5Mu9z0wS04UA8VYRtR0sB8euC8MACe0EZ50kDoqCgWHkkzYytJKwbU6400nJTke8mK'); // Replace with your Stripe Publishable Key

const CheckoutForm = ({ orderTotal, selectedAddress, cartItems }) => {
    const stripe = useStripe();
    const elements = useElements();
    const dispatch = useDispatch();
    const loggedInUser = useSelector(selectLoggedInUser);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);

    const handleCardPayment = async () => {
        if (!stripe || !elements) return;

        setLoading(true);

        try {
            // Backend call to create payment intent
            const { data } = await axios.post('http://localhost:8000/create-payment-intent', {
                amount: orderTotal + SHIPPING + TAXES, // Total amount including shipping and taxes
            });

            const { clientSecret } = data;

            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                },
            });

            if (result.error) {
                setPaymentStatus('Payment failed. Please try again.');
                console.error(result.error.message);
            } else if (result.paymentIntent.status === 'succeeded') {
                setPaymentStatus('Payment successful!');
                const order = {
                    user: loggedInUser._id,
                    items: cartItems,
                    address: selectedAddress,
                    paymentMode: 'CARD',
                    total: orderTotal + SHIPPING + TAXES,
                };
                // Dispatch order creation action
                dispatch(createOrderAsync(order));
                dispatch(resetCartByUserIdAsync(loggedInUser._id));
                navigate(`/order-success/${result.paymentIntent.id}`);
            }
        } catch (error) {
            console.error(error);
            setPaymentStatus('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack spacing={3}>
            <Typography variant="h5">Card Payment</Typography>
            <CardElement />
            <LoadingButton
                variant="contained"
                onClick={handleCardPayment}
                disabled={!stripe || loading}
                loading={loading}
            >
                {loading ? 'Processing...' : 'Pay Now'}
            </LoadingButton>
            {paymentStatus && <Typography>{paymentStatus}</Typography>}
        </Stack>
    );
};

export const Checkout = () => {
    const addresses = useSelector(selectAddresses);
    const [selectedAddress, setSelectedAddress] = useState(addresses[0]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const dispatch = useDispatch();
    const loggedInUser = useSelector(selectLoggedInUser);
    const addressStatus = useSelector(selectAddressStatus);
    const navigate = useNavigate();
    const cartItems = useSelector(selectCartItems);
    const orderStatus = useSelector(selectOrderStatus);
    const currentOrder = useSelector(selectCurrentOrder);
    const orderTotal = cartItems.reduce((acc, item) => (item.product.price * item.quantity) + acc, 0);
    const theme = useTheme();
    const is900 = useMediaQuery(theme.breakpoints.down(900));
    const is480 = useMediaQuery(theme.breakpoints.down(480));

    useEffect(() => {
        if (addressStatus === 'fulfilled') {
            reset();
        } else if (addressStatus === 'rejected') {
            alert('Error adding your address');
        }
    }, [addressStatus]);

    useEffect(() => {
        if (currentOrder && currentOrder?._id) {
            dispatch(resetCartByUserIdAsync(loggedInUser?._id));
            navigate(`/order-success/${currentOrder?._id}`);
        }
    }, [currentOrder]);

    const handleAddAddress = (data) => {
        const address = { ...data, user: loggedInUser._id };
        dispatch(addAddressAsync(address));
    };

    const handleCreateOrder = () => {
        const order = {
            user: loggedInUser._id,
            items: cartItems,
            address: selectedAddress,
            paymentMode: selectedPaymentMethod,
            total: orderTotal + SHIPPING + TAXES,
        };
        dispatch(createOrderAsync(order));
    };

    return (
        <Stack flexDirection={'row'} p={2} rowGap={10} justifyContent={'center'} flexWrap={'wrap'} mb={'5rem'} mt={2} columnGap={4} alignItems={'flex-start'}>
            {/* Left Box */}
            <Stack rowGap={4}>
                <Stack flexDirection={'row'} columnGap={is480 ? 0.3 : 1} alignItems={'center'}>
                    <motion.div whileHover={{ x: -5 }}>
                        <IconButton component={Link} to={"/cart"}><ArrowBackIcon fontSize={is480 ? "medium" : 'large'} /></IconButton>
                    </motion.div>
                    <Typography variant='h4'>Shipping Information</Typography>
                </Stack>

                {/* Address Form */}
                <Stack component={'form'} noValidate rowGap={2} onSubmit={handleSubmit(handleAddAddress)}>
                    <Stack>
                        <Typography gutterBottom>Type</Typography>
                        <TextField placeholder='Eg. Home, Business' {...register("type", { required: true })} />
                    </Stack>
                    <Stack>
                        <Typography gutterBottom>Street</Typography>
                        <TextField {...register("street", { required: true })} />
                    </Stack>
                    <Stack>
                        <Typography gutterBottom>Country</Typography>
                        <TextField {...register("country", { required: true })} />
                    </Stack>
                    <Stack>
                        <Typography gutterBottom>Phone Number</Typography>
                        <TextField type='number' {...register("phoneNumber", { required: true })} />
                    </Stack>

                    <Stack flexDirection={'row'}>
                        <Stack width={'100%'}>
                            <Typography gutterBottom>City</Typography>
                            <TextField {...register("city", { required: true })} />
                        </Stack>
                        <Stack width={'100%'}>
                            <Typography gutterBottom>State</Typography>
                            <TextField {...register("state", { required: true })} />
                        </Stack>
                        <Stack width={'100%'}>
                            <Typography gutterBottom>Postal Code</Typography>
                            <TextField type='number' {...register("postalCode", { required: true })} />
                        </Stack>
                    </Stack>

                    <Stack flexDirection={'row'} alignSelf={'flex-end'} columnGap={1}>
                        <LoadingButton loading={addressStatus === 'pending'} type='submit' variant='contained'>Add</LoadingButton>
                        <Button color='error' variant='outlined' onClick={() => reset()}>Reset</Button>
                    </Stack>
                </Stack>

                {/* Existing Address */}
                <Stack rowGap={3}>
                    <Stack>
                        <Typography variant='h6'>Address</Typography>
                        <Typography variant='body2' color={'text.secondary'}>Choose from existing Addresses</Typography>
                    </Stack>

                    <Grid container gap={2} width={is900 ? "auto" : '50rem'} justifyContent={'flex-start'} alignContent={'flex-start'}>
                        {addresses.map((address, index) => (
                            <FormControl item key={address._id}>
                                <Stack p={is480 ? 2 : 2} width={is480 ? '100%' : '20rem'} height={is480 ? 'auto' : '15rem'} rowGap={2} component={is480 ? Paper : Paper} elevation={1}>
                                    <Stack flexDirection={'row'} alignItems={'center'}>
                                        <Radio checked={selectedAddress === address} name='addressRadioGroup' value={selectedAddress} onChange={(e) => setSelectedAddress(addresses[index])} />
                                        <Typography variant='h6'>{address.type}</Typography>
                                    </Stack>
                                    <Typography variant='body2'>{address.street}</Typography>
                                    <Typography variant='body2'>{address.city}, {address.state}</Typography>
                                    <Typography variant='body2'>{address.country}</Typography>
                                    <Typography variant='body2'>{address.postalCode}</Typography>
                                    <Typography variant='body2'>{address.phoneNumber}</Typography>
                                </Stack>
                            </FormControl>
                        ))}
                    </Grid>
                </Stack>
            </Stack>

            {/* Right Box */}
            <Box width={is900 ? '100%' : '45%'} p={3} component={Paper} elevation={3}>
                <Cart />
                <Stack flexDirection={'row'} justifyContent={'space-between'} mt={2}>
                    <Typography variant="h5">Total</Typography>
                    <Typography variant="h5">{orderTotal + SHIPPING + TAXES}</Typography>
                </Stack>
                <CheckoutForm orderTotal={orderTotal} selectedAddress={selectedAddress} cartItems={cartItems} />
            </Box>
        </Stack>
    );
};
