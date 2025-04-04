-- Fix profile creation for Google sign-ins
-- This script updates the handle_new_user function to better handle OAuth sign-ins

-- Update handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_value TEXT;
  full_name_value TEXT;
  email_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- Get role from metadata or default to athlete
  role_value := COALESCE(
    NEW.raw_user_meta_data->>'role',
    current_setting('request.jwt.claim.role', true),
    'athlete'
  );
  
  -- Get name from metadata fields
  full_name_value := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'User'
  );
  
  -- Get email from auth info or metadata
  email_value := COALESCE(
    NEW.email,
    NEW.raw_user_meta_data->>'email',
    ''
  );
  
  -- Get avatar from metadata
  avatar_url_value := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    NULL
  );
  
  -- Log the values for debugging
  RAISE LOG 'Creating profile for user % with role %, name %, email %',
    NEW.id, role_value, full_name_value, email_value;
  
  -- Insert profile with validation
  BEGIN
    INSERT INTO public.profiles (
      id, 
      role,
      full_name, 
      email,
      avatar_url
    ) VALUES (
      NEW.id,
      role_value,
      full_name_value,
      email_value,
      avatar_url_value
    );
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Profile already exists for user %', NEW.id;
    WHEN check_violation THEN
      RAISE LOG 'Invalid data for profile: %', NEW.raw_user_meta_data;
    WHEN OTHERS THEN
      RAISE LOG 'Error in handle_new_user: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to manually add a missing profile
CREATE OR REPLACE FUNCTION public.add_missing_profile(
  user_id UUID,
  role TEXT DEFAULT 'coach',
  full_name TEXT DEFAULT 'User',
  email TEXT DEFAULT NULL,
  avatar_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  email_value TEXT;
BEGIN
  -- Make sure we have a valid email
  SELECT COALESCE(email, au.email) INTO email_value
  FROM auth.users au
  WHERE au.id = user_id;
  
  -- Insert the profile if it doesn't exist
  INSERT INTO public.profiles (
    id,
    role,
    full_name,
    email,
    avatar_url,
    created_at,
    updated_at
  )
  VALUES (
    user_id,
    role,
    full_name,
    email_value,
    avatar_url,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error adding missing profile: %', SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 