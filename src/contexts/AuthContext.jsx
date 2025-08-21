import React, { useEffect, useState } from 'react'
import { auth, supabase, isSupabaseConfigured } from '../lib/supabase'
import { AuthContext } from './contexts'

// Re-export AuthContext for convenience
export { AuthContext }

// User roles for social app (defined outside component to avoid dependency issues)
const userRoles = {
  // Public roles for content creation
  creator: 'creator',
  businessCreator: 'business-creator',
  author: 'author',
  
  // Internal business roles
  admin: 'admin',
  superAdmin: 'super_admin',
  moderator: 'moderator',
  analyst: 'analyst',
  contentManager: 'content_manager'
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Get user role from profile or default to creator
  const getUserRole = (userProfile) => {
    return userProfile?.role || userRoles.creator
  }
  
  // Check if user has required role
  const hasRole = (requiredRoles) => {
    if (!profile) return false
    const userRole = getUserRole(profile)
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
    return roles.includes(userRole)
  }

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
          setError('Supabase not configured. Please set up your environment variables.')
          setLoading(false)
          return
        }
        
        // Get current session
        const { session, error: sessionError } = await auth.getSession()
        
        if (sessionError) {
          setError(sessionError.message)
        } else if (session?.user) {
          setUser(session.user)
          
          // Try to load user profile - but don't fail if it doesn't exist
          try {
            // Check if we have a user_profiles table in Supabase (enhanced schema)
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('auth_id', session.user.id)
              .single()
            
            if (!profileError && profileData) {
              // Use profile data from Supabase - map fields for compatibility
              setProfile({
                id: profileData.auth_id, // Use auth_id as id for compatibility
                email: profileData.email,
                full_name: profileData.display_name || profileData.username,
                display_name: profileData.display_name,
                username: profileData.username,
                avatar_url: profileData.avatar_url,
                role: profileData.role,
                status: profileData.status,
                created_at: profileData.created_at,
                updated_at: profileData.updated_at
              })
            } else {
              // Create basic profile from user metadata with default role
              const basicProfile = {
                auth_id: session.user.id,
                email: session.user.email,
                username: session.user.email.split('@')[0] || 'user', // Generate username from email
                display_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                avatar_url: session.user.user_metadata?.avatar_url,
                role: userRoles.creator, // Default role for new users
                status: 'active',
                email_verified: session.user.email_confirmed || false,
                onboarding_completed: false
              }
              
              // Set profile for frontend compatibility
              setProfile({
                id: session.user.id,
                email: basicProfile.email,
                full_name: basicProfile.display_name,
                display_name: basicProfile.display_name,
                username: basicProfile.username,
                avatar_url: basicProfile.avatar_url,
                role: basicProfile.role,
                status: basicProfile.status,
                created_at: session.user.created_at,
                updated_at: session.user.updated_at
              })
              
              // Optionally try to create profile in Supabase (don't fail if it doesn't work)
              try {
                await supabase.from('user_profiles').insert([basicProfile])
              } catch {
                // Continue without saving to database
              }
            }
          } catch {
            // Continue without profile data
          }
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Only set up auth listener if Supabase is configured
    if (isSupabaseConfigured()) {
      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // eslint-disable-next-line no-console
          console.log('🔐 Auth state change:', event, session?.user?.email)
          
          if (session?.user) {
            // eslint-disable-next-line no-console
            console.log('🔐 Setting user:', session.user.email)
            setUser(session.user)
            
            // Try to get full profile from enhanced database
            try {
              const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('auth_id', session.user.id)
                .single()
              
              if (!profileError && profileData) {
                // Map enhanced profile data for frontend compatibility
                setProfile({
                  id: profileData.auth_id, // Use auth_id as id for compatibility
                  email: profileData.email,
                  full_name: profileData.display_name || profileData.username,
                  display_name: profileData.display_name,
                  username: profileData.username,
                  avatar_url: profileData.avatar_url,
                  role: profileData.role,
                  status: profileData.status,
                  created_at: profileData.created_at,
                  updated_at: profileData.updated_at
                })
              } else {
                // Fallback to basic profile from session metadata
                setProfile({
                  id: session.user.id,
                  email: session.user.email,
                  full_name: session.user.user_metadata?.full_name || session.user.email,
                  avatar_url: session.user.user_metadata?.avatar_url,
                  role: userRoles.creator,
                  created_at: session.user.created_at,
                  updated_at: session.user.updated_at
                })
              }
            } catch {
              // Fallback to basic profile from session metadata
              setProfile({
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.email,
                avatar_url: session.user.user_metadata?.avatar_url,
                role: userRoles.creator,
                created_at: session.user.created_at,
                updated_at: session.user.updated_at
              })
            }
          } else {
            // eslint-disable-next-line no-console
            console.log('🔐 Clearing user')
            setUser(null)
            setProfile(null)
          }
          
          setLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    }
  }, [])

  // Auth methods
  const signUp = async (email, password, metadata = {}) => {
    try {
      setError(null)
      const { data, error } = await auth.signUp(email, password, metadata)
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      return { data }
    } catch (err) {
      setError(err.message)
      return { error: err.message }
    }
  }

  const signIn = async (email, password) => {
    try {
      setError(null)
      
      const { data, error } = await auth.signIn(email, password)
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      return { data }
    } catch (err) {
      setError(err.message)
      return { error: err.message }
    }
  }

  const signInWithOAuth = async (provider) => {
    try {
      setError(null)
      const { data, error } = await auth.signInWithOAuth(provider)
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      return { data }
    } catch (err) {
      setError(err.message)
      return { error: err.message }
    }
  }

  const signOut = async () => {
    try {
      setError(null)
      const { error } = await auth.signOut()
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      setUser(null)
      setProfile(null)
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { error: err.message }
    }
  }

  const updateProfile = async (updates) => {
    try {
      setError(null)
      
      if (!user) {
        throw new Error('No user logged in')
      }
      
      // For now, just update the local profile state
      // In the future, this could sync with a profiles table
      const updatedProfile = {
        ...profile,
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      setProfile(updatedProfile)
      return { data: updatedProfile }
    } catch (err) {
      setError(err.message)
      return { error: err.message }
    }
  }

  const resetPassword = async (email) => {
    try {
      setError(null)
      const { data, error } = await auth.resetPassword(email)
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      return { data }
    } catch (err) {
      setError(err.message)
      return { error: err.message }
    }
  }

  const updatePassword = async (password) => {
    try {
      setError(null)
      const { data, error } = await auth.updatePassword(password)
      
      if (error) {
        setError(error.message)
        return { error }
      }
      
      return { data }
    } catch (err) {
      setError(err.message)
      return { error: err.message }
    }
  }

  const value = {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    // Role-based access functions
    userRoles,
    getUserRole: () => getUserRole(profile),
    hasRole,
    isAdmin: () => hasRole([userRoles.admin, userRoles.superAdmin, userRoles.moderator]),
    // Auth methods
    signUp,
    signIn,
    signInWithOAuth,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}