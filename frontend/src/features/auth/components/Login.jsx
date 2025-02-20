import { Box, FormHelperText, Stack, TextField, Typography, useMediaQuery, useTheme, Paper } from '@mui/material'
import React, { useEffect } from 'react'
import Lottie from 'lottie-react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form"
import { ecommerceOutlookAnimation } from '../../../assets'
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab';
import { selectLoggedInUser, loginAsync, selectLoginStatus, selectLoginError, clearLoginError, resetLoginStatus } from '../AuthSlice'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'

export const Login = () => {
  const dispatch = useDispatch()
  const status = useSelector(selectLoginStatus)
  const error = useSelector(selectLoginError)
  const loggedInUser = useSelector(selectLoggedInUser)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down(900))

  // Redirect based on login status
  useEffect(() => {
    if (loggedInUser?.isVerified) navigate("/")
    else if (loggedInUser && !loggedInUser.isVerified) navigate("/verify-otp")
  }, [loggedInUser])

  useEffect(() => {
    if (error) toast.error(error.message)
  }, [error])

  useEffect(() => {
    if (status === 'fulfilled' && loggedInUser?.isVerified) {
      toast.success(`Login successful`)
      reset()
    }
    return () => {
      dispatch(clearLoginError())
      dispatch(resetLoginStatus())
    }
  }, [status])

  const handleLogin = (data) => {
    dispatch(loginAsync(data))
  }

  return (
    <Stack width={'100vw'} height={'100vh'} flexDirection={'row'} sx={{ overflowY: "hidden", background: theme.palette.background.default }}>
      {/* Left Section (Animation) */}
      {!isMobile && (
        <Stack flex={1} justifyContent={'center'} sx={{ background: 'linear-gradient(135deg, #000428, #004e92)' }}>
          <Lottie animationData={ecommerceOutlookAnimation} />
        </Stack>
      )}

      {/* Right Section (Form) */}
      <Stack flex={1} justifyContent={'center'} alignItems={'center'}>
        <Paper 
          elevation={6} 
          sx={{ p: 4, borderRadius: '12px', maxWidth: '28rem', width: '90%', textAlign: 'center', background: 'white' }}
        >
          {/* Branding */}
          <Typography variant='h3' fontWeight={700} color='primary'>Trend Find</Typography>
          <Typography variant='subtitle2' color='gray'>- Shop Anything</Typography>

          {/* Login Form */}
          <Stack mt={3} spacing={2} component={'form'} noValidate onSubmit={handleSubmit(handleLogin)}>
            
            <motion.div whileHover={{ scale: 1.02 }}>
              <TextField 
                fullWidth 
                {...register("email", {
                  required: "Email is required",
                  pattern: { 
                    value: /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/, 
                    message: "Enter a valid email" 
                  }
                })} 
                placeholder='Email' 
                sx={{ bgcolor: 'white', borderRadius: '8px' }}
              />
              {errors.email && <FormHelperText error>{errors.email.message}</FormHelperText>}
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <TextField 
                type='password' 
                fullWidth 
                {...register("password", { required: "Password is required" })} 
                placeholder='Password' 
                sx={{ bgcolor: 'white', borderRadius: '8px' }}
              />
              {errors.password && <FormHelperText error>{errors.password.message}</FormHelperText>}
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 1 }}>
              <LoadingButton 
                fullWidth 
                sx={{ height: '2.8rem', borderRadius: '8px', fontSize: '1rem' }} 
                loading={status === 'pending'} 
                type='submit' 
                variant='contained'
              >
                Login
              </LoadingButton>
            </motion.div>

            {/* Links */}
            <Stack direction={'row'} justifyContent={'space-between'} alignItems={'center'} mt={2}>
              <motion.div whileHover={{ x: 2 }}>
                <Typography component={Link} to={'/forgot-password'} sx={{ textDecoration: "none", color: "text.primary" }}>
                  Forgot password?
                </Typography>
              </motion.div>

              <motion.div whileHover={{ x: -2 }}>
                <Typography component={Link} to={'/signup'} sx={{ textDecoration: "none", color: "text.primary" }}>
                  Don't have an account? <span style={{ color: theme.palette.primary.dark }}>Register</span>
                </Typography>
              </motion.div>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  )
}
