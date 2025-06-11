-- Modify the handle_new_user trigger function to respect role selection
-- This allows the application to create profiles with correct roles for OAuth users

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  role_value TEXT;
  full_name_value TEXT;
  email_value TEXT;
  avatar_url_value TEXT;
BEGIN
  -- Check if we have a role in metadata
  role_value := COALESCE(
    NEW.raw_user_meta_data->>'role',
    current_setting('request.jwt.claim.role', true)
  );
  
  -- If no role is specified, don't create a profile
  -- This allows the application to create the profile with the correct role
  IF role_value IS NULL THEN
    RAISE LOG 'No role provided in metadata for user %. Profile creation will be handled by the application.',
      NEW.id;
    RETURN NEW;
  END IF;

  -- If we have a role, proceed with profile creation
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
$$; 