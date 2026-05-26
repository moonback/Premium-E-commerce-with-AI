CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    new.id, 
    new.email, 
    CASE WHEN new.email LIKE '%admin%' THEN 'admin'::user_role ELSE 'customer'::user_role END
  );
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Fallback: if the trigger fails, do not block the signup process
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;