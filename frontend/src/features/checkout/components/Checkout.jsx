import { Stack, TextField, Typography, Button, Radio, Paper, IconButton, Box, useTheme, useMediaQuery } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import React, { useEffect, useState } from 'react';
import { Cart } from '../../cart/components/Cart';
import { useForm } from 'react-hook-form';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useDispatch, useSelector } from 'react-redux';
import { addAddressAsync, selectAddressStatus, selectAddresses } from '../../address/AddressSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { Link, useNavigate } from 'react-router-dom';
import { createOrderAsync, selectCurrentOrder } from '../../order/OrderSlice';
import { resetCartByUserIdAsync, selectCartItems } from '../../cart/CartSlice';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { SHIPPING, TAXES } from '../../../constants';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Grid, FormControl } from '@mui/material';

const stripePromise = loadStripe('pk_test_51QcpGWD8KDgrStpyI2pSAKf2v5vPeprN5Mu9z0wS04UA8VYRtR0sB8euC8MACe0EZ50kDoqCgWHkkzYytJKwbU6400nJTke8mK'); // Replace with your Stripe Publishable Key

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
                color: '#aab7c4'
            }
        },
        invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
        }
    }
};

const COUNTRY_TO_CODE = {
    'India': 'IN',
    'United States': 'US',
    'United Kingdom': 'GB',
    // Add more country mappings as needed
};

const CheckoutForm = ({ orderTotal, selectedAddress, cartItems }) => {
    const stripe = useStripe();
    const elements = useElements();
    const dispatch = useDispatch();
    const loggedInUser = useSelector(selectLoggedInUser);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [cardError, setCardError] = useState(null);

    // Convert country name to ISO code
    const getCountryCode = (countryName) => {
        if (!countryName) return 'US'; // default to US if no country provided
        
        // If it's already a 2-letter code, return it
        if (countryName.length === 2 && countryName === countryName.toUpperCase()) {
            return countryName;
        }

        // Try to get the country code from our mapping
        const code = COUNTRY_TO_CODE[countryName];
        if (code) return code;

        // If we don't have a mapping, log it and default to US
        console.warn(`Country code not found for: ${countryName}. Defaulting to US`);
        return 'US';
    };

    // Handle card input change
    const handleCardChange = (event) => {
        if (event.error) {
            setCardError(event.error.message);
        } else {
            setCardError(null);
        }
    };

    const handleCardPayment = async () => {
        if (!stripe || !elements) {
            setPaymentStatus('Payment system not ready. Please try again.');
            return;
        }

        if (!selectedAddress) {
            setPaymentStatus('Please select a delivery address.');
            return;
        }

        // Validate postal code
        if (!selectedAddress.postalCode || selectedAddress.postalCode.toString().length < 5) {
            setPaymentStatus('Please enter a valid postal code in your address (minimum 5 digits).');
            return;
        }

        setLoading(true);
        setPaymentStatus(null);
        setCardError(null);

        try {
            console.log('Creating payment intent for amount:', orderTotal + SHIPPING + TAXES);
            
            const { data } = await axios.post('http://localhost:8000/create-payment-intent', {
                amount: Math.round((orderTotal + SHIPPING + TAXES) * 100),
            }).catch(error => {
                console.error('Error creating payment intent:', error.response?.data || error.message);
                throw new Error('Failed to create payment. Please try again.');
            });

            if (!data || !data.clientSecret) {
                throw new Error('Invalid response from payment server');
            }

            const { clientSecret } = data;
            console.log('Payment intent created successfully');

            // Format postal code to ensure it's a string and has proper length
            const formattedPostalCode = selectedAddress.postalCode.toString().padStart(5, '0');
            
            // Get the country code
            const countryCode = getCountryCode(selectedAddress?.country);
            console.log('Using country code:', countryCode, 'for country:', selectedAddress?.country);

            // Prepare the payment method data
            const paymentMethodData = {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: loggedInUser?.name || '',
                        email: loggedInUser?.email || '',
                        address: {
                            line1: selectedAddress?.street || '',
                            city: selectedAddress?.city || '',
                            state: selectedAddress?.state || '',
                            postal_code: formattedPostalCode,
                            country: countryCode
                        }
                    }
                }
            };

            console.log('Confirming card payment...');
            const result = await stripe.confirmCardPayment(clientSecret, paymentMethodData);

            if (result.error) {
                console.error('Payment confirmation error:', result.error);
                if (result.error.type === 'card_error' || result.error.type === 'validation_error') {
                    setCardError(result.error.message);
                } else {
                    setPaymentStatus('An unexpected error occurred. Please try again.');
                }
            } else if (result.paymentIntent.status === 'succeeded') {
                console.log('Payment successful:', result.paymentIntent.id);
                setPaymentStatus('Payment successful!');
                const order = {
                    user: loggedInUser._id,
                    items: cartItems,
                    address: selectedAddress,
                    paymentMode: 'CARD',
                    total: orderTotal + SHIPPING + TAXES,
                    paymentIntentId: result.paymentIntent.id
                };
                dispatch(createOrderAsync(order));
                dispatch(resetCartByUserIdAsync(loggedInUser._id));
                navigate(`/order-success/${result.paymentIntent.id}`);
            } else {
                console.warn('Unexpected payment status:', result.paymentIntent.status);
                setPaymentStatus('Payment status unclear. Please check your order status.');
            }
        } catch (error) {
            console.error('Payment processing error:', error);
            setPaymentStatus(error.message || 'Payment failed. Please check your card details and try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Stack spacing={3}>
            <Typography variant="h5">Card Payment</Typography>
            <Box sx={{ border: '1px solid #e0e0e0', padding: 2, borderRadius: 1 }}>
                <CardElement 
                    options={{
                        ...CARD_ELEMENT_OPTIONS,
                        hidePostalCode: true // We're using the address form postal code
                    }} 
                    onChange={handleCardChange}
                />
            </Box>
            {cardError && (
                <Typography color="error" variant="body2">
                    {cardError}
                </Typography>
            )}
            <LoadingButton
                variant="contained"
                onClick={handleCardPayment}
                disabled={!stripe || loading || !!cardError}
                loading={loading}
            >
                {loading ? 'Processing...' : `Pay $${(orderTotal + SHIPPING + TAXES).toFixed(2)}`}
            </LoadingButton>
            {paymentStatus && (
                <Typography color={paymentStatus.includes('successful') ? 'success.main' : 'error.main'}>
                    {paymentStatus}
                </Typography>
            )}
        </Stack>
    );
};

export const Checkout = () => {
    const addresses = useSelector(selectAddresses);
    const [selectedAddress, setSelectedAddress] = useState(addresses[0]);
    const { register, handleSubmit, reset } = useForm();
    const dispatch = useDispatch();
    const loggedInUser = useSelector(selectLoggedInUser);
    const addressStatus = useSelector(selectAddressStatus);
    const navigate = useNavigate();
    const cartItems = useSelector(selectCartItems);
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
    }, [addressStatus, reset]);

    useEffect(() => {
        if (currentOrder && currentOrder?._id) {
            dispatch(resetCartByUserIdAsync(loggedInUser?._id));
            navigate(`/order-success/${currentOrder?._id}`);
        }
    }, [currentOrder, dispatch, loggedInUser?._id, navigate]);

    const handleAddAddress = (data) => {
        const address = { ...data, user: loggedInUser._id };
        dispatch(addAddressAsync(address));
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
