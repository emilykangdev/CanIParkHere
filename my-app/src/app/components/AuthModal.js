'use client'

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, X } from 'lucide-react'

export default function AuthModal({ isOpen, onClose }) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const { login, signup, signInWithGoogle, resetPassword } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (resetMode) {
      if (!email) {
        setError('Please enter your email address')
        return
      }
      
      try {
        setError('')
        setLoading(true)
        await resetPassword(email)
        setResetSuccess(true)
      } catch (error) {
        setError('Failed to send reset email: ' + error.message)
      } finally {
        setLoading(false)
      }
      return
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    try {
      setError('')
      setLoading(true)
      
      if (isLogin) {
        await login(email, password)
      } else {
        await signup(email, password, displayName)
      }
      
      onClose()
    } catch (error) {
      setError('Authentication failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setError('')
      setLoading(true)
      await signInWithGoogle()
      onClose()
    } catch (error) {
      setError('Google sign-in failed: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setDisplayName('')
    setError('')
    setResetMode(false)
    setResetSuccess(false)
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {resetMode ? 'Reset Password' : isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {resetSuccess ? (
            <div className="text-center">
              <div className="text-green-600 mb-4">
                ✅ Password reset email sent! Check your inbox.
              </div>
              <button
                onClick={() => {
                  setResetSuccess(false)
                  setResetMode(false)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-800"
                    placeholder="Enter your email"
                  />
                </div>

                {!resetMode && (
                  <>
                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-800"
                          placeholder="Enter your name"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-800 pr-10"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {!isLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black dark:text-white bg-white dark:bg-gray-800"
                          placeholder="Confirm your password"
                        />
                      </div>
                    )}
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  {loading ? 'Loading...' : resetMode ? 'Send Reset Email' : isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              {!resetMode && (
                <>
                  <div className="my-4 text-center text-gray-500 dark:text-gray-400">or</div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    {loading ? 'Loading...' : 'Continue with Google'}
                  </button>

                  <div className="mt-4 text-center text-sm">
                    {isLogin ? (
                      <>
                        <button
                          onClick={() => setResetMode(true)}
                          className="text-blue-500 hover:underline mr-4"
                        >
                          Forgot password?
                        </button>
                        <span className="text-gray-600 dark:text-gray-400">Don&apos;t have an account? </span>
                        <button
                          onClick={switchMode}
                          className="text-blue-500 hover:underline"
                        >
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-600 dark:text-gray-400">Already have an account? </span>
                        <button
                          onClick={switchMode}
                          className="text-blue-500 hover:underline"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}

              {resetMode && !resetSuccess && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setResetMode(false)}
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}